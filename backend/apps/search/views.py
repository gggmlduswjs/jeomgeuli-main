import os
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")

@csrf_exempt
def search_news(request):
    """Naver News Search API"""
    query = request.GET.get("q", "인공지능")  # 기본 검색어
    display = request.GET.get("display", "5")  # 기본 5개
    sort = request.GET.get("sort", "sim")  # 기본 유사도순
    
    # Naver API 키 확인
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        return JsonResponse({
            "ok": False, 
            "error": "Naver API keys not configured"
        }, status=500)
    
    # Naver News API 호출
    url = f"https://openapi.naver.com/v1/search/news.json"
    params = {
        "query": query,
        "display": display,
        "sort": sort
    }
    
    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    }

    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        return JsonResponse({"ok": True, "data": data})
    except requests.exceptions.RequestException as e:
        return JsonResponse({
            "ok": False, 
            "error": f"Naver API request failed: {str(e)}"
        }, status=500)
    except Exception as e:
        return JsonResponse({
            "ok": False, 
            "error": f"Unexpected error: {str(e)}"
        }, status=500)

def search_home(request):
    """Search API 홈 엔드포인트"""
    return JsonResponse({
        "ok": True,
        "message": "Search API ready",
        "endpoints": {
            "news": "/api/search/?q=검색어",
            "weather": "/api/search/weather/"
        },
        "naver_configured": bool(NAVER_CLIENT_ID and NAVER_CLIENT_SECRET)
    })

def news(request):
    # Google News RSS → json 변환
    url = "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
    try:
        r = requests.get(url, timeout=6)
        r.raise_for_status()
        import xml.etree.ElementTree as ET
        root = ET.fromstring(r.text)
        items = []
        for it in root.findall(".//item")[:8]:
            items.append({
                "title": it.findtext("title"),
                "link": it.findtext("link"),
            })
        return JsonResponse({"items": items})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

def weather(request):
    # Open-Meteo 무료 API (키 불필요)
    lat = request.GET.get("lat","37.5665"); lon = request.GET.get("lon","126.9780")
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
    try:
        r = requests.get(url, timeout=6); r.raise_for_status()
        return JsonResponse(r.json())
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
