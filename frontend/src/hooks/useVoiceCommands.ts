import { useCallback } from "react";

type CommandHandlers = {
  next?: () => void;
  prev?: () => void;
  repeat?: () => void;
  pause?: () => void;
  start?: () => void;
  learn?: () => void;
  brailleOn?: () => void;
  brailleOff?: () => void;
  detail?: (idx?: number) => void; // 0-based index
};

/** 한글 서수/기수 매핑 (0-based index 반환) */
const KOREAN_ORDINAL_MAP: Record<string, number> = {
  "첫": 0, "첫째": 0, "첫번째": 0,
  "둘": 1, "두": 1, "둘째": 1, "두번째": 1,
  "셋": 2, "세": 2, "셋째": 2, "세번째": 2,
  "넷": 3, "네": 3, "넷째": 3, "네번째": 3,
  "다섯": 4, "다섯째": 4, "다섯번째": 4,
  "여섯": 5, "여섯째": 5, "여섯번째": 5,
  "일곱": 6, "일곱째": 6, "일곱번째": 6,
  "여덟": 7, "여덟째": 7, "여덟번째": 7,
  "아홉": 8, "아홉째": 8, "아홉번째": 8,
  "열": 9, "열째": 9, "열번째": 9,
};

/** 숫자 표현 → 0-based index */
function extractIndex(t: string): number | undefined {
  // 1) 한글 서수/기수
  for (const k of Object.keys(KOREAN_ORDINAL_MAP)) {
    if (t.includes(k)) return KOREAN_ORDINAL_MAP[k];
  }
  // 2) 숫자 + (번|번째)
  const m1 = t.match(/(\d+)\s*(번|번째)/);
  if (m1) {
    const n = parseInt(m1[1], 10);
    if (!Number.isNaN(n) && n > 0) return n - 1; // 0-based
  }
  // 3) 단독 숫자 (맥락상 detail일 때 자주 말함)
  const m2 = t.match(/\b(\d{1,2})\b/);
  if (m2) {
    const n = parseInt(m2[1], 10);
    if (!Number.isNaN(n) && n > 0) return n - 1;
  }
  return undefined;
}

/** 입력 전처리: 소문자, 공백 정규화, 기호 제거 */
function normalize(raw: string): string {
  return String(raw ?? "")
    .toLowerCase()
    .replace(/[~!@#$%^&*()_+=[\]{};:"/\\|<>“”‘’，､、。．·ㆍ…]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function useVoiceCommands(handlers: CommandHandlers) {
  const onSpeech = useCallback(
    (text: string) => {
      const t = normalize(text);
      if (!t) return;

      // ===== 우선순위 1: 멈춤/일시정지 =====
      if (/(멈춰|정지|스탑|일시\s*정지)/.test(t)) {
        console.log("Voice command: pause");
        return handlers.pause?.();
      }

      // ===== 우선순위 2: 다음/이전 =====
      if (/(다음|넘겨|다음으로|계속|진행)/.test(t)) {
        console.log("Voice command: next");
        return handlers.next?.();
      }
      if (/(이전|뒤로|이전으로|뒤로가기)/.test(t)) {
        console.log("Voice command: prev");
        return handlers.prev?.();
      }

      // ===== 우선순위 3: 반복 =====
      // '재생'은 start에도 쓰이므로 repeat은 '다시|반복' 위주로
      if (/(반복|다시( 말해| 읽어)?)/.test(t)) {
        console.log("Voice command: repeat");
        return handlers.repeat?.();
      }

      // ===== 우선순위 4: 시작/재개 =====
      // '재생'은 여기에서 처리 (pause보다 아래, repeat보다 아래)
      if (/(시작|계속|시작해|재생)/.test(t)) {
        console.log("Voice command: start");
        return handlers.start?.();
      }

      // ===== 우선순위 5: 도메인/토글 =====
      if (/(학습하기|학습|공부)/.test(t)) {
        console.log("Voice command: learn");
        return handlers.learn?.();
      }
      if (/(점자\s*출력\s*켜|점자\s*켜|점자\s*시작)/.test(t)) {
        console.log("Voice command: braille on");
        return handlers.brailleOn?.();
      }
      if (/(점자\s*출력\s*꺼|점자\s*꺼|점자\s*중지)/.test(t)) {
        console.log("Voice command: braille off");
        return handlers.brailleOff?.();
      }

      // ===== 우선순위 6: 자세히 (인덱스 파싱 포함) =====
      if (/(자세히|더 알려줘|자세하게)/.test(t) || /(번|번째)/.test(t)) {
        const idx = extractIndex(t);
        console.log("Voice command: detail", idx);
        return handlers.detail?.(idx);
      }

      // ===== 미인식 =====
      console.log("Voice command not recognized:", t);
    },
    [handlers]
  );

  return { onSpeech };
}
