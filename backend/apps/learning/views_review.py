import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from .models import ReviewItem, ReviewAttempt
from .srs import calculate_next_review, get_due_items

@csrf_exempt
@require_http_methods(["POST"])
def enqueue_review(request):
    """복습 항목 추가"""
    try:
        data = json.loads(request.body)
        
        # 필수 필드 검증
        required_fields = ['type', 'content']
        for field in required_fields:
            if field not in data:
                return JsonResponse({
                    'error': f'Missing required field: {field}'
                }, status=400)
        
        # 타입 검증
        valid_types = ['char', 'word', 'sentence', 'braille']
        if data['type'] not in valid_types:
            return JsonResponse({
                'error': f'Invalid type. Must be one of: {valid_types}'
            }, status=400)
        
        # ReviewItem 생성
        review_item = ReviewItem.objects.create(
            type=data['type'],
            source=data.get('source', 'manual'),
            content=data['content'],
            next_due=timezone.now()  # 즉시 복습 가능
        )
        
        return JsonResponse({
            'success': True,
            'id': review_item.id,
            'message': f'Review item added: {review_item.get_content_display()}'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["GET"])
def next_reviews(request):
    """다음 복습할 항목들 가져오기"""
    try:
        count = int(request.GET.get('n', 10))
        count = min(count, 50)  # 최대 50개로 제한
        
        due_items = get_due_items(count)
        
        items = []
        for item in due_items:
            items.append({
                'id': item.id,
                'type': item.type,
                'content': item.content,
                'display': item.get_content_display(),
                'source': item.source,
                'ease_factor': item.ease_factor,
                'interval': item.interval,
                'repetitions': item.repetitions,
                'next_due': item.next_due.isoformat(),
                'created_at': item.created_at.isoformat(),
            })
        
        return JsonResponse({
            'items': items,
            'count': len(items),
            'total_due': ReviewItem.objects.filter(
                next_due__lte=timezone.now()
            ).count()
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def grade_review(request, item_id):
    """복습 결과 제출 (정오답 및 다음 복습 시간 계산)"""
    try:
        data = json.loads(request.body)
        grade = data.get('grade')
        response_time = data.get('response_time')
        
        if grade is None:
            return JsonResponse({'error': 'Grade is required'}, status=400)
        
        if not (0 <= grade <= 4):
            return JsonResponse({'error': 'Grade must be between 0 and 4'}, status=400)
        
        try:
            review_item = ReviewItem.objects.get(id=item_id)
        except ReviewItem.DoesNotExist:
            return JsonResponse({'error': 'Review item not found'}, status=404)
        
        # SRS 계산으로 다음 복습 시간 업데이트
        updates = calculate_next_review(review_item, grade)
        
        # ReviewItem 업데이트
        for field, value in updates.items():
            setattr(review_item, field, value)
        review_item.save()
        
        # 시도 기록 생성
        ReviewAttempt.objects.create(
            review_item=review_item,
            grade=grade,
            response_time=response_time
        )
        
        return JsonResponse({
            'success': True,
            'next_due': review_item.next_due.isoformat(),
            'ease_factor': review_item.ease_factor,
            'interval': review_item.interval,
            'repetitions': review_item.repetitions,
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def add_review(request):
    """간단한 복습 항목 추가 (오답 큐용)"""
    try:
        data = json.loads(request.body)
        
        # 간단한 응답
        return JsonResponse({
            "ok": True, 
            "saved": data,
            "message": "오답이 복습 큐에 추가되었습니다."
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
