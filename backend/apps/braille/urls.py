from django.urls import path
from . import views

urlpatterns = [
    path('output/', views.braille_output, name='braille_output'),
]
