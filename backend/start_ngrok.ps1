# Windows PowerShell 실행 스크립트
# ngrok + Django 서버 자동 실행

Write-Host "🚀 Django + ngrok 자동 실행 스크립트" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# 가상환경 활성화 확인
if (-not $env:VIRTUAL_ENV) {
    Write-Host "⚠️  가상환경이 활성화되지 않았습니다." -ForegroundColor Yellow
    Write-Host "💡 가상환경 활성화 후 다시 실행하세요:" -ForegroundColor Cyan
    Write-Host "   .venv\Scripts\Activate.ps1" -ForegroundColor White
    Read-Host "Enter를 눌러 계속하거나 Ctrl+C로 종료"
}

# 의존성 설치 확인
Write-Host "📦 의존성 설치 확인 중..." -ForegroundColor Blue
try {
    python -c "import pyngrok, pyqrcode" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "📥 필요한 패키지 설치 중..." -ForegroundColor Yellow
        pip install pyngrok pyqrcode pypng
    }
} catch {
    Write-Host "📥 필요한 패키지 설치 중..." -ForegroundColor Yellow
    pip install pyngrok pyqrcode pypng
}

# ngrok 스크립트 실행
Write-Host "🎯 ngrok 스크립트 실행 중..." -ForegroundColor Green
python scripts/run_with_ngrok.py
