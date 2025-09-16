#!/usr/bin/env python3
"""
로컬 Django 서버 실행 스크립트 (ngrok 없이)
- Django 서버만 실행
- 로컬 테스트용
"""

import subprocess
import sys
import os
from pathlib import Path

# 현재 스크립트의 부모 디렉토리 (backend)로 이동
script_dir = Path(__file__).parent
backend_dir = script_dir.parent
os.chdir(backend_dir)

def main():
    print("🚀 Django 서버 로컬 실행...")
    print(f"📁 작업 디렉토리: {backend_dir}")
    
    try:
        # Django 서버 실행
        print("\n1️⃣ Django 서버 시작 중...")
        django_process = subprocess.Popen([
            sys.executable, "manage.py", "runserver", "8000"
        ])
        
        # 사용 안내
        print("\n✅ 서버 시작 완료!")
        print("🖥️  로컬 접속: http://localhost:8000")
        print("📱 같은 네트워크에서 접속: http://[내부IP]:8000")
        print("\n📋 테스트 방법:")
        print("1. 브라우저에서 http://localhost:8000 접속")
        print("2. '정보탐색' 버튼 클릭")
        print("3. GPT 답변 + 뉴스 5개 확인")
        print("\n⏹️  종료하려면 Ctrl+C를 누르세요...")
        
        # 서버 실행 유지
        try:
            django_process.wait()
        except KeyboardInterrupt:
            print("\n🛑 서버 종료 중...")
            django_process.terminate()
            print("✅ 종료 완료!")
            
    except Exception as e:
        print(f"❌ 실행 오류: {e}")
        return

if __name__ == "__main__":
    main()
