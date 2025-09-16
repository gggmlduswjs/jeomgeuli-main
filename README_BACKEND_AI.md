# AI Module (Backend)

## Overview
This module provides a standardized AI service for text summarization with a consistent JSON schema across the application.

## Endpoint
- **POST** `/api/chat/ask/`  
  Body: `{"text":"..."}`
  Returns: `{"summary": "...", "bullets": ["..."], "keywords": ["..."]}`

- **POST** `/api/ai/ask/` (alias)
  Same functionality as above endpoint

## Service
- `services/ai.py` provides `summarize(text)` and a base `PROMPT`.
- Replace stub with real Gemini call when ready.

## JSON Schema
The API always returns a consistent structure:
```json
{
  "summary": "핵심을 2~4문장으로 한국어 요약",
  "bullets": ["초등학생도 이해할 쉬운 한국어 불릿 2~3개"],
  "keywords": ["핵심 키워드 2~3개 (짧게)"]
}
```

## Curl Smoke Test
```bash
curl -sX POST http://localhost:8000/api/chat/ask/ \
 -H "Content-Type: application/json" \
 -d '{"text":"물가 상승과 금리 인하 전망에 대한 오늘 뉴스"}' | jq
```

## PowerShell Test
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:8000/api/chat/ask/" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"text":"물가 상승과 금리 인하 전망에 대한 오늘 뉴스"}'
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 3
```

## Integration
To integrate with real Gemini API:
1. Set `GEMINI_API_KEY` environment variable
2. Replace the stub implementation in `services/ai.py`
3. Update the `summarize()` function to call Gemini API
4. Ensure response matches the required JSON schema

## Architecture
- **Service Layer**: `services/ai.py` - Core AI logic
- **View Layer**: `apps/chat/views.py` - HTTP handling
- **Routing**: `apps/api/urls.py` - API gateway
- **Settings**: `jeomgeuli_backend/settings.py` - Configuration
