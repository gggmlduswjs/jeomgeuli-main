from django.http import JsonResponse
import requests

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
