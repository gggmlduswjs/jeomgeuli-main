# apps/chat/views.py
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from services.ai import summarize  # safe; summarize never raises

def _safe_json(request):
    """
    어떤 형식이 와도 dict로 변환:
    - JSON(body bytes) → dict
    - 폼데이터 → dict
    - 문자열 → {"query": "..."}
    - 실패 시 → {}
    """
    try:
        # 우선 JSON 시도
        raw = (request.body or b'').decode('utf-8') if isinstance(request.body, (bytes, bytearray)) else (request.body or '')
        raw = raw.strip()
        if raw:
            try:
                data = json.loads(raw)
                # 만약 data가 문자열이라면 {"query": data}로 감싸기
                if isinstance(data, str):
                    return {"query": data}
                if isinstance(data, dict):
                    return data
            except Exception:
                pass

        # 폼데이터(예: application/x-www-form-urlencoded)
        if hasattr(request, "POST") and request.POST:
            return request.POST.dict()
    except Exception:
        pass

    return {}

@csrf_exempt
def ask(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    data = _safe_json(request)

    # 호환 키: query / q / text
    query = (data.get("query") or data.get("q") or data.get("text") or "").strip() if isinstance(data, dict) else ""
    mode = (data.get("mode") or "qa") if isinstance(data, dict) else "qa"
    
    if not query:
        return JsonResponse({"error": "missing 'query'"}, status=400)

    # === 실제 처리부 (LLM/검색/요약 등) ===
    result = summarize(query)
    
    # Convert to expected frontend format
    response = {
        "chat_markdown": result.get("summary", ""),
        "keywords": result.get("keywords", []),
        "braille_words": [],  # Not implemented yet
        "mode": mode,
        "actions": {},
        "meta": {},
        "ok": True,
        "error": None
    }
    
    return JsonResponse(response)


