import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatLikeInput } from '../components/ChatLikeInput';
import { AnswerCard } from '../components/AnswerCard';
import { BrailleOutputPanel } from '../components/BrailleOutputPanel';
import { useTTS } from '../hooks/useTTS';
import useBrailleBLE from '../hooks/useBrailleBLE';
import { useBraillePlayback } from '../hooks/useBraillePlayback';
import useVoiceCommands from '../hooks/useVoiceCommands';
import { askChat, askChatWithKeywords, type ChatResponse, fetchExplore } from '../lib/api';
import type { ChatMessage } from '../types';

// function extractBulletsFromMarkdown(md?: string): string[] {
//   if (!md) return [];
//   const lines = md.split(/\r?\n/).map((l: string) => l.trim());
//   const bulletRegex = /^(?:•|-|\*|\d+[.)])\s+(.*)$/;
//   return lines.filter((line) => bulletRegex.test(line)).map((line) => {
//     const match = line.match(bulletRegex);
//     return match ? match[1] : line;
//   });
// }

// function getSimpleTTS(res?: ChatResponse | null): string | undefined {
//   if (!res) return;
//   return (res.actions as any)?.simple_tts || (res as any).simple_tts;
// }

export default function Explore() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBraille, setCurrentBraille] = useState<string[]>([]); // 현재 출력 중인 점자
  const listRef = useRef<HTMLDivElement>(null);
  
  // 정보탐색 모드 상태
  const [exploreData, setExploreData] = useState<{
    answer: string;
    news: any[];
    query: string;
  } | null>(null);
  const [isExploreLoading, setIsExploreLoading] = useState(false);

  const { speak } = useTTS();
  const { isConnected, connect, disconnect } = useBrailleBLE();
  const braille = useBraillePlayback({
    ble: {
      serviceUUID: "0000180a-0000-1000-8000-00805f9b34fb",
      characteristicUUID: "00002a00-0000-1000-8000-00805f9b34fb",
    },
  });

  // 새 메시지 렌더 시 맨 아래로 스크롤
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, isLoading]);

  // 점자 출력 핸들러
  const handleBrailleOutput = useCallback((keywords: string[]) => {
    setCurrentBraille(keywords);
    braille.enqueueKeywords(keywords);
  }, [braille]);

  // AI 응답 공통 처리
  const handleAiResponse = useCallback(async (res: ChatResponse) => {
    // 키워드 3개까지만 큐 적재
    const ks = (res?.keywords ?? [])
      .filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
      .slice(0, 3);

    // 응답에서 불릿 추출
    // const answerText = normalizeAnswer(res);
    // const bullets = extractBulletsFromMarkdown(answerText);

    // 점자 큐 적재 (토글 ON일 때 훅이 자동 재생)
    if (ks.length) braille.enqueueKeywords(ks);
  }, [braille]);

  // "자세히" 요청 처리
  const handleDetail = useCallback(async (topic: string) => {
    if (!topic) return;
    
    setIsLoading(true);
    const typingId = `typing_${Date.now()}`;
    
    setMessages(p => [
      ...p,
      {
        id: typingId,
        role: 'assistant',
        type: 'text',
        text: '__typing__',
        createdAt: Date.now(),
      },
    ]);

    try {
      // 기존 답변을 확장하는 프롬프트로 변경
      const expandPrompt = `위에서 "${topic}"에 대해 간단히 설명했는데, 이제 더 자세하고 구체적으로 설명해주세요. 

다음 내용을 포함해주세요:
- 기본 개념과 정의
- 주요 특징과 원리  
- 실제 활용 사례나 예시
- 관련된 중요 정보

답변 후에 핵심 키워드 3개를 추출해서 "키워드: 키워드1, 키워드2, 키워드3" 형태로 끝에 추가해주세요.`;

      const result = await askChatWithKeywords(expandPrompt);
      
      // typing indicator 제거
      setMessages(p => p.filter(m => m.id !== typingId));

      // Create response object for compatibility
      const response = { answer: result.answer, keywords: result.keywords, ok: true };

      // 공통 처리(키워드 큐, 불릿 추출)
      await handleAiResponse(response);

      // AI 응답을 메시지로 추가
      const cardMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        type: 'text',
        text: result.answer,
        keywords: result.keywords,
        createdAt: Date.now(),
      };
      setMessages(p => [...p, cardMsg]);

      // TTS로 자동 낭독
      await speak(result.answer);
    } catch (error) {
      console.error('자세히 요청 오류:', error);
      setMessages(p => [
        ...p.filter(m => m.id !== typingId),
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          type: 'text',
          text: `죄송합니다. "${topic}"에 대한 자세한 설명을 가져오는 중 오류가 발생했습니다.`,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [askChatWithKeywords, handleAiResponse, speak]);

  // 정보탐색 모드 처리
  const handleExplore = useCallback(async (query: string) => {
    setIsExploreLoading(true);
    try {
      const data = await fetchExplore(query);
      setExploreData({
        answer: data.answer ?? "",
        news: data.news ?? [],
        query: data.query ?? ""
      });
      
      // TTS로 자동 낭독
      if (data.answer) {
        await speak(data.answer);
      }
    } catch (error) {
      console.error('정보탐색 오류:', error);
      const errorMessage = `정보탐색 중 오류가 발생했습니다: ${error}`;
      setExploreData({
        answer: errorMessage,
        news: [],
        query: query
      });
      
      // 오류 메시지도 TTS로 읽기
      await speak(errorMessage);
    } finally {
      setIsExploreLoading(false);
    }
  }, [speak]);

  // 메시지 전송 처리
  const handleSubmit = useCallback(async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    // 사용자 메시지 추가
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      type: 'text',
      text: userText,
      createdAt: Date.now(),
    };
    setMessages(p => [...p, userMsg]);

    setIsLoading(true);
    const typingId = `typing_${Date.now()}`;
    
    setMessages(p => [
      ...p,
      {
        id: typingId,
        role: 'assistant',
        type: 'text',
        text: '__typing__',
        createdAt: Date.now(),
      },
    ]);

    try {
      // AI API 호출 - 키워드와 함께
      const result = await askChatWithKeywords(userText);
      if (import.meta?.env?.DEV) {
        console.debug("[Explore] result=", result);
      }

      // typing indicator 제거
      setMessages(p => p.filter(m => m.id !== typingId));

      // Create response object for compatibility
      const response = { answer: result.answer, keywords: result.keywords, ok: true };

      // 공통 처리(키워드 큐, 불릿 추출)
      await handleAiResponse(response);

      // AI 응답을 메시지로 추가
      const cardMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        type: 'text',
        text: result.answer,
        keywords: result.keywords,
        createdAt: Date.now(),
      };
      setMessages(p => [...p, cardMsg]);

      // TTS로 자동 낭독
      await speak(result.answer);
    } catch (error) {
      console.error('AI 응답 오류:', error);
      setMessages(p => [
        ...p.filter(m => m.id !== typingId),
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          type: 'text',
          text: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.',
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, askChat, handleAiResponse, speak]);

  // 음성 명령 처리
  useVoiceCommands({
    // 네비게이션
    home: () => {
      window.location.href = '/';
    },
    back: () => {
      window.history.back();
    },
    
    // 점자 제어
    brailleOn: () => braille.setEnabled(true),
    brailleOff: () => braille.setEnabled(false),
    brailleConnect: () => connect(),
    brailleDisconnect: () => disconnect(),
    
    // 재생 제어
    next: () => braille.next(),
    repeat: () => braille.repeat(),
    start: () => braille.start(),
    stop: () => braille.pause(),
    
    // 상세 정보
    detail: () => {
      // 마지막 assistant 메시지의 첫 번째 키워드로 자세히 요청
      const lastAssistantMsg = messages
        .filter(m => m.role === 'assistant' && m.keywords && m.keywords.length > 0)
        .pop();
      if (lastAssistantMsg?.keywords?.[0]) {
        handleDetail(lastAssistantMsg.keywords[0]);
      }
    },
    
    // 정보탐색
    news: () => handleExplore("오늘 뉴스"),
    weather: () => handleExplore("오늘 날씨"),
    
    // 도움말
    help: () => {
      const helpText = '사용 가능한 음성 명령어: 홈, 뒤로, 점자켜, 점자꺼, 점자연결, 점자해제, 다음, 반복, 시작, 정지, 자세히, 뉴스, 날씨, 도움말';
      speak(helpText);
    },
    
    // TTS 제어
    speak: (text: string) => speak(text),
    mute: () => {
      // TTS 중지 로직 추가 가능
    },
    unmute: () => {
      speak('음성이 활성화되었습니다.');
    },
  });

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 상단 점자 출력 패널 - Sticky */}
      <BrailleOutputPanel 
        currentBraille={currentBraille}
        className="sticky top-0 z-20"
      />

      {/* 상단 컨트롤 바 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-3">
          {/* BLE 연결 상태 */}
          <button
            onClick={isConnected ? disconnect : connect}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isConnected
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-pressed={isConnected}
          >
            {isConnected ? '🔗 연결됨' : '🔌 연결'}
          </button>

          {/* 점자 출력 토글 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={braille.enabled}
              onChange={(e) => braille.setEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              aria-label="점자 출력 토글"
            />
            <span className="text-sm font-medium text-gray-700">점자 출력</span>
          </label>

          {/* 빠른 액션 버튼들 */}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleExplore("오늘 뉴스")}
              disabled={isExploreLoading}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              📰 오늘의 뉴스
            </button>
            
            {/* 점자 제어 버튼들 */}
            <button
              onClick={() => braille.next()}
              disabled={!braille.queue.length}
              className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-sm font-medium hover:bg-green-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ▶ 다음
            </button>
            <button
              onClick={() => braille.repeat()}
              disabled={!braille.queue.length}
              className="px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 text-sm font-medium hover:bg-yellow-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⟳ 반복
            </button>
            <button
              onClick={() => braille.pause()}
              disabled={!braille.isPlaying}
              className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ⏸ 정지
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 overflow-hidden">
        <div 
          ref={listRef}
          className="h-full overflow-y-auto px-4 py-6"
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 정보탐색 결과 */}
            {exploreData && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🔍</span>
                  <h3 className="text-lg font-semibold text-gray-800">
                    정보탐색: {exploreData.query}
                  </h3>
                </div>
                
                <div className="mb-4">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {exploreData.answer}
                  </p>
                </div>

                {exploreData.news.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-3">관련 뉴스</h4>
                    <div className="space-y-3">
                      {exploreData.news.slice(0, 3).map((news, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <a 
                            href={news.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block group"
                          >
                            <h5 className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                              {news.title?.replace(/<[^>]*>/g, '') || '제목 없음'}
                            </h5>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {news.description?.replace(/<[^>]*>/g, '') || '설명 없음'}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {news.pubDate ? new Date(news.pubDate).toLocaleDateString('ko-KR') : '날짜 없음'}
                              </span>
                              <span className="text-xs text-blue-600 group-hover:text-blue-800">
                                원문 보기 →
                              </span>
                            </div>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 채팅 메시지들 */}
            {messages.map((m) => {
              // 타이핑 인디케이터
              if (m.text === '__typing__') {
                return (
                  <div key={m.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <div className="flex items-center gap-2" aria-label="답변 생성 중">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:120ms]" />
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:240ms]" />
                      <span className="text-sm text-gray-500 ml-2">답변을 생성하고 있습니다...</span>
                    </div>
                  </div>
                );
              }

              // 사용자 메시지
              if (m.role === 'user') {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-xl px-4 py-3 max-w-[80%] shadow-md">
                      <p className="text-sm leading-relaxed">{m.text}</p>
                    </div>
                  </div>
                );
              }

              // AI 답변 카드
              return (
                <AnswerCard
                  key={m.id}
                  text={m.text || ''}
                  keywords={m.keywords || []}
                  onBrailleOutput={handleBrailleOutput}
                />
              );
            })}

            {/* 로딩 상태 */}
            {isLoading && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="flex items-center gap-2" aria-label="답변 생성 중">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:120ms]" />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:240ms]" />
                  <span className="text-sm text-gray-500 ml-2">답변을 생성하고 있습니다...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 입력 영역 */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <ChatLikeInput
            onSubmit={handleSubmit}
            disabled={isLoading}
            placeholder="궁금한 것을 물어보세요..."
          />
        </div>
      </div>
    </div>
  );
}