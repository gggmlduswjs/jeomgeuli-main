import pyqrcode

# ngrok URL
url = "https://1b818b0ad4ce.ngrok-free.app"

# QR 코드 생성
qr = pyqrcode.create(url)

# 터미널에 출력
print("=" * 50)
print("📱 스마트폰 접속 URL:", url)
print("=" * 50)
print(qr.terminal(quiet_zone=1))
print("=" * 50)