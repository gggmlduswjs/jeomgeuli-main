from pathlib import Path
import json
import os
from datetime import datetime
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
        print(f"[braille_convert] Request method: {request.method}")
        print(f"[braille_convert] Request body: {request.body}")
        
        body = json.loads(request.body.decode("utf-8") or "{}")
        text = (body.get("text") or "").strip()
        print(f"[braille_convert] Text to convert: '{text}'")
        
        table = _load_json("ko_braille.json")  # 없거나 깨져도 {}
        print(f"[braille_convert] Loaded table with {len(table)} entries")
        
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
        
        print(f"[braille_convert] Generated {len(cells)} cells")
        return JsonResponse({"cells": cells})
    except Exception as e:
        print(f"[braille_convert] Error: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({"cells": [], "error": str(e)})

# 별칭: /api/convert (프론트엔드 호환)
convert_braille = braille_convert

# --- 복습 시스템 ---

@csrf_exempt
def review_save(request):
    """
    POST {"kind": "wrong|keyword", "payload": {...}} -> {"ok": true}
    복습 항목을 저장합니다.
    """
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
        kind = body.get("kind", "wrong")
        payload = body.get("payload", {})
        
        # 간단한 파일 기반 저장 (실제로는 DB 사용 권장)
        review_file = DATA_DIR / "review.json"
        reviews = []
        
        if review_file.exists():
            try:
                with open(review_file, "r", encoding="utf-8") as f:
                    reviews = json.load(f)
            except:
                reviews = []
        
        # 새 항목 추가
        reviews.append({
            "kind": kind,
            "payload": payload,
            "timestamp": datetime.now().isoformat(),
            "id": len(reviews) + 1
        })
        
        # 파일에 저장
        with open(review_file, "w", encoding="utf-8") as f:
            json.dump(reviews, f, ensure_ascii=False, indent=2)
        
        return JsonResponse({"ok": True})
    except Exception as e:
        return JsonResponse({"detail": str(e)}, status=500)

@csrf_exempt
def review_enqueue(request):
    """
    POST {"kind": "wrong|keyword", "payload": {...}} -> {"ok": true}
    복습 대기열에 항목을 추가합니다.
    """
    return review_save(request)  # 동일한 로직 사용

@csrf_exempt
def review_list(request):
    """
    GET -> {"items": [...]}
    복습 항목 목록을 반환합니다.
    """
    try:
        review_file = DATA_DIR / "review.json"
        reviews = []
        
        if review_file.exists():
            try:
                with open(review_file, "r", encoding="utf-8") as f:
                    reviews = json.load(f)
            except:
                reviews = []
        
        return JsonResponse({"items": reviews})
    except Exception as e:
        return JsonResponse({"detail": str(e)}, status=500)

# 레거시 함수들 (URL 호환성)
def review_add(request):
    """레거시: review_save와 동일"""
    return review_save(request)

def review_today(request):
    """레거시: review_list와 동일"""
    return review_list(request)

def news_feed(request):
    """뉴스 피드 - 간단한 목업"""
    return JsonResponse({
        "items": [
            {"title": "샘플 뉴스 1", "summary": "샘플 요약 1", "url": "#"},
            {"title": "샘플 뉴스 2", "summary": "샘플 요약 2", "url": "#"}
        ]
    })

def news_cards(request):
    """뉴스 카드 - 간단한 목업"""
    return JsonResponse({
        "cards": [
            {"title": "샘플 카드 1", "summary": "샘플 요약 1", "url": "#"},
            {"title": "샘플 카드 2", "summary": "샘플 요약 2", "url": "#"}
        ]
    })

# --- Gemini Chat moved to apps.chat.views.chat_ask ---
# The chat_ask function has been moved to apps/chat/views.py
# to avoid conflicts and use proper Gemini integration
