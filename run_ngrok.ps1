# 목표:
# - ngrok 실행 후 발급된 주소를 자동 추출
# - backend/.env 와 frontend/.env 둘 다 API_BASE_URL 자동 갱신
# - React/Vite 프론트엔드에서 즉시 반영
# - 터미널에 QR코드 ASCII로 표시 → 폰 카메라로 바로 접속 가능

param([string]$Port = "8000")

Write-Host "🚀 Django + ngrok 자동 실행 시작 (포트 $Port)..." -ForegroundColor Green

# 1. Django 실행 (백그라운드)
Write-Host "1️⃣ Django 서버 시작 중..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "cd backend; python manage.py runserver 0.0.0.0:$Port" -WindowStyle Hidden

# 2. ngrok 실행 (JSON 출력 모드)
Write-Host "2️⃣ ngrok 터널 생성 중..." -ForegroundColor Yellow
$ngrok = Start-Process ngrok -ArgumentList "http $Port --log=stdout --log-format=json" -RedirectStandardOutput "ngrok.log" -PassThru

# ngrok 준비 대기
Start-Sleep -Seconds 5

# 3. ngrok 주소 추출
Write-Host "3️⃣ ngrok 주소 감지 중..." -ForegroundColor Yellow
$lines = Get-Content ngrok.log
$publicUrl = ($lines | Select-String -Pattern "msg=" | Select-String "started tunnel" -Context 0,5 | ForEach-Object {
    if ($_ -match "url=https://[^ ]+") { $matches[0].Split("=")[1] }
}) | Select-Object -First 1

if (-not $publicUrl) {
    Write-Error "❌ ngrok 주소를 찾을 수 없음"
    exit 1
}

Write-Host "🌐 ngrok 주소: $publicUrl" -ForegroundColor Cyan

# 4. backend/.env, frontend/.env 갱신
Write-Host "4️⃣ 환경변수 파일 업데이트 중..." -ForegroundColor Yellow
$envPathBackend = "backend/.env"
$envPathFrontend = "frontend/.env"

# backend/.env 업데이트
if (Test-Path $envPathBackend) {
    (Get-Content $envPathBackend) -replace "API_BASE_URL=.*", "API_BASE_URL=$publicUrl/api" | Set-Content $envPathBackend
    Write-Host "✅ backend/.env 업데이트 완료" -ForegroundColor Green
} else {
    Write-Warning "⚠️ backend/.env 파일이 없습니다"
}

# frontend/.env 업데이트
if (Test-Path $envPathFrontend) {
    (Get-Content $envPathFrontend) -replace "VITE_API_BASE_URL=.*", "VITE_API_BASE_URL=$publicUrl/api" | Set-Content $envPathFrontend
    Write-Host "✅ frontend/.env 업데이트 완료" -ForegroundColor Green
} else {
    Write-Warning "⚠️ frontend/.env 파일이 없습니다"
}

# 5. QR코드 표시
Write-Host "5️⃣ QR 코드 생성 중..." -ForegroundColor Yellow
try {
    python -c "
import qrcode
import sys
qr = qrcode.QRCode(border=1)
qr.add_data('$publicUrl')
qr.make(fit=True)
qr.print_ascii(invert=True)
print('📱 스마트폰에서 이 QR을 찍으세요: $publicUrl')
"
} catch {
    Write-Warning "⚠️ QR 코드 생성 실패: $_"
    Write-Host "📱 수동 접속: $publicUrl" -ForegroundColor Cyan
}

# 6. React dev 서버 실행
Write-Host "6️⃣ React 개발 서버 시작 중..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "cd frontend; npm run dev"

Write-Host ""
Write-Host "🎉 모든 서비스 실행 완료!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host "🖥️  PC 접속: http://localhost:5173" -ForegroundColor White
Write-Host "📱 폰 접속: $publicUrl" -ForegroundColor White
Write-Host "=" * 50 -ForegroundColor Gray
Write-Host ""
Write-Host "⏹️  종료하려면 Ctrl+C를 누르세요..." -ForegroundColor Yellow

# 프로세스 유지
try {
    $ngrok.WaitForExit()
} catch {
    Write-Host "프로그램이 종료되었습니다." -ForegroundColor Red
}
