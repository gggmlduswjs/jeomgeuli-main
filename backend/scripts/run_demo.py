# 목적: 빠른 시연 환경 자동화 (ngrok + runserver)
# - Django runserver 실행
# - ngrok 터널 연결
# - ngrok 주소 콘솔에 출력 + QR 코드 생성
# - React 프론트에서 호출할 API_BASE 자동 주입

import os
import subprocess
import time
import requests
import pyqrcode
import signal
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

def signal_handler(sig, frame):
    """Ctrl+C 시 프로세스 정리"""
    print("\n🛑 시연 모드 종료 중...")
    if 'django' in globals():
        django.terminate()
    if 'ngrok' in globals():
        ngrok.terminate()
    sys.exit(0)

def get_ngrok_url():
    """ngrok API에서 퍼블릭 URL 가져오기"""
    for i in range(10):  # 최대 10번 시도
        try:
            resp = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=2)
            data = resp.json()
            if data.get("tunnels"):
                return data["tunnels"][0]["public_url"]
        except Exception:
            time.sleep(1)
    return None

def run_demo():
    global django, ngrok
    
    print("🚀 Django + ngrok 시연 모드 시작")
    print("=" * 50)
    
    # Ctrl+C 핸들러 등록
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        # 1. Django 서버 실행
        print("1️⃣ Django 서버 시작 중...")
        django = subprocess.Popen(
            ["python", "manage.py", "runserver", "0.0.0.0:8000"],
            cwd=BASE_DIR / "backend",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        time.sleep(3)
        print("✅ Django 서버 시작 완료")

        # 2. ngrok 실행
        print("2️⃣ ngrok 터널 생성 중...")
        ngrok = subprocess.Popen(
            ["ngrok", "http", "8000", "--log=stdout"],
            cwd=BASE_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        time.sleep(5)
        print("✅ ngrok 터널 생성 완료")

        # 3. ngrok URL 가져오기
        print("3️⃣ ngrok URL 감지 중...")
        public_url = get_ngrok_url()
        
        if not public_url:
            print("❌ ngrok URL을 가져올 수 없습니다.")
            print("💡 ngrok이 제대로 실행되었는지 확인하세요.")
            return

        print(f"✅ ngrok URL 감지: {public_url}")

        # 4. React 프론트 .env에 API_BASE 주입
        print("4️⃣ React 환경변수 업데이트 중...")
        frontend_env = BASE_DIR / "frontend" / ".env.development.local"
        with open(frontend_env, "w", encoding="utf-8") as f:
            f.write(f"VITE_API_BASE={public_url}/api\n")
        print(f"✅ React 환경변수 업데이트: {frontend_env}")

        # 5. QR코드 출력
        print("5️⃣ QR 코드 생성 중...")
        try:
            qr = pyqrcode.create(public_url)
            print("\n" + "=" * 50)
            print("📱 스마트폰 접속 URL:", public_url)
            print("=" * 50)
            print(qr.terminal(quiet_zone=1))
            print("=" * 50)
        except Exception as e:
            print(f"❌ QR 코드 생성 실패: {e}")
            print(f"🔗 수동 접속: {public_url}")

        # 6. 테스트 안내
        print("\n🎉 시연 준비 완료!")
        print("📋 테스트 방법:")
        print("1. 스마트폰에서 QR 코드 스캔 또는 URL 직접 접속")
        print("2. React 메인화면이 정상적으로 로드되는지 확인")
        print("3. '정보탐색' 버튼으로 GPT + 네이버 뉴스 API 테스트")
        print("\n🔗 API 엔드포인트:")
        print(f"   • 메인화면: {public_url}/")
        print(f"   • 정보탐색: {public_url}/api/explore?q=AI")
        print(f"   • 뉴스만: {public_url}/api/news?q=AI")
        print(f"   • 헬스체크: {public_url}/api/health")
        print("\n⏹️  종료하려면 Ctrl+C를 누르세요...")
        print("=" * 50)

        # 7. 프로세스 유지
        try:
            django.wait()
        except KeyboardInterrupt:
            signal_handler(None, None)

    except FileNotFoundError as e:
        print(f"❌ 명령어를 찾을 수 없습니다: {e}")
        print("💡 Python, ngrok이 설치되어 있는지 확인하세요.")
    except Exception as e:
        print(f"❌ 실행 오류: {e}")
        if 'django' in globals():
            django.terminate()
        if 'ngrok' in globals():
            ngrok.terminate()

if __name__ == "__main__":
    run_demo()
