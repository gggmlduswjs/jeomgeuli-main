from django.urls import path
from . import views

urlpatterns = [
    path("convert/", views.braille_convert, name="braille_convert"),
    path("", views.braille_convert, name="braille_convert_root"),  # /api/convert/ 호환
]