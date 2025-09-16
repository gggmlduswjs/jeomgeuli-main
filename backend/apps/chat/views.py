import json
import re
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .services import GeminiService


@csrf_exempt
@require_http_methods(["POST"])
def ask(request):
    try:
        # Validate input
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        # Support both old and new API formats
        query = data.get('query', '') or data.get('q', '')
        mode = data.get('mode', '')
        topic = data.get('topic', '')
        
        if not query or not query.strip():
            return JsonResponse({'error': 'Query is required and cannot be empty'}, status=400)
        
        # Validate and set mode
        if not mode:
            mode = determine_mode(query)
        
        # Validate mode
        if mode not in ['news', 'explain', 'qa', 'detail', 'summary']:
            mode = 'qa'
        
        # Check if GEMINI_API_KEY is available
        gemini_key = os.getenv('GEMINI_API_KEY')
        if not gemini_key:
            # Return demo response when no API key
            demo_response = get_demo_response(query, mode)
            return JsonResponse(demo_response)
        
        # Try to use Gemini service
        try:
            gemini_service = GeminiService()
            
            if mode == 'news' or mode == 'summary':
                response_data = gemini_service.generate_news_response(query)
            elif mode == 'explain' or mode == 'detail':
                response_data = gemini_service.generate_explain_response(query)
            else:  # qa
                response_data = gemini_service.generate_qa_response(query)
            
            # -----------------------------------------------------------
            # DEBUG: Check if the AI returned a valid response
            # -----------------------------------------------------------
            if isinstance(response_data, dict) and 'error' in response_data:
                print(f"AI returned error: {response_data}")
                return JsonResponse(response_data, status=400)
            
            print(f"AI response successful for query: {query}")
            return JsonResponse(response_data)
            
        except Exception as gemini_error:
            # -----------------------------------------------------------
            # DEBUG: Print the full error stack to the console
            # -----------------------------------------------------------
            import traceback
            traceback.print_exc()
            print(f"Gemini API error: {gemini_error}")
            print(f"Error processing AI response in views.py: {gemini_error}")
            
            # Fallback to demo response if Gemini fails
            demo_response = get_demo_response(query, mode)
            return JsonResponse(demo_response)
        
    except Exception as e:
        print(f"Chat ask error: {e}")
        return JsonResponse({'error': 'Internal server error'}, status=500)


def determine_mode(query):
    """Determine the mode based on query content"""
    query_lower = query.lower()
    
    # Summary keywords (first-time questions)
    summary_keywords = ['뉴스', 'news', '오늘', '최신', '속보', '기사', '요약', '이슈', '소식']
    if any(keyword in query_lower for keyword in summary_keywords):
        return 'summary'
    
    # Detail keywords (follow-up questions)
    detail_keywords = ['자세히', '더', '상세', '구체', '첫번째', '첫 번째', '1번', '배경', '의미']
    if any(keyword in query_lower for keyword in detail_keywords):
        return 'detail'
    
    # Explain keywords (first explanation requests)
    explain_keywords = ['설명', 'explain', '쉽게', '어떻게', '뭐야', '무엇', '뜻', '원리', '개념']
    if any(keyword in query_lower for keyword in explain_keywords):
        return 'summary'  # First explanation request goes to summary
    
    # Default to Q&A
    return 'qa'


def get_demo_response(query, mode):
    """Get demo response when Gemini API is not available"""
    if mode == 'summary':
        return {
            "mode": "summary",
            "chat_markdown": """📰 **오늘의 주요 뉴스 요약**

• **경제 성장률 2%대 전망**: 세계 경제가 완만한 회복세를 보이며, 선진국과 신흥국 간 성장 격차가 좁혀지고 있습니다.

• **신기술 연구 성과**: 인공지능과 양자컴퓨팅 분야에서 혁신적인 연구 결과가 발표되어 미래 기술 발전에 대한 기대감이 높아지고 있습니다.

• **스포츠 주요 소식**: 올림픽과 월드컵을 앞두고 각국 선수들의 준비 상황과 경기장 인프라 구축이 순조롭게 진행되고 있습니다.

• **사회 이슈 관심 확대**: 디지털 격차 해소와 환경 보호를 위한 정책 논의가 활발해지며, 시민들의 참여도가 높아지고 있습니다.

• **국제 정세 변화 예상**: 다자간 협력과 지역 안보를 위한 새로운 프레임워크 구축 논의가 진행되며, 글로벌 거버넌스 개선에 대한 관심이 증대하고 있습니다.""",
            "simple_tts": "오늘 주요 이슈를 다섯 가지로 정리했어요. 경제, 기술, 스포츠, 사회, 국제 정세 분야의 소식입니다.",
            "bullets": [
                "경제 성장률 2%대 전망",
                "신기술 연구 성과",
                "스포츠 주요 소식",
                "사회 이슈 관심 확대",
                "국제 정세 변화 예상"
            ],
            "keywords": ["경제", "기술", "스포츠"],
            "braille_words": ["경제", "기술", "스포츠"],
            "actions": {
                "voice_hint": "명령어: '자세히', '다음', '반복', '키워드 점자 출력'",
                "learn_suggestion": "이 키워드로 학습을 이어가 보세요."
            },
            "meta": {
                "note": "데모 응답입니다. 예시/교육 목적."
            }
        }
    elif mode == 'detail':
        return {
            "mode": "detail",
            "chat_markdown": """📌 **경제 성장률 2%대 전망 - 상세 분석**

올해 세계 경제 성장률은 약 2%대에 머물 것으로 예상됩니다. 주요 원인은 금리 인상, 지정학적 갈등, 공급망 불안정과 같은 복합적인 요인 때문입니다. 특히 선진국 경제는 저성장이 이어지고 있으며, 미국과 유럽은 인플레이션 억제를 위한 긴축 정책으로 회복세가 제한되고 있습니다.

반면 신흥국에서는 내수 시장 확대와 기술 산업 성장 덕분에 점진적인 회복세가 관측되고 있습니다. 중국의 경제 정책 변화와 인도의 제조업 육성 정책이 긍정적인 영향을 미치고 있으며, 동남아시아 국가들도 디지털 전환과 친환경 투자를 통해 새로운 성장 동력을 확보하고 있습니다.

이러한 경제 환경 변화는 글로벌 공급망 재편과 에너지 전환 가속화로 이어지고 있습니다. 기업들은 공급망 다각화와 ESG 경영을 통해 지속가능한 성장 모델을 모색하고 있으며, 정부 차원에서도 디지털 인프라 투자와 인재 양성에 집중하고 있습니다.

쉽게 말해, 세계 경제는 빠른 성장은 어렵지만 점차 안정적인 흐름을 찾고 있다고 볼 수 있습니다. 단기적으로는 불확실성이 지속되겠지만, 중장기적으로는 새로운 기술과 정책을 통해 지속가능한 성장 기반을 마련해 나갈 것으로 전망됩니다.""",
            "simple_tts": "세계 경제는 2% 성장할 것으로 예상돼요. 빠른 성장은 어렵지만 점차 안정적인 흐름을 보이고 있습니다.",
            "detail": {
                "title": "경제 성장률 2%대 전망 - 상세 분석",
                "sections": [
                    {
                        "heading": "배경 및 현황",
                        "text": "올해 세계 경제 성장률은 약 2%대에 머물 것으로 예상됩니다. 주요 원인은 금리 인상, 지정학적 갈등, 공급망 불안정과 같은 복합적인 요인 때문입니다. 특히 선진국 경제는 저성장이 이어지고 있으며, 미국과 유럽은 인플레이션 억제를 위한 긴축 정책으로 회복세가 제한되고 있습니다."
                    },
                    {
                        "heading": "지역별 성장 동력",
                        "text": "반면 신흥국에서는 내수 시장 확대와 기술 산업 성장 덕분에 점진적인 회복세가 관측되고 있습니다. 중국의 경제 정책 변화와 인도의 제조업 육성 정책이 긍정적인 영향을 미치고 있으며, 동남아시아 국가들도 디지털 전환과 친환경 투자를 통해 새로운 성장 동력을 확보하고 있습니다."
                    },
                    {
                        "heading": "구조적 변화와 대응",
                        "text": "이러한 경제 환경 변화는 글로벌 공급망 재편과 에너지 전환 가속화로 이어지고 있습니다. 기업들은 공급망 다각화와 ESG 경영을 통해 지속가능한 성장 모델을 모색하고 있으며, 정부 차원에서도 디지털 인프라 투자와 인재 양성에 집중하고 있습니다."
                    },
                    {
                        "heading": "전망 및 시사점",
                        "text": "쉽게 말해, 세계 경제는 빠른 성장은 어렵지만 점차 안정적인 흐름을 찾고 있다고 볼 수 있습니다. 단기적으로는 불확실성이 지속되겠지만, 중장기적으로는 새로운 기술과 정책을 통해 지속가능한 성장 기반을 마련해 나갈 것으로 전망됩니다."
                    }
                ]
            },
            "keywords": ["경제", "성장", "전망"],
            "braille_words": ["경제", "성장", "전망"],
            "actions": {
                "voice_hint": "명령어: '다음', '반복', '키워드 점자 출력'",
                "learn_suggestion": "경제 관련 용어를 이어서 학습해 보세요."
            },
            "meta": {
                "note": "데모 응답입니다. 예시/교육 목적."
            }
        }
    else:  # qa
        return {
            "mode": "qa",
            "chat_markdown": """💡 **질문에 대한 상세 답변**

귀하의 질문에 대해 종합적으로 분석하여 답변드리겠습니다. 이 주제는 현재 사회적으로 많은 관심을 받고 있는 분야로, 다양한 관점에서 접근할 수 있는 복합적인 이슈입니다.

핵심 내용을 정리하면, 최근 연구 결과와 전문가들의 의견을 종합해볼 때 몇 가지 중요한 변화가 관찰되고 있습니다. 이러한 변화는 단기적으로는 일부 혼란을 야기할 수 있지만, 중장기적으로는 긍정적인 발전으로 이어질 것으로 전망됩니다.

또한 관련 분야의 전문가들은 이러한 현상이 더 큰 사회적 변화의 신호일 수 있다고 분석하고 있습니다. 따라서 지속적인 관심과 모니터링이 필요하며, 개인과 조직 차원에서의 적절한 대응 전략 수립이 중요합니다.

**💡 도움되는 팁**: 이 주제에 대해 더 깊이 알고 싶으시다면, 관련 전문 서적이나 최신 연구 논문을 참고하시는 것을 추천드립니다. 또한 실무진과의 네트워킹을 통해 실제 경험담을 듣는 것도 큰 도움이 될 것입니다.""",
            "simple_tts": "질문에 대한 답변을 정리했어요. 핵심 내용과 도움되는 팁을 제공했습니다.",
            "keywords": ["답변", "정보", "팁"],
            "braille_words": ["답변", "정보", "팁"],
            "actions": {
                "voice_hint": "명령어: '자세히', '더 알려줘', '키워드 점자 출력'",
                "learn_suggestion": "이 키워드로 학습을 이어가 보세요."
            },
            "meta": {
                "note": "데모 응답입니다. 예시/교육 목적."
            }
        }


@csrf_exempt
@require_http_methods(["GET"])
def news_top(request):
    """Get top news with fallback data"""
    try:
        # Try to get real news from NewsAPI if key is available
        newsapi_key = os.getenv('NEWSAPI_KEY')
        if newsapi_key:
            # TODO: Implement real NewsAPI call
            pass
        
        # Fallback news data
        return JsonResponse({
            "summary": "오늘 주요 뉴스를 카드로 정리했습니다.",
            "simple": "쉬운 설명: 첫 번째 뉴스는 경제, 두 번째는 과학입니다.",
            "keywords": ["경제", "과학", "스포츠"],
            "cards": [
                {"title": "경제 성장률 2% 전망", "desc": "올해 경제 성장률이 2%대로 전망됩니다.", "url": "https://example.com/1"},
                {"title": "신기술 연구 성과", "desc": "최신 기술 연구에서 새로운 성과가 나왔습니다.", "url": "https://example.com/2"},
            ],
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)
