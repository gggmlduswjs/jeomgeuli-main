# Jeomgeuli Frontend

## Environment Setup

Create `frontend/.env` or `frontend/.env.local` file with the following content:

```
VITE_API_BASE=http://127.0.0.1:8000
VITE_WS_BASE=ws://127.0.0.1:8000
```

**Important**: Restart the Vite dev server after creating/modifying the .env file to pick up environment variables.

## Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

## Mobile App-Style UI

The app now features a mobile app-style interface with:

- **Home**: Two big buttons for "점자 학습" and "정보 탐색"
- **Learn Menu**: Four learning modes (자모/단어/문장/자유변환)
- **Learn Step**: Step-by-step learning with progress indicator
- **Explore**: Voice input with AI assistant integration
- **Accessibility**: TTS, STT, braille output, large buttons, high contrast

## Build

```bash
npm run build
```

## PWA Icons

Generate PWA icons:
```bash
npm run gen:icons
```
