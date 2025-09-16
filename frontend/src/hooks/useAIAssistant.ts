import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { askAI, type ChatResponse } from "@/lib/api";

/** 카드/키워드 UI에 맞춘 클라이언트 측 타입 */
export interface AICard {
  title: string;
  desc?: string;
  url?: string;
}

export interface UseAIAssistantOptions {
  /** 초기 질의어 (바로 실행하려면 provide) */
  initialQuery?: string;
  /** 마운트 시 자동 실행 여부 (initialQuery가 있을 때만) */
  immediate?: boolean;
  /** 디바운스(ms). 0이면 디바운스 없음 */
  debounceMs?: number;
  /** 호출 성공 시 콜백 */
  onSuccess?: (resp: ChatResponse) => void;
  /** 호출 실패 시 콜백 */
  onError?: (err: unknown) => void;
}

/** markdown에서 간단한 불릿 추출 (•, -, *, 1. / 1)) */
const extractBullets = (markdown: string): string[] => {
  const lines = String(markdown || "").split(/\r?\n/);
  const bulletRegex = /^\s*(?:•|-|\*|\d+[.)])\s+(.*)$/;
  const bullets = lines
    .map((l) => {
      const m = l.match(bulletRegex);
      return m ? m[1].trim() : "";
    })
    .filter(Boolean);

  if (bullets.length > 0) return bullets;

  // 불릿이 없으면 문장 분리로 앞 몇 개만
  const compact = String(markdown || "")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!compact) return [];
  return compact.split(/(?<=[.!?。…])\s+/).map(s => s.trim()).filter(Boolean).slice(0, 3);
};

export function useAIAssistant(options: UseAIAssistantOptions = {}) {
  const {
    initialQuery = "",
    immediate = true,
    debounceMs = 0,
    onSuccess,
    onError,
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [data, setData] = useState<ChatResponse | null>(null);
  const [cards, setCards] = useState<AICard[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const titleByMode = useMemo(
    () => (mode?: string) =>
      mode === "news" ? "뉴스" : mode === "explain" ? "설명" : "답변",
    []
  );

  const cleanupPending = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (debounceRef.current != null) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  };

  const run = useCallback(
    async (q: string) => {
      cleanupPending();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      setData(null);
      setCards([]);
      setKeywords([]);

      try {
        const resp = await askAI(q); // 백엔드 호출
        if (controller.signal.aborted) return;

        setData(resp);

        // 클라이언트 카드/키워드 구성
        const bullets = extractBullets(resp.chat_markdown || "");
        const derivedCards: AICard[] =
          bullets.length > 0
            ? bullets.map((b) => ({
                title: titleByMode(resp.mode)(resp.mode),
                desc: b,
              }))
            : [];

        setCards(derivedCards);
        setKeywords(Array.isArray(resp.keywords) ? resp.keywords : []);

        onSuccess?.(resp);
      } catch (e: any) {
        if (controller.signal.aborted) return;
        const msg = e?.message || "AI 요청 실패";
        setError(msg);
        onError?.(e);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          abortRef.current = null;
        }
      }
    },
    [onSuccess, onError, titleByMode]
  );

  const refetch = useCallback(
    (q?: string) => {
      const next = (q ?? query).trim();
      if (!next) {
        setError("질의어가 비어 있습니다.");
        return;
      }
      // 디바운스 처리
      cleanupPending();
      if (debounceMs > 0) {
        debounceRef.current = window.setTimeout(() => run(next), debounceMs);
      } else {
        run(next);
      }
    },
    [query, run, debounceMs]
  );

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      cleanupPending();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 마운트 시 즉시 실행 옵션
  useEffect(() => {
    if (immediate && initialQuery.trim()) {
      refetch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    /** 상태 */
    data,
    cards,
    keywords,
    loading,
    error,

    /** 제어 */
    query,
    setQuery,
    refetch, // refetch() or refetch("새 질의어")
    cancel: cleanupPending,
  };
}

export default useAIAssistant;
