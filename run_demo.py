#!/usr/bin/env python3
"""
점글이 시연 모드 원클릭 실행
- Django + ngrok + React 통합 시연 환경 자동화
- QR 코드로 스마트폰 접속 가능
"""

import subprocess
import sys
from pathlib import Path

def main():
    print("🚀 점글이 시연 모드 실행")
    print("=" * 40)
    
    # backend/scripts/run_demo.py 실행
    script_path = Path(__file__).parent / "backend" / "scripts" / "run_demo.py"
    
    try:
        subprocess.run([sys.executable, str(script_path)], check=True)
    except subprocess.CalledProcessError:
        print("❌ 시연 모드 실행 실패")
    except KeyboardInterrupt:
        print("\n✅ 시연 모드 종료")

if __name__ == "__main__":
    main()
