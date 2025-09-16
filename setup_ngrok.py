#!/usr/bin/env python3
"""
🚀 전체 구조 세팅 자동화 스크립트
- ngrok URL 자동 감지
- backend/.env와 frontend/.env 동시 업데이트
- Django 서버 재시작 안내
"""
import requests
import json
import os
import subprocess
import time
from pathlib import Path

def get_ngrok_url():
    """ngrok API에서 현재 터널 URL 가져오기"""
    try:
        response = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=2)
        data = response.json()
        if data.get("tunnels"):
            return data["tunnels"][0]["public_url"]
    except Exception as e:
        print(f"ngrok URL 감지 실패: {e}")
    return None

def update_backend_env(ngrok_url):
    """backend/.env 파일 업데이트"""
    backend_dir = Path(__file__).parent / "backend"
    env_file = backend_dir / ".env"
    
    # 기존 .env 파일 읽기
    existing_content = ""
    if env_file.exists():
        with open(env_file, "r", encoding="utf-8") as f:
            existing_content = f.read()
    
    # API_BASE_URL 라인 찾아서 업데이트
    lines = existing_content.split('\n')
    updated_lines = []
    api_base_updated = False
    
    for line in lines:
        if line.startswith("API_BASE_URL="):
            updated_lines.append(f"API_BASE_URL={ngrok_url}/api")
            api_base_updated = True
        else:
            updated_lines.append(line)
    
    # API_BASE_URL이 없으면 추가
    if not api_base_updated:
        updated_lines.append(f"API_BASE_URL={ngrok_url}/api")
    
    try:
        with open(env_file, "w", encoding="utf-8") as f:
            f.write('\n'.join(updated_lines))
        print(f"✅ backend/.env 업데이트 완료: {ngrok_url}/api")
        return True
    except Exception as e:
        print(f"❌ backend/.env 업데이트 실패: {e}")
        return False

def update_frontend_env(ngrok_url):
    """frontend/.env 파일 업데이트"""
    frontend_dir = Path(__file__).parent / "frontend"
    env_file = frontend_dir / ".env"
    
    content = f"""VITE_API_BASE_URL={ngrok_url}/api
"""
    
    try:
        with open(env_file, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✅ frontend/.env 업데이트 완료: {ngrok_url}/api")
        return True
    except Exception as e:
        print(f"❌ frontend/.env 업데이트 실패: {e}")
        return False

def main():
    print("🚀 전체 구조 세팅 자동화 시작")
    print("=" * 50)
    
    print("🔍 ngrok URL 감지 중...")
    ngrok_url = get_ngrok_url()
    
    if ngrok_url:
        print(f"🌐 ngrok URL: {ngrok_url}")
        print()
        
        # 백엔드 .env 업데이트
        print("📝 backend/.env 업데이트 중...")
        backend_success = update_backend_env(ngrok_url)
        
        # 프론트엔드 .env 업데이트
        print("📝 frontend/.env 업데이트 중...")
        frontend_success = update_frontend_env(ngrok_url)
        
        if backend_success and frontend_success:
            print("\n🎉 전체 환경변수 업데이트 완료!")
            print("=" * 50)
            print("📋 다음 단계:")
            print("1. Django 서버 재시작:")
            print("   cd backend")
            print("   python manage.py runserver 0.0.0.0:8000")
            print()
            print("2. 프론트엔드 개발 서버 재시작:")
            print("   cd frontend")
            print("   npm run dev")
            print()
            print("3. 스마트폰에서 접속:")
            print(f"   {ngrok_url}")
            print("=" * 50)
        else:
            print("❌ 환경변수 업데이트 실패")
    else:
        print("❌ ngrok이 실행되지 않았거나 접근할 수 없습니다.")
        print("💡 ngrok을 먼저 실행하세요: ngrok http 8000")

if __name__ == "__main__":
    main()
