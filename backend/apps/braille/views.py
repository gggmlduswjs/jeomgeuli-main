from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json, os

# backend/data/ko_braille.json 사용
DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "ko_braille.json")
with open(DATA_PATH, "r", encoding="utf-8") as f:
    MAP = json.load(f)

def text_to_cells(text:str):
    res = []
    for ch in text or "":
        arr = MAP.get(ch)
        if isinstance(arr, list) and len(arr) == 6:
            res.append(arr)
        else:
            res.append([0,0,0,0,0,0])
    return res

@csrf_exempt
def convert(request):
    try:
        if request.method == "GET":
            text = request.GET.get("text","")
        else:
            payload = json.loads(request.body.decode("utf-8") or "{}")
            text = payload.get("text","")
        return JsonResponse({"cells": text_to_cells(text)})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)