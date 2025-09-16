from django.urls import path
from . import views
from .ai_assistant import ai_assistant_view
from .health import health_check

urlpatterns = [
    path('ask/', views.ask, name='ask'),
    path('ai/', ai_assistant_view, name='ai_assistant'),
    path('health/', health_check, name='health_check'),
    path('top/', views.news_top, name='news_top'),
]
