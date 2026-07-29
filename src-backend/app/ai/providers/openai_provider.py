import logging
logger = logging.getLogger(__name__)

import os
import time
import json
from typing import Dict, Any
from app.ai.providers.base import BaseProvider

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

class OpenAIProvider(BaseProvider):
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "")

    def generate(self, prompt: str, system_prompt: str = "", config: Dict[str, Any] = None) -> Dict[str, Any]:
        start_time = time.time()
        
        cfg = config or {}
        model = cfg.get("model", os.getenv("AI_MODEL", "gpt-4o-mini"))
        temperature = cfg.get("temperature", 0.7)
        max_tokens = cfg.get("max_tokens", 2048)

        content = ""
        success = True
        error_msg = None

        if not self.api_key or not OpenAI:
            # Fallback mock response if API key is not configured
            success = False
            error_msg = "OPENAI_API_KEY is not configured in .env or openai package is not installed."
            mock_response = {
                "Situation": "API Key Missing",
                "Analysis": "OpenAI API Key is not configured.",
                "Reasoning": "Cannot process request without credentials.",
                "Recommendation": "Please add OPENAI_API_KEY to the .env file.",
                "Risks": "N/A",
                "Confidence": 0,
                "Expected Impact": "N/A",
                "References": "System",
                "Timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
            content = json.dumps(mock_response)
        else:
            try:
                client = OpenAI(api_key=self.api_key)
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                chat_completion = client.chat.completions.create(
                    messages=messages,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    response_format={ "type": "json_object" }
                )
                
                raw = chat_completion.choices[0].message.content
                # Parse to ensure it is valid JSON
                try:
                    parsed = json.loads(raw)
                    content = json.dumps(parsed)
                except Exception:
                    # In case the model fails to return proper JSON despite response_format
                    fallback_response = {
                        "Situation": raw,
                        "Analysis": "N/A",
                        "Reasoning": "N/A",
                        "Recommendation": "N/A",
                        "Risks": "N/A",
                        "Confidence": 100,
                        "Expected Impact": "N/A",
                        "References": "System",
                        "Timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                    }
                    content = json.dumps(fallback_response)
                    
            except Exception as e:
                success = False
                error_msg = str(e)
                logger.info(f"OpenAI API error: {e}")
                # Provide a safe error payload that won't break the UI
                error_response = {
                    "Situation": f"Error: {e}",
                    "Analysis": "N/A",
                    "Reasoning": "N/A",
                    "Recommendation": "N/A",
                    "Risks": "N/A",
                    "Confidence": 0,
                    "Expected Impact": "N/A",
                    "References": "System",
                    "Timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                }
                content = json.dumps(error_response)

        execution_time = time.time() - start_time
        tokens = len(prompt + content) // 4
        
        return {
            "content": content,
            "tokens": tokens,
            "execution_time": execution_time,
            "success": success,
            "error_message": error_msg
        }
