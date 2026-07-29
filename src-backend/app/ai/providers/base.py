from typing import Dict, Any

class BaseProvider:
    def generate(self, prompt: str, system_prompt: str = "", config: Dict[str, Any] = None) -> Dict[str, Any]:
        raise NotImplementedError("Providers must implement the generate method")
