import { useState, useCallback, useRef, useEffect } from 'react';

interface STTHookReturn {
  start: () => void;
  stop: () => void;
  isListening: boolean;
  transcript: string;
  error: string | null;
}

type VendorSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onstart: ((this: VendorSpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: VendorSpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: VendorSpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: VendorSpeechRecognition, ev: Event) => any) | null;
};

type SpeechRecognitionCtor = new () => VendorSpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w: any = window as any;
  return (w.SpeechRecognition || w.webkitSpeechRecognition || null) as SpeechRecognitionCtor | null;
}

export function useSTT(): STTHookReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<VendorSpeechRecognition | null>(null);
  const stoppingRef = useRef(false);      // stop 호출 직후 onend와의 레이스 방지
  const unmountedRef = useRef(false);      // 언마운트 가드

  const start = useCallback(() => {
    const Recognition = getRecognitionCtor();
    if (!Recognition) {
      setError('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }
    if (recognitionRef.current || isListening) {
      // 이미 진행중
      return;
    }

    try {
      const recognition = new Recognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        if (unmountedRef.current) return;
        stoppingRef.current = false;
        setIsListening(true);
        setError(null);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        if (unmountedRef.current) return;
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0]?.transcript ?? '';
          if (event.results[i].isFinal) finalTranscript += t;
          else interimTranscript += t;
        }
        setTranscript(finalTranscript || interimTranscript);
      };

      recognition.onerror = (event: any) => {
        if (unmountedRef.current) return;
        const code = event?.error ?? 'unknown';
        const msg =
          code === 'not-allowed'
            ? '마이크 권한이 거부되었습니다.'
            : code === 'no-speech'
            ? '음성이 감지되지 않았습니다.'
            : code === 'audio-capture'
            ? '마이크가 감지되지 않았습니다.'
            : '음성 인식 오류가 발생했습니다.';
        setError(`Speech recognition error: ${msg}`);
        setIsListening(false);
        // 안전정리
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        if (unmountedRef.current) return;
        // stop() 직후 발생하는 onend에서는 에러/상태를 덮어쓰지 않도록
        setIsListening(false);
        recognitionRef.current = null;
        stoppingRef.current = false;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.warn('Failed to start speech recognition:', e);
      setError(e?.message || '음성 인식을 시작할 수 없습니다.');
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [isListening]);

  const stop = useCallback(() => {
    stoppingRef.current = true;
    const rec = recognitionRef.current;
    try {
      if (rec) {
        // 즉시 중단을 위해 abort 우선
        if (typeof rec.abort === 'function') rec.abort();
        else rec.stop();
      }
    } catch (e) {
      // no-op
    } finally {
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  // 언마운트 시 정리
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      try {
        // 중단 시 남아있는 핸들러가 상태를 덮어쓰지 않도록
        const rec = recognitionRef.current;
        if (rec) {
          if (typeof rec.abort === 'function') rec.abort();
          else rec.stop();
        }
      } catch {
        /* no-op */
      } finally {
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    start,
    stop,
    isListening,
    transcript,
    error,
  };
}

// TypeScript declarations for Web Speech API (minimum)
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }
  interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    readonly isFinal: boolean;
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
  }
}

export default useSTT;
