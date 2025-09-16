import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, RotateCcw, Type } from 'lucide-react';
import AppShellMobile from '../components/AppShellMobile';
import Card from '../components/Card';
import VoiceButton from '../components/VoiceButton';
import SpeechBar from '../components/SpeechBar';
import useTTS from '../hooks/useTTS';
import useSTT from '../hooks/useSTT';
import ToastA11y from '../components/ToastA11y';

export default function Home() {
  const navigate = useNavigate();
  const { speak } = useTTS(); // stop은 사용하지 않아서 제거
  const { start: startSTT, stop: stopSTT, isListening, transcript } = useSTT();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 온보딩 음성 안내 (사용자 상호작용 후)
  useEffect(() => {
    const onboardingMessage =
      '시각장애인 학습 앱, 점글이입니다. 메인화면에 점자학습, 정보탐색, 복습하기, 자유변환 모드가 있습니다. 모드를 선택해주세요.';

    const handleFirstInteraction = () => {
      speak(onboardingMessage);
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [speak]);

  // 음성 명령 처리
  useEffect(() => {
    if (!transcript) return;

    const command = transcript.toLowerCase().trim();

    if (command.includes('학습') || command.includes('점자학습')) {
      navigate('/learn');
      showToastMessage('점자 학습 모드로 이동합니다.');
      stopSTT();
    } else if (command.includes('탐색') || command.includes('정보탐색')) {
      navigate('/explore');
      showToastMessage('정보 탐색 모드로 이동합니다.');
      stopSTT();
    } else if (command.includes('복습')) {
      navigate('/review');
      showToastMessage('복습 모드로 이동합니다.');
      stopSTT();
    } else if (command.includes('자유') || command.includes('변환')) {
      navigate('/free-convert');
      showToastMessage('자유 변환 모드로 이동합니다.');
      stopSTT();
    } else {
      showToastMessage('음성 명령을 인식하지 못했습니다. 다시 시도해주세요.');
    }
  }, [transcript, navigate, stopSTT]);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const menuItems = [
    {
      id: 'learn',
      title: '점자 학습',
      description: '자모, 단어, 문장 단계별 점자 학습',
      icon: BookOpen,
      route: '/learn',
      color: 'primary',
    },
    {
      id: 'explore',
      title: '정보 탐색',
      description: '뉴스 요약 및 쉬운 설명으로 정보 탐색',
      icon: Search,
      route: '/explore',
      color: 'success',
    },
    {
      id: 'review',
      title: '복습하기',
      description: '틀린 문제들을 체계적으로 복습',
      icon: RotateCcw,
      route: '/review',
      color: 'accent',
    },
    {
      id: 'free-convert',
      title: '자유 변환',
      description: '임의의 텍스트를 점자로 변환',
      icon: Type,
      route: '/free-convert',
      color: 'primary',
    },
  ];

  return (
    <AppShellMobile title="점글이" className="relative">
      {/* 온보딩 버튼 */}
      <div className="mb-6">
        <button
          onClick={() =>
            speak(
              '시각장애인 학습 앱, 점글이입니다. 메인화면에 점자학습, 정보탐색, 복습하기, 자유변환 모드가 있습니다. 모드를 선택해주세요.'
            )
          }
          className="btn btn-ghost w-full mb-4"
          aria-label="앱 소개 음성 안내 듣기"
        >
          🔊 앱 소개 듣기
        </button>
      </div>

      {/* 음성 명령 인터페이스 */}
      <div className="mb-6">
        <SpeechBar isListening={isListening} transcript={transcript} />

        <div className="flex justify-center mt-4">
          <VoiceButton
            onStart={startSTT}
            onStop={stopSTT}
            isListening={isListening}
            // size prop 제거 (VoiceButton에 없음)
          />
        </div>

        <div className="text-center mt-2">
          <p className="text-sm text-secondary">
            음성으로 &quot;학습&quot;, &quot;탐색&quot;, &quot;복습&quot;, &quot;자유변환&quot; 중 하나를 말해보세요
          </p>
        </div>
      </div>

      {/* 메뉴 카드들 */}
      <div className="space-y-4">
        {menuItems.map((item) => (
          <Card
            key={item.id}
            title={item.title}
            description={item.description}
            icon={item.icon}
            variant="interactive"
            onClick={() => {
              navigate(item.route);
              showToastMessage(`${item.title} 모드로 이동합니다.`);
            }}
            className="card-interactive"
          >
            <div className="mt-3">
              <button
                onClick={() => speak(`${item.title}. ${item.description}`)}
                className="btn btn-ghost text-sm"
                aria-label={`${item.title} 설명 듣기`}
              >
                🔊 설명 듣기
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* 접근성 도움말 */}
      <div className="mt-8 p-4 bg-card rounded-2xl border border-border">
        <h3 className="h3 mb-2">💡 사용 팁</h3>
        <ul className="space-y-2 text-secondary">
          <li>• 음성 명령으로 모든 기능을 제어할 수 있습니다</li>
          <li>• 키보드 Tab 키로 메뉴 간 이동이 가능합니다</li>
          <li>• 점자 출력 기능을 사용하려면 점자 디스플레이를 연결하세요</li>
          <li>• 학습 과정에서 틀린 문제는 자동으로 복습 노트에 저장됩니다</li>
        </ul>
      </div>

      {/* 토스트 알림: 항상 마운트 + isVisible 토글 */}
      <ToastA11y
        message={toastMessage}
        isVisible={showToast}
        duration={3000}
        onClose={() => setShowToast(false)}
      />
    </AppShellMobile>
  );
}
