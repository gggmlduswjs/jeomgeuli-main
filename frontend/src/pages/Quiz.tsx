// src/pages/Quiz.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { LessonItem } from "@/lib/normalize";
import type { LessonMode } from "@/store/lessonSession";
import { loadLessonSession, saveLessonSession } from "@/store/lessonSession";
import { fetchLearn, saveReview } from "@/lib/api";

const textOf = (it:LessonItem)=> it.char ?? it.word ?? it.sentence ?? it.text ?? '';


export default function Quiz() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const mode = (sp.get('mode') as LessonMode) || (loadLessonSession()?.mode ?? 'char');

  const [pool, setPool] = useState<LessonItem[]>([]);
  const [i, setI] = useState(0);
  const [user, setUser] = useState('');
  const [loading, setLoading] = useState(true);

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

  const onSubmit = async () => {
    if (!cur) return;
    const ok = user.trim() === textOf(cur).trim();
    if (!ok) await saveReview('wrong', { mode, expected: textOf(cur), user, idx: i });
    setUser('');
    setI((x) => x + 1);
    if (i + 1 >= pool.length) nav('/review', { replace: true });
  };

  if (loading) return <div>퀴즈 준비 중…</div>;
  if (!pool.length) return <div>퀴즈에 필요한 학습 데이터가 없습니다.</div>;

  return (
    <div>
      <div><strong>퀴즈</strong> — {i + 1} / {pool.length} ({mode})</div>
      <div style={{margin:'12px 0', fontSize:20, fontWeight:700}}>
        {cur ? textOf(cur) : ''}
      </div>
      <input value={user} onChange={e=>setUser(e.target.value)} placeholder="정답 입력" />
      <div style={{marginTop:12}}>
        <button onClick={onSubmit}>제출</button>
      </div>
    </div>
  );
}
