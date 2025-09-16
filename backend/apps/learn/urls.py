from django.urls import path
from . import views

urlpatterns = [
    path("learn/char/", views.learn_char),
    path("learn/word/", views.learn_word),
    path("learn/sentence/", views.learn_sentence),
    path("health/", views.health),
]