import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { ArrowLeft, RotateCcw, Mic, MicOff } from "lucide-react";
import type { LessonItem } from "@/lib/normalize";
import type { LessonMode } from "@/store/lessonSession";
import { loadLessonSession, saveLessonSession } from "@/store/lessonSession";
import { convertBraille, fetchLearn, saveReview } from "@/lib/api";
import { normalizeCells, type Cell } from "@/lib/brailleSafe";
import { localToBrailleCells } from "@/lib/braille";

// 🧩 유틸: 어떤 형태로 와도 6튜플로 변환
function toTuple(x: any): Cell {
  // [1,0,0,0,0,0]
  if (Array.isArray(x) && x.length === 6) return x.map(v => (v ? 1 : 0)) as Cell;
  // {a,b,c,d,e,f}
  if (x && typeof x === "object" && "a" in x) {
    const { a,b,c,d,e,f } = x as any;
    return [a?1:0,b?1:0,c?1:0,d?1:0,e?1:0,f?1:0] as Cell;
  }
  // 비트마스크 0..63
  if (typeof x === "number") {
    const d = (n:number)=> ((x>>(n-1))&1) ? 1 : 0;
    return [d(1),d(2),d(3),d(4),d(5),d(6)] as Cell;
  }
  return [0,0,0,0,0,0] as Cell;
}
function cellsFromItem(it: any): Cell[] {
  // 단일 셀: [1,0,0,0,0,0] 형태
  if (it?.cell) {
    if (Array.isArray(it.cell) && it.cell.length === 6) {
      return [it.cell.map((v: any) => (v ? 1 : 0)) as Cell];
    }
    return [toTuple(it.cell)];
  }
  // 배열 셀들
  if (Array.isArray(it?.cells) && it.cells.length) {
    return it.cells.map(toTuple);
  }
  if (Array.isArray(it?.brailles) && it.brailles.length) {
    return it.brailles.map(toTuple);
  }
  return [];
}

/* ─ UI helpers (LearnStep과 동일 톤) ─ */
function Dot({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-block w-4 h-4 rounded-full mx-0.5 my-0.5 border-2 ${
        on ? "bg-primary border-primary shadow-sm" : "bg-card border-border"
      }`}
    />
  );
}
function CellView({ c }: { c: Cell }) {
  const [a, b, c2, d, e, f] = c || [0, 0, 0, 0, 0, 0];
  return (
    <div className="inline-flex flex-col px-3 py-2 rounded-xl border border-border bg-white shadow-toss">
      <div className="flex"><Dot on={!!a} /><Dot on={!!d} /></div>
      <div className="flex"><Dot on={!!b} /><Dot on={!!e} /></div>
      <div className="flex"><Dot on={!!c2}/><Dot on={!!f} /></div>
    </div>
  );
}

/* 정답/문제 텍스트 계산 규칙
   - 문제(점자 셀)는 글자 자체를 사용: char > word > sentence > text
   - 정답은 명칭/발음 우선: name > word > sentence > text > char
*/
const promptText = (it: LessonItem) =>
  it.char ?? it.word ?? it.sentence ?? (it as any).text ?? "";
const answerText = (it: LessonItem) =>
  (it as any).name ?? it.word ?? it.sentence ?? (it as any).text ?? it.char ?? "";

// 🎯 STT 결과와 정답을 유연하게 매칭하는 함수
function isAnswerMatch(userInput: string, correctAnswer: string, item: LessonItem): boolean {
  const normalizedUser = userInput.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();
  
  // 1) 정확한 매칭
  if (normalizedUser === normalizedCorrect) return true;
  
  // 2) 자모 특별 처리: "기역" ↔ "ㄱ" 양방향 매칭
  const char = item.char?.trim();
  const name = (item as any).name?.trim();
  
  if (char && name) {
    // "기역"이라고 말했는데 STT가 "ㄱ"으로 인식한 경우
    if ((normalizedUser === char.toLowerCase() && normalizedCorrect === name.toLowerCase()) ||
        // "ㄱ"이라고 말했는데 STT가 "기역"으로 인식한 경우  
        (normalizedUser === name.toLowerCase() && normalizedCorrect === char.toLowerCase())) {
      return true;
    }
  }
  
  // 3) 부분 매칭 (예: "기역"에서 "기"만 인식된 경우)
  if (normalizedCorrect.includes(normalizedUser) || normalizedUser.includes(normalizedCorrect)) {
    return true;
  }
  
  return false;
}

export default function Quiz() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { pathname } = useLocation();
  
  // 경로에서 mode 추출 (직접 진입 대비)
  const pathTail = pathname.split('/').pop() || '';
  const fromPath = (['char','word','sentence'] as LessonMode[]).includes(pathTail as any)
    ? (pathTail as LessonMode) : undefined;

  const mode = (fromPath || (sp.get("mode") as LessonMode) || (loadLessonSession()?.mode) || "char");

  const [pool, setPool] = useState<LessonItem[]>([]);
  const [i, setI] = useState(0);
  const [loading, setLoading] = useState(true);

  const [cells, setCells] = useState<Cell[]>([]);     // 문제로 보여줄 점자 셀
  const [user, setUser] = useState("");               // 사용자가 말하거나 입력한 값
  const [result, setResult] = useState<null | { ok: boolean; answer: string }>(null);

  // STT
  const [sttOn, setSttOn] = useState(false);
  const recRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 데이터 로딩: 세션 → 없으면 재요청
  useEffect(() => {
    let alive = true;
    (async () => {
      const sess = loadLessonSession();
      if (sess?.items?.length) {
        setPool(sess.items);
        setLoading(false);
        return;
      }
      try {
        const { items } = await fetchLearn(mode);
        if (!alive) return;
        setPool(items);
        saveLessonSession({ mode, items, createdAt: Date.now() });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [mode]);

  const cur = useMemo(() => (i < pool.length ? pool[i] : null), [i, pool]);

  // ✅ 문제 셀 계산: 아이템 데이터 ➜ (없으면) 변환 API ➜ (없으면) 로컬 폴백
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cur) { setCells([]); return; }

      console.log('[Quiz] Current item:', cur);
      console.log('[Quiz] Item cell:', cur.cell);
      console.log('[Quiz] Item cells:', cur.cells);
      console.log('[Quiz] Item brailles:', cur.brailles);

      // 0) 데이터에 이미 셀이 있으면 그걸로 끝
      const fromData = cellsFromItem(cur);
      console.log('[Quiz] Extracted cells from data:', fromData);
      if (fromData.length) { setCells(fromData); return; }

      // 1) 서버 변환 (404면 건너뜀)
      try {
        const res = await convertBraille(promptText(cur), mode);
        const norm = normalizeCells(res?.cells ?? []);
        if (!cancelled && norm.length) { setCells(norm.map(toTuple)); return; }
      } catch { /* ignore */ }

      // 2) 로컬 폴백 (한글 미지원이면 빈 배열이 올 수 있음)
      try {
        const bools = localToBrailleCells(promptText(cur)); // boolean[][]
        const tuples = bools.map(b => toTuple(b));
        if (!cancelled) setCells(tuples);
      } catch { if (!cancelled) setCells([]); }
    })();
    return () => { cancelled = true; };
  }, [cur, mode]);

  // STT 초기화
  useEffect(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    console.log('[Quiz] SpeechRecognition available:', !!SR);
    if (!SR) {
      console.log('[Quiz] SpeechRecognition not supported');
      return;
    }
    const r: any = new SR();
    r.lang = "ko-KR";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("").trim();
      console.log('[Quiz] STT result:', t);
      setUser(t);
      // 인식 끝나면 자동 제출(원하면 해제 가능)
      setTimeout(() => onSubmit(t), 50);
    };
    r.onerror = (e: any) => {
      console.log('[Quiz] STT error:', e.error);
      setSttOn(false);
    };
    r.onend = () => {
      console.log('[Quiz] STT ended');
      setSttOn(false);
    };
    recRef.current = r;
    return () => { try { r.abort(); } catch {} };
  }, []);

  const startSTT = () => { 
    try { 
      console.log('[Quiz] Starting STT...');
      recRef.current?.start(); 
      setSttOn(true); 
    } catch (e) {
      console.log('[Quiz] STT start error:', e);
    }
  };
  const stopSTT  = () => { 
    try { 
      console.log('[Quiz] Stopping STT...');
      recRef.current?.stop();  
      setSttOn(false);
    } catch (e) {
      console.log('[Quiz] STT stop error:', e);
    }
  };

  // TTS(다시 듣기: 문제 안내)
  const speak = (t: string) => {
    try { const u = new SpeechSynthesisUtterance(t); u.lang="ko-KR"; window.speechSynthesis.speak(u); } catch {}
  };
  const speakPrompt = () => {
    // "점자 문제입니다. 정답을 말하세요." 정도의 안내
    speak("점자 문제입니다. 정답을 말하거나 입력하세요.");
  };

  const onSubmit = async (val?: string) => {
    if (!cur) return;
    const answer = answerText(cur).trim();  // ex) '기역'
    const userAns = (val ?? user).trim();

    console.log('[Quiz] Answer check:', { userAns, answer, char: cur.char, name: (cur as any).name });

    // 🎯 유연한 매칭 사용
    const ok = userAns.length > 0 && isAnswerMatch(userAns, answer, cur);
    
    if (!ok) {
      await saveReview("wrong", {
        mode, expected: answer, user: userAns, idx: i,
        questionText: promptText(cur),
        questionCells: cells,             // ← 여기가 포인트
      });
    }

    setResult({ ok, answer });
    setTimeout(() => {
      setResult(null);
      setUser("");
      setI((x) => x + 1);
      if (i + 1 >= pool.length) nav("/review", { replace: true });
      else inputRef.current?.focus();
    }, 900);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") onSubmit();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-fg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-muted">퀴즈 준비 중…</div>
        </div>
      </div>
    );
  }
  if (!pool.length) {
    return (
      <div className="min-h-screen bg-bg text-fg flex items-center justify-center">
        <div className="text-center text-muted">퀴즈에 필요한 학습 데이터가 없습니다.</div>
      </div>
    );
  }

  const progress = Math.round(((i + 1) / pool.length) * 100);

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-border shadow-toss">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => nav(-1)}
              className="p-3 rounded-2xl hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-6 h-6 text-fg" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-fg">자모 퀴즈</h1>
              <div className="text-xs text-muted mt-1">
                {i + 1} / {pool.length} ({mode})
              </div>
            </div>
            <div className="w-12" />
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="flex-1 p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* 진행률 */}
          <div className="bg-white rounded-2xl p-4 shadow-toss">
            <div className="flex justify-between text-sm text-muted mb-2">
              <span>진척도</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* 문제 카드 (문자 대신 점자 셀!) */}
          <div className="bg-white rounded-2xl p-6 shadow-toss text-center">
            {/* 결과 배지: 독립 블록으로 중앙 정렬 → 셀을 밀지 않음 */}
            {result && (
              <div className="mb-4 w-full flex justify-center">
                <div className={`px-3 py-2 rounded-xl text-sm ${
                  result.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                }`}>
                  {result.ok ? "정답입니다!" : `오답입니다. 정답: ${result.answer}`}
                </div>
              </div>
            )}

            {/* 문제: 항상 '점자 셀'을 가운데 노출 */}
            <div className="mb-6 flex justify-center">
              {cells.length ? (
                <div className="inline-flex flex-wrap justify-center gap-3">
                  {cells.map((c, idx) => <CellView key={idx} c={c} />)}
                </div>
              ) : (
                <div className="text-muted text-sm py-8">점자 데이터를 불러오는 중…</div>
              )}
            </div>

            <label className="block text-sm text-muted mb-2">정답 입력(예: "디귿")</label>
            <input
              ref={inputRef}
              value={user}
              onChange={(e) => setUser(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="정확히 입력하세요"
              className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={speakPrompt}
                className="flex-1 px-4 py-3 rounded-2xl bg-accent text-white hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <RotateCcw className="inline w-4 h-4 mr-1" /> 다시 듣기
              </button>

              {/* 음성 입력 토글 */}
              <button
                onClick={sttOn ? stopSTT : startSTT}
                className={`px-4 py-3 rounded-2xl ${sttOn ? "bg-danger text-white" : "bg-card text-fg"} hover:bg-border focus:outline-none focus:ring-2 focus:ring-primary`}
                aria-pressed={sttOn}
                title="음성으로 정답 말하기(예: 디귿)"
              >
                {sttOn ? <><MicOff className="inline w-4 h-4 mr-1" /> 끄기</> : <><Mic className="inline w-4 h-4 mr-1" /> 음성 입력</>}
              </button>

              <button
                onClick={() => onSubmit()}
                disabled={!user.trim().length}
                className="flex-1 px-4 py-3 rounded-2xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                제출
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}