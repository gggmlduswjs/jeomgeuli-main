// import React from "react";

interface KeywordChipsProps {
  items?: string[];
  className?: string;
}

export default function KeywordChips({
  items = [],
  className = "",
}: KeywordChipsProps) {
  if (!items.length) return null;

  return (
    <div
      className={`flex gap-2 flex-wrap ${className}`}
      role="list"
      aria-label="키워드 목록"
    >
      {items.map((k, idx) => (
        <span
          key={`${idx}-${k}`}
          role="listitem"
          className="px-3 py-1 rounded-xl bg-brand-100 text-brand-800 text-sm font-medium"
        >
          {k}
        </span>
      ))}
    </div>
  );
}
