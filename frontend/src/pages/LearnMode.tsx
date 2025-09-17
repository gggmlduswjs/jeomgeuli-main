import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw, Play } from 'lucide-react';
import AppShellMobile from '../components/AppShellMobile';
import BrailleCell from '../components/BrailleCell';
import VoiceButton from '../components/VoiceButton';
import SpeechBar from '../components/SpeechBar';
import useTTS from '../hooks/useTTS';
import useSTT from '../hooks/useSTT';
import { localToBrailleCells } from '@/lib/braille';
import ToastA11y from '../components/ToastA11y';

interface LearningItem {
  char: string;
  name: string;
  description: string;
  examples: string[];
}

export default function LearnMode() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { speak, stop: stopTTS } = useTTS();
  const { start: startSTT, stop: stopSTT, isListening, transcript } = useSTT();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 페이지 진입 시 자동 음성 안내
  useEffect(() => {
    const modeNames = {
      'jamo': '자모',
      'word': '단어', 
      'sentence': '문장'
    };
    const modeName = modeNames[mode as keyof typeof modeNames] || mode;
    const welcomeMessage = `${modeName} 학습 모드입니다. 음성 명령으로 다음, 이전, 반복, 테스트를 할 수 있습니다.`;
    
    const timer = setTimeout(() => {
      speak(welcomeMessage);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [speak, mode]);

  // 학습 데이터 (실제로는 API에서 가져오세요)
  const getLearningData = (): LearningItem[] => {
    switch (mode) {
      case 'jamo':
        return [
          { char: 'ㄱ', name: '기역', description: '자음 ㄱ입니다', examples: ['가', '거', '고'] },
          { char: 'ㄴ', name: '니은', description: '자음 ㄴ입니다', examples: ['나', '너', '노'] },
          { char: 'ㄷ', name: '디귿', description: '자음 ㄷ입니다', examples: ['다', '더', '도'] },
          { char: 'ㅏ', name: '아', description: '모음 ㅏ입니다', examples: ['가', '나', '다'] },
          { char: 'ㅓ', name: '어', description: '모음 ㅓ입니다', examples: ['거', '너', '더'] },
        ];
      case 'word':
        return [
          { char: '가', name: '가', description: '가나다라마의 가입니다', examples: ['가족', '가방', '가게'] },
          { char: '나', name: '나', description: '가나다라마의 나입니다', examples: ['나무', '나라', '나이'] },
          { char: '다', name: '다', description: '가나다라마의 다입니다', examples: ['다리', '다음', '다양'] },
        ];
      case 'sentence':
        return [
          { char: '안녕하세요', name: '안녕하세요', description: '인사말입니다', examples: ['안녕하세요. 좋은 하루입니다.'] },
          { char: '감사합니다', name: '감사합니다', description: '감사의 표현입니다', examples: ['감사합니다. 도움이 되었습니다.'] },
        ];
      default:
        return [];
    }
  };

  const learningData = useMemo(getLearningData, [mode]);
  const currentItem = learningData[currentIndex];

  // 음성 명령 처리
  useEffect(() => {
    if (!transcript) return;
    const command = transcript.toLowerCase().trim();

    if (/(다음|넘어|계속)/.test(command)) {
      handleNext();
    } else if (/(이전|뒤로)/.test(command)) {
      handlePrevious();
    } else if (/(반복|다시)/.test(command)) {
      handleRepeat();
    } else if (/(학습|테스트)/.test(command)) {
      handleStartTest();
    }
  }, [transcript]); // 의존성은 transcript만으로 충분

  const handleNext = () => {
    // 기존 TTS 중지
    stopTTS();
    
    if (currentIndex < learningData.length - 1) {
      setCurrentIndex((i) => i + 1);
      showToastMessage('다음 항목으로 이동합니다.');
    } else {
      showToastMessage('모든 학습이 완료되었습니다. 테스트를 시작합니다.');
      setTimeout(() => handleStartTest(), 800);
    }
  };

  const handlePrevious = () => {
    // 기존 TTS 중지
    stopTTS();
    
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      showToastMessage('이전 항목으로 이동합니다.');
    }
  };

  const handleRepeat = () => {
    if (!currentItem) return;
    // 기존 TTS 중지
    stopTTS();
    const message = `${currentItem.name}. ${currentItem.description}. 점자 패턴을 기억해보세요.`;
    speak(message);
  };

  const handleStartTest = () => {
    showToastMessage('테스트 모드로 이동합니다.');
    setTimeout(() => {
      navigate(`/test/${mode}`);
    }, 600);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  // 현재 항목 변경 시 음성 안내
  useEffect(() => {
    if (!currentItem) return;
    // 기존 TTS 중지 후 새 메시지 재생
    stopTTS();
    const message = `${currentItem.name}. ${currentItem.description}. 점자 패턴을 기억해보세요.`;
    speak(message);
  }, [currentItem, speak, stopTTS]);

  if (!currentItem) {
    return (
      <AppShellMobile title="학습 모드" showBackButton>
        <div className="text-center">
          <p className="text-secondary">학습 데이터를 불러올 수 없습니다.</p>
          <button onClick={() => navigate('/learn')} className="btn btn-primary mt-4">
            학습 선택으로 돌아가기
          </button>
        </div>
      </AppShellMobile>
    );
  }

  // 한글 포함 안전 변환: 첫 번째 셀(문자/단어/문장의 첫 글자 기준)
  const firstCellPattern: any[] =
    localToBrailleCells(currentItem.char)?.[0] ?? [false, false, false, false, false, false];

  const total = learningData.length;
  const progressed = currentIndex + 1;
  const percent = Math.round((progressed / total) * 100);

  return (
    <AppShellMobile
      title={`${mode === 'jamo' ? '자모' : mode === 'word' ? '단어' : '문장'} 학습`}
      showBackButton
    >
      {/* 진행 상황 */}
      <div className="mb-6" aria-live="polite">
        <div className="flex justify-between items-center mb-2">
          <span className="text-secondary">
            {progressed} / {total}
          </span>
          <span className="text-sm text-secondary">{percent}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* 점자 셀 표시 */}
      <div className="text-center mb-6">
        <BrailleCell pattern={firstCellPattern} active className="scale-110" />
      </div>

      {/* 학습 내용 */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-fg mb-2">{currentItem.char}</h2>
          <p className="text-lg text-secondary">{currentItem.name}</p>
        </div>

        <div className="p-4 bg-card rounded-2xl border border-border">
          <p className="text-center text-lg mb-3">{currentItem.description}</p>

          {!!currentItem.examples.length && (
            <div>
              <p className="text-sm text-secondary mb-2">예시:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {currentItem.examples.map((example, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary text-black rounded-full text-sm"
                    aria-label={`예시 ${index + 1} ${example}`}
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 음성 입력 */}
      <div className="mb-6">
        <SpeechBar isListening={isListening} transcript={transcript} />
        <div className="flex justify-center mt-4">
          <VoiceButton
            onStart={startSTT}
            onStop={stopSTT}
            isListening={isListening}
            className="w-14 h-14" // size prop이 없으므로 className으로 크기 조절
          />
        </div>
      </div>

      {/* 컨트롤 버튼들 */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="btn btn-ghost flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          <span>이전</span>
        </button>

        <button onClick={handleNext} className="btn btn-primary flex items-center justify-center space-x-2">
          <span>{currentIndex === total - 1 ? '테스트' : '다음'}</span>
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <button onClick={handleRepeat} className="btn btn-ghost flex items-center justify-center space-x-2">
          <RotateCcw className="w-5 h-5" aria-hidden="true" />
          <span>반복</span>
        </button>

        <button onClick={handleStartTest} className="btn btn-accent flex items-center justify-center space-x-2">
          <Play className="w-5 h-5" aria-hidden="true" />
          <span>테스트</span>
        </button>
      </div>

      {/* 음성 명령 힌트 */}
      <div className="mt-6 p-4 bg-card rounded-2xl border border-border">
        <h3 className="h3 mb-2">🎤 음성 명령</h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-secondary">
          <div>• "다음" - 다음 항목</div>
          <div>• "이전" - 이전 항목</div>
          <div>• "반복" - 다시 듣기</div>
          <div>• "테스트" - 테스트 시작</div>
        </div>
      </div>

      {/* 토스트 알림 (컴포넌트의 isVisible prop 사용) */}
      <ToastA11y
        message={toastMessage}
        isVisible={showToast}
        duration={1800}
        onClose={() => setShowToast(false)}
      />
    </AppShellMobile>
  );
}
