import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Type, FileText, Wand2 } from 'lucide-react';
import AppShellMobile from '../components/AppShellMobile';
import Card from '../components/Card';
import useTTS from '../hooks/useTTS';
import useSTT from '../hooks/useSTT';

export default function Learn() {
  const navigate = useNavigate();
  const { speak } = useTTS();
  const { start: startSTT, stop: stopSTT, isListening, transcript } = useSTT();

  // 페이지 진입 시 안내 (사용자 상호작용 이후 브라우저 정책에 따라 재생 가능)
  useEffect(() => {
    const message =
      '점자 학습 모드입니다. 자모 학습, 단어 학습, 문장 학습, 자유 변환 중에서 선택해주세요.';
    speak(message);
  }, [speak]);

  // 음성 명령 처리
  useEffect(() => {
    if (!transcript) return;

    const command = transcript.toLowerCase().trim();

    if (command.includes('자모') || command.includes('기본')) {
      navigate('/learn/jamo');
      stopSTT();
    } else if (command.includes('단어')) {
      navigate('/learn/word');
      stopSTT();
    } else if (command.includes('문장')) {
      navigate('/learn/sentence');
      stopSTT();
    } else if (command.includes('자유') || command.includes('변환')) {
      navigate('/learn/free');
      stopSTT();
    }
  }, [transcript, navigate, stopSTT]);

  // 언마운트 시 STT 정리
  useEffect(() => {
    return () => {
      stopSTT();
    };
  }, [stopSTT]);

  const learningModes = [
    {
      id: 'jamo',
      title: '자모 학습',
      description: '한글 자음과 모음의 점자 패턴을 학습합니다',
      icon: BookOpen,
      route: '/learn/jamo',
      level: '기초',
    },
    {
      id: 'word',
      title: '단어 학습',
      description: '자모를 조합한 단어의 점자를 학습합니다',
      icon: Type,
      route: '/learn/word',
      level: '중급',
    },
    {
      id: 'sentence',
      title: '문장 학습',
      description: '완전한 문장의 점자 표현을 학습합니다',
      icon: FileText,
      route: '/learn/sentence',
      level: '고급',
    },
    {
      id: 'free',
      title: '자유 변환',
      description: '임의의 텍스트를 점자로 변환해 봅니다',
      icon: Wand2,
      route: '/learn/free',
      level: '실습',
    },
  ];

  return (
    <AppShellMobile title="점자 학습" showBackButton>
      {/* 음성 명령 안내 */}
      <div className="mb-6">
        <div className="text-center">
          <p className="text-secondary mb-4">
            음성으로 &quot;자모&quot;, &quot;단어&quot;, &quot;문장&quot;, &quot;자유변환&quot; 중 하나를 말해보세요
          </p>
          <button
            onClick={() => startSTT()}
            className="btn btn-primary"
            disabled={isListening}
            aria-pressed={isListening}
            aria-label="음성 명령 시작"
          >
            {isListening ? '음성 인식 중...' : '음성 명령 시작'}
          </button>
        </div>
      </div>

      {/* 학습 모드 선택 */}
      <div className="space-y-4">
        {learningModes.map((mode) => (
          <Card
            key={mode.id}
            title={mode.title}
            description={mode.description}
            icon={mode.icon}
            variant="interactive"
            onClick={() => {
              navigate(mode.route);
              speak(`${mode.title} 모드를 시작합니다. ${mode.description}`);
              stopSTT();
            }}
          >
            <div className="flex items-center justify-between mt-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  mode.level === '기초'
                    ? 'bg-primary text-black'
                    : mode.level === '중급'
                    ? 'bg-accent text-black'
                    : mode.level === '고급'
                    ? 'bg-danger text-white'
                    : 'bg-success text-black'
                }`}
              >
                {mode.level}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(`${mode.title}. ${mode.description}`);
                }}
                className="btn btn-ghost text-sm"
                aria-label={`${mode.title} 설명 듣기`}
              >
                🔊 설명 듣기
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* 학습 진행 상황 (예시) */}
      <div className="mt-8 p-4 bg-card rounded-2xl border border-border">
        <h3 className="h3 mb-3">📊 학습 진행 상황</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-secondary">자모 학습</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-muted rounded-full">
                <div className="w-3/4 h-full bg-primary rounded-full" />
              </div>
              <span className="text-sm">75%</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-secondary">단어 학습</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-muted rounded-full">
                <div className="w-1/2 h-full bg-accent rounded-full" />
              </div>
              <span className="text-sm">50%</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-secondary">문장 학습</span>
            <div className="flex items-center space-x-2">
              <div className="w-20 h-2 bg-muted rounded-full">
                <div className="w-1/4 h-full bg-danger rounded-full" />
              </div>
              <span className="text-sm">25%</span>
            </div>
          </div>
        </div>
      </div>
    </AppShellMobile>
  );
}
