#!/usr/bin/env python3
"""
원클릭 실행 스크립트
Django + ngrok + QR 코드 자동 실행
"""

import subprocess
import sys
import os
from pathlib import Path

# 현재 디렉토리를 backend로 설정
backend_dir = Path(__file__).parent
os.chdir(backend_dir)

def main():
    print("🚀 Django + ngrok 원클릭 실행")
    print("=" * 40)
    
    # React 빌드 + Django + ngrok 자동화 스크립트 실행
    try:
        subprocess.run([sys.executable, "scripts/run_with_react_ngrok.py"], check=True)
    except subprocess.CalledProcessError:
        print("❌ 실행 실패")
    except KeyboardInterrupt:
        print("\n✅ 종료")

if __name__ == "__main__":
    main()
