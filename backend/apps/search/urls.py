from django.urls import path
from . import views

urlpatterns = [
    path("", views.search_news, name="search_news"),  # Naver News Search API
    path("home/", views.search_home, name="search_home"),  # API 정보
    path("news/", views.news, name="google_news"),  # Google News RSS
    path("weather/", views.weather, name="weather"),  # Weather API
]
