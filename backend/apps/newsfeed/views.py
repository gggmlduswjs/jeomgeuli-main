import feedparser
from django.http import JsonResponse

def headlines(request):
    url = "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
    d = feedparser.parse(url)
    items = []
    for e in d.entries[:5]:
        items.append({
            "title": e.title,
            "summary": (e.summary if hasattr(e, "summary") else "")[:160],
            "url": e.link
        })
    return JsonResponse({"items": items})
