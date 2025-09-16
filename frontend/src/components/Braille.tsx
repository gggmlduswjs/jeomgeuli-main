import React from "react";

interface BrailleCellProps {
  dots?: Array<number | boolean>; // 6칸, 0/1 또는 boolean
  className?: string;
}

const normalizeDots = (arr?: Array<number | boolean>): number[] => {
  const raw = Array.isArray(arr) ? arr : [];
  // 0/1로 정규화 + 길이 6로 pad/trim
  const toBit = (v: number | boolean) => (typeof v === "boolean" ? (v ? 1 : 0) : v ? 1 : 0);
  const norm = raw.slice(0, 6).map(toBit);
  while (norm.length < 6) norm.push(0);
  return norm as number[];
};

/**
 * 표준 점 배치: (grid-flow-col, rows=3)
 * 0 1 2 ↓  => 왼쪽 열: 1,2,3
 * 3 4 5 ↓     오른쪽 열: 4,5,6
 */
export const BrailleCell = React.memo(function BrailleCell({
  dots = [0, 0, 0, 0, 0, 0],
  className = "",
}: BrailleCellProps) {
  const d = normalizeDots(dots);

  return (
    <div
      role="group"
      aria-label="점자 셀"
      className={`w-[56px] h-[80px] grid grid-cols-2 grid-rows-3 grid-flow-col gap-2 rounded-xl bg-white shadow px-3 py-4 ${className}`}
    >
      {d.map((v, i) => (
        <div
          key={i}
          className={`w-5 h-5 rounded-full border ${
            v ? "bg-sky-500 border-sky-500 shadow-[0_2px_6px_rgba(2,132,199,.45)]" : "bg-gray-200 border-gray-300"
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
});

interface BrailleRowProps {
  cells?: Array<Array<number | boolean>>;
  className?: string;
}

export function BrailleRow({ cells = [], className = "" }: BrailleRowProps) {
  return (
    <div className={`flex flex-wrap gap-3 items-center ${className}`}>
      {cells.map((c, idx) => (
        <BrailleCell key={idx} dots={c} />
      ))}
    </div>
  );
}
