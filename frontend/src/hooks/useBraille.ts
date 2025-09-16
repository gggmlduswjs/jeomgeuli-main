import { useEffect, useState } from "react";
import { convertBraille } from "@/lib/api";   // ✅ 백엔드 API 호출 함수 사용
import { normalizeCells } from "@/lib/brailleSafe"; // 셀 구조 정리 유틸

export default function useBraille(text: string, mode: "char" | "word" | "sentence" = "word") {
  const [cells, setCells] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!text) {
      setCells([]);
      setError(null);
      return;
    }

    let canceled = false;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ 백엔드 점자 변환 API 호출
        const result = await convertBraille(text, mode);
        if (canceled) return;

        const raw = result?.cells ?? result;
        const normalized = normalizeCells(raw);

        setCells(normalized);
        setError(result?.ok ? null : result?.error || "변환 실패");
      } catch (e: any) {
        console.error("점자 변환 오류:", e);
        if (!canceled) {
          setCells([]);
          setError("API 오류");
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    };

    run();
    return () => {
      canceled = true;
    };
  }, [text, mode]);

  return { cells, error, loading };
}
