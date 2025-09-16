import React, { useMemo, useCallback } from "react";
import { FileText, Volume2, Clipboard, Share2 } from "lucide-react";
import { localToBrailleCells } from "../lib/braille";
import type { ChatResponse } from "../lib/api";
import { normalizeAnswer } from "../lib/api";

/** 확장형 SummaryCard Props */
interface SummaryCardProps {
  data: ChatResponse;
  className?: string;

  /** 불릿 클릭 시 */
  onBulletClick?: (index: number, bullet: string) => void;

  /** 키워드 점자 출력: 외부(BLE 등)로 보낼 때 사용 */
  onKeywordBraille?: (keyword: string, cells: boolean[][]) => void;

  /** 카드 전체 내용을 TTS로 말하기 */
  onSpeak?: (text: string) => void;

  /** 카드 전체 내용을 복사하기 (기본: 클립보드 복사) */
  onCopy?: (text: string) => void;

  /** 공유 버튼 동작 (선택) */
  onShare?: (payload: { text: string; mode: string; keywords: string[] }) => void;

  /** 우측 상단 액션 버튼 표시 여부 */
  showActions?: boolean;
}

/** markdown에서 불릿 추출 + 없으면 자동 생성 */
function extractBullets(markdown: string): string[] {
  const lines = String(markdown || "").split(/\r?\n/);

  // 불릿 패턴: •, -, *, 1. 1)
  const bulletRegex = /^\s*(?:•|-|\*|\d+[.)])\s+(.*)$/;

  const bullets = lines
    .map((line) => {
      const m = line.match(bulletRegex);
      return m ? m[1].trim() : "";
    })
    .filter(Boolean);

  if (bullets.length > 0) return bullets;

  // 불릿이 하나도 없으면 간이 요약(문장 분리 후 앞쪽 몇 개)
  const compact = String(markdown || "")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!compact) return [];

  // 문장 기준 잘라 상위 2~3개 정도만
  const sentences = compact.split(/(?<=[.!?。…])\s+/).map((s) => s.trim()).filter(Boolean);
  return sentences.slice(0, 3);
}

export default function SummaryCard({
  data,
  className = "",
  onBulletClick,
  onKeywordBraille,
  onSpeak,
  onCopy,
  onShare,
  showActions = true,
}: SummaryCardProps) {
  // 안전장치
  if (!data) {
    return (
      <div className="bg-white border border-border rounded-2xl p-6 shadow-toss">
        <p className="text-muted">요약 정보를 불러오는 중...</p>
      </div>
    );
  }

  const {
    keywords = [],
    mode = "qa",
    actions = {},
    meta = {},
  } = (data as any) ?? {};

  const answerText = normalizeAnswer(data);
  const bullets = useMemo(() => extractBullets(answerText), [answerText]);

  // 디버깅 로그 (개발 중에만)
  if (import.meta?.env?.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[SummaryCard] data=", data, "normalized answer=", answerText);
  }

  const titleText = mode === "news" ? "뉴스 요약" : mode === "explain" ? "설명" : "답변";
  const plainTextForActions = useMemo(() => {
    const header = `[${titleText}]`;
    const bulletText = bullets.length ? bullets.map((b, i) => `${i + 1}. ${b}`).join("\n") : answerText;
    const kw = Array.isArray(keywords) && keywords.length ? `\n\n# 키워드: ${keywords.join(", ")}` : "";
    return `${header}\n${bulletText}${kw}`.trim();
  }, [titleText, bullets, answerText, keywords]);

  // 키워드 점자 출력
  const handleKeywordClick = useCallback(
    (keyword: string) => {
      const k = String(keyword || "").trim();
      if (!k) return;
      try {
        const cells = localToBrailleCells(k);
        // Convert Cell[] to boolean[][]
        const booleanCells = cells.map(cell => cell.map(dot => dot === 1));
        onKeywordBraille?.(k, booleanCells);
      } catch (e) {
        console.warn("키워드 점자 변환 실패:", e);
      }
    },
    [onKeywordBraille]
  );

  // 불릿 키보드 트리거
  const bulletKeyHandler = useCallback(
    (index: number, bullet: string) =>
      (e: React.KeyboardEvent<HTMLLIElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onBulletClick?.(index, bullet);
        }
      },
    [onBulletClick]
  );

  // 기본 복사 동작
  const defaultCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      // noop
    }
  }, []);

  const handleSpeak = () => onSpeak?.(plainTextForActions);
  const handleCopy = () => (onCopy ? onCopy(plainTextForActions) : defaultCopy(plainTextForActions));
  const handleShare = () =>
    onShare?.({ text: plainTextForActions, mode, keywords: Array.isArray(keywords) ? keywords : [] });

  return (
    <div
      className={`bg-white border border-border rounded-2xl p-6 shadow-toss ${className}`}
      role="region"
      aria-label={`${mode} 모드 응답`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-fg">{titleText}</h3>
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSpeak}
              className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="요약 음성으로 듣기"
              title="음성으로 듣기"
            >
              <Volume2 className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-lg bg-muted/40 text-fg hover:bg-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="요약 복사"
              title="복사"
            >
              <Clipboard className="w-5 h-5" aria-hidden="true" />
            </button>
            {onShare && (
              <button
                type="button"
                onClick={handleShare}
                className="px-2.5 py-1.5 rounded-lg bg-muted/40 text-fg hover:bg-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="요약 공유"
                title="공유"
              >
                <Share2 className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 불릿 포인트 or 본문 */}
      {bullets.length > 0 ? (
        <div className="mb-6">
          <ul className="space-y-2" role="list">
            {bullets.map((bullet, index) => (
              <li
                key={`${index}-${bullet}`}
                className={`flex items-start gap-3 ${
                  onBulletClick ? "cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors" : ""
                }`}
                role="listitem"
                aria-label={`요약 ${index + 1}: ${bullet}`}
                tabIndex={onBulletClick ? 0 : -1}
                onClick={() => onBulletClick?.(index, bullet)}
                onKeyDown={onBulletClick ? bulletKeyHandler(index, bullet) : undefined}
              >
                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" aria-hidden="true" />
                <span className="text-fg leading-relaxed">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mb-6 text-fg leading-relaxed whitespace-pre-wrap">
          {answerText || "응답이 비어 있습니다. (네트워크/파서/렌더 경로를 확인해 주세요)"}
        </div>
      )}

      {/* 키워드 칩 */}
      {Array.isArray(keywords) && keywords.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-muted mb-3">핵심 키워드</h4>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <button
                key={`${index}-${keyword}`}
                type="button"
                onClick={() => handleKeywordClick(keyword)}
                className="
                  px-3 py-2 bg-primary/10 text-primary rounded-lg
                  border border-primary/20 hover:bg-primary/20
                  transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                "
                aria-label={`${keyword} 키워드 점자 출력`}
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 액션 힌트 */}
      {(actions as any)?.voice_hint && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted">
            <strong>음성 명령:</strong> {(actions as any).voice_hint}
          </p>
          {(actions as any).learn_suggestion && (
            <p className="text-sm text-muted mt-1">{(actions as any).learn_suggestion}</p>
          )}
        </div>
      )}

      {/* 출처 힌트 */}
      {(meta as any)?.source_hint && (
        <div className="text-xs text-muted text-center">{(meta as any).source_hint}</div>
      )}

      {/* 스크린 리더용 요약 텍스트 */}
      <div className="sr-only" aria-live="polite">
        요약 완료: {bullets.join(". ")}. 키워드: {Array.isArray(keywords) ? keywords.join(", ") : ""}
      </div>
    </div>
  );
}
