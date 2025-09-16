import React, { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Home, BookOpen, Search, RefreshCw, Type } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AppShellMobileProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function AppShellMobile({
  title,
  showBackButton = false,
  onBack,
  children,
  className = ''
}: AppShellMobileProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [isHighContrast, setIsHighContrast] = useState(false);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  // 사용처가 생길 수 있어 남겨두되 안전 가드 추가
  // const _speakText = (text: string) => {
  //   if (!isTTSEnabled) return;
  //   if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  //     window.speechSynthesis.cancel();
  //     const utterance = new SpeechSynthesisUtterance(text);
  //     utterance.lang = 'ko-KR';
  //     utterance.rate = 0.9;
  //     utterance.volume = 1.0;
  //     window.speechSynthesis.speak(utterance);
  //   }
  // };

  const toggleTTS = () => {
    setIsTTSEnabled((prev) => {
      const next = !prev;
      if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  const toggleHighContrast = () => {
    setIsHighContrast((prev) => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        document.body.classList.toggle('theme-dark', next);
      }
      return next;
    });
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`min-h-screen bg-bg text-fg flex flex-col ${className}`}>
      {/* 상단 헤더 - 토스 스타일 */}
      <header className="bg-white border-b border-border shadow-toss">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* 뒤로가기 / 로고 */}
            <div className="flex items-center">
              {showBackButton ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-3 rounded-2xl hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="뒤로 가기"
                >
                  <ArrowLeft className="w-6 h-6 text-fg" aria-hidden="true" />
                </button>
              ) : (
                <div className="text-xl font-bold text-primary">점글이</div>
              )}
            </div>

            {/* 제목 */}
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-fg">{title}</h1>
            </div>

            {/* 접근성 도구들 */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={toggleTTS}
                className={`p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  isTTSEnabled ? 'bg-primary text-white' : 'bg-card text-muted hover:bg-border'
                }`}
                aria-label={isTTSEnabled ? '음성 안내 끄기' : '음성 안내 켜기'}
                aria-pressed={isTTSEnabled}
              >
                {isTTSEnabled ? (
                  <Volume2 className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-5 h-5" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={toggleHighContrast}
                className={`p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  isHighContrast ? 'bg-accent text-white' : 'bg-card text-muted hover:bg-border'
                }`}
                aria-label={isHighContrast ? '고대비 모드 끄기' : '고대비 모드 켜기'}
                aria-pressed={isHighContrast}
              >
                <Type className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto bg-bg">
        <div className="max-w-md mx-auto px-4 py-6">{children}</div>
      </main>

      {/* 하단 탭 네비게이션 - 토스 스타일 */}
      <nav className="bg-white border-t border-border shadow-toss" role="navigation" aria-label="메인 네비게이션">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex flex-col items-center p-3 rounded-2xl hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              aria-label="홈으로 가기"
              aria-current={isActive('/') ? 'page' : undefined}
            >
              <Home className={`w-6 h-6 ${isActive('/') ? 'text-primary' : 'text-muted'}`} aria-hidden="true" />
              <span className={`text-xs mt-1 ${isActive('/') ? 'text-primary' : 'text-muted'}`}>홈</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/learn')}
              className="flex flex-col items-center p-3 rounded-2xl hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              aria-label="점자 학습"
              aria-current={isActive('/learn') ? 'page' : undefined}
            >
              <BookOpen className={`w-6 h-6 ${isActive('/learn') ? 'text-primary' : 'text-muted'}`} aria-hidden="true" />
              <span className={`text-xs mt-1 ${isActive('/learn') ? 'text-primary' : 'text-muted'}`}>학습</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="flex flex-col items-center p-3 rounded-2xl hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              aria-label="정보 탐색"
              aria-current={isActive('/explore') ? 'page' : undefined}
            >
              <Search className={`w-6 h-6 ${isActive('/explore') ? 'text-primary' : 'text-muted'}`} aria-hidden="true" />
              <span className={`text-xs mt-1 ${isActive('/explore') ? 'text-primary' : 'text-muted'}`}>탐색</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/review')}
              className="flex flex-col items-center p-3 rounded-2xl hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              aria-label="복습하기"
              aria-current={isActive('/review') ? 'page' : undefined}
            >
              <RefreshCw className={`w-6 h-6 ${isActive('/review') ? 'text-primary' : 'text-muted'}`} aria-hidden="true" />
              <span className={`text-xs mt-1 ${isActive('/review') ? 'text-primary' : 'text-muted'}`}>복습</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/learn/free')}
              className="flex flex-col items-center p-3 rounded-2xl hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              aria-label="자유 변환"
              aria-current={isActive('/learn/free') ? 'page' : undefined}
            >
              <Type className={`w-6 h-6 ${isActive('/learn/free') ? 'text-primary' : 'text-muted'}`} aria-hidden="true" />
              <span className={`text-xs mt-1 ${isActive('/learn/free') ? 'text-primary' : 'text-muted'}`}>자유</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
