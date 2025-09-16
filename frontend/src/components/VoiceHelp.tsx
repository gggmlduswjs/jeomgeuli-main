import { useState, useEffect } from 'react';
import useTTS from '../hooks/useTTS';

interface VoiceHelpProps {
  isVisible: boolean;
  onClose: () => void;
}

export function VoiceHelp({ isVisible, onClose }: VoiceHelpProps) {
  const { speak } = useTTS();
  const [currentPage, setCurrentPage] = useState('');

  const helpCommands = {
    home: [
      '홈 화면 음성 명령어:',
      '학습 - 점자 학습 모드로 이동',
      '정보탐색 - 정보 탐색 모드로 이동', 
      '복습 - 복습 모드로 이동',
      '자유변환 - 자유 변환 모드로 이동',
      '퀴즈 - 퀴즈 모드로 이동',
      '도움말 - 음성 명령어 안내',
      '앱소개듣기 - 앱 소개 음성 안내'
    ],
    explore: [
      '정보탐색 화면 음성 명령어:',
      '홈 - 홈 화면으로 이동',
      '뒤로 - 이전 화면으로 이동',
      '점자켜 - 점자 출력 활성화',
      '점자꺼 - 점자 출력 비활성화',
      '점자연결 - 점자 디스플레이 연결',
      '점자해제 - 점자 디스플레이 해제',
      '다음 - 다음 키워드 출력',
      '반복 - 현재 키워드 반복',
      '시작 - 점자 출력 시작',
      '정지 - 점자 출력 정지',
      '자세히 - 마지막 답변 자세히 설명',
      '뉴스 - 오늘 뉴스 보기',
      '날씨 - 오늘 날씨 보기',
      '도움말 - 음성 명령어 안내'
    ],
    learn: [
      '학습 화면 음성 명령어:',
      '홈 - 홈 화면으로 이동',
      '뒤로 - 이전 화면으로 이동',
      '다음 - 다음 학습 항목',
      '이전 - 이전 학습 항목',
      '반복 - 현재 항목 반복',
      '시작 - 학습 시작',
      '정지 - 학습 정지',
      '점자켜 - 점자 출력 활성화',
      '점자꺼 - 점자 출력 비활성화',
      '도움말 - 음성 명령어 안내'
    ],
    quiz: [
      '퀴즈 화면 음성 명령어:',
      '홈 - 홈 화면으로 이동',
      '뒤로 - 이전 화면으로 이동',
      '다음 - 다음 문제',
      '이전 - 이전 문제',
      '반복 - 문제 다시 읽기',
      '정지 - 퀴즈 정지',
      '도움말 - 음성 명령어 안내'
    ],
    review: [
      '복습 화면 음성 명령어:',
      '홈 - 홈 화면으로 이동',
      '뒤로 - 이전 화면으로 이동',
      '다음 - 다음 복습 항목',
      '이전 - 이전 복습 항목',
      '반복 - 현재 항목 반복',
      '시작 - 복습 시작',
      '정지 - 복습 정지',
      '도움말 - 음성 명령어 안내'
    ],
    freeConvert: [
      '자유변환 화면 음성 명령어:',
      '홈 - 홈 화면으로 이동',
      '뒤로 - 이전 화면으로 이동',
      '전송 - 텍스트 점자 변환',
      '지워 - 입력 텍스트 삭제',
      '점자켜 - 점자 출력 활성화',
      '점자꺼 - 점자 출력 비활성화',
      '도움말 - 음성 명령어 안내'
    ]
  };

  useEffect(() => {
    if (isVisible) {
      // 현재 페이지 감지
      const path = window.location.pathname;
      let page = 'home';
      
      if (path.includes('/explore')) page = 'explore';
      else if (path.includes('/learn')) page = 'learn';
      else if (path.includes('/quiz')) page = 'quiz';
      else if (path.includes('/review')) page = 'review';
      else if (path.includes('/free-convert')) page = 'freeConvert';
      
      setCurrentPage(page);
      
      // 해당 페이지의 도움말 음성 안내
      const commands = helpCommands[page as keyof typeof helpCommands];
      if (commands) {
        speak(commands.join('. '));
      }
    }
  }, [isVisible, speak]);

  if (!isVisible) return null;

  const commands = helpCommands[currentPage as keyof typeof helpCommands] || helpCommands.home;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">음성 명령어 도움말</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="도움말 닫기"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-2">
          {commands.map((command, index) => (
            <div key={index} className="text-sm text-gray-700">
              {command}
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => speak(commands.join('. '))}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            🔊 다시 듣기
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default VoiceHelp;
