# apps/chat/urls.py
from django.urls import path
from .views import chat_ask, chat_detail, health, llm_health, news_summary, naver_news, explore

urlpatterns = [
    path("ask/", chat_ask, name="chat_ask"),
    path("detail/", chat_detail, name="chat_detail"),  # 자세한 설명 모드
    path("health/", health, name="health"),
    path("llm/health/", llm_health, name="llm_health"),
    path("news/summary/", news_summary, name="news_summary"),
    path("news/", naver_news, name="naver_news"),  # 네이버 뉴스 API 프록시
    path("explore/", explore, name="explore"),      # 정보탐색 모드: GPT + 뉴스
]
