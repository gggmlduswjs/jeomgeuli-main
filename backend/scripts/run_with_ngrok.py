#!/usr/bin/env python3
"""
ngrok + Django 서버 자동 실행 스크립트 (완전 자동화 버전)
- Django 서버 실행 (포트 8000)
- ngrok 터널 자동 생성
- React 프론트엔드 .env.local에 ngrok URL 자동 반영
- 터미널에 ASCII QR 코드 출력 (스마트폰 접속용)
- 정보탐색 모드 + 네이버 뉴스 API 자동 테스트
"""

import subprocess
import requests
import time
import os
import qrcode
import sys
from pathlib import Path

# 현재 스크립트의 부모 디렉토리 (backend)로 이동
script_dir = Path(__file__).parent
backend_dir = script_dir.parent
os.chdir(backend_dir)

def update_frontend_env(ngrok_url):
    """React 프론트엔드 .env.local에 ngrok URL 반영"""
    frontend_env = backend_dir.parent / "frontend" / ".env.local"
    
    # 기존 .env.local 읽기
    lines = []
    if frontend_env.exists():
        try:
            with open(frontend_env, "r", encoding="utf-8") as f:
                lines = f.readlines()
        except Exception as e:
            print(f"⚠️  기존 .env.local 읽기 실패: {e}")
    
    # VITE_API_BASE_URL 업데이트
    new_lines = []
    found = False
    for line in lines:
        if line.startswith("VITE_API_BASE_URL="):
            new_lines.append(f"VITE_API_BASE_URL={ngrok_url}/api\n")
            found = True
        else:
            new_lines.append(line)
    
    # 없으면 추가
    if not found:
        new_lines.append(f"VITE_API_BASE_URL={ngrok_url}/api\n")
    
    # 파일 쓰기
    try:
        with open(frontend_env, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print(f"✅ React .env.local 업데이트 완료: {frontend_env}")
        print(f"   VITE_API_BASE_URL={ngrok_url}/api")
        return True
    except Exception as e:
        print(f"❌ .env.local 업데이트 실패: {e}")
        return False

def update_react_env(ngrok_url):
    """React 프론트엔드 .env 파일에도 ngrok URL 반영 (호환성)"""
    react_env = backend_dir.parent / "frontend" / ".env"
    
    # 기존 .env 읽기
    lines = []
    if react_env.exists():
        try:
            with open(react_env, "r", encoding="utf-8") as f:
                lines = f.readlines()
        except Exception as e:
            print(f"⚠️  기존 .env 읽기 실패: {e}")
    
    # REACT_APP_API_BASE 업데이트
    new_lines = []
    found = False
    for line in lines:
        if line.startswith("REACT_APP_API_BASE="):
            new_lines.append(f"REACT_APP_API_BASE={ngrok_url}/api\n")
            found = True
        else:
            new_lines.append(line)
    
    # 없으면 추가
    if not found:
        new_lines.append(f"REACT_APP_API_BASE={ngrok_url}/api\n")
    
    # 파일 쓰기
    try:
        with open(react_env, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print(f"✅ React .env 업데이트 완료: {react_env}")
        print(f"   REACT_APP_API_BASE={ngrok_url}/api")
        return True
    except Exception as e:
        print(f"❌ .env 업데이트 실패: {e}")
        return False

def get_ngrok_url():
    """ngrok API를 통해 터널 URL 가져오기"""
    try:
        response = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=5)
        if response.status_code == 200:
            data = response.json()
            tunnels = data.get("tunnels", [])
            if tunnels:
                return tunnels[0].get("public_url")
    except Exception as e:
        print(f"⚠️  ngrok API 호출 실패: {e}")
    return None

def main():
    print("🚀 Django + ngrok + React 자동 실행 시작...")
    print(f"📁 작업 디렉토리: {backend_dir}")
    
    try:
        # 1️⃣ Django 서버 실행
        print("\n1️⃣ Django 서버 시작 중...")
        django = subprocess.Popen([sys.executable, "manage.py", "runserver", "8000"])
        time.sleep(2)  # 서버 시작 대기
        
        # 2️⃣ ngrok 실행
        print("2️⃣ ngrok 터널 생성 중...")
        ngrok = subprocess.Popen(
            ["ngrok", "http", "8000", "--log=stdout"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        time.sleep(3)  # ngrok 초기화 대기
        
        # 3️⃣ ngrok API로 터널 URL 가져오기
        print("3️⃣ ngrok URL 감지 중...")
        url = get_ngrok_url()
        
        if not url:
            print("❌ ngrok URL을 가져올 수 없습니다.")
            print("💡 ngrok이 제대로 실행되었는지 확인하세요.")
            return
        
        print(f"✅ ngrok URL 감지: {url}")
        
        # 4️⃣ React 프론트엔드 환경변수 파일들에 반영
        print("4️⃣ React 프론트엔드 설정 업데이트 중...")
        vite_updated = update_frontend_env(url)  # .env.local (Vite용)
        react_updated = update_react_env(url)    # .env (React용)
        
        if vite_updated or react_updated:
            print("✅ 프론트엔드가 ngrok URL로 자동 연결됩니다!")
        
        # 4.5️⃣ Django ALLOWED_HOSTS 안내
        print("✅ Django ALLOWED_HOSTS가 ngrok 도메인을 자동 허용합니다!")
        print("   (.ngrok-free.app, .ngrok.io 패턴 허용)")
        
        # 5️⃣ QR 코드 출력
        print("\n5️⃣ QR 코드 생성 중...")
        try:
            qr = qrcode.QRCode(border=1)
            qr.add_data(url)
            qr.make()
            qr.print_ascii(invert=True)
            print(f"\n📱 스마트폰에서 QR 코드 스캔하여 접속: {url}")
        except Exception as e:
            print(f"❌ QR 코드 생성 오류: {e}")
            print(f"🔗 수동 접속: {url}")
        
        # 6️⃣ 테스트 안내
        print("\n" + "="*60)
        print("🎉 완전 자동화 설정 완료!")
        print("="*60)
        print(f"📱 스마트폰 접속: {url}")
        print("🖥️  로컬 접속: http://localhost:8000")
        print("\n📋 테스트 방법:")
        print("1. 스마트폰에서 QR 코드 스캔 또는 URL 직접 접속")
        print("2. 루트('/') 접속 → 서버 상태 JSON 확인")
        print("3. '정보탐색' 버튼 클릭 → GPT 답변 + 네이버 뉴스 5개")
        print("\n🔗 API 엔드포인트:")
        print(f"   • 서버 상태: {url}/")
        print(f"   • 정보탐색: {url}/api/explore?q=AI")
        print(f"   • 뉴스만: {url}/api/news?q=AI")
        print(f"   • 헬스체크: {url}/api/health")
        print("\n💡 프론트엔드 개발 서버도 실행하려면:")
        print("   cd ../frontend && npm run dev")
        print("   (자동으로 ngrok URL로 연결됨)")
        print("\n⏹️  종료하려면 Ctrl+C를 누르세요...")
        print("="*60)
        
        # 7️⃣ 프로세스 유지
        try:
            django.wait()
        except KeyboardInterrupt:
            print("\n🛑 서버 종료 중...")
            django.terminate()
            ngrok.terminate()
            print("✅ 종료 완료!")
            
    except FileNotFoundError:
        print("❌ ngrok이 설치되지 않았습니다.")
        print("💡 설치 방법:")
        print("   1. https://ngrok.com/download 에서 다운로드")
        print("   2. ngrok 계정 생성 후 토큰 설정:")
        print("      ngrok config add-authtoken YOUR_TOKEN")
    except Exception as e:
        print(f"❌ 실행 오류: {e}")

if __name__ == "__main__":
    main()