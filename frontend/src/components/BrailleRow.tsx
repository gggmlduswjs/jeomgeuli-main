import React from "react";
import BrailleDots from "./BrailleDots";
import type { Cell } from "@/lib/brailleMap";

interface BrailleRowProps {
  cells?: Cell[];
  label?: string;
  className?: string;
}

export default function BrailleRow({
  cells = [],
  label = "점자 행",
  className = "",
}: BrailleRowProps) {
  return (
    <div
      className={`flex flex-wrap gap-3 items-center ${className}`}
      role="group"
      aria-label={label}
    >
      {cells.map((c, idx) => (
        <BrailleDots key={`cell-${idx}-${JSON.stringify(c)}`} cell={c} />
      ))}
    </div>
  );
}
