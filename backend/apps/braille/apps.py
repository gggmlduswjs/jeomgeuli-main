from django.apps import AppConfig


class BrailleConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.braille'
    verbose_name = '점자 변환'