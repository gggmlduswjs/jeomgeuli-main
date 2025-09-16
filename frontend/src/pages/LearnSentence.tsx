// pages/LearnSentence.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShellMobile from "../components/AppShellMobile";
import useTTS from "../hooks/useTTS";

type SentenceItem = {
  text: string;
  parts: { label: string; note?: string }[];
  examples: string[];
  // 데모용 점자 문자열(실점자는 백엔드/공통 변환기를 붙이세요)
  braille: string;
};

const SENTENCES: SentenceItem[] = [
  {
    text: "안녕하세요",
    parts: [
      { label: "안녕", note: "인사" },
      { label: "하세요", note: "존댓말" },
    ],
    examples: ['"안녕하세요, 선생님!"', '"안녕하세요, 처음 뵙겠습니다."'],
    braille: "⠁⠃⠉⠇⠁⠣⠕⠊",
  },
  {
    text: "좋은 하루예요",
    parts: [
      { label: "좋은" },
      { label: "하루예요" },
    ],
    examples: ['"오늘도 좋은 하루예요."', '"주말 좋은 하루 보내세요."'],
    braille: "⠒⠕⠦ ⠓⠁⠗⠕⠽⠕",
  },
];

export default function LearnSentence() {
  const { speak, stop } = useTTS();
  const [idx, setIdx] = useState(0);
  const item = SENTENCES[idx];

  const handlePrev = () => setIdx((i) => Math.max(0, i - 1));
  const handleNext = () => setIdx((i) => Math.min(SENTENCES.length - 1, i + 1));
  const handleRepeat = () =>
    speak(`${item.text}. 문장을 구성 요소로 나눠 볼게요. ${item.parts.map(p => p.label).join(", ")}.`);

  // 항목 바뀔 때 자동 안내(첫 진입 포함)
  useEffect(() => {
    handleRepeat();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  return (
    <AppShellMobile title="문장 학습" showBackButton>
      <div className="space-y-6">
        {/* 제목/문장 카드 */}
        <div className="card">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-fg mb-3">{item.text}</h2>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4">
              <div className="text-lg font-semibold">"{item.text}"</div>
              <div className="text-sm/relaxed opacity-90 mt-1">인사말/예문 학습</div>
            </div>
          </div>

          <div className="space-y-4">
            {/* 문장 분해 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-3">문장 분해</h3>
              <div className="grid grid-cols-2 gap-2">
                {item.parts.map((p, i) => (
                  <div key={i} className="bg-white px-3 py-2 rounded-lg text-center border">
                    <div className="text-sm font-bold">{p.label}</div>
                    {p.note && <div className="text-xs text-gray-500">{p.note}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* 점자(데모) */}
            <div className="bg-purple-50 rounded-xl p-4">
              <h3 className="font-semibold text-purple-800 mb-2">점자 (데모)</h3>
              <div className="text-lg font-mono text-purple-900 break-all">{item.braille}</div>
              <p className="mt-2 text-xs text-purple-700">
                실제 점자는 백엔드 점자 변환 API 또는 공통 변환 유틸을 연결해 표시하세요.
              </p>
            </div>

            {/* 예문 */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold text-blue-800 mb-2">사용 예시</h3>
              <div className="text-sm text-blue-900 space-y-1">
                {item.examples.map((ex, i) => (
                  <p key={i}>• {ex}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="grid grid-cols-3 gap-3">
          <button onClick={handlePrev} className="btn-ghost py-3" disabled={idx === 0} aria-disabled={idx === 0}>
            ⬅️ 이전
          </button>
          <button onClick={handleRepeat} className="btn-accent py-3">
            🔊 반복
          </button>
          <button
            onClick={handleNext}
            className="btn-primary py-3"
            disabled={idx === SENTENCES.length - 1}
            aria-disabled={idx === SENTENCES.length - 1}
          >
            {idx === SENTENCES.length - 1 ? "완료" : "다음 ➡️"}
          </button>
        </div>

        {/* 진행률 */}
        <div className="text-center">
          <div className="text-sm text-gray-500">
            진행률: {idx + 1}/{SENTENCES.length}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${((idx + 1) / SENTENCES.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 목록으로 */}
        <div className="text-center">
          <Link to="/learn" className="text-secondary hover:underline">
            ← 목록으로
          </Link>
        </div>
      </div>
    </AppShellMobile>
  );
}
