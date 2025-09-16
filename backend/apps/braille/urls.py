from django.urls import path
from . import views

urlpatterns = [
    path("encode/", views.braille_convert, name="braille_encode"),
    path("convert/", views.braille_convert, name="braille_convert"),  # legacy compatibility
    path("", views.braille_convert, name="braille_convert_root"),  # /api/convert/ 호환
]