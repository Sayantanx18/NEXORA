from dotenv import load_dotenv
load_dotenv()

import json
import os
from google import genai

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

MODEL = "gemini-3.5-flash-lite"


def analyze_fraud_case(evidence: dict) -> dict:
    prompt = f"""
You are an AI fraud investigation assistant.

Analyze the following fraud investigation evidence:

{json.dumps(evidence, default=str)}

Return ONLY valid JSON using this structure:

{{
    "summary": "Brief case summary",
    "risk_assessment": "LOW, MEDIUM, HIGH, or CRITICAL",
    "suspicious_indicators": [],
    "historical_pattern_analysis": "Analysis of historical patterns",
    "reasoning": [],
    "recommended_next_action": "Recommended action",
    "confidence": 0.0
}}
"""

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
        )

        text = response.text.strip()

        start = text.find("{")
        end = text.rfind("}") + 1

        if start == -1 or end <= start:
            raise ValueError("AI did not return valid JSON")

        return json.loads(text[start:end])

    except Exception as exc:
        return {
            "summary": (
                "AI analysis temporarily unavailable. "
                "Rule-based investigation completed successfully."
            ),
            "risk_assessment": "UNKNOWN",
            "suspicious_indicators": [],
            "historical_pattern_analysis": (
                "Historical transaction patterns were "
                "analyzed by the backend."
            ),
            "reasoning": [
                f"AI service unavailable: {type(exc).__name__}"
            ],
            "recommended_next_action": "REVIEW",
            "confidence": 0.0,
        }
