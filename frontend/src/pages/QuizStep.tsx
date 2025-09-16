import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import api from "@/lib/api";                           // ✅ api 객체로 임포트
import type { Cell } from "@/lib/brailleSafe";        // ✅ Cell 타입 출처 변경
import { normalizeCells } from "@/lib/brailleSafe";

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

export default function Quiz(){
  const { mode } = useParams<{ mode: "char"|"word"|"sentence" }>(); // char|word|sentence
  const nav = useNavigate();
  const { state } = useLocation() as { state?: { items?: any[] } };
  const src = state?.items || [];

  // 🚧 가드: 학습에서 넘어온 데이터가 없을 때
  if (!src.length) {
    return (
      <main className="max-w-xl mx-auto p-6">
        <div className="rounded-2xl bg-white shadow p-6 text-center">
          <p className="text-gray-700 mb-2">퀴즈 데이터가 없습니다.</p>
          <p className="text-sm text-gray-500 mb-6">학습을 먼저 진행한 뒤 퀴즈로 이동해주세요.</p>
          <Link to="/learn" className="btn-primary inline-block">학습으로 이동</Link>
        </div>
      </main>
    );
  }

  const [i,setI] = useState(0);
  const [answer,setAnswer] = useState("");
  const [result,setResult] = useState("");
  const [cells,setCells] = useState<Cell[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cur = src[i];
  const targetText =
    mode==="char" ? cur?.char :
    mode==="word" ? cur?.word :
    cur?.sentence;

  useEffect(()=>{ 
    if(!targetText) {
      setCells([]);
      setError("no_text");
      return;
    }
    const id = setTimeout(async ()=>{
      try {
        const resp = await api.convertBraille(targetText, mode);     // ✅ api.convertBraille 사용
        const raw = (resp as any)?.cells ?? resp;
        const normalizedCells = normalizeCells(raw);
        setCells(normalizedCells);
        setError((resp as any)?.ok === false ? ((resp as any)?.error ?? "convert_failed") : null);
      } catch (e) {
        console.error("Quiz convertBraille error:", e);
        setCells([]);
        setError("conversion_failed");
      }
    }, 150);
    return ()=> clearTimeout(id);
  },[i, src, mode, targetText]);                                       // ✅ mode 포함

  const say = (t:string)=>{
    try{
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(t);
      u.lang="ko-KR";
      speechSynthesis.speak(u);
    }catch{/* no-op */}
  };

  // 답 확인 시, 공백/미입력은 오답
  const submit = (userInput: string) => {
    const correct =
      (mode==="char" ? cur?.char :
       mode==="word" ? cur?.word : cur?.sentence) || "";
    const user = (userInput || "").trim();
    const isOk = user.length > 0 && user === correct.trim();

    if (!isOk) {
      const key = "review:items";
      const saved = JSON.parse(localStorage.getItem(key) || "[]");
      localStorage.setItem(key, JSON.stringify(
        [...saved, { mode, text: correct }].slice(-200)
      ));
    }

    const msg = isOk ? "정답입니다." : "오답입니다.";
    setResult(msg);
    say(isOk ? "정답입니다" : "오답입니다");
  };

  const next = () => {
    submit(answer);
    setAnswer("");
    setResult("");
    if(i>=src.length-1) nav("/learn");
    else setI(i+1);
  };

  if(!cur) return <main className="p-4">퀴즈 데이터가 없습니다.</main>;

  return (
    <main className="max-w-xl mx-auto p-4 pb-28">
      <section className="rounded-2xl bg-white shadow p-4 mb-4">
        점자를 촉각으로 확인한 뒤 정답을 말씀/입력하세요.
      </section>

      <section className="rounded-2xl bg-white shadow p-6 text-center">
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {cells.length > 0 ? (
            cells.map((c, idx) => <CellView key={idx} c={c} />)
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p>점자 변환 중...</p>
              {error && <p className="text-sm text-red-500 mt-2">변환 실패: {error}</p>}
            </div>
          )}
        </div>
        <div className="mt-4 text-gray-500">곧 질문합니다</div>
      </section>

      <div className="rounded-2xl bg-white shadow p-4 mt-4">
        <input
          value={answer}
          onChange={e=>setAnswer(e.target.value)}
          onKeyDown={(e)=>{ if(e.key==="Enter") next(); }}
          placeholder="정답 입력"
          className="w-full h-12 rounded-xl border px-3"
          aria-label="정답 입력"
        />
        {result && (
          <div
            className={`mt-2 text-center ${result === "정답입니다." ? "text-green-600" : "text-red-500"}`}
            role="status"
            aria-live="assertive"
          >
            {result}
          </div>
        )}
      </div>

      <nav className="fixed bottom-3 left-0 right-0 max-w-xl mx-auto flex gap-3 px-4">
        <button
          className="flex-1 h-12 rounded-xl bg-gray-200"
          onClick={()=> setI(Math.max(0,i-1))}
          disabled={i===0}
        >
          이전
        </button>
        <button
          className="flex-1 h-12 rounded-xl bg-gray-300"
          onClick={()=> say("힌트가 없습니다")}
        >
          반복
        </button>
        <button
          className="flex-1 h-12 rounded-xl bg-blue-600 text-white"
          onClick={next}
        >
          다음
        </button>
      </nav>
    </main>
  );
}
