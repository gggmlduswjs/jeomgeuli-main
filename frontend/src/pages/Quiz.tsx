// src/pages/Quiz.tsx
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";                       // ✅ api 객체로 임포트
import { isCorrect } from "@/lib/grade";          // ✅ 확장자 제거
import { useParams, useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { normalizeCells, type Cell } from "@/lib/brailleSafe";

function Dot({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-block w-5 h-5 rounded-full mx-0.5 my-0.5 border-2 transition-all duration-200 ${
        on ? "bg-blue-600 border-blue-600 shadow-md" : "bg-gray-100 border-gray-300"
      }`}
    />
  );
}

function CellView({ c }: { c: Cell }) {
  const [a,b,c2,d,e,f] = c || [0,0,0,0,0,0];
  return (
    <div className="inline-flex flex-col px-3 py-2 rounded-lg border-2 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex">
        <Dot on={!!a}/><Dot on={!!d}/>
      </div>
      <div className="flex">
        <Dot on={!!b}/><Dot on={!!e}/>
      </div>
      <div className="flex">
        <Dot on={!!c2}/><Dot on={!!f}/>
      </div>
    </div>
  );
}

type Q = { text:string, gold:string|string[] };

function saveReview(items:any[], kind:string){
  const key = `review_${new Date().toISOString().slice(0,10)}`;
  const prev = JSON.parse(localStorage.getItem(key)||"[]");
  const add = items.map(x=>{
    const content = kind === 'char' ? x.char : kind === 'word' ? x.word : x.sentence;
    const gold = kind === 'char' ? [x.char, x.name] : kind === 'word' ? x.word : x.sentence;
    return { kind, content, gold };
  });
  localStorage.setItem(key, JSON.stringify(prev.concat(add)));
}

export default function Quiz(){
  const params = useParams<{ kind?: "char"|"word"|"sentence" }>();
  const kind = (params.kind ?? "char") as "char"|"word"|"sentence";
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation() as { state?: { items?: any[] } };

  // ✅ 학습 단계에서 전달된 데이터
  const src = location.state?.items ?? [];
  const qs = useMemo(() => src, [src]);

  const [idx,setIdx] = useState(0);
  const [ans,setAns] = useState("");
  const [wrong,setWrong] = useState<Q[]>([]);
  const cur = qs[idx];

  // ====== 가드: state 없이 직접 진입한 경우 ======
  if (!qs.length) {
    return (
      <main className="p-6 space-y-4 max-w-md mx-auto">
        <div className="card p-6 text-center">
          <p className="text-gray-700 mb-3">퀴즈에 필요한 학습 데이터가 없습니다.</p>
          <p className="text-sm text-gray-500 mb-6">학습을 먼저 진행한 뒤 퀴즈로 이동해주세요.</p>
          <Link to="/learn" className="btn-primary">학습으로 이동</Link>
        </div>
      </main>
    );
  }

  useEffect(()=>{ setAns(""); },[idx]);

  // Auto-start from learning mode
  useEffect(()=>{
    if (searchParams.get("auto")==="1") {
      const input = document.querySelector('input[placeholder*="정답"]') as HTMLInputElement | null;
      input?.focus();
    }
  },[searchParams]);

  const [cells,setCells] = useState<Cell[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 점자 변환
  useEffect(()=>{
    if (!cur) {
      setCells([]);
      setError("no_question_data");
      return;
    }
    const textToConvert = kind === 'char' ? cur.char : kind === 'word' ? cur.word : cur.sentence;
    if (!textToConvert) {
      setCells([]);
      setError("no_text_to_convert");
      return;
    }
    (async ()=>{
      try {
        const resp = await api.convertBraille(textToConvert, kind);   // ✅ api.convertBraille 사용
        const raw = (resp as any)?.cells ?? resp;
        const normalizedCells = normalizeCells(raw);
        setCells(normalizedCells);
        setError((resp as any)?.ok === false ? ((resp as any)?.error ?? "convert_failed") : null);
      } catch (e) {
        console.error("[Quiz] convertBraille error:", e);
        setCells([]);
        setError("conversion_failed");
      }
    })();
  },[cur, idx, kind]);

  const [result, setResult] = useState<string>("");
  const [showResult, setShowResult] = useState(false);

  const submit = ()=>{
    const correct = kind === 'char' ? cur.char : kind === 'word' ? cur.word : cur.sentence;
    const userAnswer = ans || "";

    // char 모드: 문자명(예: 기역)도 정답 허용
    const correctAnswers = kind === 'char' && cur.name ? [correct, cur.name] : [correct];

    const ok = isCorrect(userAnswer, correctAnswers);
    if(!ok){ setWrong(w=>w.concat([cur])); }
    setResult(ok ? "정답입니다!" : "오답입니다.");
    setShowResult(true);
  };

  const next = () => {
    setAns("");
    setResult("");
    setShowResult(false);
    if(idx+1<qs.length) {
      setIdx(idx+1);
    } else {
      if(wrong.length) saveReview(wrong, kind);
      nav("/review");
    }
  };

  return (
    <main className="p-6 space-y-4 max-w-md mx-auto">
      <div className="card p-4" aria-live="polite">문제 {idx+1} / {qs.length}</div>

      <div className="card p-6 flex gap-3 flex-wrap justify-center" aria-label="점자 문제">
        {cells.length > 0 ? (
          cells.map((c,i)=>(<CellView key={i} c={c}/>))
        ) : (
          <div className="text-center text-gray-500 p-4">
            <p>점자 변환 중...</p>
            {error && <p className="text-sm text-red-500 mt-2">변환 실패: {error}</p>}
          </div>
        )}
      </div>

      <div className="card p-4">
        <input
          className="input w-full mb-3"
          placeholder="정답을 말하거나 입력하세요"
          value={ans}
          onChange={e=>setAns(e.target.value)}
          onKeyDown={(e)=>{ if(e.key==="Enter" && !showResult) submit(); }}
          aria-label="정답 입력"
        />

        {showResult && (
          <div className={`text-center mb-3 p-3 rounded-lg ${
            result.includes("정답") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`} role="status" aria-live="assertive">
            {result}
          </div>
        )}

        <div className="flex gap-3">
          <button className="btn flex-1" onClick={()=>setAns("")}>지우기</button>
          {!showResult ? (
            <button className="btn-primary flex-1" onClick={submit}>제출</button>
          ) : (
            <button className="btn-secondary flex-1" onClick={next}>
              {idx+1 < qs.length ? "다음" : "완료"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
