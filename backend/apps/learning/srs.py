"""
간단한 SM-2 기반 Spaced Repetition System
"""
from django.utils import timezone
from datetime import timedelta

def calculate_next_review(review_item, grade):
    """
    SM-2 알고리즘으로 다음 복습 시간 계산
    
    Args:
        review_item: ReviewItem 인스턴스
        grade: 0(틀림) ~ 4(완벽)
    
    Returns:
        dict: 업데이트할 필드들
    """
    ease_factor = review_item.ease_factor
    interval = review_item.interval
    repetitions = review_item.repetitions
    
    if grade < 3:  # 틀렸거나 어려웠으면 처음부터
        new_repetitions = 0
        new_interval = 1
        new_ease_factor = max(1.3, ease_factor - 0.2)
    else:  # 맞았으면
        new_repetitions = repetitions + 1
        
        if repetitions == 0:
            new_interval = 1
        elif repetitions == 1:
            new_interval = 6
        else:
            new_interval = int(interval * ease_factor)
        
        # ease factor 조정
        new_ease_factor = ease_factor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
        new_ease_factor = max(1.3, new_ease_factor)
    
    # 다음 복습 시간 계산
    next_due = timezone.now() + timedelta(days=new_interval)
    
    return {
        'ease_factor': round(new_ease_factor, 2),
        'interval': new_interval,
        'repetitions': new_repetitions,
        'next_due': next_due,
    }

def get_due_items(count=10):
    """
    복습 시간이 된 항목들을 가져오기
    
    Args:
        count: 가져올 항목 수
    
    Returns:
        QuerySet: 복습할 ReviewItem들
    """
    from .models import ReviewItem
    
    return ReviewItem.objects.filter(
        next_due__lte=timezone.now()
    ).order_by('next_due', 'created_at')[:count]
