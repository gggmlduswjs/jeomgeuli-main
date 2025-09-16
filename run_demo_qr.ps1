Write-Host "🚀 Django + ngrok 자동 실행 + QR코드 표시 시작..."

# 1. Django 실행
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PWD\backend; python manage.py runserver 0.0.0.0:8000"

Start-Sleep -Seconds 5

# 2. ngrok 실행
Start-Process ngrok "http 8000" -WindowStyle Hidden

Start-Sleep -Seconds 5

# 3. ngrok URL 가져오기
$response = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels"
$public_url = $response.tunnels[0].public_url
Write-Host "🌍 PC 접속: http://localhost:8000"
Write-Host "📱 스마트폰 접속: $public_url"

# 4. Python으로 QR 출력
python .\show_qr.py $public_url
