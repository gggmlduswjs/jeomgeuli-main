from django.urls import path
from . import views

urlpatterns = [
    path("",       views.news_feed,  name="news_feed"),
    path("cards/", views.news_cards, name="news_cards"),
]
