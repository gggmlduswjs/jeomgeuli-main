import { ReactNode } from "react";
import clsx from "clsx";

export type BubbleRole = "user" | "assistant" | "system";

export type MessageBubbleProps = {
  role: BubbleRole;
  children?: ReactNode;
  text?: string;
  className?: string;
  keywords?: string[]; // 키워드 추가
  onBrailleOutput?: (keywords: string[]) => void; // 점자 출력 콜백 추가
};

export function MessageBubble({ 
  role, 
  children, 
  text, 
  className, 
  keywords = [], 
  onBrailleOutput 
}: MessageBubbleProps) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";
  const isSystem = role === "system";
  const hasKeywords = keywords.length > 0;

  return (
    <div
      role="article"
      data-role={role}
      aria-label={isUser ? "사용자 메시지" : isAssistant ? "도우미 메시지" : "시스템 메시지"}
      aria-live={isAssistant ? "polite" : undefined}
      aria-atomic={isAssistant ? true : undefined}
      className={clsx("w-full flex flex-col", isUser ? "items-end" : "items-start", className)}
    >
      <div
        dir="auto"
        className={clsx(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-6",
          "whitespace-pre-wrap break-words",
          isUser
            ? // user bubble
              "bg-primary text-white shadow-lg bg-sky-600"
            : isSystem
            ? // system bubble
              "bg-card text-fg border border-border shadow-card bg-amber-50 border-amber-200 text-amber-900"
            : // assistant bubble
              "bg-card text-fg border border-border shadow-card bg-white border-gray-200 text-gray-900"
        )}
      >
        {children ?? text}
      </div>
      
      {/* 점자 출력 버튼 - assistant 메시지에만 표시 */}
      {isAssistant && hasKeywords && onBrailleOutput && (
        <div className="mt-2 flex gap-2 items-center">
          <button
            onClick={() => onBrailleOutput(keywords)}
            className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-1"
            aria-label={`${keywords.join(", ")} 키워드 점자 출력`}
          >
            <span className="text-xs">⠠⠃</span>
            점자 출력 ({keywords.length}개)
          </button>
          <div className="text-xs text-gray-500 flex items-center">
            {keywords.slice(0, 2).join(", ")}{keywords.length > 2 && "..."}
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
