import React, { useState } from "react";
import BrailleToggle from "./BrailleToggle";

interface MobileShellProps {
  title?: string;
  /** 헤더에 브라유 토글을 표시할지 */
  brailleToggle?: boolean;
  /** 제어형 토글 상태 (선택) */
  brailleOn?: boolean;
  /** 제어형 토글 핸들러 (선택) */
  onBrailleToggle?: (v: boolean) => void;
  /** 우측 커스텀 헤더 콘텐츠 (선택) */
  headerRight?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export default function MobileShell({
  title,
  brailleToggle = false,
  brailleOn,
  onBrailleToggle,
  headerRight,
  className = "",
  children,
}: MobileShellProps) {
  // 제어형이 아니면 내부 상태로 동작
  const [localOn, setLocalOn] = useState(false);
  const isOn = typeof brailleOn === "boolean" ? brailleOn : localOn;
  const handleToggle = (v: boolean) => {
    if (onBrailleToggle) onBrailleToggle(v);
    else setLocalOn(v);
  };

  return (
    <div className={`min-h-screen bg-white ${className}`}>
      {/* Header */}
      <header
        role="banner"
        className={`
          h-16 sticky top-0 z-50
          bg-brand-900 text-white
          bg-gray-900  /* fallback */
          flex items-center justify-between px-4
        `}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <h1 className="text-xl font-bold text-white m-0">
          {title || "점글이"}
        </h1>

        <div className="flex items-center gap-3">
          {headerRight}
          {brailleToggle && (
            <BrailleToggle on={isOn} onChange={handleToggle} />
          )}
        </div>
      </header>

      {/* Content */}
      <main
        role="main"
        className="max-w-md mx-auto px-4 py-6 pb-24"
        style={{ paddingBottom: "max(6rem, env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>
    </div>
  );
}
