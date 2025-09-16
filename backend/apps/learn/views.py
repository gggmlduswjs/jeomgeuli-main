from django.http import JsonResponse
from django.conf import settings
import json, os
from pathlib import Path

def _load_json(filename):
    try:
        # Make sure this path is correct relative to your project root
        DATA_PATH = Path(settings.BASE_DIR) / 'data'
        file_path = DATA_PATH / filename
        
        print(f"Loading JSON file: {file_path}")
        
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        print(f"Successfully loaded {len(data) if isinstance(data, list) else 'object'} items from {filename}")
        return data
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return []
    except json.JSONDecodeError as e:
        print(f"Invalid JSON format in {filename}: {e}")
        return []
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return []

def learn_char(request):
    try:
        data = _load_json("lesson_chars.json")
        # 데이터 파일이 이미 {mode, items} 구조이므로 그대로 반환
        return JsonResponse(data)
    except Exception as e:
        print(f"Error in learn_char: {e}")
        return JsonResponse({'error': 'Failed to load character data'}, status=500)

def learn_word(request):
    try:
        data = _load_json("lesson_words.json")
        # 데이터 파일이 이미 {mode, items} 구조이므로 그대로 반환
        return JsonResponse(data)
    except Exception as e:
        print(f"Error in learn_word: {e}")
        return JsonResponse({'error': 'Failed to load word data'}, status=500)

def learn_sentence(request):
    try:
        data = _load_json("lesson_sentences.json")
        # 데이터 파일이 이미 {mode, items} 구조이므로 그대로 반환
        return JsonResponse(data)
    except Exception as e:
        print(f"Error in learn_sentence: {e}")
        return JsonResponse({'error': 'Failed to load sentence data'}, status=500)

# 필요 시 간단한 헬스체크(프런트 진단용)
def health(request):
    return JsonResponse({"ok": True})