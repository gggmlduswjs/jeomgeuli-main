// src/pages/Free.tsx
import React, { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import BrailleRow from "../components/BrailleRow";
import type { Cell as TupleCell } from "@/lib/brailleMap"; // 6튜플 타입
import { normalizeCells } from "@/lib/brailleSafe";

export default function Free() {
  const [text, setText] = useState("");
  const [cells, setCells] = useState<TupleCell[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = text.trim();

    // 입력 비었을 때 정리
    if (!trimmed) {
      abortRef.current?.abort();
      setCells([]);
      setError(null);
      setLoading(false);
      return;
    }

    // 이전 요청 취소
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    // 가벼운 디바운스 (타이핑 중 과호출 방지)
    const t = setTimeout(async () => {
      try {
        const res = await api.convertBraille(trimmed, "word", { signal: ctrl.signal });
        const raw = (res as any)?.cells ?? res;
        const normalized = normalizeCells(raw) as unknown as TupleCell[];
        setCells(normalized);
        if ((res as any)?.ok === false) {
          setError((res as any)?.error || "convert_failed");
        }
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error("Free convertBraille error:", e);
        setCells([]);
        setError(e?.message || "conversion_failed");
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [text]);

  // 실제 출력은 3셀까지만(UX), 화면 미리보기는 전체
  const chunkForOutput = cells.slice(0, 3);

  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="텍스트를 입력하세요"
        className="w-full rounded-2xl border px-4 py-3"
        aria-label="점자로 변환할 텍스트 입력"
      />

      {loading && (
        <div className="text-sm text-gray-500" role="status" aria-live="polite">
          점자 변환 중…
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600" role="alert">
          변환 실패: {error}
        </div>
      )}

      <section className="p-4 bg-white rounded-2xl border">
        <div className="text-sm text-gray-500 mb-2">전체 미리보기</div>
        <BrailleRow cells={cells as unknown as TupleCell[]} />
      </section>

      <section className="p-4 bg-white rounded-2xl border">
        <div className="text-sm text-gray-500 mb-2">출력(3셀)</div>
        <BrailleRow cells={chunkForOutput as unknown as TupleCell[]} />
      </section>
    </main>
  );
}
