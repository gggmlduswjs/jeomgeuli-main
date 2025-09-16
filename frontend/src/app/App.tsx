import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import LearnStep from "../pages/LearnStep";
import FreeConvert from "../pages/FreeConvert";
import Quiz from "../pages/Quiz";
import Review from "../pages/Review";
import Explore from "../pages/Explore";
import NotFound from "../pages/NotFound";
import DevHealth from "../components/DevHealth";

function Home(){
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-4">
        <div className="max-w-md mx-auto">
          {/* 환영 메시지 */}
          <div className="text-center mb-8 mt-8">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">⠿</span>
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">점글이</h1>
            <p className="text-lg text-muted">시각장애인을 위한<br/>점자학습 및 정보접근 PWA</p>
          </div>

          {/* 주요 기능 카드들 */}
          <div className="space-y-4">
            <Link 
              to="/learn" 
              className="block p-6 bg-white rounded-2xl shadow-toss hover:shadow-toss-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="점자 학습 - 자모, 단어, 문장을 차례로 배워보세요"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-fg">점자 학습</h3>
                  <p className="text-sm text-muted">자모, 단어, 문장을 차례로 배워보세요</p>
                </div>
                <div className="text-muted">
                  →
                </div>
              </div>
            </Link>

            <Link 
              to="/explore" 
              className="block p-6 bg-white rounded-2xl shadow-toss hover:shadow-toss-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="정보 탐색 - ChatGPT 스타일로 정보를 탐색해보세요"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🔍</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-fg">정보 탐색</h3>
                  <p className="text-sm text-muted">ChatGPT 스타일로 정보를 탐색해보세요</p>
                </div>
                <div className="text-muted">
                  →
                </div>
              </div>
            </Link>
          </div>

          {/* 빠른 액션 */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-fg mb-4">빠른 액션</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link 
                to="/learn/free" 
                className="p-4 bg-card rounded-xl text-center hover:bg-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="자유 변환"
              >
                <div className="text-2xl mb-1">⚡</div>
                <div className="text-sm font-medium">자유 변환</div>
              </Link>
              <Link 
                to="/review" 
                className="p-4 bg-card rounded-xl text-center hover:bg-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="복습하기"
              >
                <div className="text-2xl mb-1">🔄</div>
                <div className="text-sm font-medium">복습하기</div>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LearnIndex(){
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-border shadow-toss">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-primary">점자 학습</h1>
          <p className="text-sm text-muted mt-1">기초부터 차근차근 배워보세요</p>
        </div>
      </header>

      {/* 학습 메뉴 */}
      <main className="flex-1 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <Link 
            to="/learn/char" 
            className="block p-6 bg-white rounded-2xl shadow-toss hover:shadow-toss-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="자모 학습 - 한글의 기본 글자들을 배워보세요"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">ㄱ</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fg">자모 학습</h3>
                <p className="text-sm text-muted">초성, 중성, 종성을 차례로 배워보세요</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/learn/word" 
            className="block p-6 bg-white rounded-2xl shadow-toss hover:shadow-toss-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="단어 학습 - 자주 사용하는 단어들을 배워보세요"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">가</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fg">단어 학습</h3>
                <p className="text-sm text-muted">일상에서 자주 쓰는 단어들을 배워보세요</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/learn/sentence" 
            className="block p-6 bg-white rounded-2xl shadow-toss hover:shadow-toss-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="문장 학습 - 완성된 문장으로 점자를 배워보세요"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-sky/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">안녕</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fg">문장 학습</h3>
                <p className="text-sm text-muted">실제 문장으로 점자 읽기를 연습해보세요</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/learn/free" 
            className="block p-6 bg-white rounded-2xl shadow-toss hover:shadow-toss-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="자유 변환 - 원하는 텍스트를 점자로 변환해보세요"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⠿</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fg">자유 변환</h3>
                <p className="text-sm text-muted">원하는 텍스트를 실시간으로 점자로 변환해보세요</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/review" 
            className="block p-6 bg-white rounded-2xl shadow-toss hover:shadow-toss-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="복습하기 - 틀린 문제들을 다시 연습해보세요"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-danger/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fg">복습하기</h3>
                <p className="text-sm text-muted">틀린 문제들을 다시 연습해보세요</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function App(){
  // 개발 헬스 기록
  (window as any).__APP_HEALTH__ = { ...(window as any).__APP_HEALTH__, appMounted: true };
  console.log("[APP] mounted", (window as any).__APP_HEALTH__);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {import.meta.env.DEV && <DevHealth />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />

        <Route path="/learn" element={<LearnIndex />} />
        <Route path="/learn/char" element={<LearnStep />} />
        <Route path="/learn/word" element={<LearnStep />} />
        <Route path="/learn/sentence" element={<LearnStep />} />
        <Route path="/learn/free" element={<FreeConvert />} />

        {/* 퀴즈는 두 경로 모두 수용 */}
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/learn/quiz" element={<Quiz />} />

        <Route path="/review" element={<Review />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}