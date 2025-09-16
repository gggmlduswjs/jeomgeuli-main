import { useCallback } from "react";

type CommandHandlers = {
  // 기본 제어
  next?: () => void;
  prev?: () => void;
  repeat?: () => void;
  pause?: () => void;
  start?: () => void;
  stop?: () => void;
  
  // 네비게이션
  home?: () => void;
  back?: () => void;
  menu?: () => void;
  
  // 학습 관련
  learn?: () => void;
  quiz?: () => void;
  review?: () => void;
  freeConvert?: () => void;
  
  // 정보탐색
  explore?: () => void;
  news?: () => void;
  weather?: () => void;
  
  // 점자 관련
  brailleOn?: () => void;
  brailleOff?: () => void;
  brailleConnect?: () => void;
  brailleDisconnect?: () => void;
  
  // 상세 정보
  detail?: (idx?: number) => void;
  help?: () => void;
  
  // TTS 관련
  speak?: (text: string) => void;
  mute?: () => void;
  unmute?: () => void;
  
  // 입력 관련
  clear?: () => void;
  submit?: () => void;
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

      // ===== 우선순위 1: 긴급 정지 =====
      if (/(멈춰|정지|스탑|일시\s*정지|중지)/.test(t)) {
        console.log("Voice command: stop");
        return handlers.stop?.() || handlers.pause?.();
      }

      // ===== 우선순위 2: 네비게이션 =====
      if (/(홈|메인|처음으로|홈으로)/.test(t)) {
        console.log("Voice command: home");
        return handlers.home?.();
      }
      if (/(뒤로|이전|뒤로가기|이전으로)/.test(t)) {
        console.log("Voice command: back");
        return handlers.back?.();
      }
      if (/(메뉴|목록|메뉴보기)/.test(t)) {
        console.log("Voice command: menu");
        return handlers.menu?.();
      }

      // ===== 우선순위 3: 페이지 이동 =====
      if (/(학습|학습하기|공부|점자\s*학습)/.test(t)) {
        console.log("Voice command: learn");
        return handlers.learn?.();
      }
      if (/(퀴즈|문제|테스트|시험)/.test(t)) {
        console.log("Voice command: quiz");
        return handlers.quiz?.();
      }
      if (/(복습|리뷰|다시\s*보기)/.test(t)) {
        console.log("Voice command: review");
        return handlers.review?.();
      }
      if (/(자유\s*변환|변환|점자\s*변환)/.test(t)) {
        console.log("Voice command: freeConvert");
        return handlers.freeConvert?.();
      }
      if (/(정보\s*탐색|탐색|검색|정보)/.test(t)) {
        console.log("Voice command: explore");
        return handlers.explore?.();
      }
      if (/(뉴스|뉴스\s*보기|오늘\s*뉴스)/.test(t)) {
        console.log("Voice command: news");
        return handlers.news?.();
      }
      if (/(날씨|날씨\s*보기|오늘\s*날씨)/.test(t)) {
        console.log("Voice command: weather");
        return handlers.weather?.();
      }

      // ===== 우선순위 4: 점자 제어 =====
      if (/(점자\s*출력\s*켜|점자\s*켜|점자\s*시작|점자\s*활성화)/.test(t)) {
        console.log("Voice command: braille on");
        return handlers.brailleOn?.();
      }
      if (/(점자\s*출력\s*꺼|점자\s*꺼|점자\s*중지|점자\s*비활성화)/.test(t)) {
        console.log("Voice command: braille off");
        return handlers.brailleOff?.();
      }
      if (/(점자\s*연결|점자\s*디스플레이\s*연결|블루투스\s*연결)/.test(t)) {
        console.log("Voice command: braille connect");
        return handlers.brailleConnect?.();
      }
      if (/(점자\s*해제|점자\s*디스플레이\s*해제|블루투스\s*해제)/.test(t)) {
        console.log("Voice command: braille disconnect");
        return handlers.brailleDisconnect?.();
      }

      // ===== 우선순위 5: 재생 제어 =====
      if (/(다음|넘겨|다음으로|계속|진행)/.test(t)) {
        console.log("Voice command: next");
        return handlers.next?.();
      }
      if (/(이전|이전으로|뒤로)/.test(t)) {
        console.log("Voice command: prev");
        return handlers.prev?.();
      }
      if (/(반복|다시( 말해| 읽어)?|재생)/.test(t)) {
        console.log("Voice command: repeat");
        return handlers.repeat?.();
      }
      if (/(시작|시작해|재개|계속해)/.test(t)) {
        console.log("Voice command: start");
        return handlers.start?.();
      }

      // ===== 우선순위 6: TTS 제어 =====
      if (/(음성\s*꺼|음성\s*중지|음성\s*멈춰|음성\s*비활성화)/.test(t)) {
        console.log("Voice command: mute");
        return handlers.mute?.();
      }
      if (/(음성\s*켜|음성\s*활성화|음성\s*시작)/.test(t)) {
        console.log("Voice command: unmute");
        return handlers.unmute?.();
      }

      // ===== 우선순위 7: 입력 제어 =====
      if (/(지워|삭제|초기화|다시\s*입력)/.test(t)) {
        console.log("Voice command: clear");
        return handlers.clear?.();
      }
      if (/(전송|제출|확인|입력)/.test(t)) {
        console.log("Voice command: submit");
        return handlers.submit?.();
      }

      // ===== 우선순위 8: 상세 정보 =====
      if (/(자세히|더\s*알려줘|자세하게|상세히)/.test(t) || /(번|번째)/.test(t)) {
        const idx = extractIndex(t);
        console.log("Voice command: detail", idx);
        return handlers.detail?.(idx);
      }
      if (/(도움말|도움|헬프|사용법|명령어)/.test(t)) {
        console.log("Voice command: help");
        return handlers.help?.();
      }

      // ===== 미인식 =====
      console.log("Voice command not recognized:", t);
      // 미인식된 명령어에 대한 피드백
      handlers.speak?.("죄송합니다. 인식하지 못했습니다. 다시 말씀해 주세요.");
    },
    [handlers]
  );

  return { onSpeech };
}
