import React, { useEffect, useMemo, useState } from "react";
import AppShellMobile from "../components/AppShellMobile";
import BrailleCell from "../components/BrailleCell";
import { ensureCells } from "@/lib/braille";
import useTTS from "../hooks/useTTS";
import useSTT from "../hooks/useSTT";

export default function LearnFree() {
  const [text, setText] = useState("");

  // TTS/STT 훅
  const { speak } = useTTS();
  const { start, stop, isListening, transcript } = useSTT();

  // STT 결과를 입력에 반영
  useEffect(() => {
    if (transcript) setText(transcript);
  }, [transcript]);

  // 점자 셀 계산 (입력 변경 시)
  const cells = useMemo(() => ensureCells({ pattern: text }), [text]);

  const handleMic = () => {
    speak("말씀해 주세요.");
    start();
  };

  return (
    <AppShellMobile title="자유 변환" showBackButton>
      <div className="space-y-6 pb-24">
        {/* 입력 영역 */}
        <div className="card">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            문장을 입력하거나 마이크를 사용하세요
          </label>
          <input
            className="w-full p-3 border rounded-lg"
            placeholder="예) 안녕하세요"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="점자 변환 입력"
          />

          {/* 점자 미리보기 */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {cells.length ? (
              cells.map((cell, i) => <BrailleCell key={i} pattern={cell} />)
            ) : (
              <div className="text-sm text-gray-500">입력된 텍스트가 없습니다.</div>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-wrap gap-3">
          <button
            className="btn-primary"
            onClick={handleMic}
            disabled={isListening}
            aria-pressed={isListening}
            aria-label="음성 입력 시작"
          >
            {isListening ? "인식 중..." : "🎤 음성 입력"}
          </button>

          <button
            className="btn-secondary"
            onClick={() => speak(text || "읽을 내용이 없습니다.")}
            disabled={!text.trim()}
            aria-label="텍스트 읽어주기"
          >
            ▶ 읽어주기
          </button>

          {isListening && (
            <button className="btn-ghost" onClick={stop} aria-label="음성 인식 중지">
              중지
            </button>
          )}
        </div>

        {/* 텍스트 확인 */}
        {text && (
          <div className="card">
            <div className="text-sm text-gray-600 mb-2">입력된 텍스트</div>
            <div className="text-lg">{text}</div>
          </div>
        )}
      </div>
    </AppShellMobile>
  );
}
