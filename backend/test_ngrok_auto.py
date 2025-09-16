#!/usr/bin/env python3
"""
ngrok 자동화 테스트 스크립트
- ngrok URL 감지 테스트
- React 환경변수 업데이트 테스트
- QR 코드 생성 테스트
"""

import requests
import qrcode
import os
from pathlib import Path

def test_ngrok_detection():
    """ngrok URL 감지 테스트"""
    print("🔍 ngrok URL 감지 테스트...")
    try:
        response = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=5)
        if response.status_code == 200:
            data = response.json()
            tunnels = data.get("tunnels", [])
            if tunnels:
                url = tunnels[0].get("public_url")
                print(f"✅ ngrok URL 감지 성공: {url}")
                return url
            else:
                print("❌ ngrok 터널이 없습니다.")
        else:
            print(f"❌ ngrok API 응답 오류: {response.status_code}")
    except Exception as e:
        print(f"❌ ngrok API 호출 실패: {e}")
    return None

def test_env_update(url):
    """React 환경변수 업데이트 테스트"""
    print(f"\n📝 React 환경변수 업데이트 테스트...")
    
    # .env.local 업데이트
    frontend_env = Path(__file__).parent.parent / "frontend" / ".env.local"
    try:
        with open(frontend_env, "w", encoding="utf-8") as f:
            f.write(f"VITE_API_BASE_URL={url}/api\n")
        print(f"✅ .env.local 업데이트 완료: {frontend_env}")
        print(f"   VITE_API_BASE_URL={url}/api")
    except Exception as e:
        print(f"❌ .env.local 업데이트 실패: {e}")
    
    # .env 업데이트
    react_env = Path(__file__).parent.parent / "frontend" / ".env"
    try:
        with open(react_env, "w", encoding="utf-8") as f:
            f.write(f"REACT_APP_API_BASE={url}/api\n")
        print(f"✅ .env 업데이트 완료: {react_env}")
        print(f"   REACT_APP_API_BASE={url}/api")
    except Exception as e:
        print(f"❌ .env 업데이트 실패: {e}")

def test_qr_code(url):
    """QR 코드 생성 테스트"""
    print(f"\n📱 QR 코드 생성 테스트...")
    try:
        qr = qrcode.QRCode(border=1)
        qr.add_data(url)
        qr.make()
        qr.print_ascii(invert=True)
        print(f"✅ QR 코드 생성 성공: {url}")
    except Exception as e:
        print(f"❌ QR 코드 생성 실패: {e}")

def main():
    print("🚀 ngrok 자동화 테스트 시작...")
    
    # 1. ngrok URL 감지
    url = test_ngrok_detection()
    if not url:
        print("\n💡 ngrok이 실행되지 않았습니다.")
        print("   다음 명령으로 ngrok을 실행하세요:")
        print("   ngrok http 8000")
        return
    
    # 2. 환경변수 업데이트
    test_env_update(url)
    
    # 3. QR 코드 생성
    test_qr_code(url)
    
    print("\n🎉 모든 테스트 완료!")
    print(f"📱 스마트폰에서 QR 코드 스캔하여 접속: {url}")

if __name__ == "__main__":
    main()
