#!/usr/bin/env python3
"""
ngrok URL을 자동으로 감지하고 frontend/.env.development 파일을 업데이트하는 스크립트
"""
import requests
import json
import os
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

def update_env_file(ngrok_url):
    """frontend/.env.development 파일 업데이트"""
    frontend_dir = Path(__file__).parent / "frontend"
    env_file = frontend_dir / ".env.development"
    
    api_base = f"{ngrok_url}/api"
    
    # .env.development 파일 내용
    content = f"""# Vite Development Environment Variables
VITE_API_BASE={api_base}
"""
    
    try:
        with open(env_file, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"✅ {env_file} 업데이트 완료: {api_base}")
        return True
    except Exception as e:
        print(f"❌ {env_file} 업데이트 실패: {e}")
        return False

def main():
    print("🔍 ngrok URL 감지 중...")
    ngrok_url = get_ngrok_url()
    
    if ngrok_url:
        print(f"🌐 ngrok URL: {ngrok_url}")
        if update_env_file(ngrok_url):
            print("🎉 프론트엔드 환경변수 업데이트 완료!")
            print("💡 프론트엔드 개발 서버를 재시작하세요: npm run dev")
        else:
            print("❌ 환경변수 업데이트 실패")
    else:
        print("❌ ngrok이 실행되지 않았거나 접근할 수 없습니다.")
        print("💡 ngrok을 먼저 실행하세요: ngrok http 8000")

if __name__ == "__main__":
    main()
