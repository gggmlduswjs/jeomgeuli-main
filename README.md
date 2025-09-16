# 점글이 (Jeomgeuli) - 시각장애인 정보접근 PWA

점글이는 시각장애인을 위한 정보접근 및 점자학습 PWA(Progressive Web App)입니다. React 프론트엔드와 Django 백엔드를 통해 음성 인터페이스, 점자 출력, AI 기반 정보 처리를 제공합니다.

## 주요 기능

### 정보탐색 모듈
- **뉴스 요약**: 최신 뉴스를 5개 카드 형태로 요약
- **쉬운 설명**: 복잡한 개념을 불릿 포인트와 쉬운 말로 설명
- **질문답변**: 일반적인 질문에 대한 AI 답변
- **음성 인터페이스**: STT/TTS를 통한 음성 상호작용
- **점자 출력**: 핵심 키워드를 점자로 순차 출력

### 점자학습 모듈
- **자모 학습**: 한글 자모의 점자 패턴 학습
- **단어 학습**: 단어 단위 점자 학습
- **문장 학습**: 문장 단위 점자 학습
- **자유 변환**: 사용자 입력 텍스트의 점자 변환
- **자동 테스트**: 학습 내용에 대한 자동 평가
- **복습 노트**: 오답 문제 자동 저장 및 복습

## 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** (빌드 도구)
- **Tailwind CSS** (스타일링)
- **React Query** (데이터 페칭)
- **Zustand** (상태 관리)
- **React Router** (라우팅)
- **PWA** (Progressive Web App)

### Backend
- **Django 4.2** + **Django REST Framework**
- **Google Gemini AI** (정보 처리)
- **SQLite** (개발용 데이터베이스)
- **CORS** (크로스 오리진 지원)

### 음성 기능
- **Web Speech API** (STT/TTS)
- **한국어 음성 인식/합성**

## 설치 및 실행

### 사전 요구사항
- Node.js 18+
- Python 3.8+
- Google Gemini API Key

### 1. 저장소 클론
\`\`\`bash
git clone <repository-url>
cd jeomgeuli
\`\`\`

### 2. 백엔드 설정
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 GEMINI_API_KEY 설정

# 데이터베이스 마이그레이션
python manage.py migrate

# 개발 서버 실행
python manage.py runserver
\`\`\`

### 3. 프론트엔드 설정
\`\`\`bash
cd frontend
npm install

# 개발 서버 실행
npm run dev
\`\`\`

### 4. 접속
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000

## API 엔드포인트

### 채팅 API
- \`POST /api/chat/ask\` - 질문 및 답변 처리

### 학습 API
- \`GET /api/learn/next/?mode={mode}\` - 다음 학습 내용 조회
- \`POST /api/learn/test/\` - 테스트 결과 제출

### 점자 API
- \`POST /api/braille/output/\` - 점자 출력 요청 (하드웨어 연동용)

## 사용법

### 1. 홈 화면
- **점자학습**: 체계적인 점자 학습 과정
- **정보탐색**: AI 기반 정보 접근

### 2. 정보탐색
- 음성이나 텍스트로 질문 입력
- 뉴스 요약, 쉬운 설명, 질문답변 모드 자동 인식
- 핵심 키워드 추출 및 점자 출력

### 3. 점자학습
- 자모 → 단어 → 문장 → 자유변환 순서로 학습
- 각 단계별 TTS 안내 및 자동 테스트
- 오답은 자동으로 복습 노트에 저장

### 4. 복습 노트
- 오답 문제들을 체계적으로 복습
- 음성 안내 및 점자 출력 지원

## 접근성 기능

- **키보드 네비게이션**: Tab/Enter 키로 모든 기능 접근 가능
- **음성 안내**: 모든 주요 기능에 TTS 지원
- **큰 폰트**: 시각적 접근성 향상
- **고대비 모드**: 시각 장애인을 위한 색상 대비 강화
- **점자 출력**: 하드웨어 연동을 통한 점자 디스플레이

## 개발 정보

### 프로젝트 구조
\`\`\`
jeomgeuli/
├── backend/                 # Django 백엔드
│   ├── apps/               # Django 앱들
│   │   ├── chat/          # 채팅 API
│   │   ├── learn/         # 학습 API
│   │   └── braille/       # 점자 출력 API
│   ├── jeomgeuli_backend/ # Django 설정
│   └── requirements.txt
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/    # UI 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── services/      # API 서비스
│   │   └── store/         # 상태 관리
│   └── package.json
└── README.md
\`\`\`

### 환경 변수
\`\`\`env
# Backend (.env)
GEMINI_API_KEY=your_gemini_api_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,8000

# Frontend (.env)
VITE_API_URL=http://localhost:8000/api
\`\`\`

## 라이선스

MIT License

## 기여하기

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.
