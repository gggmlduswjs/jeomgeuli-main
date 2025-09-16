from django.urls import path
from .views import api_health, braille_convert, news_list

urlpatterns = [
    path("api/health/", api_health),
    path("api/braille/convert/", braille_convert),   # 자유변환/퀴즈용 점자 변환
    path("api/news/", news_list),                    # 구글뉴스 RSS → JSON 프록시
]
