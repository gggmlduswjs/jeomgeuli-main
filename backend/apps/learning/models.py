from django.db import models
from django.utils import timezone
import json

class ReviewItem(models.Model):
    """복습 항목 - 자모/단어/문장 등"""
    TYPE_CHOICES = [
        ('char', '자모'),
        ('word', '단어'),
        ('sentence', '문장'),
        ('braille', '점자변환'),
    ]
    
    SOURCE_CHOICES = [
        ('manual', '수동추가'),
        ('quiz_wrong', '퀴즈오답'),
        ('free_convert', '자유변환'),
        ('learning_queue', '학습큐'),
    ]
    
    # 기본 정보
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')
    content = models.JSONField(help_text="학습 내용 (JSON)")
    
    # SRS 필드
    ease_factor = models.FloatField(default=2.5)  # SM-2 ease factor
    interval = models.IntegerField(default=1)     # 일 단위
    repetitions = models.IntegerField(default=0)  # 반복 횟수
    next_due = models.DateTimeField(default=timezone.now)
    
    # 메타데이터
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['next_due', 'created_at']
        indexes = [
            models.Index(fields=['next_due', 'type']),
            models.Index(fields=['type', 'source']),
        ]
    
    def __str__(self):
        return f"{self.get_type_display()}: {self.get_content_display()}"
    
    def get_content_display(self):
        """내용의 표시용 문자열 반환"""
        content = self.content
        if isinstance(content, dict):
            if self.type == 'char':
                return content.get('char', '?')
            elif self.type == 'word':
                return content.get('word', '?')
            elif self.type == 'sentence':
                return content.get('text', '?')
            elif self.type == 'braille':
                return content.get('text', '?')
        return str(content)
    
    def is_due(self):
        """복습 시간이 되었는지 확인"""
        return timezone.now() >= self.next_due

class ReviewAttempt(models.Model):
    """복습 시도 기록"""
    GRADE_CHOICES = [
        (0, '틀림'),
        (1, '어려움'),
        (2, '보통'),
        (3, '쉬움'),
        (4, '완벽'),
    ]
    
    review_item = models.ForeignKey(ReviewItem, on_delete=models.CASCADE, related_name='attempts')
    grade = models.IntegerField(choices=GRADE_CHOICES)
    response_time = models.FloatField(null=True, blank=True, help_text="응답 시간 (초)")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.review_item}: {self.get_grade_display()} ({self.created_at.strftime('%m-%d %H:%M')})"
