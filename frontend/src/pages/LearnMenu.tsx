// import React from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import { useTTS } from "../hooks/useTTS";

type Mode = {
  id: "char" | "word" | "sentence" | "free";
  label: string;
  desc: string;
};

export default function LearnMenu() {
  const navigate = useNavigate();
  const { speak } = useTTS();

  const modes: Mode[] = [
    { id: "char",      label: "자모 학습", desc: "한글 자음과 모음 학습" },
    { id: "word",      label: "단어 학습", desc: "기본 단어와 점자 학습" },
    { id: "sentence",  label: "문장 학습", desc: "문장 구성과 점자 학습" }, // ← sent → sentence
    { id: "free",      label: "자유 변환", desc: "자유로운 텍스트 점자 변환" },
  ];

  const handleModeSelect = (mode: Mode["id"]) => {
    const m = modes.find((x) => x.id === mode);
    if (m) speak(`${m.label}을 시작합니다.`);
    navigate(`/learn/${mode}`);
  };

  return (
    <MobileShell title="점자 학습" brailleToggle={true}>
      <div className="space-y-4" role="list" aria-label="학습 모드 목록">
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => handleModeSelect(mode.id)}
            className="card text-left cursor-pointer hover:shadow-lg transition-shadow focus:outline-none focus:ring-4 focus:ring-primary/30"
            role="listitem"
            aria-label={`${mode.label} - ${mode.desc}`}
          >
            <h3 className="h2 mb-1">{mode.label}</h3>
            <p className="text-gray-600 text-sm">{mode.desc}</p>
          </button>
        ))}
      </div>
    </MobileShell>
  );
}
