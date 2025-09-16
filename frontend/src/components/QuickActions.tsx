import { Play, RotateCcw, Square, SkipForward } from 'lucide-react'

interface QuickActionsProps {
  onNext: () => void
  onRepeat: () => void
  onStop: () => void
  onStart: () => void
  isPlaying?: boolean
  hasQueue?: boolean
  className?: string
}

const QuickActions = ({ 
  onNext, 
  onRepeat, 
  onStop, 
  onStart, 
  isPlaying = false,
  hasQueue = true,
  className = '' 
}: QuickActionsProps) => {
  const baseBtn =
    "flex items-center space-x-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"

  return (
    <div className={`flex items-center justify-center space-x-4 ${className}`}>
      {/* 반복 */}
      <button
        type="button"
        onClick={onRepeat}
        disabled={!hasQueue}
        className={`${baseBtn} px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700`}
        aria-label="반복 재생"
      >
        <RotateCcw size={20} />
        <span className="hidden sm:inline">반복</span>
      </button>

      {/* 시작/정지 */}
      <button
        type="button"
        onClick={isPlaying ? onStop : onStart}
        disabled={!hasQueue}
        className={`${baseBtn} px-6 py-3 font-medium ${
          isPlaying
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-primary-500 hover:bg-primary-600 text-white'
        }`}
        aria-label={isPlaying ? '정지' : '시작'}
        aria-pressed={isPlaying}
      >
        {isPlaying ? <Square size={20} /> : <Play size={20} />}
        <span className="hidden sm:inline">{isPlaying ? '정지' : '시작'}</span>
      </button>

      {/* 다음 */}
      <button
        type="button"
        onClick={onNext}
        disabled={!hasQueue}
        className={`${baseBtn} px-4 py-2 bg-accent-100 hover:bg-accent-200 text-accent-700`}
        aria-label="다음"
      >
        <SkipForward size={20} />
        <span className="hidden sm:inline">다음</span>
      </button>
    </div>
  )
}

export default QuickActions
