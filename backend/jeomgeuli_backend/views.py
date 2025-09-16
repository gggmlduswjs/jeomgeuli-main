import json, os, datetime, logging
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import feedparser

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
REVIEW_FILE = os.path.join(DATA_DIR, "review.json")

def _load_json(filename, default):
    try:
        with open(os.path.join(DATA_DIR, filename), "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default

def _save_review(obj):
    try:
        with open(REVIEW_FILE, "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def health(_):
    return JsonResponse({"ok": True})

# -------- 학습 데이터 --------
def learn_chars(_):
    return JsonResponse(_load_json("lesson_chars.json", {"items": []}))

def learn_words(_):
    return JsonResponse(_load_json("lesson_words.json", {"items": []}))

def learn_sentences(_):
    return JsonResponse(_load_json("lesson_sentences.json", {"items": []}))

# -------- 간단 한국점자 매핑(서버용 fallback) --------
JAMO = {
    # 한글 자음
    "ㄱ":[1,0,0,0,0,0], "ㄲ":[1,1,0,0,0,0], "ㄴ":[1,0,1,0,0,0], "ㄷ":[1,1,0,0,1,0],
    "ㄹ":[1,0,0,1,0,0], "ㅁ":[1,0,1,1,0,0], "ㅂ":[1,1,0,1,0,0], "ㅅ":[0,1,0,1,0,0],
    "ㅆ":[0,1,1,1,0,0], "ㅇ":[0,0,1,1,0,0], "ㅈ":[1,0,0,0,1,0], "ㅊ":[1,0,0,1,1,0],
    "ㅋ":[1,0,1,0,1,0], "ㅌ":[1,1,0,0,1,0], "ㅍ":[1,1,1,0,1,0], "ㅎ":[0,1,0,0,1,0],
    # 한글 모음
    "ㅏ":[0,0,1,0,0,0], "ㅓ":[0,1,0,0,0,0], "ㅗ":[0,0,1,1,0,0], "ㅜ":[0,1,1,0,0,0],
    "ㅡ":[0,1,0,1,0,0], "ㅣ":[0,0,0,1,0,0], "ㅑ":[0,0,1,0,1,0], "ㅕ":[0,1,0,0,1,0],
    "ㅛ":[0,0,1,1,1,0], "ㅠ":[0,1,1,0,1,0], "ㅐ":[0,0,1,0,0,1], "ㅔ":[0,1,0,0,0,1],
    # 영어 (간단한 매핑)
    "a":[1,0,0,0,0,0], "b":[1,1,0,0,0,0], "c":[1,0,0,1,0,0], "d":[1,0,0,1,1,0],
    "e":[1,0,0,0,1,0], "f":[1,1,0,1,0,0], "g":[1,1,0,1,1,0], "h":[1,1,0,0,1,0],
    "i":[0,1,0,1,0,0], "j":[0,1,0,1,1,0], "k":[1,0,1,0,0,0], "l":[1,1,1,0,0,0],
    "m":[1,0,1,1,0,0], "n":[1,0,1,1,1,0], "o":[1,0,1,0,1,0], "p":[1,1,1,1,0,0],
    "q":[1,1,1,1,1,0], "r":[1,1,1,0,1,0], "s":[0,1,1,1,0,0], "t":[0,1,1,1,1,0],
    "u":[1,0,1,0,0,1], "v":[1,1,1,0,0,1], "w":[0,1,0,1,1,1], "x":[1,0,1,1,0,1],
    "y":[1,0,1,1,1,1], "z":[1,0,1,0,1,1],
    # 특수문자
    "·":[0,0,0,0,0,0], " ":[0,0,0,0,0,0], ".":[0,1,0,1,1,0], ",":[0,1,0,0,0,0],
    "!":[0,1,1,0,1,0], "?":[0,1,1,0,0,1]
}
import unicodedata
def _text_to_cells(txt):
    cells=[]
    for ch in txt.strip():
        if ch in JAMO:
            cells.append(JAMO[ch])
            continue
        # 한글 낱자 분해
        try:
            dec=unicodedata.normalize("NFD", ch)
            for j in dec:
                if j in JAMO: 
                    cells.append(JAMO[j])
        except Exception:
            # 알 수 없는 문자는 공백으로 처리
            cells.append([0,0,0,0,0,0])
    return cells

@csrf_exempt
@require_POST
def convert_braille(request):
    """
    요청: { "text": "안녕", "mode": "char|word|sentence" }
    응답:
    {
      "ok": true,
      "cells": [ [1,0,0,0,0,0], ... ],   # 6점 배열 (UI 호환)
      "bins":  ["100000", ...],          # 문자열 6비트 (기타 호환)
      "len":   2
    }
    """
    try:
        body = request.body.decode("utf-8-sig") if request.body else "{}"
        payload = json.loads(body)
    except Exception as e:
        logger.exception("convert_braille invalid_json")
        return JsonResponse({"ok": False, "error": "invalid_json"}, status=400)

    text = (payload.get("text") or "").strip()
    mode = (payload.get("mode") or "word").strip()

    if not text:
        return JsonResponse({"ok": False, "error": "empty_text"}, status=400)

    try:
        # --- 최소 동작 보장용 아주 단순 매핑 (실 서비스 로직으로 교체 가능) ---
        # dot1(100000)로 모두 찍어 UI를 반드시 뜨게 한다. (프론트 폴백도 함께 넣을 것)
        def cell_bin(dot1=True):
            return "100000" if dot1 else "000000"

        bins = [cell_bin(True) for _ in text]
        cells = [[int(b) for b in s] for s in bins]

        return JsonResponse({"ok": True, "cells": cells, "bins": bins, "len": len(bins)})
    except Exception as e:
        logger.exception("convert_braille failed")
        # 절대 500으로 죽지 말고, 프론트가 폴백하도록 안전 반환
        return JsonResponse({"ok": False, "error": "convert_failed"}, status=200)

# 레거시 함수 (호환성 유지)
@csrf_exempt
def braille_convert(request):
    if request.method!="POST":
        return HttpResponseBadRequest("POST only")
    try:
        # UTF-8 인코딩으로 요청 본문 디코딩
        request_body = request.body.decode("utf-8")
        body=json.loads(request_body)
        text=body.get("text","")
        
        # 빈 텍스트 처리
        if not text:
            return JsonResponse({"cells": [], "braille": ""})
            
        cells=_text_to_cells(text)
        
        # 점자 패턴을 문자열로 변환 (디버깅용)
        braille_str = ""
        for cell in cells:
            braille_str += "".join(["●" if dot else "○" for dot in cell])
        
        return JsonResponse({
            "cells": cells,
            "braille": braille_str,
            "original": text
        })
    except json.JSONDecodeError as e:
        return HttpResponseBadRequest(f"Invalid JSON: {str(e)}")
    except Exception as e:
        return HttpResponseBadRequest(f"Conversion error: {str(e)}")

# -------- 복습노트(파일 기반) --------
@csrf_exempt
def review_add(request):
    if request.method!="POST": return HttpResponseBadRequest("POST only")
    try:
        body=json.loads(request.body.decode("utf-8"))
        item_type=body.get("type")   # char|word|sentence|keyword
        content=body.get("content","")
        src=body.get("source","")
        today=datetime.date.today().isoformat()
        db=_load_json("review.json", {})
        day=db.get(today, [])
        day.append({"type":item_type,"content":content,"source":src,"ts":datetime.datetime.now().isoformat()})
        db[today]=day
        _save_review(db)
        return JsonResponse({"ok":True, "saved": len(day)})
    except Exception as e:
        return HttpResponseBadRequest(str(e))

def review_today(_):
    today=datetime.date.today().isoformat()
    db=_load_json("review.json", {})
    return JsonResponse({"date": today, "items": db.get(today, [])})

@csrf_exempt
def review_enqueue(request):
    if request.method!="POST": 
        return HttpResponseBadRequest("POST only")
    try:
        body=json.loads(request.body.decode("utf-8"))
        item_type=body.get("type", "unknown")
        data=body.get("data", {})
        category=body.get("category", "")
        
        # 복습 데이터 저장
        today=datetime.date.today().isoformat()
        db=_load_json("review.json", {})
        day=db.get(today, [])
        
        # 데이터 구조에 따라 content 추출
        content = ""
        if isinstance(data, dict):
            content = data.get("text", data.get("content", str(data)))
        else:
            content = str(data)
            
        day.append({
            "type": item_type,
            "content": content,
            "category": category,
            "data": data,
            "ts": datetime.datetime.now().isoformat()
        })
        db[today]=day
        _save_review(db)
        
        return JsonResponse({"ok": True, "saved": len(day)})
    except Exception as e:
        return HttpResponseBadRequest(str(e))

# -------- 뉴스 피드 (새로운 안전한 버전) --------
def news_feed(request):
    """
    GET /api/news?q=키워드
    Google News RSS를 feedparser로 읽어 상위 10개 반환
    """
    q = request.GET.get("q", "한국 뉴스")
    url = f"https://news.google.com/rss/search?q={q}&hl=ko&gl=KR&ceid=KR:ko"
    try:
        d = feedparser.parse(url)
        items = []
        for e in (d.entries or [])[:10]:
            items.append({
                "title": getattr(e, "title", ""),
                "link": getattr(e, "link", ""),
                "summary": getattr(e, "summary", "")[:500],
                "published": getattr(e, "published", ""),
            })
        return JsonResponse({"ok": True, "items": items})
    except Exception as e:
        logger.exception("news_feed failed")
        return JsonResponse({"ok": False, "items": [], "error": "news_failed"})

# -------- 뉴스 카드 (구글 뉴스 RSS) - 레거시 --------
def news_cards(_):
    url="https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
    feed=feedparser.parse(url)
    items=[]
    for e in feed.entries[:5]:
        items.append({
            "title": e.title,
            "summary": (getattr(e, "summary", "") or "")[:180],
            "link": getattr(e, "link", "")
        })
    return JsonResponse({"items": items})
