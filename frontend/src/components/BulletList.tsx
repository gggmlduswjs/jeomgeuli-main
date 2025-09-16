import React, { useMemo } from "react";
import TTSButton from "./TTSButton";

interface BulletListProps {
  bullets?: string[];
  className?: string;
}

const BulletList = React.memo(function BulletList({
  bullets = [],
  className = "",
}: BulletListProps) {
  // 공백/빈 항목 제거
  const items = useMemo(
    () => bullets.map(b => (b ?? "").trim()).filter(Boolean),
    [bullets]
  );

  if (items.length === 0) return null;

  return (
    <ul className={`space-y-3 ${className}`} role="list">
      {items.map((bullet, index) => (
        <li
          key={`${index}-${bullet}`}
          className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
        >
          <span
            aria-hidden
            className="w-2 h-2 bg-sky-500 rounded-full mt-2 flex-shrink-0"
          />
          <p className="text-gray-700 leading-relaxed flex-1">{bullet}</p>
          <TTSButton text={bullet} size="sm" />
        </li>
      ))}
    </ul>
  );
});

export default BulletList;
