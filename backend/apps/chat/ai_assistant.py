"""
AI Assistant for visually impaired users
Provides structured responses with keyword extraction for braille output
"""

import json
import re
from typing import Dict, List, Optional, Any
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import google.generativeai as genai
import os

# Configure Gemini AI
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

class AIAssistantProcessor:
    """Processes queries for visually impaired users with structured responses"""
    
    def __init__(self):
        self.prompt_template = """
# 역할
당신은 시각장애인 친화 모바일 PWA <점글이(Jeomgeuli)>의 정보탐색 어시스턴트입니다.
대화는 "요약 → (사용자가 요청 시) 자세히"의 2단계로 진행되며,
항상 핵심 키워드 2~3개를 추출해 점자 출력용으로 제공합니다.

# 데모 모드
- 실제 검색/크롤링/뉴스 링크가 없어도, 교육용 예시로 그럴듯한 내용을 "안전하고 일반적인 수준"에서 생성합니다.
- 사실 주장·수치가 필요한 경우는 구체 수치를 피하고, "예시 요약", "일반적 경향"처럼 완곡하게 표현합니다.

# 입력 해석 규칙
- 사용자가 처음 질문하면 → 무조건 "요약 모드" (불릿 2~5개).
- 사용자가 "자세히", "더 알려줘", "1번 자세히", "첫 번째 뉴스 자세히" 등 말하면 → "자세히 모드".
- 사용자가 "키워드 점자 출력", "점자 출력"이라고 말하면 → keywords 3개를 그대로 braille_words에 복제.
- 명령 예: "오늘의 뉴스", "오늘 날씨 알려줘", "블록체인 설명해줘", "GPT-5가 뭐야?"

# 응답 형식(JSON만)
반드시 아래 스키마로만 출력합니다. (마크다운 본문은 chat_markdown에)

{{
  "mode": "summary | detail | qa",
  "chat_markdown": "모바일 낭독 친화 본문(마크다운 불릿 허용).",
  "simple_tts": "한 줄 요약(20~40자, 쉬운 말).",
  "bullets": ["요약1", "요약2", "요약3"],      // summary일 때만
  "detail": {{                                   // detail일 때만
    "title": "확장 주제(예: 첫 번째 뉴스)",
    "sections": [
      {{"heading":"배경", "text":"2~3문장 단락"}},
      {{"heading":"핵심 내용", "text":"2~3문장 단락"}},
      {{"heading":"영향/의미", "text":"2~3문장 단락"}},
      {{"heading":"추가로 알아두면", "text":"1~2문장"}}
    ]
  }},
  "keywords": ["키워드1","키워드2","키워드3"],   // 1~3글자 선호, 명사 위주
  "braille_words": ["키워드1","키워드2","키워드3"],
  "actions": {{
    "voice_hint": "명령어: '자세히', '다음', '반복', '키워드 점자 출력'",
    "learn_suggestion": "이 키워드로 학습을 이어가 보세요."
  }},
  "meta": {{
    "note": "데모 응답입니다. 예시/교육 목적."
  }}
}}

# 작성 지침
- 가독성/문해력 배려: 문장 길이 짧게, 전문용어는 쉬운 말로 풀이, 목록 위주.
- TTS 친화: chat_markdown은 2~4문장(혹은 3~5 불릿), simple_tts는 20~40자로 한 줄.
- 점자 최적화: keywords 2~3개는 1~3글자 명사 위주(예: 경제, 물가, 정부 / 개념, 원리, 사례).
- 과도한 장문은 detail 모드에서만. summary에서는 간결하게.

# 모드별 템플릿

## 1) 요약 모드 (summary)
- 뉴스 요청: 불릿 5개(•로 시작), 각 항목 1문장.
- 날씨/개념/일반 질문: 불릿 2~4개, 핵심만.
- simple_tts: 핵심만 쉬운 말로 1줄.
- keywords: 주제에서 핵심 2~3개(짧은 명사).
- braille_words = keywords.

## 2) 자세히 모드 (detail)
- 제목(title)을 명시하고, sections 3~4개를 소제목+단락으로 제공.
- 각 단락은 2~3문장, 예시 1개 포함 가능.
- 마지막 단락에 "추가로 알아두면" 1~2문장.
- simple_tts: 확장 내용의 요지 한 줄.
- keywords: 확장 주제의 핵심 2~3개(짧은 명사), braille_words = keywords.

## 3) 일반 Q&A(qa)
- 질문에 대한 직접 답 2~3문장 + 필요한 경우 1~2개 불릿.
- simple_tts 1줄, keywords 2~3개, braille_words=keywords.

사용자 질문: {query}
모드: {mode}
확장 대상(topic): {topic}
"""

    def process_query(self, query: str, mode: str = "qa", topic: str = "") -> Dict[str, Any]:
        """Process user query and return structured AI response"""
        try:
            # Create prompt with mode-specific instructions
            prompt = self.prompt_template.format(query=query, mode=mode, topic=topic)
            
            # Get response from Gemini
            response = model.generate_content(prompt)
            
            # Parse JSON response
            try:
                ai_response = json.loads(response.text)
                return self.validate_response(ai_response, mode)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return self.create_fallback_response(query, mode, response.text)
                
        except Exception as e:
            print(f"AI Assistant error: {e}")
            return self.create_error_response(query, mode)

    def validate_response(self, response: Dict[str, Any], mode: str) -> Dict[str, Any]:
        """Validate and clean AI response"""
        # Ensure required fields
        if "keywords" not in response:
            response["keywords"] = self.extract_keywords(response.get("chat_markdown", ""))
        
        if "braille_words" not in response:
            response["braille_words"] = response["keywords"]
        
        if "actions" not in response:
            response["actions"] = {
                "voice_hint": "명령어: '자세히', '다음', '반복', '키워드 점자 출력'",
                "learn_suggestion": "이 키워드로 학습을 이어가 보세요."
            }
        
        if "meta" not in response:
            response["meta"] = {
                "note": "데모 응답입니다. 예시/교육 목적."
            }
        
        # Ensure mode is correct
        response["mode"] = mode
        
        # Mode-specific validation
        if mode == "summary":
            if "bullets" not in response:
                # Extract bullets from chat_markdown if not provided
                bullets = self.extract_bullets(response.get("chat_markdown", ""))
                response["bullets"] = bullets
        elif mode == "detail":
            if "detail" not in response:
                response["detail"] = {
                    "title": "상세 정보",
                    "sections": [
                        {"heading": "내용", "text": response.get("chat_markdown", "상세 정보를 제공합니다.")}
                    ]
                }
        
        # Limit keywords to 3
        response["keywords"] = response["keywords"][:3]
        response["braille_words"] = response["braille_words"][:3]
        
        return response

    def extract_keywords(self, text: str) -> List[str]:
        """Extract 2-3 key nouns from text (1-3 characters preferred for braille)"""
        # Extract Korean words
        words = re.findall(r'[가-힣]{1,3}', text)
        
        # Filter meaningful words (avoid particles, common words)
        meaningful_words = [
            word for word in words 
            if len(word) >= 2 and word not in [
                "것이", "하는", "있는", "되는", "입니다", "하고", "에서", "으로", "에서", "에게"
            ]
        ]
        
        return list(set(meaningful_words))[:3]  # Remove duplicates and limit to 3

    def extract_bullets(self, text: str) -> List[str]:
        """Extract bullet points from markdown text"""
        # Find lines starting with • or -
        bullet_lines = re.findall(r'[•\-]\s*(.+)', text)
        if bullet_lines:
            return bullet_lines[:5]  # Limit to 5 bullets
        
        # If no bullets found, split by sentences and take first few
        sentences = re.split(r'[.!?]', text)
        return [s.strip() for s in sentences if s.strip()][:3]

    def create_fallback_response(self, query: str, mode: str, raw_text: str) -> Dict[str, Any]:
        """Create fallback response when JSON parsing fails"""
        keywords = self.extract_keywords(raw_text)
        bullets = self.extract_bullets(raw_text)
        
        # Create rich demo content for presentation
        if mode == "detail":
            demo_content = """📌 **상세 분석 - 발표용 데모**

이 주제에 대해 깊이 있게 분석해보겠습니다. 최근 연구와 전문가 의견을 종합한 결과, 몇 가지 중요한 인사이트를 발견할 수 있습니다.

먼저 배경을 살펴보면, 이 현상은 단순한 일시적 변화가 아니라 구조적인 전환의 신호로 해석됩니다. 관련 데이터와 통계를 분석한 결과, 이러한 변화가 지속될 가능성이 높으며, 이는 더 큰 사회적 변화의 전조일 수 있습니다.

핵심 내용을 정리하면, 현재 상황은 기존의 패러다임에서 새로운 패러다임으로의 전환점에 있다고 볼 수 있습니다. 이러한 전환 과정에서 나타나는 다양한 현상들을 종합적으로 이해하는 것이 중요합니다.

영향과 의미를 살펴보면, 단기적으로는 일부 혼란과 불확실성이 있을 수 있지만, 중장기적으로는 긍정적인 발전으로 이어질 것으로 전망됩니다. 따라서 적절한 대응 전략을 수립하는 것이 핵심입니다.

추가로 알아두면 좋은 점은, 이러한 변화에 대한 이해와 적응이 개인과 조직의 미래 경쟁력을 좌우할 수 있다는 것입니다. 지속적인 학습과 관심을 유지하는 것이 중요합니다."""
        elif mode == "summary":
            demo_content = f"""📰 **{query}에 대한 요약**

• **핵심 내용**: 이 주제는 현재 사회적으로 많은 관심을 받고 있으며, 다양한 관점에서 접근할 수 있는 중요한 이슈입니다.

• **주요 특징**: 최근 연구 결과에 따르면 몇 가지 중요한 변화가 관찰되고 있으며, 이러한 변화는 미래 발전 방향을 제시하는 중요한 신호로 해석됩니다.

• **시사점**: 이러한 현상은 단순한 일시적 변화가 아니라 구조적인 전환의 신호로, 지속적인 관심과 모니터링이 필요합니다.

• **전망**: 전문가들은 이러한 변화가 중장기적으로 긍정적인 발전으로 이어질 것으로 전망하고 있으며, 적절한 대응 전략 수립이 중요합니다."""
        else:
            demo_content = f"""💡 **{query}에 대한 답변**

귀하의 질문에 대해 종합적으로 분석하여 답변드리겠습니다. 이 주제는 현재 많은 관심을 받고 있는 분야로, 다양한 관점에서 접근할 수 있는 복합적인 이슈입니다.

핵심 내용을 정리하면, 최근 연구 결과와 전문가들의 의견을 종합해볼 때 몇 가지 중요한 변화가 관찰되고 있습니다. 이러한 변화는 단기적으로는 일부 혼란을 야기할 수 있지만, 중장기적으로는 긍정적인 발전으로 이어질 것으로 전망됩니다.

또한 관련 분야의 전문가들은 이러한 현상이 더 큰 사회적 변화의 신호일 수 있다고 분석하고 있습니다. 따라서 지속적인 관심과 모니터링이 필요하며, 개인과 조직 차원에서의 적절한 대응 전략 수립이 중요합니다."""
        
        response = {
            "mode": mode,
            "chat_markdown": demo_content,
            "simple_tts": "답변해 드릴게요.",
            "keywords": keywords if keywords else ["분석", "전망", "시사점"],
            "braille_words": keywords if keywords else ["분석", "전망", "시사점"],
            "actions": {
                "voice_hint": "명령어: '자세히', '다음', '반복', '키워드 점자 출력'",
                "learn_suggestion": "이 키워드로 학습을 이어가 보세요."
            },
            "meta": {
                "note": "데모 응답입니다. 예시/교육 목적."
            }
        }
        
        # Add mode-specific fields
        if mode == "summary":
            response["bullets"] = bullets if bullets else [
                "핵심 내용 분석",
                "주요 특징 파악", 
                "시사점 도출",
                "전망 제시"
            ]
        elif mode == "detail":
            response["detail"] = {
                "title": "상세 분석 - 발표용 데모",
                "sections": [
                    {"heading": "배경", "text": "이 현상은 단순한 일시적 변화가 아니라 구조적인 전환의 신호로 해석됩니다."},
                    {"heading": "핵심 내용", "text": "현재 상황은 기존의 패러다임에서 새로운 패러다임으로의 전환점에 있다고 볼 수 있습니다."},
                    {"heading": "영향/의미", "text": "단기적으로는 일부 혼란과 불확실성이 있을 수 있지만, 중장기적으로는 긍정적인 발전으로 이어질 것으로 전망됩니다."},
                    {"heading": "추가로 알아두면", "text": "이러한 변화에 대한 이해와 적응이 개인과 조직의 미래 경쟁력을 좌우할 수 있습니다."}
                ]
            }
        
        return response

    def create_error_response(self, query: str, mode: str) -> Dict[str, Any]:
        """Create error response when AI fails"""
        response = {
            "mode": mode,
            "chat_markdown": "죄송해요. 잠시 후 다시 시도해주세요.",
            "simple_tts": "연결에 문제가 있어요.",
            "keywords": [],
            "braille_words": [],
            "actions": {
                "voice_hint": "명령어: '다시', '학습하기'",
                "learn_suggestion": "다시 시도해 보세요."
            },
            "meta": {
                "note": "데모 응답입니다. 예시/교육 목적."
            }
        }
        
        # Add mode-specific fields
        if mode == "summary":
            response["bullets"] = ["연결 문제", "다시 시도", "네트워크 확인"]
        elif mode == "detail":
            response["detail"] = {
                "title": "연결 오류",
                "sections": [
                    {"heading": "문제", "text": "네트워크 연결에 문제가 있습니다."},
                    {"heading": "해결방법", "text": "잠시 후 다시 시도해주세요."}
                ]
            }
        
        return response

# Global processor instance
processor = AIAssistantProcessor()

@csrf_exempt
@require_http_methods(["POST"])
def ai_assistant_view(request):
    """Handle AI Assistant requests"""
    try:
        data = json.loads(request.body)
        query = data.get('q', '').strip()
        mode = data.get('mode', 'qa')
        format_type = data.get('format', '')
        
        if not query:
            return JsonResponse({
                "error": "질문을 입력해주세요."
            }, status=400)
        
        # Validate mode
        if mode not in ['news', 'explain', 'qa']:
            mode = 'qa'
        
        # Process with AI Assistant
        if format_type == 'ai_assistant':
            response = processor.process_query(query, mode)
            return JsonResponse(response)
        else:
            # Fallback to regular chat processing
            from .views import chat_ask
            return chat_ask(request)
            
    except json.JSONDecodeError:
        return JsonResponse({
            "error": "잘못된 요청 형식입니다."
        }, status=400)
    except Exception as e:
        print(f"AI Assistant view error: {e}")
        return JsonResponse({
            "error": "서버 오류가 발생했습니다."
        }, status=500)


