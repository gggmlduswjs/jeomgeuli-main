import React from 'react'
import { Volume2, VolumeX, Loader2 } from 'lucide-react'
import { useTTS } from '../hooks/useTTS'

interface TTSButtonProps {
  text: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const TTSButton = ({ text, className = '', size = 'md' }: TTSButtonProps) => {
  const { isSpeaking, isLoading, speak, stop, isSupported, error } = useTTS()

  const handleClick = () => {
    if (isSpeaking) {
      stop()
    } else {
      speak(text).catch((err) => {
        console.error("TTS 실행 실패:", err)
        alert("음성 재생에 실패했습니다.") // 필요에 따라 토스트로 교체 가능
      })
    }
  }

  if (!isSupported) {
    return null
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  }

  return (
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-200
        ${isSpeaking 
          ? 'bg-accent-500 hover:bg-accent-600 text-white' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        }
        ${className}
      `}
      role="switch"
      aria-label={isSpeaking ? '음성 재생 중지' : '음성 재생'}
      aria-pressed={isSpeaking}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 size={iconSizes[size]} className="animate-spin" />
      ) : isSpeaking ? (
        <VolumeX size={iconSizes[size]} />
      ) : (
        <Volume2 size={iconSizes[size]} />
      )}
    </button>
  )
}

export default TTSButton
