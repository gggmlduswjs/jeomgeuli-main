import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, Mic, MicOff, Check, X } from "lucide-react";
// import { api } from "@/lib/http";
import { type Cell } from "@/lib/brailleSafe";
import { API_BASE } from "@/lib/api";
import useTTS from "../hooks/useTTS";

// 점자 셀 표시 컴포넌트 (퀴즈와 동일)
function Dot({ on }: { on: boolean }) {
  return <span className={`inline-block w-4 h-4 rounded-full mx-0.5 my-0.5 border-2 ${on ? "bg-primary border-primary shadow-sm" : "bg-card border-border"}`} />;
}
function CellView({ c }: { c: Cell }) {
  // 안전한 배열 구조분해할당
  const cellArray = Array.isArray(c) && c.length >= 6 ? c : [0,0,0,0,0,0];
  const [a,b,c2,d,e,f] = cellArray;
  
  return (
    <div className="inline-flex flex-col px-3 py-2 rounded-xl border border-border bg-white shadow-toss">
      <div className="flex"><Dot on={!!a}/><Dot on={!!d}/></div>
      <div className="flex"><Dot on={!!b}/><Dot on={!!e}/></div>
      <div className="flex"><Dot on={!!c2}/><Dot on={!!f}/></div>
    </div>
  );
}

// 🎯 STT 결과와 정답을 유연하게 매칭하는 함수 (퀴즈와 동일)
function isAnswerMatch(userInput: string, correctAnswer: string, item: any): boolean {
  const normalizedUser = userInput.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();
  
  // 1) 정확한 매칭
  if (normalizedUser === normalizedCorrect) return true;
  
  // 2) 자모 특별 처리: "기역" ↔ "ㄱ" 양방향 매칭
  const char = item.char?.trim();
  const name = item.name?.trim();
  
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

export default function Review() {
  const navigate = useNavigate();
  const { speak } = useTTS();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; answer: string }>(null);
  const [_completed, _setCompleted] = useState<number[]>([]);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // STT
  const [sttOn, setSttOn] = useState(false);
  const recRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 페이지 진입 시 자동 음성 안내
  useEffect(() => {
    const welcomeMessage = '복습 모드입니다. 이전에 틀린 문제들을 다시 복습해보세요.';
    
    const timer = setTimeout(() => {
      speak(welcomeMessage);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [speak]);

  // 데이터 로딩
  useEffect(() => {
    (async () => {
      // 1) 서버 목록 시도
      try {
        const j = await fetch(`${API_BASE}/learning/list/`).then(r => r.json());
        if (Array.isArray(j?.items) && j.items.length) {
          setItems(j.items); setLoading(false); return;
        }
      } catch {}

      // 2) 로컬 폴백
      const local = JSON.parse(localStorage.getItem('review:pending') || '[]');
      setItems(local.reverse()); // 최신 먼저
      setLoading(false);
    })();
  }, []);

  // STT 초기화
  useEffect(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r: any = new SR();
    r.lang = "ko-KR";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("").trim();
      setUserAnswer(t);
      setTimeout(() => onSubmit(t), 50);
    };
    r.onerror = (_e: any) => {
      setSttOn(false);
    };
    r.onend = () => setSttOn(false);
    recRef.current = r;
    return () => { try { r.abort(); } catch {} };
  }, []);

  const currentItem = items[currentIdx];
  const rawCells = currentItem?.payload?.cells || currentItem?.payload?.questionCells || [];
  
  // 점자 데이터 정규화: 안전한 배열 처리
  const cells: Cell[] = Array.isArray(rawCells) 
    ? rawCells.filter(cell => Array.isArray(cell) && cell.length === 6)  // 유효한 셀만 필터링
    : [];
  
  // 디버깅: 점자 데이터 확인
  console.log('[Review] Current item:', currentItem);
  console.log('[Review] Raw cells:', rawCells);
  console.log('[Review] Normalized cells:', cells);

  const startSTT = () => { 
    try { 
      recRef.current?.start(); 
      setSttOn(true); 
    } catch (e) {
      console.log('[Review] STT start error:', e);
    }
  };
  const stopSTT = () => { 
    try { 
      recRef.current?.stop();  
      setSttOn(false);
    } catch (e) {
      console.log('[Review] STT stop error:', e);
    }
  };

  // TTS는 useTTS 훅에서 가져옴

  const onSubmit = async (val?: string) => {
    if (!currentItem) return;
    const p = currentItem.payload ?? currentItem;
    const answer = p.expected?.trim() || "";
    const userAns = (val ?? userAnswer).trim();

    const ok = userAns.length > 0 && isAnswerMatch(userAns, answer, p);
    
    setResult({ ok, answer });
    setScore(prev => ({ 
      correct: prev.correct + (ok ? 1 : 0), 
      total: prev.total + 1 
    }));

    setTimeout(() => {
      setResult(null);
      setUserAnswer("");
      setShowAnswer(false);
      
      if (currentIdx + 1 < items.length) {
        setCurrentIdx(prev => prev + 1);
        inputRef.current?.focus();
      } else {
        // 복습 완료
        alert(`복습 완료! 정답률: ${Math.round((score.correct + (ok ? 1 : 0)) / (score.total + 1) * 100)}%`);
        navigate("/", { replace: true });
      }
    }, 1500);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") onSubmit();
  };

  const showAnswerNow = () => {
    setShowAnswer(true);
    const p = currentItem?.payload ?? currentItem;
    if (p?.expected) speak(p.expected);
  };

  if (loading) return <div className="p-4">불러오는 중…</div>;
  if (!items.length) return <div className="p-4">오늘은 복습할 항목이 없습니다.</div>;

  const progress = Math.round(((currentIdx + 1) / items.length) * 100);
  const p = currentItem?.payload ?? currentItem;

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
              <ArrowLeft className="w-6 h-6 text-fg" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-fg">복습 모드</h1>
              <div className="text-xs text-muted mt-1">
                {currentIdx + 1} / {items.length} (정답률: {score.total > 0 ? Math.round(score.correct / score.total * 100) : 0}%)
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

          {/* 문제 카드 */}
          <div className="bg-white rounded-2xl p-6 shadow-toss text-center">
            {/* 결과 배지 */}
            {result && (
              <div className="mb-4 w-full flex justify-center">
                <div className={`px-3 py-2 rounded-xl text-sm ${
                  result.ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                }`}>
                  {result.ok ? (
                    <><Check className="inline w-4 h-4 mr-1" />정답입니다!</>
                  ) : (
                    <><X className="inline w-4 h-4 mr-1" />오답입니다. 정답: {result.answer}</>
                  )}
                </div>
              </div>
            )}

            {/* 점자 셀 표출 */}
            <div className="mb-6 flex justify-center">
              {cells.length ? (
                <div className="inline-flex flex-wrap justify-center gap-3">
                  {cells.map((c, idx) => <CellView key={idx} c={c} />)}
                </div>
              ) : (
                <div className="text-muted text-sm py-8">
                  <div>점자 데이터 없음</div>
                  <div className="text-xs mt-2">
                    {currentItem?.payload?.content ? `내용: ${currentItem.payload.content}` : '데이터 없음'}
                  </div>
                </div>
              )}
            </div>

            {/* 답 표시 또는 입력 */}
            {showAnswer ? (
              <div className="text-2xl font-bold text-green-600 mb-4">
                {p?.expected || "정답 없음"}
              </div>
            ) : (
              <>
                <label className="block text-sm text-muted mb-2">정답 입력</label>
                <input
                  ref={inputRef}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="정확히 입력하세요"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={showAnswerNow}
                className="flex-1 px-4 py-3 rounded-2xl bg-accent text-white hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <RotateCcw className="inline w-4 h-4 mr-1" /> 답 보기
              </button>

              {/* 음성 입력 토글 */}
              <button
                onClick={sttOn ? stopSTT : startSTT}
                className={`px-4 py-3 rounded-2xl ${sttOn ? "bg-danger text-white" : "bg-card text-fg"} hover:bg-border focus:outline-none focus:ring-2 focus:ring-primary`}
                aria-pressed={sttOn}
                title="음성으로 정답 말하기"
              >
                {sttOn ? <><MicOff className="inline w-4 h-4 mr-1" /> 끄기</> : <><Mic className="inline w-4 h-4 mr-1" /> 음성 입력</>}
              </button>

              <button
                onClick={() => onSubmit()}
                disabled={!userAnswer.trim().length}
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