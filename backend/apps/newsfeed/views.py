import feedparser
from django.http import JsonResponse

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

def headlines(request):
    """레거시 호환"""
    url = "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
    try:
        d = feedparser.parse(url)
        items = []
        for e in d.entries[:5]:
            items.append({
                "title": e.title,
                "summary": (e.summary if hasattr(e, "summary") else "")[:160],
                "url": e.link
            })
        return JsonResponse({"items": items})
    except:
        return news_feed(request)
