from django.urls import path
from . import views_review as views

urlpatterns = [
    path("",         views.review_list,   name="review_list"),   # GET
    path("save/",    views.review_save,   name="review_save"),   # POST
    path("enqueue/", views.review_enqueue,name="review_enqueue"),# POST
    
    # 레거시 호환
    path("add/",     views.review_add,    name="review_add"),
    path("today/",   views.review_today,  name="review_today"),
]