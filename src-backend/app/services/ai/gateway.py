import logging
import httpx
from app.config.settings import settings

logger = logging.getLogger(__name__)

class LLMGateway:
    """
    Enterprise abstraction layer for interacting with multiple LLMs.
    Integrates directly with Groq completions endpoints using httpx.
    """
    def __init__(self, provider="groq"):
        self.provider = provider
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        logger.info(f"Initialized LLMGateway with provider: {self.provider}, model: {self.model}")

    def generate_response(self, prompt: str, context: dict) -> str:
        """
        Takes a composed prompt + context and queries the LLM.
        """
        logger.debug(f"Querying LLM [{self.provider}] with context keys: {list(context.keys())}")
        
        if not self.api_key:
            logger.warning("GROQ_API_KEY is not configured. Using mock fallback.")
            return self._mock_fallback(prompt)

        # Prepare messages
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a Senior Grid Operations Engineer and Enterprise Grid Decision Intelligence Assistant. "
                    "Your tone is highly concise, precise, operational, and enterprise-ready. "
                    "Never start your response with 'I can...', 'I\\'ve analysed...', 'I can orchestrate...', or any conversational filler. "
                    "Focus only on direct recommendations, reasons, expected outcomes, and next actions. "
                    "Always refer to the active policy, telemetry, weather, and active grid parameters."
                )
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion/Prompt:\n{prompt}"
            }
        ]

        # Call Groq API with retries
        for attempt in range(3):
            try:
                response = httpx.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": 0.1,
                        "max_tokens": 1000
                    },
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    logger.warning(f"Groq API error (status {response.status_code}): {response.text}")
            except Exception as e:
                logger.error(f"Error querying Groq API (attempt {attempt + 1}): {e}")
        
        logger.error("Failed to query Groq API after 3 attempts. Using mock fallback.")
        return self._mock_fallback(prompt)

    def _mock_fallback(self, prompt: str) -> str:
        prompt_lower = prompt.lower()
        if "festival" in prompt_lower or "season" in prompt_lower or "calendar" in prompt_lower:
            return (
                "Current Situation\n"
                "The system has detected an active Festival Season through the Calendar API context, leading to a high illumination load surge across residential zones.\n\n"
                "Recommended Policy\n"
                "Supply Augmentation Mode (Active Load Share)\n\n"
                "Reason\n"
                "- Active festival season requires immediate electricity supply increase to match the 720 MW residential surge.\n"
                "- Battery BESS has been commanded to active discharge to support base load generation.\n\n"
                "Supporting Evidence\n"
                "- Calendar API reports Festival Illumination Season. Live load has climbed to 720 MW.\n\n"
                "Expected Operational Impact\n"
                "- Maintain system frequency at 50.00 Hz during peak surge.\n"
                "- Successfully prevent local brownouts in commercial and residential districts.\n\n"
                "Risks\n"
                "- Local transformer loading may exceed nominal thermal bounds momentarily during lighting peaks.\n\n"
                "Alternative Policies\n"
                "- Reliability Priority Mode\n\n"
                "Next Actions\n"
                "- Activate Supply Augmentation Mode\n"
                "- Monitor Substation B BESS SOC"
            )
        if "weather" in prompt_lower or "cloud" in prompt_lower or "storm" in prompt_lower:
            return (
                "Green Mode is recommended.\n"
                "Reason:\n"
                "- Weather forecast shows solar yield drop.\n"
                "- Storage state-of-charge is sufficient (SoC > 70%).\n"
                "Expected Outcome:\n"
                "- Stabilize voltage levels.\n"
                "- Reduce thermal stress on transformers.\n"
                "Next Actions:\n"
                "- Activate Green Mode policy."
            )
        return (
            "Economic Mode is active.\n"
            "Reason:\n"
            "- Grid load is normal.\n"
            "- Off-peak rates are active.\n"
            "Expected Outcome:\n"
            "- Optimize battery charging.\n"
            "- Minimize operational cost.\n"
            "Next Actions:\n"
            "- Maintain current posture."
        )
