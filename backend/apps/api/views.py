from pathlib import Path
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

DATA_DIR = Path(settings.BASE_DIR) / "data"

def _load_json(name: str):
    """
    data/name 을 안전하게 읽어 dict 반환.
    - 파일이 없거나, UTF-8 BOM, 혹은 깨진 JSON이라도 예외를 터뜨리지 않음.
    """
    p = DATA_DIR / name
    if not p.exists():
        return {}
    try:
        # BOM 포함 가능성 대비 utf-8-sig
        with open(p, "r", encoding="utf-8-sig") as f:
            return json.load(f)
    except Exception:
        # 손상/오타 등 어떤 경우라도 빈 매핑
        return {}

def health(_):
    return JsonResponse({"ok": True})

def learn(request, mode):
    """
    GET /api/learn/char/ | /word/ | /sentence/
    """
    name_map = {
        "char": "lesson_chars.json",
        "word": "lesson_words.json",
        "sentence": "lesson_sentences.json",
    }
    if mode not in name_map:
        return JsonResponse({"detail": "mode not found"}, status=404)
    try:
        payload = _load_json(name_map[mode])
        return JsonResponse(payload)
    except Exception as e:
        return JsonResponse({"detail": str(e)}, status=500)

@csrf_exempt
def braille_convert(request):
    """
    POST {"text": "..."} -> {"cells": [[0|1 x 6], ...]}
    매핑이 없거나 문자를 못 찾으면 6점 모두 0(빈 점)으로 반환.
    어떤 경우에도 500을 던지지 말고 JsonResponse로 안전 반환.
    """
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
        text = (body.get("text") or "").strip()
        table = _load_json("ko_braille.json")  # 없거나 깨져도 {}
        cells = []
        for ch in text:
            pattern = table.get(ch)
            if pattern is None:
                if ch == " ":
                    pattern = [0,0,0,0,0,0]
                else:
                    pattern = [0,0,0,0,0,0]
            if not isinstance(pattern, (list, tuple)) or len(pattern) != 6:
                pattern = [0,0,0,0,0,0]
            cells.append([1 if int(x) else 0 for x in pattern])
        return JsonResponse({"cells": cells})
    except Exception:
        return JsonResponse({"cells": []})

# --- Gemini Chat (simple) ---
import os, requests

@csrf_exempt
def chat_ask(request):
    """
    POST {"query":"오늘의 뉴스 5개 요약해줘"}
    Return:
    {
      "mode": "news|weather|qa",
      "messages": [{"role":"assistant","text":"..."}],
      "cards": [{"title":"...", "summary":"...", "url":"..."}],
      "keywords": ["경제","물가"]
    }
    """
    try:
        body = json.loads(request.body.decode("utf-8"))
        q = (body.get("query") or "").strip()
        if not q:
            return JsonResponse({"messages":[{"role":"assistant","text":"질문을 입력해주세요."}], "keywords":[]})

        # Very light intent detection
        lower = q.lower()
        mode = "qa"
        if "뉴스" in q or "news" in lower:
            mode = "news"
        elif "날씨" in q or "weather" in lower:
            mode = "weather"

        # -- MOCK path if no key --
        key = os.getenv("GOOGLE_API_KEY", "")
        if not key:
            resp = {
              "mode": mode,
              "messages":[{"role":"assistant","text": "개발용 목업 응답입니다."}],
              "cards": [],
              "keywords": ["뉴스","요약"] if mode=="news" else (["날씨","오늘"] if mode=="weather" else ["질문","답변"])
            }
            if mode=="news":
                # quick RSS top5 (optional): return empty list if blocked
                try:
                    import feedparser
                    feed = feedparser.parse("https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko")
                    cards=[]
                    for e in feed.entries[:5]:
                        cards.append({"title": e.title, "summary": e.get("summary",""), "url": e.link})
                    resp["cards"]=cards
                except:
                    pass
            return JsonResponse(resp)

        # -- Real Gemini call (text-only minimal prompt) --
        # You can replace requests with google genai SDK if available.
        # Here we just echo to keep the scaffold.
        return JsonResponse({
            "mode": mode,
            "messages":[{"role":"assistant","text": f"(Gemini 응답) '{q}' 에 대한 요약/설명입니다."}],
            "cards": [],
            "keywords": ["키워드","요약"]
        })
    except Exception as e:
        return JsonResponse({"detail": str(e)}, status=500)
