from django.urls import path, include

urlpatterns = [
    path("health/",   include("apps.app.urls")),       # 헬스체크 등 공용
    path("learn/",    include("apps.learn.urls")),     # 학습 세트
    path("chat/",     include("apps.chat.urls")),      # Gemini 요약/설명/키워드
    path("ai/",       include("apps.chat.urls")),      # ai/ask 별칭
    path("braille/",  include("apps.braille.urls")),   # 문자→점자 인코딩/출력
    path("review/",   include("apps.learning.urls")),  # 복습 저장/조회
    path("news/",     include("apps.newsfeed.urls")),  # 뉴스 피드/카드
    path("convert/",  include("apps.braille.urls")),   # 프론트엔드 호환: /api/convert
]