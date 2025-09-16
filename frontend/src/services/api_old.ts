// src/services/api.ts
import { API_BASE } from "@/lib/http";
import { normalizeCells, type Cells } from "@/lib/brailleSafe";
import type { ChatResponse } from "@/lib/api";

/* ─────────────────────────────────────────
 * 공통 fetch 래퍼
 * ───────────────────────────────────────── */
async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function postJSON<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/* ─────────────────────────────────────────
 * 타입
 * ───────────────────────────────────────── */
export type LearnMode = "char" | "word" | "sentence";

export type LearnItem = {
  // 서버에서 오는 필드들(유연하게)
  char?: string;
  word?: string;
  sentence?: string;
  name?: string;
  cells?: Cells;
  brailles?: Cells;
  examples?: string[];
  tts?: string | string[];
  ttsIntro?: string;
  decomposeTTS?: string[];
};

export type LearnList = { items: LearnItem[] };

export type BrailleConvertResult = {
  ok?: boolean;
  cells?: unknown;       // 서버 포맷 다양성 고려
  error?: string;
};

export type AskAIParams = {
  q: string;
  mode?: string;
  topic?: string;
};

export type EnqueuePayload = {
  text?: string;
  braille?: unknown;
  segments?: unknown;
};

/* ─────────────────────────────────────────
 * 학습 데이터
 * (서버 없을 때를 대비해 안전한 폴백 포함)
 * ───────────────────────────────────────── */
export async function fetchChars(): Promise<LearnList> {
  try {
    return await getJSON<LearnList>("/learn/chars");
  } catch {
    // 폴백 더미
    return {
      items: [
        { char: "ㄱ", name: "기역", tts: "자음 기역입니다", examples: ["가", "거", "고"] },
        { char: "ㄴ", name: "니은", tts: "자음 니은입니다", examples: ["나", "너", "노"] },
      ],
    };
  }
}

export async function fetchWords(): Promise<LearnList> {
  try {
    return await getJSON<LearnList>("/learn/words");
  } catch {
    return {
      items: [
        { word: "학교", tts: "학교 입니다", examples: ["학교에 갑니다"] },
        { word: "가방", tts: "가방 입니다", examples: ["가방을 메다"] },
      ],
    };
  }
}

export async function fetchSentences(): Promise<LearnList> {
  try {
    return await getJSON<LearnList>("/learn/sentences");
  } catch {
    return {
      items: [
        { sentence: "안녕하세요", tts: "안녕하세요, 인사말입니다" },
        { sentence: "감사합니다", tts: "감사합니다, 감사 표현입니다" },
      ],
    };
  }
}

/* ─────────────────────────────────────────
 * 점자 변환
 * ───────────────────────────────────────── */
export async function convertBraille(
  text: string,
  mode: LearnMode = "word"
): Promise<BrailleConvertResult> {
  const res = await postJSON<BrailleConvertResult>("/braille/convert", { text, mode });
  // cells 포맷이 섞여 들어와도 항상 6비트 셀 배열로 맞춰 쓰기 쉽게 변환
  const cells = normalizeCells(res?.cells ?? []);
  return { ok: res.ok ?? true, cells, error: res.error };
}

/* ─────────────────────────────────────────
 * AI 질문/요약
 * ───────────────────────────────────────── */
export async function askAI(params: AskAIParams): Promise<ChatResponse> {
  const resp = await postJSON<ChatResponse>("/chat/ask", params);
  // 널 가드
  return {
    chat_markdown: resp.chat_markdown ?? "",
    keywords: resp.keywords ?? [],
    braille_words: resp.braille_words ?? [],
    mode: resp.mode ?? "qa",
    actions: resp.actions ?? {},
    meta: resp.meta ?? {},
    ok: resp.ok ?? true,
    error: resp.error,
  };
}

/* ─────────────────────────────────────────
 * 복습 큐 적재
 * ───────────────────────────────────────── */
export async function enqueueReview(
  kind: "braille" | "quiz" | string,
  payload: EnqueuePayload,
  source?: string
): Promise<{ ok: boolean }> {
  try {
    await postJSON("/review/enqueue", { kind, payload, source });
    return { ok: true };
  } catch {
    // 서버 엔드포인트 없을 때 로컬 저장 폴백
    const key = "review:pending";
    const prev = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([...prev, { kind, payload, source, ts: Date.now() }].slice(-200)));
    return { ok: true };
  }
}

/* ─────────────────────────────────────────
 * (옵션) SSE 스트리밍 래퍼 – 필요 시 사용
 * ───────────────────────────────────────── */
export async function askAIStream(
  body: AskAIParams,
  onText: (delta: string) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/ask/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = dec.decode(value);
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          // 서버 포맷에 맞게 조정 (예: data.delta, data.text 등)
          onText(typeof data === "string" ? data : (data.delta ?? data.text ?? ""));
        } catch {
          /* ignore parse errors on keepalive lines */
        }
      }
    }
  }
}
