# apps/chat/views.py
import os, json, time, requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# --- 레이트리밋(그대로) ---
_LAST = {}
def _ok_rate(ip: str, interval=1.0):
    now = time.time()
    last = _LAST.get(ip, 0)
    if now - last < interval:
        return False
    _LAST[ip] = now
    return True

def _get_openai_client():
    # 안전장치: .env 파일 자동 탐색 및 로드
    from dotenv import load_dotenv, find_dotenv
    load_dotenv(find_dotenv(), override=True, encoding="utf-8")
    
    try:
        from openai import OpenAI
    except Exception as e:
        raise RuntimeError(f"OpenAI SDK(v1+) 필요: {e}")
    
    key = os.getenv("OPENAI_API_KEY")
    
    # 확인 코드 추가 (로깅)
    import logging
    logging.warning("OPENAI_API_KEY prefix: %s", (key[:10] if key else "NONE"))
    
    if not key:
        raise RuntimeError("OPENAI_API_KEY 미설정")
    return OpenAI(api_key=key)

# --- 헬스 체크들 ---
def health(_request):
    return JsonResponse({"ok": True})

def llm_health(_request):
    # LLM 연결상태 간단 점검(키 유무만 확인)
    has_key = bool(os.getenv("OPENAI_API_KEY"))
    return JsonResponse({"ok": has_key, "provider": "openai", "model": "gpt-4o-mini"})

@csrf_exempt
def news_summary(request):
    try:
        if request.method == "POST":
            try:
                body = json.loads(request.body.decode("utf-8"))
                q = (body.get("q") or body.get("query") or "").strip()
            except Exception:
                q = ""
        else:
            # GET 요청에서 쿼리 파라미터 받기
            q = request.GET.get("q", "").strip()
            if not q:
                q = request.GET.get("query", "").strip()
        
        if not q:
            return JsonResponse({"ok": True, "items": [], "q": ""})
        
        # OpenAI를 사용한 뉴스 요약
        try:
            client = _get_openai_client()
            prompt = f"'{q}'에 대한 최신 뉴스를 5개 항목으로 요약해주세요. 각 항목은 제목과 간단한 설명을 포함해주세요."
            
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}]
            )
            
            answer = resp.choices[0].message.content
            # 간단한 파싱 (실제로는 더 정교한 파싱이 필요할 수 있음)
            items = [{"title": line.strip(), "summary": ""} for line in answer.split('\n') if line.strip()]
            
            return JsonResponse({"ok": True, "items": items, "q": q, "answer": answer})
        except Exception as e:
            return JsonResponse({"ok": False, "error": str(e), "items": [], "q": q})
            
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e), "items": []})

# --- 실제 챗 엔드포인트 ---
@csrf_exempt
def chat_ask(request):
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    ip = request.META.get("REMOTE_ADDR", "unknown")
    if not _ok_rate(ip):
        return JsonResponse({"error":"too_many_requests","detail":"잠시 후 다시 시도해주세요."}, status=429)

    try:
        body = json.loads(request.body.decode("utf-8"))
        user_query = (body.get("query") or "").strip()
        if not user_query:
            return JsonResponse({"error":"bad_request","detail":"query is required"}, status=400)

        try:
            client = _get_openai_client()
        except Exception as cfg_err:
            return JsonResponse({"error":"config_error","detail":str(cfg_err)}, status=503)

        # 불릿 요약 + 키워드 추출을 위한 프롬프트 수정
        enhanced_prompt = f"""다음 질문에 대해 불릿 포인트 형태로 답변해주세요: {user_query}

답변 형식:
• 첫 번째 핵심 내용
• 두 번째 핵심 내용  
• 세 번째 핵심 내용

답변 후에 핵심 키워드 3개를 추출해서 "키워드: 키워드1, 키워드2, 키워드3" 형태로 끝에 추가해주세요."""

        resp = client.chat.completions.create(
            model="gpt-4o-mini",   # 필요시 gpt-4o 등으로 변경
            messages=[{"role": "user", "content": enhanced_prompt}]
        )
        answer = resp.choices[0].message.content
        
        # 키워드 추출
        keywords = []
        if "키워드:" in answer:
            try:
                keyword_part = answer.split("키워드:")[-1].strip()
                keywords = [kw.strip() for kw in keyword_part.split(",") if kw.strip()]
                # 답변에서 키워드 부분 제거
                answer = answer.split("키워드:")[0].strip()
            except:
                pass
        
        return JsonResponse({
            "answer": answer,
            "keywords": keywords[:3]  # 최대 3개 키워드
        })

    except Exception as e:
        return JsonResponse({"error":"chat_ask_failed","detail":str(e)}, status=500)


@csrf_exempt
def chat_detail(request):
    """자세한 설명 모드"""
    if request.method != "POST":
        return JsonResponse({"error": "method_not_allowed"}, status=405)

    ip = request.META.get("REMOTE_ADDR", "unknown")
    if not _ok_rate(ip):
        return JsonResponse({"error":"too_many_requests","detail":"잠시 후 다시 시도해주세요."}, status=429)

    try:
        body = json.loads(request.body.decode("utf-8"))
        topic = (body.get("topic") or "").strip()
        if not topic:
            return JsonResponse({"error":"bad_request","detail":"topic is required"}, status=400)

        try:
            client = _get_openai_client()
        except Exception as cfg_err:
            return JsonResponse({"error":"config_error","detail":str(cfg_err)}, status=503)

        # 자세한 설명을 위한 프롬프트
        detail_prompt = f""""{topic}"에 대해 자세하고 구체적으로 설명해주세요. 

다음 내용을 포함해주세요:
- 기본 개념과 정의
- 주요 특징과 원리
- 실제 활용 사례나 예시
- 관련된 중요 정보

답변 후에 핵심 키워드 3개를 추출해서 "키워드: 키워드1, 키워드2, 키워드3" 형태로 끝에 추가해주세요."""

        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": detail_prompt}]
        )
        answer = resp.choices[0].message.content
        
        # 키워드 추출
        keywords = []
        if "키워드:" in answer:
            try:
                keyword_part = answer.split("키워드:")[-1].strip()
                keywords = [kw.strip() for kw in keyword_part.split(",") if kw.strip()]
                answer = answer.split("키워드:")[0].strip()
            except:
                pass
        
        return JsonResponse({
            "answer": answer,
            "keywords": keywords[:3],
            "mode": "detail"
        })

    except Exception as e:
        return JsonResponse({"error":"chat_detail_failed","detail":str(e)}, status=500)


# --- 네이버 뉴스 API 프록시 ---
@csrf_exempt
def naver_news(request):
    """
    네이버 뉴스 API 프록시
    GET /api/news?q=검색어&display=10&start=1&sort=sim
    """
    if request.method != "GET":
        return JsonResponse({"error": "method_not_allowed"}, status=405)
    
    try:
        # .env 강제 로드
        from dotenv import load_dotenv, find_dotenv
        load_dotenv(find_dotenv(), override=True, encoding="utf-8")
        
        # 네이버 API 키 확인
        client_id = os.getenv("NAVER_CLIENT_ID")
        client_secret = os.getenv("NAVER_CLIENT_SECRET")
        
        if not client_id or not client_secret:
            return JsonResponse({
                "error": "naver_api_keys_not_set",
                "detail": "NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 설정되지 않았습니다."
            }, status=503)
        
        # 쿼리 파라미터 추출
        query = request.GET.get('q', '').strip()
        if not query:
            return JsonResponse({"error": "query_required", "detail": "검색어(q)가 필요합니다."}, status=400)
        
        display = request.GET.get('display', '10')
        start = request.GET.get('start', '1')
        sort = request.GET.get('sort', 'sim')  # sim: 정확도순, date: 날짜순
        
        # 네이버 뉴스 API 호출
        naver_url = "https://openapi.naver.com/v1/search/news.json"
        headers = {
            'X-Naver-Client-Id': client_id,
            'X-Naver-Client-Secret': client_secret
        }
        params = {
            'query': query,
            'display': display,
            'start': start,
            'sort': sort
        }
        
        # 네이버 API 호출
        response = requests.get(naver_url, headers=headers, params=params, timeout=10)
        
        if response.status_code == 200:
            # 네이버 API 응답을 그대로 반환
            return JsonResponse(response.json(), safe=False)
        else:
            return JsonResponse({
                "error": "naver_api_error",
                "detail": f"네이버 API 오류: {response.status_code}",
                "naver_response": response.text
            }, status=response.status_code)
            
    except requests.exceptions.Timeout:
        return JsonResponse({
            "error": "timeout",
            "detail": "네이버 API 호출 시간 초과"
        }, status=504)
    except requests.exceptions.RequestException as e:
        return JsonResponse({
            "error": "network_error",
            "detail": f"네트워크 오류: {str(e)}"
        }, status=502)
    except Exception as e:
        return JsonResponse({
            "error": "internal_error",
            "detail": f"내부 오류: {str(e)}"
        }, status=500)


# --- 정보탐색 모드: GPT + 네이버 뉴스 통합 ---
@csrf_exempt
def explore(request):
    """
    정보탐색 모드: GPT 답변 + 네이버 뉴스 검색 결과 통합
    GET /api/explore?q=검색어
    """
    if request.method != "GET":
        return JsonResponse({"error": "method_not_allowed"}, status=405)
    
    try:
        # .env 강제 로드
        from dotenv import load_dotenv, find_dotenv
        load_dotenv(find_dotenv(), override=True, encoding="utf-8")
        
        # API 키 확인
        openai_key = os.getenv("OPENAI_API_KEY")
        naver_client_id = os.getenv("NAVER_CLIENT_ID")
        naver_client_secret = os.getenv("NAVER_CLIENT_SECRET")
        
        if not openai_key:
            return JsonResponse({
                "error": "openai_key_not_set",
                "detail": "OPENAI_API_KEY가 설정되지 않았습니다."
            }, status=503)
        
        if not naver_client_id or not naver_client_secret:
            return JsonResponse({
                "error": "naver_keys_not_set",
                "detail": "NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 설정되지 않았습니다."
            }, status=503)
        
        # 쿼리 파라미터 추출
        query = request.GET.get('q', '오늘 뉴스').strip()
        if not query:
            return JsonResponse({"error": "query_required", "detail": "검색어(q)가 필요합니다."}, status=400)
        
        # 1) OpenAI GPT 호출
        try:
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            
            gpt_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": f"'{query}'에 대해 간결하고 정확하게 설명해주세요."}]
            )
            gpt_answer = gpt_response.choices[0].message.content
        except Exception as e:
            gpt_answer = f"GPT 답변 생성 중 오류가 발생했습니다: {str(e)}"
        
        # 2) 네이버 뉴스 API 호출
        try:
            naver_url = "https://openapi.naver.com/v1/search/news.json"
            headers = {
                'X-Naver-Client-Id': naver_client_id,
                'X-Naver-Client-Secret': naver_client_secret
            }
            params = {
                'query': query,
                'display': 5,
                'sort': 'sim'
            }
            
            news_response = requests.get(naver_url, headers=headers, params=params, timeout=10)
            
            if news_response.status_code == 200:
                news_data = news_response.json()
                news_items = news_data.get("items", [])
            else:
                news_items = []
                
        except Exception as e:
            news_items = []
            print(f"네이버 뉴스 API 오류: {e}")
        
        # 3) 결과 통합 반환
        return JsonResponse({
            "answer": gpt_answer,
            "news": news_items,
            "query": query,
            "timestamp": time.time()
        })
        
    except Exception as e:
        return JsonResponse({
            "error": "explore_failed",
            "detail": f"정보탐색 중 오류가 발생했습니다: {str(e)}"
        }, status=500)
