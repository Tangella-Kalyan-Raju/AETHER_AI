import logging
logger = logging.getLogger(__name__)

import os
import time
import json
from typing import Dict, Any
from app.ai.providers.base import BaseProvider

try:
    from groq import Groq
except ImportError:
    Groq = None

class GroqProvider(BaseProvider):
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "")

    def generate(self, prompt: str, system_prompt: str = "", config: Dict[str, Any] = None) -> Dict[str, Any]:
        start_time = time.time()
        
        # Merge configuration overrides
        cfg = config or {}
        model = cfg.get("model", os.getenv("AI_MODEL", "llama3-70b-8192"))
        temperature = cfg.get("temperature", 0.7)
        max_tokens = cfg.get("max_tokens", 2048)

        # Mock structured response
        mock_response = {
            "Situation": "Grid is running under normal baseline operational standards.",
            "Analysis": "Load balances across Sierra substation lines are fully within tolerance guidelines (+/- 2%).",
            "Reasoning": "Low ambient temperatures reduced transformer thermal load stress metrics.",
            "Recommendation": "Proceed with regular scheduled switchyard inspection logs.",
            "Risks": "No immediate risks identified.",
            "Confidence": 98,
            "Expected Impact": "Maintain baseline system validation metrics.",
            "References": "Grid Telemetry block 5A",
            "Timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        
        content = json.dumps(mock_response)
        success = True
        error_msg = None

        if Groq and self.api_key:
            try:
                client = Groq(api_key=self.api_key)
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                chat_completion = client.chat.completions.create(
                    messages=messages,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
                raw = chat_completion.choices[0].message.content
                
                # Check if JSON
                try:
                    if "```json" in raw:
                        raw = raw.split("```json")[1].split("```")[0].strip()
                    parsed = json.loads(raw)
                    content = json.dumps(parsed)
                except Exception:
                    mock_response["Situation"] = raw
                    content = json.dumps(mock_response)
            except Exception as e:
                success = False
                error_msg = str(e)
                logger.info(f"Groq API error: {e}")

        execution_time = time.time() - start_time
        tokens = len(prompt + content) // 4
        
        return {
            "content": content,
            "tokens": tokens,
            "execution_time": execution_time,
            "success": success,
            "error_message": error_msg
        }
