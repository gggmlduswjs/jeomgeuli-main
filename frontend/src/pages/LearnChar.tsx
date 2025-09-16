import { useEffect } from "react";
import AppShellMobile from "../components/AppShellMobile";
import BrailleGrid from "../components/BrailleGrid";
import useTTS from "../hooks/useTTS";

export default function LearnChar() {
  const { speak } = useTTS();

  // 현재 학습 글자(예: ㄱ)
  const letter = {
    char: "ㄱ",
    name: "기역",
    type: "자음 (초성/받침)",
    examples: ["가나", "거북", "기차"],
    // 6점 점자: 점1만 (ㄱ → "100000")
    pattern: "100000",
    index: 1,
    total: 40,
  };

  useEffect(() => {
    speak(
      `자모 학습. 오늘의 글자는 ${letter.char}, ${letter.name}입니다. 예시 단어: ${letter.examples.join(
        ", "
      )}.`
    );
  }, [speak]);

  const handleRepeat = () => {
    speak(
      `${letter.char}, ${letter.name}. 예시 단어: ${letter.examples.join(", ")}.`
    );
  };

  const handlePrev = () => {
    speak("이전 글자는 아직 연결되지 않았어요. 목록 화면에서 다른 글자를 선택해 주세요.");
  };

  const handleNext = () => {
    speak("다음 글자는 아직 연결되지 않았어요. 목록 화면에서 다른 글자를 선택해 주세요.");
  };

  const progressPct = Math.max(
    0,
    Math.min(100, Math.round((letter.index / letter.total) * 100))
  );

  return (
    <AppShellMobile title="자모 학습" showBackButton>
      <div className="space-y-6">
        {/* 헤더 카드 */}
        <div className="card text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <span className="text-4xl font-bold text-white" aria-hidden="true">
                {letter.char}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {letter.name}
            </h2>
            <p className="text-gray-600">{letter.type}</p>
          </div>

          <div className="space-y-4">
            {/* 예시 단어 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-2">예시 단어</h3>
              <div className="flex justify-center gap-3">
                {letter.examples.map((w) => (
                  <span
                    key={w}
                    className="bg-white px-3 py-2 rounded-lg border shadow-sm"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>

            {/* 점자 시각화 */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-semibold text-blue-800 mb-3">점자</h3>
              <div className="flex items-center justify-center">
                <BrailleGrid pattern={letter.pattern} label={`${letter.char} (${letter.name})`} />
              </div>
            </div>
          </div>
        </div>

        {/* 하단 컨트롤 */}
        <div className="grid grid-cols-3 gap-3">
          <button
            className="btn-ghost py-3"
            onClick={handlePrev}
            aria-label="이전"
          >
            ⬅️ 이전
          </button>
          <button
            className="btn-accent py-3"
            onClick={handleRepeat}
            aria-label="반복 재생"
          >
            🔊 반복
          </button>
          <button
            className="btn-primary py-3"
            onClick={handleNext}
            aria-label="다음"
          >
            다음 ➡️
          </button>
        </div>

        {/* 진행률 */}
        <div className="text-center">
          <div className="text-sm text-gray-500">
            진행률: {letter.index}/{letter.total}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2" aria-hidden="true">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="sr-only">진행률 {progressPct}%</span>
        </div>
      </div>
    </AppShellMobile>
  );
}
