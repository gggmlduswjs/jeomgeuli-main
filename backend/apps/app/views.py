from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json, re
import xml.etree.ElementTree as ET
import urllib.request

# 안전한 기본 매핑(부족분은 무시하지 말고 빈칸 대신 0 리턴)
KO_BRAILLE = {
    # 자음(초성/받침 공통 기초) – 6점(상:1,2,3 / 하:4,5,6)
    "ㄱ":[1,0,0,0,0,0], "ㄴ":[1,1,0,0,0,0], "ㄷ":[1,0,0,1,0,0], "ㄹ":[1,1,0,1,0,0],
    "ㅁ":[1,1,0,0,1,0], "ㅂ":[1,0,0,1,1,0], "ㅅ":[0,1,0,1,0,0], "ㅇ":[0,0,0,1,1,0],
    "ㅈ":[1,1,0,0,0,0], # (간이값) 프로젝트의 정식 JSON이 있으면 그걸 쓰세요
    "ㅊ":[1,1,0,0,1,0], "ㅋ":[1,0,1,0,0,0], "ㅌ":[1,1,1,0,0,0], "ㅍ":[1,0,1,1,0,0], "ㅎ":[0,1,1,1,0,0],
    # 모음(간이): 실 배포시 규정 JSON으로 교체
    "ㅏ":[0,1,0,0,0,1], "ㅑ":[0,1,0,0,1,1], "ㅓ":[1,0,0,0,0,1], "ㅕ":[1,0,0,0,1,1],
    "ㅗ":[0,1,1,0,0,0], "ㅛ":[0,1,1,0,0,1], "ㅜ":[1,0,1,0,0,0], "ㅠ":[1,0,1,0,0,1],
    "ㅡ":[0,0,1,0,0,0], "ㅣ":[0,0,0,0,0,1],
    # 띄어쓰기/구두점
    " ":[0,0,0,0,0,0], ".":[0,0,1,0,1,1],
}

def _cell(ch:str):
    return KO_BRAILLE.get(ch, [0,0,0,0,0,0])

def _split_korean(text:str):
    # 간단 분해: 글자 단위(완성형 그대로). 상세 초성/중성/종성 분해는 프론트가 가진 사전으로 보완.
    return list(text)

def api_health(request):
    return JsonResponse({"ok": True})

@csrf_exempt
def braille_convert(request):
    if request.method != "POST":
        return JsonResponse({"error":"POST only"}, status=405)
    try:
        payload = json.loads(request.body.decode("utf-8"))
        text = (payload.get("text") or "").strip()
        if not text:
            return JsonResponse({"items":[]})
        items = []
        for ch in _split_korean(text):
            items.append({"char": ch, "cells":[_cell(ch)]})
        return JsonResponse({"items":items})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def news_list(request):
    # 구글뉴스 RSS 프록시(서버→구글 요청, CORS 회피)
    q = request.GET.get("q","한국 주요 뉴스")
    url = f"https://news.google.com/rss/search?q={urllib.parse.quote(q)}&hl=ko&gl=KR&ceid=KR:ko"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            xml = resp.read()
        root = ET.fromstring(xml)
        items=[]
        for it in root.iter("item"):
            title = it.findtext("title") or ""
            link = it.findtext("link") or ""
            desc = (it.findtext("description") or "").strip()
            items.append({"title":title, "link":link, "summary":desc})
            if len(items)>=10: break
        return JsonResponse({"items":items})
    except Exception as e:
        return JsonResponse({"items":[
            {"title":"(DEV) 뉴스 RSS 요청 실패", "link":"", "summary":str(e)}
        ]})
