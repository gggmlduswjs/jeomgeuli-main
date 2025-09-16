# 🚀 ngrok 자동화 스크립트 사용법

## 📋 준비사항
- Python (qrcode 패키지 설치됨)
- ngrok 설치 및 로그인
- Node.js (React 개발 서버용)

## 🎯 사용 방법

### 1. 스크립트 실행
```powershell
.\run_ngrok.ps1
```

### 2. 포트 지정 실행
```powershell
.\run_ngrok.ps1 -Port 8000
```

## 🔄 자동화 과정
1. Django 서버 시작 (백그라운드)
2. ngrok 터널 생성
3. ngrok 주소 자동 추출
4. backend/.env와 frontend/.env 업데이트
5. QR 코드 ASCII 출력
6. React 개발 서버 시작

## 📱 접속 방법
- **PC**: http://localhost:5173
- **스마트폰**: QR 코드 스캔 또는 터미널에 표시된 URL

## ⚠️ 주의사항
- ngrok이 실행 중이면 먼저 종료하세요
- Django 서버가 이미 실행 중이면 포트 충돌이 발생할 수 있습니다
