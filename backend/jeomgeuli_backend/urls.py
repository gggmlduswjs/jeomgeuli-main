from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def root_health(request):
    """루트 health 엔드포인트"""
    return JsonResponse({"ok": True, "message": "Server is running"})

urlpatterns = [
    path("admin/", admin.site.urls),

    # 루트 health 엔드포인트
    path("api/health/", root_health, name="root_health"),

    # API 라우팅
    path("api/app/", include("apps.app.urls")),
    path("api/api/", include("apps.api.urls")),
    path("api/braille/", include("apps.braille.urls")),
    path("api/chat/", include("apps.chat.urls")),
    path("api/learn/", include("apps.learn.urls")),
    path("api/learning/", include("apps.learning.urls")),
    path("api/newsfeed/", include("apps.newsfeed.urls")),
    path("api/search/", include("apps.search.urls")),
]

# React SPA fallback - 발표/시연용 구조 (절대 변경 금지)
# /api/* 요청은 Django API로 전달, 나머지 요청은 React index.html 반환
urlpatterns += [
    re_path(r"^(?!api/).*", TemplateView.as_view(template_name="index.html")),
]

# 정적 파일 서빙 (개발용)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])