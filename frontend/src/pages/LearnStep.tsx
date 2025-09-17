// src/pages/LearnStep.tsx
import { useEffect, useMemo, useState, useRef } from "react";
import { ArrowLeft, SkipForward, RotateCcw } from "lucide-react";
import { convertBraille, fetchLearn } from '@/lib/api';
// import { api } from '@/api';
// import { asStr, asStrArr } from '@/lib/safe';
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import type { Cell as CellTuple } from "@/lib/brailleSafe";
import { normalizeCells } from "@/lib/brailleSafe";
import { localToBrailleCells } from "@/lib/braille";
import type { LessonItem } from "@/lib/normalize";
import type { LessonMode } from "@/store/lessonSession";
import { saveLessonSession } from "@/store/lessonSession";
import useTTS from '../hooks/useTTS';

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

type Item = LessonItem & {
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
  const [sp] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { speak, stop } = useTTS();

  // 경로(/learn/char|word|sentence) 우선, 없으면 ?mode=, 그래도 없으면 'char'
  const pathTail = pathname.split('/').pop() || '';
  const fromPath = (['char','word','sentence'] as LessonMode[]).includes(pathTail as any)
    ? (pathTail as LessonMode)
    : undefined;

  const mode = (fromPath || (sp.get('mode') as LessonMode) || 'char');

  const [title, setTitle] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState<number>(-1); // -1이면 아직 시작 전
  const [loading, setLoading] = useState(true);
  const current = useMemo(() => (idx >= 0 && idx < items.length ? items[idx] : null), [idx, items]);

  // 문항별 캐시 (Map)
  const cacheRef = useRef<Record<string, CellTuple[]>>({});

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setIdx(-1);
    (async () => {
      try {
        console.log("[LearnStep] Starting to fetch learn data for mode:", mode);
        const { title, items } = await fetchLearn(mode);
        if (!alive) return;
        
        console.log("[LearnStep] fetched", { title, items });
        setTitle(title);
        setItems(Array.isArray(items) ? items : []);
        // ✅ 로드되면 바로 0번 아이템부터 시작
        setIdx(items.length ? 0 : -1);
        saveLessonSession({ mode, items, createdAt: Date.now() });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [mode]);

  // 문제가 변경될 때마다 음성 재생
  useEffect(() => {
    if (current && idx >= 0) {
      // 이전 음성 중지
      stop();
      
      // 새 문제 음성 재생
      const ttsText = current.tts || current.name || current.char || current.word || current.sentence || '';
      if (ttsText) {
        const timer = setTimeout(() => {
          speak(ttsText);
        }, 300); // 0.3초 후 재생 (음성 중지 후)
        
        return () => clearTimeout(timer);
      }
    }
  }, [current, idx, speak, stop]);

  const heading = current?.word || current?.sentence || current?.char || current?.name || '';
  const key = `${mode}:${heading}`;

  // 비동기 셀 계산 (항목별 캐싱 + 취소)
  const [computed, setComputed] = useState<CellTuple[]>([]);
  useEffect(() => {
    if (!heading) { setComputed([]); return; }

    const cached = cacheRef.current[key];
    if (cached) { setComputed(cached); return; }

    let cancelled = false;
    (async () => {
      try {
        const res = await convertBraille(heading, 'word');
        const norm = normalizeCells(res.cells);
        if (!cancelled && norm.length) {
          cacheRef.current[key] = norm;
          setComputed(norm);
          return;
        }
      } catch {}

      try {
        const boolCells = localToBrailleCells(heading);
        const toTuple = (b:boolean[]): CellTuple => [b[0]?1:0,b[1]?1:0,b[2]?1:0,b[3]?1:0,b[4]?1:0,b[5]?1:0];
        const norm = boolCells.map((b: any) => toTuple(b));
        if (!cancelled) {
          cacheRef.current[key] = norm;
          setComputed(norm);
        }
      } catch { if (!cancelled) setComputed([]); }
    })();

    return () => { cancelled = true; };
  }, [key]);

  // 최종 cells 선택 (서버 제공 > 캐시/계산)
  const cells: CellTuple[] = useMemo(() => {
    if (!current) return [];
    if (Array.isArray(current.cells) && current.cells.length) return current.cells;
    if (Array.isArray(current.brailles) && current.brailles.length) return current.brailles;
    if (current.cell) return [current.cell];
    return cacheRef.current[key] || computed || [];
  }, [current, computed, key]);

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
  }, [idx, heading, current]);

  const onNext = () => {
    if (idx < items.length - 1) {
      // ✅ 함수형 업데이트로 오프바이원 방지
      setIdx((i) => i + 1);
    } else {
      // 마지막 → 퀴즈 자동 이동
      navigate(`/quiz?mode=${mode}`, { replace: true });
    }
  };
  const prev = () => setIdx(Math.max(0, idx - 1));
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
                {idx + 1} / {items.length}
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
              <span>{Math.round(((idx + 1) / items.length) * 100)}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((idx + 1) / items.length) * 100}%` }}
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
              disabled={idx === 0}
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
              onClick={onNext}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-primary text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={idx === items.length - 1 ? "테스트 시작" : "다음 항목"}
            >
              <span>{idx === items.length - 1 ? "테스트" : "다음"}</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
