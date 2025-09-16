import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  onResult?: (text: string) => void;
  className?: string;
  label?: string; // 접근성 라벨 커스터마이즈
};

// 최소한의 타입 정의 (벤더 프리픽스 포함)
type VendorSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: any) => void) | null;
  onresult: ((ev: any) => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
};

type SpeechRecognitionCtor = new () => VendorSpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return (w.webkitSpeechRecognition || w.SpeechRecognition || null) as SpeechRecognitionCtor | null;
}

export default function MicButton({ onResult, className = "", label = "음성 입력" }: Props) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<VendorSpeechRecognition | null>(null);

  const Recognition = useMemo(() => getRecognitionCtor(), []);
  const isSupported = !!Recognition;

  const start = () => {
    if (!isSupported) {
      setError("이 브라우저는 음성 인식을 지원하지 않습니다.");
      onResult?.("");
      return;
    }
    if (listening) return; // 중복 호출 방지

    try {
      const recognition = new Recognition!();
      recognition.lang = "ko-KR";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        setError(null);
        setListening(true);
        setTranscript("");
      };

      recognition.onresult = (event: any) => {
        const text = event?.results?.[0]?.[0]?.transcript ?? "";
        setTranscript(text);
        onResult?.(text);
      };

      recognition.onerror = (event: any) => {
        const code = event?.error ?? "unknown";
        // 참고: 'no-speech', 'audio-capture', 'not-allowed', 'aborted', 'network' 등
        setError(String(code));
      };

      recognition.onend = () => {
        setListening(false);
        // 인스턴스 정리
        recRef.current = null;
      };

      recRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Failed to start speech recognition:", err);
      setListening(false);
      setError("start_failed");
      onResult?.("");
    }
  };

  const stop = () => {
    const rec = recRef.current;
    try {
      if (rec) {
        // stop()은 결과를 마무리하고 onend 호출, abort()는 즉시 중단
        if (typeof rec.abort === "function") rec.abort();
        else rec.stop();
      }
    } finally {
      setListening(false);
      recRef.current = null;
    }
  };

  const handleClick = () => {
    if (listening) stop();
    else start();
  };

  // 언마운트/리렌더 정리
  useEffect(() => {
    return () => {
      try {
        stop();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disabled = (!isSupported) || (listening && !recRef.current);

  return (
    <div className="inline-flex flex-col items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        role="switch"
        aria-checked={listening}
        aria-label={label}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${listening ? "bg-red-500 text-white animate-pulse" : "bg-accent text-primary"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${className}
        `}
      >
        {listening ? (
          <div aria-hidden className="w-6 h-6 bg-white/90 rounded-full" />
        ) : (
          // 마이크 아이콘 (SVG)
          <svg aria-hidden className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        )}
      </button>

      {/* 상태 텍스트 (스크린리더용) */}
      <span className="sr-only" aria-live="polite">
        {listening ? "음성 입력 중" : "음성 대기"}
      </span>

      {/* 오류 메시지 (필요시 UI로 노출) */}
      {error && (
        <span className="mt-2 text-xs text-red-600" aria-live="polite">
          {error === "not-allowed"
            ? "마이크 권한이 거부되었습니다."
            : error === "no-speech"
            ? "음성이 감지되지 않았습니다."
            : error === "audio-capture"
            ? "마이크가 감지되지 않았습니다."
            : "음성 인식 오류가 발생했습니다."}
        </span>
      )}

      {/* 디버그용 텍스트 (원하면 숨겨도 됨) */}
      {transcript && (
        <span className="mt-1 text-xs text-gray-500 truncate max-w-[12rem]" title={transcript}>
          {transcript}
        </span>
      )}
    </div>
  );
}
