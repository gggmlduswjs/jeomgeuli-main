import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AppShellMobile from "../components/AppShellMobile";
import useTTS from "../hooks/useTTS";

export default function LearnIndex() {
  const { speak } = useTTS();

  // 페이지 진입 안내 (원치 않으면 이 useEffect 제거해도 됨)
  useEffect(() => {
    speak("점자 학습 메뉴입니다. 자모, 단어, 문장, 자유 변환 중에서 선택하세요.");
  }, [speak]);

  const items = [
    { to: "/learn/char", label: "자모 학습", desc: "한글 자음/모음의 점자 패턴" },
    { to: "/learn/word", label: "단어 학습", desc: "자모 조합으로 단어 학습" },
    { to: "/learn/sentence", label: "문장 학습", desc: "문장 단위 점자 연습" },
    { to: "/learn/free", label: "자유 변환", desc: "임의 텍스트 점자 변환" },
    { to: "/review", label: "복습하기", desc: "틀린 문제/키워드 복습", highlight: true },
  ];

  return (
    <AppShellMobile title="점자 학습" showBackButton>
      <nav
        className="max-w-[560px] mx-auto space-y-3"
        aria-label="학습 카테고리"
      >
        <h2 className="text-xl font-bold mb-4">점자 학습</h2>

        {items.map(({ to, label, desc, highlight }) => (
          <Link
            key={to}
            to={to}
            className={[
              "block rounded-2xl bg-white px-5 py-4 border shadow transition-colors",
              "focus:outline-none focus:ring-4 focus:ring-primary/30",
              highlight ? "border-sky-200 text-sky-700" : "border-border text-fg",
              "hover:bg-card/80",
            ].join(" ")}
            aria-label={`${label} - ${desc}`}
          >
            <div className="font-semibold">{label}</div>
            <div className="text-sm text-secondary mt-0.5">{desc}</div>
          </Link>
        ))}
      </nav>
    </AppShellMobile>
  );
}
