from django.apps import AppConfig


class LearnConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.learn'
    verbose_name = '학습 데이터'
