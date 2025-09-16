import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '../pages/Home'
import Explore from '../pages/Explore'
import Learn from '../pages/Learn'
import LearnStep from '../pages/LearnStep'
import Quiz from '../pages/Quiz'
import FreeConvert from '../pages/FreeConvert'
import Review from '../pages/Review'

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/learn" element={<Learn />} />
      <Route path="/learn/char" element={<LearnStep />} />
      <Route path="/learn/word" element={<LearnStep />} />
      <Route path="/learn/sentence" element={<LearnStep />} />
      <Route path="/learn/free" element={<FreeConvert />} />
      {/* 중첩으로 쓰는 경우를 대비해 /learn/quiz 도 열어준다 */}
      <Route path="/learn/quiz" element={<Quiz />} />
      {/* 절대 경로 /quiz 도 열어준다 (네비게이션이 어디로 가도 커버) */}
      <Route path="/quiz" element={<Quiz />} />
      <Route path="/review" element={<Review />} />
      {/* not found */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
