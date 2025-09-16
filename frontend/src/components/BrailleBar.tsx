import React from "react";

type Cell = [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1];

const Dot = React.memo(function Dot({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full mx-1 my-1 border ${
        on ? "bg-blue-500 border-blue-500 shadow" : "bg-white border-gray-300"
      }`}
      aria-hidden={true}
    />
  );
});

const BrailleCell = React.memo(function BrailleCell({ cell }: { cell: Cell }) {
  const [d1, d2, d3, d4, d5, d6] = cell;
  return (
    <div
      className="inline-flex flex-col px-1 py-1 rounded-lg border bg-white mr-1"
      role="group"
      aria-label="점자 셀"
    >
      <div>
        <Dot on={!!d1} />
        <Dot on={!!d4} />
      </div>
      <div>
        <Dot on={!!d2} />
        <Dot on={!!d5} />
      </div>
      <div>
        <Dot on={!!d3} />
        <Dot on={!!d6} />
      </div>
    </div>
  );
});

export default function BrailleBar({ keywords = [] as string[] }: { keywords?: string[] }) {
  // TODO: 실제 한글 점자 매핑으로 교체 예정
  const keywordToCells = (keyword: string): Cell[] => {
    const length = keyword.length;
    const cells: Cell[] = [];
    for (let i = 0; i < Math.min(length, 3); i++) {
      cells.push([1, 0, 0, 0, 0, 0]); // placeholder
    }
    return cells;
  };

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-sm text-gray-500 mb-2">핵심 키워드</div>

      <div className="flex flex-wrap gap-2 mb-3">
        {keywords.map((k, idx) => (
          <span
            key={`${k}-${idx}`}
            className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm"
          >
            {k}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap">
        {keywords.map((keyword, idx) => {
          const cells = keywordToCells(keyword);
          return (
            <div key={`kw-${idx}`} className="mr-2">
              {cells.map((cell, cellIdx) => (
                <BrailleCell key={`cell-${idx}-${cellIdx}`} cell={cell} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
