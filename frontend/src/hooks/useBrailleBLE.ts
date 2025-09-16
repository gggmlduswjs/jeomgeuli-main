import { useCallback } from "react";
import type { Intent } from "../types/explore";

/**
 * 규칙 기반 간단 NLU Hook
 * - 명령(intent) 우선 → 도메인(intent) → fallback
 * - 정규식 매칭으로 조사/띄어쓰기 차이 대응
 */
export function useNLU() {
  const parse = useCallback((raw: string): Intent => {
    const t = raw.toLowerCase().trim();

    // ====== 명령어 우선 처리 ======
    if (/자세히/.test(t) || /더\s*자세/.test(t)) {
      return "detail";
    }
    if (/키워드.*(점자|출력)/.test(t)) {
      return "braille";
    }
    if (/다음(거|항목)?/.test(t)) {
      return "next";
    }
    if (/반복|다시( 읽어)?/.test(t)) {
      return "repeat";
    }
    if (/중지|그만|멈춰/.test(t)) {
      return "stop";
    }

    // ====== 도메인 처리 ======
    if (/날씨|기상|온도/.test(t)) {
      return "weather";
    }
    if (/뉴스/.test(t)) {
      return "news";
    }

    // ====== fallback ======
    return "generic";
  }, []);

  return { parse };
}

export default useNLU;
