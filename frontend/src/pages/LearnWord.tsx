// src/pages/LearnWord.tsx
import React, { useEffect, useMemo, useState } from "react";
import AppShellMobile from "../components/AppShellMobile";
import BrailleCell from "../components/BrailleCell";
import useTTS from "../hooks/useTTS";
import { localToBrailleCells } from "@/lib/braille";

type WordItem = {
  text: string;
  decompose?: string[];     // 음절/의미 분해 텍스트(선택)
  examples?: string[];      // 예문(선택)
};

const WORDS: WordItem[] = [
  { text: "학교", decompose: ["학", "교"], examples: ["나는 학교에 갑니다."] },
  { text: "기차", decompose: ["기", "차"], examples: ["기차를 타고 여행을 갔어요."] },
  { text: "사과", decompose: ["사", "과"], examples: ["사과 한 개를 먹었습니다."] },
  { text: "점자", decompose: ["점", "자"], examples: ["점자를 배워 봅시다."] },
  { text: "학습", decompose: ["학", "습"], examples: ["학습 계획을 세워요."] },
];

export default function LearnWord() {
  const [i, setI] = useState(0);
  const item = WORDS[i];
  const { speak } = useTTS();

  // 현재 단어를 점자 셀로 변환
  const cells = useMemo(() => localToBrailleCells(item.text), [item.text]);

  // 단어 변경 시 안내 음성
  useEffect(() => {
    speak(`${item.text}. 단어 학습을 시작합니다. 점자 패턴을 살펴보세요.`);
  }, [item.text, speak]);

  const handlePrev = () => setI((v) => Math.max(0, v - 1));
  const handleNext = () => setI((v) => Math.min(WORDS.length - 1, v + 1));
  const handleRepeat = () => speak(`${item.text}. 점자 패턴을 다시 안내합니다.`);

  const progress = Math.round(((i + 1) / WORDS.length) * 100);

  return (
    <AppShellMobile title="단어 학습" showBackButton>
      {/* 진행도 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-secondary">
            {i + 1} / {WORDS.length}
          </span>
          <span className="text-sm text-secondary">{progress}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="h-2 bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 단어 카드 */}
      <div className="card text-center space-y-4">
        <div>
          <div className="w-24 h-24 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{item.text}</span>
          </div>
          <h2 className="text-2xl font-bold text-fg">{item.text}</h2>
          {item.decompose && (
            <p className="text-secondary mt-1">{item.decompose.join(" + ")}</p>
          )}
        </div>

        {/* 점자 표시 */}
        <div className="bg-green-50 rounded-xl p-4">
          <h3 className="font-semibold text-green-800 mb-3">점자</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {cells.length ? (
              cells.map((pattern, idx) => <BrailleCell key={idx} pattern={pattern} />)
            ) : (
              <div className="text-sm text-secondary py-4">점자 변환 중…</div>
            )}
          </div>
        </div>

        {/* 예문 (선택) */}
        {item.examples && item.examples.length > 0 && (
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="font-semibold text-blue-800 mb-2">예문</h3>
            <ul className="text-blue-900 space-y-1 text-sm">
              {item.examples.map((ex, idx) => (
                <li key={idx}>• {ex}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 컨트롤 */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        <button onClick={handlePrev} disabled={i === 0} className="btn-ghost py-3">
          ⬅️ 이전
        </button>
        <button onClick={handleRepeat} className="btn-accent py-3">
          🔊 반복
        </button>
        <button
          onClick={handleNext}
          className="btn-primary py-3"
          aria-label={i === WORDS.length - 1 ? "완료" : "다음"}
        >
          {i === WORDS.length - 1 ? "완료" : "다음 ➡️"}
        </button>
      </div>
    </AppShellMobile>
  );
}
