# services/ai.py
from __future__ import annotations
from typing import Dict, List
import os, json, re, logging

logger = logging.getLogger(__name__)
REQUIRED_KEYS = {"summary", "bullets", "keywords"}

PROMPT = """
다음 텍스트를 분석해서 결과를 JSON으로 반환하세요.
- summary: 핵심을 2~4문장으로 한국어 요약
- bullets: 초등학생도 이해할 쉬운 한국어 불릿 2~3개
- keywords: 핵심 키워드 2~3개 (짧게)
반드시 아래 JSON 키만 포함해 반환하세요: summary, bullets, keywords.
JSON만 반환하세요.
"""

def _fallback(text: str) -> Dict[str, object]:
    # Very safe deterministic fallback
    head = (text or "").strip()
    head = re.sub(r"\s+", " ", head)[:120]
    return {
        "summary": f"'{head}...'에 대한 간단 요약입니다. 실제 환경에서는 Gemini API로 더 정확한 결과를 제공합니다.",
        "bullets": ["핵심 포인트 1", "핵심 포인트 2"],
        "keywords": ["키워드1", "키워드2"],
    }

def _coerce_schema(obj: dict) -> Dict[str, object]:
    # Ensure required keys & types
    res = {k: obj.get(k) for k in REQUIRED_KEYS}
    if not isinstance(res.get("summary"), str):
        res["summary"] = str(res.get("summary", ""))

    def _to_str_list(x):
        if isinstance(x, list):
            return [str(i) for i in x]
        if isinstance(x, str):
            # split by newline or bullets
            parts = [p.strip("•- ").strip() for p in x.splitlines() if p.strip()]
            return parts[:3] or [x]
        return []
    res["bullets"] = _to_str_list(res.get("bullets"))
    res["keywords"] = _to_str_list(res.get("keywords"))
    return res

def _extract_json(text: str) -> dict | None:
    """
    Accepts raw model text; strips ```json fences; extracts first {...} block.
    """
    if not text:
        return None
    t = text.strip()
    # remove code fences
    t = re.sub(r"^```json\s*|\s*```$", "", t, flags=re.IGNORECASE)
    # try direct json
    try:
        return json.loads(t)
    except Exception:
        pass
    # find first JSON object
    m = re.search(r"\{.*\}", t, flags=re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        return None

def summarize(text: str) -> Dict[str, object]:
    """
    Returns a dict with keys: summary (str), bullets (list[str]), keywords (list[str]).
    Never raises. Falls back on any error.
    """
    raw = (text or "").strip()
    if not raw:
        return {"summary": "", "bullets": [], "keywords": []}

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        logger.warning("[AI] GEMINI_API_KEY missing → fallback")
        return _fallback(raw)

    # Lazy import to avoid ImportError at module import time
    try:
        import google.generativeai as genai  # type: ignore
    except Exception as e:
        logger.exception("[AI] google-generativeai import failed → fallback")
        return _fallback(raw)

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"{PROMPT}\n\n분석할 텍스트:\n{raw}"

        # Request with timeout; if SDK doesn't support, ignore silently.
        kwargs = {"request_options": {"timeout": 15}}
        try:
            response = model.generate_content(prompt, **kwargs)
        except TypeError:
            response = model.generate_content(prompt)

        resp_text = getattr(response, "text", "") or ""
        obj = _extract_json(resp_text)
        if not isinstance(obj, dict):
            logger.warning("[AI] Could not parse JSON; using fallback")
            return _fallback(raw)

        obj = _coerce_schema(obj)
        if not REQUIRED_KEYS <= set(obj.keys()):
            logger.warning("[AI] Missing keys in response; using fallback")
            return _fallback(raw)

        logger.info("[AI] Gemini processed successfully")
        return obj

    except Exception:
        logger.exception("[AI] Gemini runtime error → fallback")
        return _fallback(raw)
