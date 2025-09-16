from django.urls import path
from . import views_review

urlpatterns = [
    # Review system endpoints
    path("enqueue/", views_review.enqueue_review, name="enqueue_review"),
    path("add/", views_review.add_review, name="add_review"),
    path("next/", views_review.next_reviews, name="next_reviews"),
    path("grade/<int:item_id>/", views_review.grade_review, name="grade_review"),
]
