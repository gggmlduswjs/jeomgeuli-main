from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import json, os, unicodedata
from pathlib import Path

# 전역 점자 매핑 캐시
_BRAILLE_MAP = None

def _load_braille_map():
    """점자 매핑 테이블을 안전하게 로드 (캐시 사용)"""
    global _BRAILLE_MAP
    if _BRAILLE_MAP is not None:
        return _BRAILLE_MAP
    
    try:
        data_path = Path(settings.BASE_DIR) / "data" / "ko_braille.json"
        print(f"[braille] Loading from: {data_path}")
        print(f"[braille] Path exists: {data_path.exists()}")
        
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            print(f"[braille] Loaded {len(data)} mappings")
            print(f"[braille] Sample keys: {list(data.keys())[:5]}")
            print(f"[braille] ㄱ mapping: {data.get('ㄱ')}")
            _BRAILLE_MAP = data
            return data
    except Exception as e:
        print(f"[braille] Error loading ko_braille.json: {e}")
        import traceback
        traceback.print_exc()
        _BRAILLE_MAP = {}
        return {}

def text_to_cells(text: str):
    """텍스트를 점자 셀로 변환 (한글 자음+모음 분해 포함)"""
    try:
        # 유니코드 정규화로 조합형/분해형 통일
        normalized_text = unicodedata.normalize("NFKC", text or "")
        print(f"[braille] Converting text: '{normalized_text}' (length: {len(normalized_text)})")
        
        braille_map = _load_braille_map()
        print(f"[braille] Map loaded with {len(braille_map)} entries")
        
        res = []
        for i, ch in enumerate(normalized_text):
            # 먼저 완전한 글자로 매핑 시도
            arr = braille_map.get(ch)
            if isinstance(arr, list) and len(arr) == 6:
                res.append(arr)
                print(f"[braille] Character {i}: '{ch}' -> direct mapping: {arr}")
                continue
            elif isinstance(arr, list) and len(arr) == 12:
                # 12개 점이면 2개 셀로 분할
                res.append(arr[:6])
                res.append(arr[6:])
                print(f"[braille] Character {i}: '{ch}' -> split mapping: {arr[:6]}, {arr[6:]}")
                continue
            
            # 한글인 경우 자음+모음으로 분해
            if '가' <= ch <= '힣':
                # 한글 유니코드에서 자음, 모음, 받침 추출
                base = ord(ch) - ord('가')
                initial = base // (21 * 28)  # 초성
                medial = (base % (21 * 28)) // 28  # 중성
                final = base % 28  # 종성
                
                # 자음 매핑
                consonants = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
                vowels = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ']
                
                if initial < len(consonants):
                    initial_char = consonants[initial]
                    initial_arr = braille_map.get(initial_char)
                    if isinstance(initial_arr, list) and len(initial_arr) == 6:
                        res.append(initial_arr)
                        print(f"[braille] Character {i}: '{ch}' -> initial '{initial_char}': {initial_arr}")
                
                if medial < len(vowels):
                    medial_char = vowels[medial]
                    medial_arr = braille_map.get(medial_char)
                    if isinstance(medial_arr, list) and len(medial_arr) == 6:
                        res.append(medial_arr)
                        print(f"[braille] Character {i}: '{ch}' -> medial '{medial_char}': {medial_arr}")
                
                if final > 0 and final < len(consonants):
                    final_char = consonants[final]
                    final_arr = braille_map.get(final_char)
                    if isinstance(final_arr, list) and len(final_arr) == 6:
                        res.append(final_arr)
                        print(f"[braille] Character {i}: '{ch}' -> final '{final_char}': {final_arr}")
            else:
                # 알 수 없는 문자는 공백으로 처리
                res.append([0,0,0,0,0,0])
                print(f"[braille] Character {i}: '{ch}' -> unknown, using space")
        
        print(f"[braille] Generated {len(res)} cells: {res}")
        return res
    except Exception as e:
        print(f"[braille] Error in text_to_cells: {e}")
        import traceback
        traceback.print_exc()
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