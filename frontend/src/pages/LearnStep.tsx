// src/pages/LearnStep.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, SkipForward, RotateCcw } from "lucide-react";
import { get } from "@/lib/http";
import api from "@/lib/api";
import { useLocation, useNavigate } from "react-router-dom";
import type { Cell as CellTuple } from "@/lib/brailleSafe";
import { normalizeCells } from "@/lib/brailleSafe";

function Dot({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-block w-4 h-4 rounded-full mx-0.5 my-0.5 border-2 transition-all duration-200 ${
        on ? "bg-primary border-primary shadow-sm" : "bg-card border-border"
      }`}
    />
  );
}

function CellView({ c }: { c: CellTuple }) {
  const [a, b, c2, d, e, f] = c || [0, 0, 0, 0, 0, 0];
  return (
    <div className="inline-flex flex-col px-3 py-2 rounded-xl border border-border bg-white shadow-toss hover:shadow-toss-lg transition-shadow">
      <div className="flex">
        <Dot on={!!a} />
        <Dot on={!!d} />
      </div>
      <div className="flex">
        <Dot on={!!b} />
        <Dot on={!!e} />
      </div>
      <div className="flex">
        <Dot on={!!c2} />
        <Dot on={!!f} />
      </div>
    </div>
  );
}

type Item = {
  char?: string;
  word?: string;
  sentence?: string;
  name?: string;
  tts?: string | string[];
  decomposeTTS?: string[];
  ttsIntro?: string;

  // 점자 데이터(서버가 주는 경우, 튜플 6개 기준)
  cell?: CellTuple;
  cells?: CellTuple[];
  braille?: CellTuple | string | string[]; // 유연성 유지
  brailles?: CellTuple[];

  examples?: string[];
};

export default function LearnStep() {
  const location = useLocation();
  const navigate = useNavigate();
  const mode: "char" | "word" | "sentence" =
    location.pathname.includes("/word")
      ? "word"
      : location.pathname.includes("/sentence")
      ? "sentence"
      : "char";

  const [items, setItems] = useState<Item[]>([]);
  const [i, setI] = useState(0);
  const [loading, setLoading] = useState(true);
  const current = items[i];

  const title =
    mode === "char" ? "자모 학습" : mode === "word" ? "단어 학습" : "문장 학습";

  // 학습 아이템 로딩: /learn/:mode → { items: Item[] } 형태 예상
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // 백엔드가 /learn/:mode를 제공한다고 가정
        const res = await get<{ items: Item[] }>(`/learn/${mode}`);
        setItems(Array.isArray(res?.items) ? res.items : []);
        setI(0);
      } catch (e) {
        console.error("[LearnStep] 학습 데이터 로딩 실패:", e);
        // 최소한의 안전장치(빈 배열)
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [mode]);

  // 점자 데이터가 없으면 서버 변환 → 실패 시 로컬 변환
  const [computed, setComputed] = useState<CellTuple[]>([]);
  useEffect(() => {
    const run = async () => {
      const text =
        current?.word ||
        current?.sentence ||
        current?.char ||
        current?.name ||
        "";
      const hasCells =
        (current?.cells && current.cells.length) ||
        (current?.brailles && current.brailles.length) ||
        current?.cell ||
        current?.braille;

      if (!text) {
        setComputed([]);
        return;
      }
      if (hasCells) {
        // 원본 데이터 우선
        setComputed([]);
        return;
      }

      // 1) 서버 변환 시도
      try {
        const res = await api.convertBraille(text, "word");
        const norm = normalizeCells(res?.cells);
        if (norm.length) {
          setComputed(norm);
          return;
        }
      } catch (e) {
        console.warn("[LearnStep] 서버 점자 변환 실패, 로컬 폴백 시도:", e);
      }

      // 2) 로컬 폴백
      try {
        const { localToBrailleCells } = await import("@/lib/brailleLocal");
        const boolCells = localToBrailleCells(text); // boolean[][]
        const toTuple = (b: boolean[]): CellTuple => [
          b[0] ? 1 : 0,
          b[1] ? 1 : 0,
          b[2] ? 1 : 0,
          b[3] ? 1 : 0,
          b[4] ? 1 : 0,
          b[5] ? 1 : 0,
        ];
        setComputed(boolCells.map(toTuple));
      } catch (e) {
        console.warn("[LearnStep] 로컬 점자 변환 실패:", e);
        setComputed([]);
      }
    };

    run();
  }, [current]);

  const heading =
    current?.word || current?.sentence || current?.char || current?.name || "";

  const cells: CellTuple[] = useMemo(() => {
    if (!current) return [];

    // 1. 서버가 준 표준 형태 우선
    if (Array.isArray(current.cells) && current.cells.length)
      return current.cells;
    if (Array.isArray(current.brailles) && current.brailles.length)
      return current.brailles;
    if (current.cell) return [current.cell];

    // 2. braille 필드가 뒤죽박죽일 때 정규화
    if (current.braille) {
      // string | string[] | CellTuple
      const norm = normalizeCells(current.braille as any);
      if (norm.length) return norm;
      // string[]이 “글자” 배열이라면 서버/로컬 변환으로 이미 computed에 반영됨
    }

    // 3. 최종 폴백: computed (서버 or 로컬 변환 결과)
    return computed || [];
  }, [current, computed]);

  // 간단 TTS
  const say = (t: string) => {
    try {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = "ko-KR";
      window.speechSynthesis.speak(u);
    } catch {}
  };

  useEffect(() => {
    let t = "";
    if (current?.decomposeTTS && Array.isArray(current.decomposeTTS)) {
      t = current.decomposeTTS.join(" ");
    } else if (current?.ttsIntro) {
      t = current.ttsIntro;
    } else if (Array.isArray(current?.tts)) {
      t = current.tts.join(" ");
    } else if (current?.tts) {
      t = current.tts;
    } else {
      t = heading;
    }
    if (t) say(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, heading, current]);

  const next = () => {
    if (i < items.length - 1) setI(i + 1);
    else navigate(`/quiz/${mode}?auto=1`); // 학습 끝 → 자동 퀴즈
  };
  const prev = () => setI(Math.max(0, i - 1));
  const repeat = () => {
    let t = "";
    if (current?.decomposeTTS && Array.isArray(current.decomposeTTS)) {
      t = current.decomposeTTS.join(" ");
    } else if (current?.ttsIntro) {
      t = current.ttsIntro;
    } else if (Array.isArray(current?.tts)) {
      t = current.tts.join(" ");
    } else if (current?.tts) {
      t = current.tts;
    } else {
      t = heading;
    }
    if (t) say(t);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-bg text-fg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-muted">불러오는 중…</div>
        </div>
      </div>
    );

  if (!current)
    return (
      <div className="min-h-screen bg-bg text-fg flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted">학습 항목이 없습니다.</div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-border shadow-toss">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate(-1)}
              className="p-3 rounded-2xl hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-6 h-6 text-fg" aria-hidden="true" />
            </button>

            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-fg">{title}</h1>
              <div className="text-xs text-muted mt-1">
                {i + 1} / {items.length}
              </div>
            </div>

            <div className="w-12"></div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* 진척도 바 */}
          <div className="bg-white rounded-2xl p-4 shadow-toss">
            <div className="flex justify-between text-sm text-muted mb-2">
              <span>진척도</span>
              <span>{Math.round(((i + 1) / items.length) * 100)}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((i + 1) / items.length) * 100}%` }}
              />
            </div>
          </div>

          {/* 안내 카드 */}
          <div className="bg-white rounded-2xl p-6 shadow-toss">
            <div className="text-sm text-primary font-medium mb-2">💡 학습 안내</div>
            <div className="text-lg leading-relaxed">
              {current?.decomposeTTS && Array.isArray(current.decomposeTTS)
                ? current.decomposeTTS.join(" ")
                : current?.ttsIntro
                ? current.ttsIntro
                : Array.isArray(current?.tts)
                ? current.tts.join(" ")
                : current?.tts || heading}
            </div>
            {!!current?.examples?.length && (
              <div className="text-sm text-muted mt-3 p-3 bg-card rounded-xl">
                <strong>예시:</strong> {current.examples.join(", ")}
              </div>
            )}
          </div>

          {/* 점자 표시 카드 */}
          <div className="bg-white rounded-2xl p-8 text-center shadow-toss">
            <div className="text-4xl font-bold text-fg mb-6">{heading}</div>
            <div className="inline-flex flex-wrap justify-center gap-3">
              {cells.length ? (
                cells.map((c, idx) => <CellView key={idx} c={c} />)
              ) : (
                <div className="text-muted text-sm py-8">
                  점자 데이터를 불러오는 중...
                </div>
              )}
            </div>
            {cells.length > 0 && (
              <div className="text-xs text-muted mt-4">{cells.length}개 점자 셀로 구성</div>
            )}
          </div>
        </div>
      </main>

      {/* 하단 액션 바 */}
      <div className="bg-white border-t border-border shadow-toss">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={prev}
              disabled={i === 0}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-card text-fg hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="이전 항목"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>이전</span>
            </button>

            <button
              onClick={repeat}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-accent text-white hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="다시 듣기"
            >
              <RotateCcw className="w-4 h-4" />
              <span>반복</span>
            </button>

            <button
              onClick={next}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={i === items.length - 1 ? "테스트 시작" : "다음 항목"}
            >
              <span>{i === items.length - 1 ? "테스트" : "다음"}</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
