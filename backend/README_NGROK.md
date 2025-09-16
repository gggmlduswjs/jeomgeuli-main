# 🚀 Django + ngrok 자동 실행 가이드

## 📋 개요
이 스크립트는 Django 서버와 ngrok 터널을 자동으로 실행하여 스마트폰에서 바로 테스트할 수 있도록 합니다.

## 🛠️ 설치 및 설정

### 1. 의존성 설치
```bash
# 가상환경 활성화
.venv\Scripts\Activate.ps1

# 필요한 패키지 설치
pip install -r requirements.txt
```

### 2. 환경변수 설정
`.env` 파일에 다음 키들을 설정하세요:
```
OPENAI_API_KEY=sk-proj-...
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret
```

## 🚀 실행 방법

### 방법 1: 원클릭 실행 (가장 간단)
```bash
# backend 디렉토리에서
python run.py
```

### 방법 2: ngrok + QR 코드 (스마트폰 테스트용)
```bash
# 가상환경 활성화 후
python scripts/run_with_ngrok.py
```

**⚠️ ngrok 계정 필요:**
1. https://dashboard.ngrok.com/signup 에서 계정 생성
2. https://dashboard.ngrok.com/get-started/your-authtoken 에서 토큰 복사
3. `ngrok config add-authtoken YOUR_TOKEN` 실행

### 방법 3: 로컬 전용 (간단 테스트)
```bash
# 가상환경 활성화 후
python scripts/run_local.py
```

## 📱 스마트폰 테스트

1. **스크립트 실행 후 콘솔에 표시되는 QR 코드를 스캔**
2. **스마트폰에서 웹페이지 접속**
3. **"정보탐색" 버튼 클릭**
4. **GPT 답변 + 뉴스 5개 확인**

## 🔧 기능

- ✅ Django 서버 자동 실행 (포트 8000)
- ✅ ngrok 터널 자동 생성
- ✅ QR 코드 자동 출력
- ✅ 스마트폰 접속 URL 제공
- ✅ Ctrl+C로 안전한 종료

## 📊 API 엔드포인트

- `GET /api/explore?q=검색어` - GPT 답변 + 네이버 뉴스 통합
- `GET /api/health` - 서버 상태 확인
- `GET /api/llm/health` - AI 모델 상태 확인

## 🐛 문제 해결

### ngrok 오류
```bash
# ngrok 토큰 설정 (선택사항)
ngrok config add-authtoken YOUR_TOKEN
```

### 포트 충돌
```bash
# 다른 포트 사용
python manage.py runserver 8001
# 스크립트에서 포트 번호 수정
```

### 의존성 오류
```bash
# 패키지 재설치
pip install --upgrade pyngrok pyqrcode pypng
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 가상환경 활성화 여부
2. `.env` 파일의 API 키 설정
3. 방화벽/보안 프로그램 설정
4. 인터넷 연결 상태
