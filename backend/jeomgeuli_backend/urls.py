from django.urls import path
from . import views
from apps.chat.views import ask
from apps.learn import views as learn_views

urlpatterns = [
    # 기본 헬스체크
    path("api/health", views.health),
    path("api/health/", views.health),

    # AI 채팅 (프론트엔드 호환)
    path("api/ai/ask", ask, name="ai_ask"),
    path("api/ai/ask/", ask, name="ai_ask_slash"),
    path("api/chat/ask", ask, name="chat_ask"),
    path("api/chat/ask/", ask, name="chat_ask_slash"),

    # 학습 데이터 (프론트엔드 호환)
    path("api/learn/chars", learn_views.learn_char, name="learn_chars"),
    path("api/learn/chars/", learn_views.learn_char, name="learn_chars_slash"),
    path("api/learn/words", learn_views.learn_word, name="learn_words"),
    path("api/learn/words/", learn_views.learn_word, name="learn_words_slash"),
    path("api/learn/sentences", learn_views.learn_sentence, name="learn_sentences"),
    path("api/learn/sentences/", learn_views.learn_sentence, name="learn_sentences_slash"),
    path("api/learn/char", learn_views.learn_char),
    path("api/learn/char/", learn_views.learn_char),
    path("api/learn/word", learn_views.learn_word),
    path("api/learn/word/", learn_views.learn_word),
    path("api/learn/sentence", learn_views.learn_sentence),
    path("api/learn/sentence/", learn_views.learn_sentence),

    # 점자 변환 (안전한 버전)
    path("api/braille/convert", views.convert_braille),
    path("api/braille/convert/", views.convert_braille),

    # 뉴스 피드
    path("api/news", views.news_feed),
    path("api/news/", views.news_feed),

    # 복습 노트(파일 기반)
    path("api/review/add/", views.review_add),
    path("api/review/today/", views.review_today),
    path("api/review/enqueue/", views.review_enqueue),

    # 뉴스 카드(구글 뉴스 RSS) - 레거시
    path("api/news/cards/", views.news_cards),
]
