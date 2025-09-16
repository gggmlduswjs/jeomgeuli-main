import os
import google.generativeai as genai
from django.conf import settings


class GeminiService:
    def __init__(self):
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
    def generate_news_response(self, query):
        """Generate news summary response with 5 cards"""
        prompt = f"""
        사용자의 질문: "{query}"
        
        다음 형식으로 뉴스 5개를 요약해주세요:
        
        1. 각 뉴스마다 제목, 한 줄 요약, 링크(예시 링크) 제공
        2. 전체 요약문 작성
        3. 쉬운 말로 설명
        4. 핵심 키워드 2-3개 추출
        
        JSON 형식으로 응답:
        {{
            "mode": "news",
            "summary": "전체 뉴스 요약",
            "simple": "초등학생도 이해할 수 있는 쉬운 설명",
            "keywords": ["키워드1", "키워드2", "키워드3"],
            "cards": [
                {{
                    "title": "뉴스 제목 1",
                    "oneLine": "한 줄 요약",
                    "url": "https://example.com/news1"
                }},
                ...
            ]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            # -----------------------------------------------------------
            # DEBUG: Print the raw response from Gemini
            # -----------------------------------------------------------
            print("-----------------------------------------")
            print(f"Prompt sent to Gemini: {prompt[:200]}...")
            print(f"Raw response text: {response.text}")
            print("-----------------------------------------")
            
            # Parse the response and return structured data
            return self._parse_news_response(response.text, query)
        except Exception as e:
            print(f"Error in generate_news_response: {e}")
            return self._get_fallback_news_response(query)
    
    def generate_explain_response(self, query):
        """Generate explanation response with bullet points"""
        prompt = f"""
        사용자의 질문: "{query}"
        
        다음 형식으로 설명해주세요:
        
        1. 3-5개의 불릿 포인트로 설명
        2. 마지막에 쉬운 말로 한 줄 요약
        3. 핵심 키워드 2-3개 추출
        
        JSON 형식으로 응답:
        {{
            "mode": "explain",
            "summary": "불릿 포인트로 구성된 설명",
            "simple": "쉬운 말로 한 줄 요약",
            "keywords": ["키워드1", "키워드2"],
            "bullets": [
                "불릿 포인트 1",
                "불릿 포인트 2",
                ...
            ]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            return self._parse_explain_response(response.text, query)
        except Exception as e:
            return self._get_fallback_explain_response(query)
    
    def generate_qa_response(self, query):
        """Generate Q&A response"""
        prompt = f"""
        사용자의 질문: "{query}"
        
        친근하고 도움이 되는 답변을 해주세요.
        
        JSON 형식으로 응답:
        {{
            "mode": "qa",
            "summary": "질문에 대한 답변",
            "simple": "쉬운 말로 한 줄 요약",
            "keywords": ["키워드1", "키워드2"]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            return self._parse_qa_response(response.text, query)
        except Exception as e:
            return self._get_fallback_qa_response(query)
    
    def _parse_news_response(self, response_text, query):
        """Parse news response from Gemini"""
        try:
            # Extract JSON from response
            import json
            import re
            
            # Find JSON in the response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return data
        except:
            pass
        
        # Fallback parsing
        return self._get_fallback_news_response(query)
    
    def _parse_explain_response(self, response_text, query):
        """Parse explain response from Gemini"""
        try:
            import json
            import re
            
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return data
        except:
            pass
        
        return self._get_fallback_explain_response(query)
    
    def _parse_qa_response(self, response_text, query):
        """Parse Q&A response from Gemini"""
        try:
            import json
            import re
            
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
                return data
        except:
            pass
        
        return self._get_fallback_qa_response(query)
    
    def _get_fallback_news_response(self, query):
        """Fallback news response when Gemini fails"""
        return {
            "mode": "news",
            "summary": f"'{query}'에 대한 뉴스를 검색 중입니다. 잠시 후 다시 시도해주세요.",
            "simple": "뉴스 검색 서비스가 일시적으로 불안정합니다.",
            "keywords": ["뉴스", "검색", "일시중단"],
            "cards": [
                {
                    "title": "서비스 점검 중",
                    "oneLine": "뉴스 서비스를 점검하고 있습니다",
                    "url": "#"
                }
            ]
        }
    
    def _get_fallback_explain_response(self, query):
        """Fallback explain response when Gemini fails"""
        return {
            "mode": "explain",
            "summary": f"'{query}'에 대한 설명을 준비 중입니다.",
            "simple": "설명 서비스가 일시적으로 불안정합니다.",
            "keywords": ["설명", "서비스", "점검"],
            "bullets": [
                "현재 서비스를 점검하고 있습니다",
                "잠시 후 다시 시도해주세요",
                "문의사항이 있으시면 고객센터로 연락주세요"
            ]
        }
    
    def _get_fallback_qa_response(self, query):
        """Fallback Q&A response when Gemini fails"""
        return {
            "mode": "qa",
            "summary": f"'{query}'에 대한 답변을 준비 중입니다. 잠시 후 다시 시도해주세요.",
            "simple": "질문 답변 서비스가 일시적으로 불안정합니다.",
            "keywords": ["답변", "서비스", "일시중단"]
        }
