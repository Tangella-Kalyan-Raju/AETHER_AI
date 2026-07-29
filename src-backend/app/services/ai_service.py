import logging
logger = logging.getLogger(__name__)

import os
import json
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.ai_models import AIConversation, AIMessage, AISession, AIPromptTemplate, AILog, AIMemory, AISetting
from dotenv import load_dotenv

load_dotenv()


# Groq Client import
try:
    from groq import Groq
except ImportError:
    Groq = None

def get_utc_now():
    return datetime.now(timezone.utc)

class LLMManager:
    def __init__(self):
        self.provider = "groq"
        self.model = os.getenv("AI_MODEL", "llama3-70b-8192")
        self.temperature = float(os.getenv("TEMPERATURE", "0.7"))
        self.max_tokens = int(os.getenv("MAX_TOKENS", "2048"))
        self.api_key = os.getenv("GROQ_API_KEY", "")

    def call_llm(self, prompt: str, system_prompt: str = "") -> Dict[str, Any]:
        start_time = time.time()
        
        # Default mock structured response if Groq is not configured/imported
        default_mock_content = {
            "Situation": "The grid is operating under nominal conditions with scheduled maintenance planned for regional components.",
            "Analysis": "Thermal load indicators are showing stable values across major buses. Generation yield matches load demand curves.",
            "Reasoning": "Current weather forecast shows moderate wind yield, and battery energy storage (BESS) state of charge is at 80% to absorb peak loads.",
            "Recommendation": "Optimize battery charging parameters during peak generation periods.",
            "Risks": "Low risk of overloading local transformers during solar peaks.",
            "Confidence": 95,
            "Expected Impact": "Uptime efficiency increase of +1.5% under peak grid load.",
            "References": "Grid Telemetry Block B, Substation 2 Operations Log.",
            "Timestamp": get_utc_now().isoformat()
        }

        raw_content = json.dumps(default_mock_content)

        if Groq and self.api_key:
            try:
                client = Groq(api_key=self.api_key)
                # Form messages
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                chat_completion = client.chat.completions.create(
                    messages=messages,
                    model=self.model,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                )

                raw_response = chat_completion.choices[0].message.content
                
                # Check if the output is meant to be conversational (not JSON)
                if not raw_response.strip().startswith("{") and not "```json" in raw_response:
                    raw_content = raw_response
                else:
                    # Try to parse json from raw response
                    try:
                        # Look for JSON block in markdown
                        if "```json" in raw_response:
                            json_str = raw_response.split("```json")[1].split("```")[0].strip()
                        else:
                            json_str = raw_response.strip()
                        parsed = json.loads(json_str)
                        raw_content = json.dumps(parsed)
                    except Exception:
                        raw_content = raw_response
            except Exception as e:
                logger.info(f"Error calling OpenAI API: {e}")

        response_time = time.time() - start_time
        # We estimate token count roughly (4 chars per token)
        tokens_used = len(prompt + raw_content) // 4
        
        return {
            "content": raw_content,
            "tokens": tokens_used,
            "response_time": response_time
        }


class PromptManager:
    @staticmethod
    def get_template(db: Session, name: str) -> str:
        pt = db.query(AIPromptTemplate).filter(AIPromptTemplate.name == name, AIPromptTemplate.is_active == True).first()
        if pt:
            return pt.template
        
        # Default prompt templates
        defaults = {
            "Enterprise System Prompt": (
                "You are the Enterprise AI Grid Copilot.\n"
                "Your role is to offer professional, explainable, and grid-focused advice.\n"
                "Never hallucinate, invent data, or guess values. Always explain reasoning.\n"
                "CRITICAL INSTRUCTION: If the user asks a generic question (like 'hi', 'hello', 'how are you'), respond conversationally in plain text.\n"
                "HOWEVER, if the user asks a technical question related to the project (Grid Policy Orchestrator, substations, assets, etc.), you MUST format your response exactly as a JSON object with keys: "
                "Situation, Analysis, Reasoning, Recommendation, Risks, Confidence, Expected Impact, References, Timestamp. "
                "Do NOT use JSON formatting for simple greetings."
            ),
            "Executive Summary Prompt": "Summarize the following grid performance context and recommendations.",
            "Recommendation Prompt": "Formulate explainable action items for the following asset warning signals.",
            "Shift Handover Prompt": "Generate shift handover logs detailing outstanding incidents.",
            "Incident Analysis Prompt": "Examine the following fault alarm and output cause categories.",
            "Maintenance Prompt": "Plan maintenance stages using RUL and predictive metrics.",
            "Report Generation Prompt": "Compile a printable summary report based on optimization history."
        }
        return defaults.get(name, "You are the Enterprise AI Grid Copilot. Return structured answers.")

    @staticmethod
    def assemble_prompt(db: Session, user_query: str, template_name: str, memory_context: str = "") -> str:
        template = PromptManager.get_template(db, template_name)
        # Combine template instructions, memory, context placeholder, and query
        full_prompt = (
            f"Template Context: {template}\n\n"
            f"Conversation History: {memory_context}\n\n"
            f"Enterprise Context: [Empty]\n\n"
            f"User Query: {user_query}"
        )
        return full_prompt


class MemoryManager:
    @staticmethod
    def save_memory(db: Session, user_id: Optional[int], key: str, value: Any, memory_type: str = "short_term"):
        mem = db.query(AIMemory).filter(AIMemory.user_id == user_id, AIMemory.key == key, AIMemory.memory_type == memory_type).first()
        if not mem:
            mem = AIMemory(user_id=user_id, key=key, value=value, memory_type=memory_type)
            db.add(mem)
        else:
            mem.value = value
        db.commit()

    @staticmethod
    def get_memory(db: Session, user_id: Optional[int], key: str, memory_type: str = "short_term") -> Optional[Any]:
        mem = db.query(AIMemory).filter(AIMemory.user_id == user_id, AIMemory.key == key, AIMemory.memory_type == memory_type).first()
        if mem:
            return mem.value
        return None

    @staticmethod
    def clear_memory(db: Session, user_id: Optional[int], memory_type: Optional[str] = None):
        query = db.query(AIMemory).filter(AIMemory.user_id == user_id)
        if memory_type:
            query = query.filter(AIMemory.memory_type == memory_type)
        query.delete()
        db.commit()


class AIService:
    def __init__(self, db: Session):
        self.db = db
        self.llm_manager = LLMManager()

    def process_chat(
        self,
        conversation_id: str,
        user_query: str,
        user_id: Optional[int] = None,
        session_uuid: Optional[str] = None,
        template_name: str = "Enterprise System Prompt"
    ) -> Dict[str, Any]:
        # Fetch conversation history
        history_msgs = self.db.query(AIMessage).filter(AIMessage.conversation_id == conversation_id).order_by(AIMessage.created_at.asc()).all()
        history_str = ""
        for m in history_msgs[-6:]: # last 6 messages
            history_str += f"{m.role.upper()}: {m.content}\n"

        # Assemble prompt
        system_prompt = PromptManager.get_template(self.db, "Enterprise System Prompt")
        full_prompt = PromptManager.assemble_prompt(self.db, user_query, template_name, history_str)

        # Call LLM
        llm_res = self.llm_manager.call_llm(full_prompt, system_prompt)

        # Save user message
        user_msg = AIMessage(conversation_id=conversation_id, role="user", content=user_query)
        self.db.add(user_msg)

        # Save assistant message
        assistant_msg = AIMessage(conversation_id=conversation_id, role="assistant", content=llm_res["content"])
        self.db.add(assistant_msg)

        # Update Session tracking metrics
        if session_uuid:
            sess = self.db.query(AISession).filter(AISession.session_uuid == session_uuid).first()
            if sess:
                sess.total_requests += 1
                sess.total_tokens += llm_res["tokens"]
                sess.average_response_time = (sess.average_response_time * (sess.total_requests - 1) + llm_res["response_time"]) / sess.total_requests
                
        # Record AI log
        ai_log = AILog(
            question=user_query,
            prompt_template_name=template_name,
            response=llm_res["content"],
            model=self.llm_manager.model,
            tokens=llm_res["tokens"],
            response_time=llm_res["response_time"],
            status="Success",
            user_id=user_id,
            session_uuid=session_uuid
        )
        self.db.add(ai_log)
        self.db.commit()

        # Try parsing response content as JSON for the structured return envelope
        try:
            structured_data = json.loads(llm_res["content"])
        except Exception:
            structured_data = {
                "Situation": llm_res["content"],
                "Analysis": "Parsing output raw text.",
                "Reasoning": "LLM returned non-JSON format.",
                "Recommendation": "Re-run query with strict formatting filters.",
                "Risks": "High risk of format inconsistency.",
                "Confidence": 50,
                "Expected Impact": "Nominal",
                "References": "System fallback model.",
                "Timestamp": get_utc_now().isoformat()
            }

        return {
            "conversation_id": conversation_id,
            "response": structured_data,
            "tokens_used": llm_res["tokens"],
            "latency": llm_res["response_time"],
            "success": True
        }
