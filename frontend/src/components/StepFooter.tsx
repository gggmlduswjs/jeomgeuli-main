// import React from "react";

interface StepFooterProps {
  onPrev?: () => void;
  onRepeat?: () => void;
  onNext?: () => void;
  isLast?: boolean;
}

export default function StepFooter({
  onPrev,
  onRepeat,
  onNext,
  isLast = false,
}: StepFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200">
      <div className="grid grid-cols-3 gap-2 p-4">
        {/* 이전 버튼 */}
        <button
          onClick={onPrev}
          disabled={!onPrev}
          className={`text-sm rounded-lg px-4 py-2 transition ${
            onPrev
              ? "bg-gray-800 text-white hover:bg-gray-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          aria-label="이전 단계로 이동"
        >
          이전
        </button>

        {/* 반복 버튼 */}
        <button
          onClick={onRepeat}
          disabled={!onRepeat}
          className={`text-sm rounded-lg px-4 py-2 transition ${
            onRepeat
              ? "bg-gray-800 text-white hover:bg-gray-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          aria-label="현재 단계 반복"
        >
          반복
        </button>

        {/* 다음/완료 버튼 */}
        <button
          onClick={onNext}
          disabled={!onNext}
          className={`text-sm rounded-lg px-4 py-2 font-medium transition ${
            onNext
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
          aria-label={isLast ? "마지막 단계 완료" : "다음 단계로 이동"}
        >
          {isLast ? "완료" : "다음"}
        </button>
      </div>
    </div>
  );
}
