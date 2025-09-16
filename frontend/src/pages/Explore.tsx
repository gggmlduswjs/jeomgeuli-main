import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageBubble } from '../components/MessageBubble';
import SummaryCard from '../components/SummaryCard';
import { ChatLikeInput } from '../components/ChatLikeInput';
// import BrailleCell from '../components/BrailleCell'; // 미사용 제거
import BraillePanel from '../components/BraillePanel';
import { useTTS } from '../hooks/useTTS';
import useBrailleBLE from '../hooks/useBrailleBLE';
import { useBraillePlayback } from '../hooks/useBraillePlayback';
import useVoiceCommands from '../hooks/useVoiceCommands';
import api, { type ChatResponse } from '@/lib/api';
import type { ChatMessage } from '@/types/chat';

function extractBulletsFromMarkdown(md?: string): string[] {
  if (!md) return [];
  return md
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('•'))
    .map(l => l.replace(/^•\s*/, '').trim());
}

function getSimpleTTS(res?: ChatResponse | null): string | undefined {
  if (!res) return;
  return (res.actions as any)?.simple_tts || (res as any).simple_tts;
}

export default function Explore() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryBullets, setSummaryBullets] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const listRef = useRef<HTMLDivElement>(null);

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

  // AI 응답 공통 처리
  const handleAiResponse = useCallback(async (res: ChatResponse) => {
    // 키워드 3개까지만 큐 적재
    const ks = (res?.keywords ?? [])
      .filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
      .slice(0, 3);

    // chat_markdown에서 불릿 추출하여 요약 섹션 갱신
    const bullets = extractBulletsFromMarkdown(res.chat_markdown);
    if (bullets.length) {
      setSummaryBullets(bullets);
      setSelectedIndex(0);
    }

    // 점자 큐 적재 (토글 ON일 때 훅이 자동 재생)
    if (ks.length) braille.enqueueKeywords(ks);
  }, [braille]);

  // "자세히" 요청 처리
  const handleDetail = useCallback(async (idx = selectedIndex) => {
    const topic = summaryBullets[idx] ?? '';
    if (!topic) {
      speak('자세히 설명할 내용이 없어요.');
      return;
    }

    const q = `다음 요약 항목을 자세히 설명해줘. 소제목(배경/핵심/영향/추가로 알아두면)으로 2~3문장씩:\n"${topic}"`;

    try {
      setIsLoading(true);
      const resp = await api.ask(`[detail] ${q}`);

      // 카드 메시지로 추가
      const detailMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        type: 'card',
        payload: resp,
        createdAt: Date.now(),
      };
      setMessages(prev => [...prev, detailMsg]);

      speak(getSimpleTTS(resp) || '자세히 설명을 시작할게요.');
      await handleAiResponse(resp);
    } catch (error) {
      console.error('자세히 요청 실패:', error);
      speak('자세히 설명을 불러오는데 문제가 있어요.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedIndex, summaryBullets, handleAiResponse, speak]);

  // 불릿 클릭 시 해당 인덱스로 상세
  function onBulletClick(i: number) {
    setSelectedIndex(i);
    handleDetail(i);
  }

  // 점자 출력 핸들러들
  const handleNext = braille.next;
  const handleRepeat = braille.repeat;
  const handleStop = braille.pause;

  // 음성 명령 매핑 (STT 상위 연결시 onSpeech 호출하면 동작)
  const { onSpeech: _onSpeech } = useVoiceCommands({
    next: handleNext,
    repeat: handleRepeat,
    pause: handleStop,
    brailleOn: () => braille.setEnabled(true),
    brailleOff: () => braille.setEnabled(false),
    detail: handleDetail,
  });
  // TODO: ChatLikeInput 내부 STT에서 transcript를 상위로 전달하도록 바꾸면
  // onSpeech(transcript) 를 여기서 호출 가능

  async function handleSubmit(userText: string) {
    // 유저 메시지 추가
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      type: 'text',
      text: userText,
      createdAt: Date.now(),
    };
    setMessages(p => [...p, userMsg]);

    setIsLoading(true);
    const typingId = crypto.randomUUID();
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
      // AI API 호출
      const response: ChatResponse = await api.ask(userText);

      // typing indicator 제거
      setMessages(p => p.filter(m => m.id !== typingId));

      // 공통 처리(키워드 큐, 불릿 추출)
      await handleAiResponse(response);

      // AI 응답을 카드 메시지로 추가
      const cardMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        type: 'card',
        payload: response,
        createdAt: Date.now(),
      };
      setMessages(p => [...p, cardMsg]);

      // TTS로 읽기
      const tts = getSimpleTTS(response);
      if (tts) {
        speak(tts);
      }
    } catch (error) {
      // typing indicator 제거
      setMessages(p => p.filter(m => m.id !== typingId));

      // 에러 메시지 추가
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        type: 'text',
        text: '죄송합니다. AI 응답을 생성하는 중 오류가 발생했습니다.',
        createdAt: Date.now(),
      };
      setMessages(p => [...p, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 상단 컨트롤 바 */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={isConnected ? disconnect : connect}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              isConnected
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            } transition-colors`}
            aria-pressed={isConnected}
          >
            {isConnected ? '연결됨' : '연결'}
          </button>

          <label className="flex items-center gap-2 ml-2">
            <input
              type="checkbox"
              checked={braille.enabled}
              onChange={(e) => braille.setEnabled(e.target.checked)}
              className="w-4 h-4 text-primary"
              aria-label="점자 출력 토글"
            />
            <span className="text-sm font-medium text-fg">점자 출력</span>
          </label>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleDetail()}
              disabled={!summaryBullets.length}
              className="px-2 py-1 rounded bg-green-100 text-green-700 text-sm hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="선택된 항목 자세히 설명"
            >
              자세히
            </button>
            <button
              onClick={() => braille.enqueueKeywords(['경제', '기술', '스포츠'])}
              className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm hover:bg-blue-200 transition-colors"
              aria-label="데모 키워드 점자 출력"
            >
              키워드 점자 출력
            </button>
            <button
              onClick={handleRepeat}
              disabled={!braille.queue.length}
              className="px-2 py-1 rounded bg-slate-100 text-sm hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="현재 키워드 다시 출력"
            >
              ⟳ 반복
            </button>
            <button
              onClick={handleNext}
              disabled={!braille.queue.length}
              className="px-2 py-1 rounded bg-slate-100 text-sm hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="다음 키워드 출력"
            >
              ▶ 다음
            </button>
            <button
              onClick={handleStop}
              disabled={!braille.queue.length}
              className="px-2 py-1 rounded bg-slate-100 text-sm hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="점자 출력 정지"
            >
              ■ 정지
            </button>
          </div>
        </div>

        {/* 키워드 칩 */}
        {braille.queue.length > 0 && (
          <div className="flex items-center gap-4 mt-3">
            <div className="text-sm text-muted font-medium">핵심 키워드</div>
            <div className="flex gap-3">
              {braille.queue.map((w, i) => (
                <button
                  key={w + i}
                  onClick={() => {
                    braille.setEnabled(true);
                    braille.setIndexTo(i);
                  }}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                    i === braille.index
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-300 text-slate-700 hover:border-primary hover:bg-primary/5'
                  }`}
                  aria-current={i === braille.index}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 점자 출력 패널 */}
        {braille.enabled && <BraillePanel braille={braille} />}
      </div>

      {/* 메시지 리스트 */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m) => {
          if (m.type === 'text') {
            // 타이핑 인디케이터
            if (m.text === '__typing__') {
              return (
                <MessageBubble key={m.id} role="assistant">
                  <span className="inline-flex gap-1" aria-label="답변 생성 중">
                    <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:120ms]" />
                    <span className="w-2 h-2 rounded-full bg-muted animate-bounce [animation-delay:240ms]" />
                  </span>
                </MessageBubble>
              );
            }
            // 일반 텍스트 메시지
            return <MessageBubble key={m.id} role={m.role} text={m.text} />;
          }

          // 카드 타입 메시지
          return (
            <div key={m.id} className="my-2">
              <SummaryCard data={m.payload} onBulletClick={onBulletClick} />
            </div>
          );
        })}
      </div>

      {/* 하단 입력바 */}
      <ChatLikeInput onSubmit={handleSubmit} />
    </div>
  );
}
