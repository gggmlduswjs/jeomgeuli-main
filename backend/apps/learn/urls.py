from django.urls import path
from django.views.generic.base import RedirectView
from . import views

urlpatterns = [
    # 표준 경로 (복수형)
    path("chars/",     views.learn_char,     name="learn_chars"),
    path("words/",     views.learn_word,     name="learn_words"),
    path("sentences/", views.learn_sentence, name="learn_sentences"),
    
    # 과거 별칭 유지 (단수형)
    path("char/",      views.learn_char,     name="learn_char"),
    path("word/",      views.learn_word,     name="learn_word"),
    path("sentence/",  views.learn_sentence, name="learn_sentence"),
]