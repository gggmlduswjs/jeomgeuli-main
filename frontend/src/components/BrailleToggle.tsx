import React from "react";

interface BrailleToggleProps {
  on: boolean;
  onChange: (v: boolean) => void;
}

export default function BrailleToggle({ on, onChange }: BrailleToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`px-3 py-2 rounded-xl border transition-colors ${
        on
          ? "bg-accent-500 text-white border-accent-600"
          : "bg-white text-gray-900 border-gray-200"
      }`}
    >
      점자출력 {on ? "ON" : "OFF"}
    </button>
  );
}
