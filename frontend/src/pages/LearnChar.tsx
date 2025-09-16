import { useEffect, useState } from 'react';
import { fetchLearn } from '@/lib/api';
import type { LessonItem } from '@/lib/normalize';

export default function LearnChar() {
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<LessonItem[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { title, items } = await fetchLearn('char');
        setTitle(title);
        setItems(items);
      } catch (e: any) {
        setErr(e?.message ?? 'load failed');
      }
    })();
  }, []);

  if (err) return <div style={{color:'tomato'}}>오류: {err}</div>;
  if (!items?.length) return <div>학습 항목이 없습니다 (응답 스키마 정규화 후에도 비어있음)</div>;

  return (
    <div>
      <h2>{title || '자모 학습'}</h2>
      <ul>
        {items.map((it, i) => (
          <li key={i}>
            <strong>{it.char ?? it.word ?? it.sentence ?? it.text ?? '(미정)'}</strong>
            {it.desc && <> — {it.desc}</>}
            {it.hint && <small> ({it.hint})</small>}
          </li>
        ))}
      </ul>
    </div>
  );
}