import React, { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { askChatWithKeywords, type ChatResponse, normalizeAnswer } from "@/lib/api";
import type { ChatMessage } from "@/types";
import { useTTS } from "@/hooks/useTTS";
import { useBraillePlayback } from "@/hooks/useBraillePlayback";
import type { ChatMode } from "@/types";
// (선택) SSE 스트리밍이 있다면 readSSE 사용 가능
// import { readSSE } from "@/lib/sse";
// import SummaryCard from "@/components/SummaryCard"; // 요약 카드 컴포넌트 쓰려면 주석 해제

export default function AIAssistant() {
  const [brailleOn, setBrailleOn] = useState(false);
  const [currentMode, setCurrentMode] = useState<ChatMode>("qa");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // TTS
  const { speak, stop, isSpeaking } = useTTS();

  // 점자 재생
  const braille = useBraillePlayback();
  // 외부 토글과 훅의 enabled를 동기화
  useEffect(() => {
    braille.setEnabled(brailleOn);
  }, [brailleOn]); // eslint-disable-line react-hooks/exhaustive-deps

  // 응답을 읽어줄 텍스트 생성
  const buildSpeakText = useCallback((res: ChatResponse | null) => {
    if (!res) return "";
    if (res.actions?.simple_tts || (res as any).simple_tts) {
      // 과거/다른 스펙 호환: actions.simple_tts 또는 top-level simple_tts
      return (res.actions?.simple_tts || (res as any).simple_tts) as string;
    }
    const answerText = normalizeAnswer(res);
    if (answerText) {
      // '• ' 불릿을 읽을 수 있게 줄바꿈 제거
      const bullets = answerText
        .split("\n")
        .filter((l) => l.trim().startsWith("•"))
        .map((l) => l.replace(/^•\s*/, "").trim());
      if (bullets.length) return bullets.join(". ");
    }
    // 그래도 없으면 간단 안내
    return "응답을 확인했습니다.";
  }, []);

  const handleAsk = useCallback(async () => {
    const q = query.trim();
    if (!q || isLoading) return;

    // 이전 요청 취소
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setIsLoading(true);
    setErrorText(null);
    setResponse(null);
    stop(); // TTS 중지

    // Add user message to history
    const userMessage: ChatMessage = { id: Date.now().toString(), role: "user", type: "text", text: q, createdAt: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setQuery(""); // Clear input

    try {
      // Use askChatWithKeywords to get both answer and keywords
      const result = await askChatWithKeywords(q);
      setResponse({ answer: result.answer, keywords: result.keywords, ok: true });

      // Add assistant response to history
      const assistantMessage: ChatMessage = { 
        id: Date.now().toString(), 
        role: "assistant", 
        type: "text", 
        text: result.answer,
        keywords: result.keywords,
        createdAt: Date.now() 
      };
      setMessages([...newMessages, assistantMessage]);

      // 점자 출력은 사용자가 직접 버튼을 눌렀을 때만 실행

      // 간단 음성 안내
      const speakText = buildSpeakText({ answer: result.answer, keywords: result.keywords });
      if (speakText) speak(speakText);
    } catch (err: any) {
      if (err?.name === "AbortError") return; // 사용자가 새로 요청
      console.error("[AIAssistant] ask error:", err);
      
      const raw = err?.message || "";
      const friendly = raw.replace(/^HTTP \d+:\s*[^-]+-\s*/i, ""); // http.ts prefix 제거
      setErrorText(friendly || "요청에 실패했습니다.");
      
      // Set error response
      const errorResp = { answer: `오류: ${friendly || "서버 오류"}` };
      setResponse(errorResp);
      
      // Add error message to history
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        type: "text",
        text: `오류: ${friendly || "서버 오류"}`,
        createdAt: Date.now()
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [query, currentMode, isLoading, brailleOn, braille, speak, stop, buildSpeakText, messages]);

  // 다시 읽기(TTS)
  const repeat = useCallback(() => {
    if (!response) return;
    const txt = buildSpeakText(response);
    if (txt) {
      stop();
      speak(txt);
    }
  }, [response, speak, stop, buildSpeakText]);

  // 학습(키워드 점자 출력 큐 적재 + 복습 노트 저장 + 복습 모드로 이동)
  const learn = useCallback(async () => {
    const kws = response?.keywords || [];
    if (!kws.length) return;
    
    try {
      // 1. 키워드를 복습 노트에 저장
      for (const keyword of kws) {
        await fetch('/api/learning/save/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: 'keyword',
            payload: {
              type: 'keyword',
              content: keyword,
              correct_answer: keyword,
              user_answer: '',
              cells: [], // 키워드 점자 변환은 나중에
              questionCells: [],
              timestamp: new Date().toISOString(),
              source: 'ai_assistant',
              query: query || ''
            }
          })
        });
      }
      
      // 2. 점자 출력 큐에 적재
      braille.enqueueKeywords(kws);
      if (brailleOn) braille.start();
      
      // 3. 복습 모드로 이동
      speak(`키워드 ${kws.length}개가 복습 노트에 저장되었습니다. 복습 모드로 이동합니다.`);
      
      // 4. 복습 모드로 페이지 이동
      setTimeout(() => {
        window.location.href = '/review';
      }, 2000); // 2초 후 이동
      
    } catch (error) {
      console.error('키워드 학습 저장 실패:', error);
      // 점자 출력은 그대로 진행
      braille.enqueueKeywords(kws);
      if (brailleOn) braille.start();
      speak('키워드 저장에 실패했습니다. 점자 출력만 진행합니다.');
    }
  }, [response?.keywords, braille, brailleOn, speak, query]);

  // Enter 전송
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAsk();
    } else if (e.key === "Escape") {
      abortRef.current?.abort();
      stop();
    }
  };

  return (
    <div className="screen">
      <div className="container-phone">
        {/* Header */}
        <div className="header-dark px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="h1">AI 어시스턴트</h1>
              <p className="text-gray-300">AI와 대화하며 정보 찾기</p>
            </div>
            <Link
              to="/explore"
              className="text-gray-300 hover:text-white transition-colors"
              aria-label="탐색으로 이동"
            >
              ← 탐색으로
            </Link>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 모드 선택 */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">모드 선택</h2>
            <div className="grid grid-cols-3 gap-3">
              {(["qa", "news", "explain"] as ChatMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setCurrentMode(m)}
                  className={`py-3 px-4 rounded-xl font-medium transition-colors ${
                    currentMode === m
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  aria-pressed={currentMode === m}
                >
                  {m === "qa" ? "💬 질문답변" : m === "news" ? "📰 뉴스" : "📖 설명"}
                </button>
              ))}
            </div>
          </div>

          {/* 질문 입력 */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">질문하기</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="무엇이 궁금하신가요?"
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={onKeyDown}
                aria-label="질문 입력"
                disabled={isLoading}
              />

              <div className="flex space-x-3">
                <button
                  onClick={handleAsk}
                  disabled={!query.trim() || isLoading}
                  className="btn-primary flex-1"
                >
                  {isLoading ? "처리 중..." : "🔍 질문하기"}
                </button>

                <button
                  onClick={() => setBrailleOn((v) => !v)}
                  className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all ${
                    brailleOn
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  aria-pressed={brailleOn}
                  aria-label="점자 출력 토글"
                  title="점자 출력 토글"
                >
                  <span className="text-2xl">📱</span>
                </button>
              </div>
            </div>

            {errorText && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800"
              >
                {errorText}
              </div>
            )}
          </div>

          {/* 채팅 히스토리 표시 */}
          {messages.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">대화 내역</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 응답 표시 */}
          {response && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">AI 응답</h3>

              {/* 요약 카드 컴포넌트로 대체 가능 */}
              {/* <SummaryCard data={response} /> */}

              <div className="space-y-4">
                {/* 간단 TTS 본문 */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-blue-900">
                    {response.actions?.simple_tts ||
                      (response as any).simple_tts ||
                      normalizeAnswer(response) ||
                      "응답을 확인했습니다."}
                  </p>
                </div>

                {/* 키워드 */}
                {response.keywords?.length ? (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">키워드</h4>
                    <div className="flex flex-wrap gap-2">
                      {response.keywords.map((keyword, idx) => (
                        <span
                          key={`${keyword}-${idx}`}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 카드 리스트 */}
                {Array.isArray((response as any).cards) && (response as any).cards.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800">관련 정보</h4>
                    {(response as any).cards.map(
                      (card: { title?: string; desc?: string; url?: string }, index: number) => (
                        <div
                          key={index}
                          className="bg-white border border-gray-200 rounded-xl p-4"
                        >
                          <h5 className="font-semibold text-gray-900">{card.title || "제목"}</h5>
                          {card.desc && <p className="text-gray-600 text-sm mt-1">{card.desc}</p>}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={repeat}
              disabled={!response}
              className="btn-ghost py-3"
              aria-disabled={!response}
            >
              {isSpeaking ? "⏸️ 다시 읽는 중..." : "🔊 다시 읽기"}
            </button>

            <button
              onClick={() => {
                const kws = response?.keywords || [];
                if (kws.length) {
                  braille.enqueueKeywords(kws);
                  if (brailleOn) braille.start();
                }
              }}
              disabled={!response?.keywords?.length}
              className="btn-secondary py-3"
              aria-disabled={!response?.keywords?.length}
            >
              ⠠⠃ 점자 출력
            </button>

            <button
              onClick={learn}
              disabled={!response?.keywords?.length}
              className="btn-accent py-3"
              aria-disabled={!response?.keywords?.length}
            >
              📚 학습하기
            </button>
          </div>

          {/* 점자 상태 표시 */}
          {brailleOn && (
            <div className="card bg-green-50 border-green-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📱</span>
                <div>
                  <h3 className="font-semibold text-green-800">점자 출력 활성화</h3>
                  <p className="text-sm text-green-600">
                    키워드가 연결된 점자 디스플레이로 전송됩니다
                    {braille.demoMode ? " (데모 모드)" : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 디버그(선택) */}
          {/* <pre className="text-xs text-gray-500">{JSON.stringify(braille, null, 2)}</pre> */}
        </div>
      </div>
    </div>
  );
}
