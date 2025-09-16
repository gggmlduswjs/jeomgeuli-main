from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import json, os
from pathlib import Path

# 안전한 JSON 로딩
def _load_braille_map():
    """점자 매핑 테이블을 안전하게 로드"""
    try:
        data_path = Path(settings.BASE_DIR) / "data" / "ko_braille.json"
        with open(data_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[braille] Error loading ko_braille.json: {e}")
        return {}

def text_to_cells(text: str):
    """텍스트를 점자 셀로 변환"""
    try:
        braille_map = _load_braille_map()
        res = []
        for ch in text or "":
            arr = braille_map.get(ch)
            if isinstance(arr, list) and len(arr) == 6:
                res.append(arr)
            else:
                res.append([0,0,0,0,0,0])
        return res
    except Exception as e:
        print(f"[braille] Error in text_to_cells: {e}")
        return []

@csrf_exempt
def braille_convert(request):
    """
    POST {"text": "..."} -> {"cells": [[0|1 x 6], ...]}
    프론트엔드 호환을 위한 점자 변환 API
    """
    try:
        print(f"[braille_convert] Request method: {request.method}")
        print(f"[braille_convert] Request body: {request.body}")
        
        if request.method == "GET":
            text = request.GET.get("text","")
        else:
            payload = json.loads(request.body.decode("utf-8") or "{}")
            text = payload.get("text","")
        
        print(f"[braille_convert] Text to convert: '{text}'")
        cells = text_to_cells(text)
        print(f"[braille_convert] Generated {len(cells)} cells")
        
        return JsonResponse({"cells": cells})
    except Exception as e:
        print(f"[braille_convert] Error: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def convert(request):
    """레거시 호환"""
    return braille_convert(request)