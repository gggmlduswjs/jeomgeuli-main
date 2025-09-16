import os, time, threading
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from google.api_core.exceptions import DeadlineExceeded, ServiceUnavailable

MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")  # 필요시 pro로 교체

class TransientError(RuntimeError): ...
class RateLimitError(RuntimeError): ...

SYSTEM_PROMPT = (
    "당신은 한국어로 답하는 유용한 도우미입니다. "
    "질문이 모호해도 합리적인 가정을 밝히고 먼저 요약·핵심 답변을 제공합니다. "
    "그 다음에 필요한 추가 정보를 1문장으로 정중히 물어봅니다. "
    "답변은 불필요한 사족 없이 5~8줄 이내로 간결하게 작성하세요."
)

def _get_api_key():
    key = os.environ.get("GOOGLE_API_KEY")
    if not key:
        raise RuntimeError("GOOGLE_API_KEY가 설정되지 않았습니다(.env 또는 환경변수 확인).")
    return key

def _get_model():
    genai.configure(api_key=_get_api_key())
    return genai.GenerativeModel(
        MODEL_NAME,
        system_instruction=SYSTEM_PROMPT,
        safety_settings={
            # 필요 시 정책 맞게 조정
            "HARASSMENT": "BLOCK_ONLY_HIGH",
            "HATE": "BLOCK_ONLY_HIGH",
        },
        generation_config={
            "temperature": 0.7,
            "top_p": 0.9,
            "max_output_tokens": 512,
        },
    )

def explain_gemini_error(e: Exception) -> str:
    msg = str(e)
    # 흔한 케이스 매핑
    if "permission" in msg.lower():
        return "API 권한/빌링 문제로 요청이 거부되었습니다."
    if "quota" in msg.lower() or "rate" in msg.lower() or "429" in msg:
        return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요."
    if "Invalid resource name" in msg or "model not found" in msg.lower():
        return "모델 이름이 잘못되었거나 접근 권한이 없습니다."
    if "GOOGLE_API_KEY" in msg or "not set" in msg.lower():
        return "서버에 GOOGLE_API_KEY가 없습니다. .env/환경변수를 설정하고 서버를 재시작하세요."
    return f"LLM 처리 중 오류: {msg}"

# 🔒 429(레이트리밋)은 재시도 금지. 네트워크/서버 불안정(503/timeout)만 재시도.
@retry(
  reraise=True,
  stop=stop_after_attempt(2),
  wait=wait_exponential(multiplier=1, max=8),
  retry=retry_if_exception_type((DeadlineExceeded, ServiceUnavailable, TimeoutError))
)
def generate_reply(query: str, history: list[dict] | None = None) -> str:
    """
    history 예시: [{"role":"user","content":"..."},{"role":"assistant","content":"..."}]
    """
    # ⏳ 프로세스 내 소프트 레이트리밋(버스트 방지)
    _MIN_GAP = float(os.getenv("LLM_MIN_GAP_SEC", "0.8"))  # 호출 최소 간격(초)
    if not hasattr(generate_reply, "_gate"):
        generate_reply._gate = {"ts": 0.0, "lock": threading.Lock()}
    with generate_reply._gate["lock"]:
        now = time.time()
        wait = generate_reply._gate["ts"] + _MIN_GAP - now
        if wait > 0:
            time.sleep(wait)
        generate_reply._gate["ts"] = time.time()
    
    # 키/모델 준비 실패 시 즉시 예외 (재시도 없음)
    model = _get_model()
    # Gemini의 멀티턴 대화 포맷으로 변환
    chat_history = []
    for m in (history or []):
        role = "user" if m.get("role") == "user" else "model"
        chat_history.append({"role": role, "parts": [m.get("content", "")]})

    chat = model.start_chat(history=chat_history)
    try:
        resp = chat.send_message(query)
    except Exception as e:
        # 예외를 그대로 사람이 읽는 RuntimeError 메시지로 변환
        raise RuntimeError(explain_gemini_error(e))
    
    # resp.text가 없으면 candidates/parts에서 수동 추출
    text = getattr(resp, "text", None)
    if not text:
        try:
            text = resp.candidates[0].content.parts[0].text  # type: ignore
        except Exception:
            text = ""
    return text.strip()
