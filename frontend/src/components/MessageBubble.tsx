import { ReactNode } from "react";
import clsx from "clsx";

export type BubbleRole = "user" | "assistant" | "system";

export type MessageBubbleProps = {
  role: BubbleRole;
  children?: ReactNode;
  text?: string;
  className?: string;
};

export function MessageBubble({ role, children, text, className }: MessageBubbleProps) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";
  const isSystem = role === "system";

  return (
    <div
      role="article"
      data-role={role}
      aria-label={isUser ? "사용자 메시지" : isAssistant ? "도우미 메시지" : "시스템 메시지"}
      aria-live={isAssistant ? "polite" : undefined}
      aria-atomic={isAssistant ? true : undefined}
      className={clsx("w-full flex", isUser ? "justify-end" : "justify-start", className)}
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
    </div>
  );
}

export default MessageBubble;
