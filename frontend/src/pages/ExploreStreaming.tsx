import React, { useCallback, useEffect, useRef, useState } from "react";
import AppShellMobile from "../components/AppShellMobile";
import MicButton from "../components/MicButton";
import BrailleToggle from "../components/BrailleToggle";
import KeywordChips from "../components/KeywordChips";
import useVoiceCommands from "../hooks/useVoiceCommands";
import { connectBraille, sendKeywords } from "@/lib/bleBraille";
import { readSSE } from "@/lib/sse";

type Msg = { id: string; role: "user" | "bot"; text: string };

export default function ExploreStreaming() {
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [brailleOn, setBrailleOn] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 새 메시지 렌더 시 맨 아래로 스크롤
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [msgs, isStreaming]);

  /** 유연한 스트리밍 청크 파서: 문자열/JSON(delta|text|keywords|done…) 모두 처리 */
  const appendBotText = useCallback((botId: string, piece: string) => {
    setMsgs((m) =>
      m.map((x) => (x.id === botId ? { ...x, text: (x.text || "") + piece } : x))
    );
  }, []);

  const handleChunk = useCallback(
    (botId: string, chunk: any) => {
      try {
        if (typeof chunk === "string") {
          appendBotText(botId, chunk);
          return;
        }
        // JSON 형태일 때
        if (typeof chunk === "object" && chunk) {
          if (typeof chunk.delta === "string") appendBotText(botId, chunk.delta);
          else if (typeof chunk.text === "string") appendBotText(botId, chunk.text);

          if (Array.isArray(chunk.keywords)) {
            const ks = chunk.keywords.filter(
              (s: unknown): s is string => typeof s === "string" && s.trim().length > 0
            );
            if (ks.length) setKeywords(ks);
          }
        }
      } catch (e) {
        // 파싱 실패 시 콘솔만 남기고 무시
        console.warn("[SSE] chunk handling error:", e, chunk);
      }
    },
    [appendBotText]
  );

  const ask = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isStreaming) return;

      // 이전 스트림 중단
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setIsStreaming(true);
      setKeywords([]);

      // 메시지 두 개(유저/봇자리) 추가하면서 botId 확보
      const userId = crypto.randomUUID();
      const botId = crypto.randomUUID();
      setMsgs((m) => [
        ...m,
        { id: userId, role: "user", text: content },
        { id: botId, role: "bot", text: "" },
      ]);

      try {
        await readSSE(
          // sse.ts가 API_BASE를 자동 프리픽스하므로 상대 경로만 넘깁니다
          "/chat/ask/stream",
          { prompt: content },
          (payload /* , meta */) => handleChunk(botId, payload),
          {
            signal: ctrl.signal,
            onOpen: () => {
              // 연결 시작
            },
            onError: (err) => {
              console.error("[SSE] onError:", err);
            },
            onClose: () => {
              setIsStreaming(false);
            },
          }
        );
      } catch (e) {
        console.error("[SSE] failed:", e);
        setIsStreaming(false);
        // 에러 메시지 출력
        setMsgs((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "bot",
            text: "죄송해요. 잠시 후 다시 시도해주세요.",
          },
        ]);
      }
    },
    [handleChunk, isStreaming]
  );

  const learn = () => {
    // 현재 keywords를 복습노트로 POST 등… (추후 API 연동)
    console.log("학습하기 - 키워드:", keywords);
  };

  const { onSpeech } = useVoiceCommands({
    next: () => {
      // TODO: 다음 카드 or 다음 키워드
    },
    repeat: () => {
      // TODO: 마지막 응답 재낭독 (TTS 훅과 연결 시)
    },
    brailleOn: () => setBrailleOn(true),
    brailleOff: () => setBrailleOn(false),
    learn,
  });

  // MicButton: 명령어면 onSpeech만, 아니면 ask
  const handleMic = async (text: string) => {
    const cmdMatched = /다음|이전|반복|멈춰|시작|학습하기|점자출력켜|점자출력꺼|점자켜|점자꺼/.test(
      text.replace(/\s/g, "")
    );
    if (cmdMatched) {
      onSpeech(text);
      return;
    }
    await ask(text);
  };

  const handleBrailleToggle = async (v: boolean) => {
    setBrailleOn(v);
    if (v) {
      try {
        const ok = await connectBraille();
        if (!ok) throw new Error("BLE 연결 실패");
        if (keywords.length) await sendKeywords(keywords);
      } catch (e) {
        alert("BLE 연결 실패");
        setBrailleOn(false);
      }
    } else {
      // 필요 시 BLE 해제 로직 추가
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    ask(q);
    setQ("");
  };

  return (
    <AppShellMobile title="정보 탐색 (스트리밍)">
      {/* 상단 제어 영역 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted">스트리밍으로 답변을 받아요</div>
        <BrailleToggle on={brailleOn} onChange={handleBrailleToggle} />
      </div>

      {/* 키워드 칩 */}
      {keywords.length > 0 && (
        <div className="mb-4">
          <KeywordChips items={keywords} />
        </div>
      )}

      {/* 대화 영역 */}
      <div ref={listRef} className="space-y-3 pb-40 min-h-[40vh]">
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`card ${
              m.role === "user" ? "bg-brand-900 text-ink-white ml-12" : "mr-12"
            }`}
            aria-live={m.role === "bot" ? "polite" : undefined}
          >
            {m.text || (m.role === "bot" && isStreaming ? "..." : "")}
          </div>
        ))}
      </div>

      {/* 입력 바 */}
      <form
        className="fixed bottom-20 left-1/2 -translate-x-1/2 container-phone px-5"
        onSubmit={onSubmit}
      >
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 rounded-2xl border border-ink-100 px-4 py-3"
            placeholder="질문을 입력하거나 마이크를 누르세요"
            disabled={isStreaming}
            aria-label="질문 입력"
          />
          <button className="btn-primary" disabled={!q.trim() || isStreaming}>
            {isStreaming ? "받는 중..." : "보내기"}
          </button>
          <MicButton onResult={handleMic} />
        </div>
      </form>
    </AppShellMobile>
  );
}
