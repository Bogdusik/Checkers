'use client'

import { useEffect, useState, useRef } from 'react'
import { Clock } from 'lucide-react'

interface GameTimerProps {
  timeLeft: number | null
  isActive: boolean
  onTimeUp?: () => void
}

export default function GameTimer({ timeLeft, isActive, onTimeUp }: GameTimerProps) {
  const [displayTime, setDisplayTime] = useState(timeLeft || 0)
  const startTimeRef = useRef<number>(Date.now())
  const initialTimeRef = useRef<number>(timeLeft || 0)

  // Sync displayTime when timeLeft changes
  useEffect(() => {
    if (timeLeft !== null && timeLeft !== undefined) {
      setDisplayTime(timeLeft)
      initialTimeRef.current = timeLeft
      startTimeRef.current = Date.now()
    }
  }, [timeLeft])

  useEffect(() => {
    if (!isActive || !timeLeft || timeLeft <= 0) {
      if (timeLeft !== null && timeLeft !== undefined) {
        setDisplayTime(timeLeft)
      }
      return
    }

    const interval = setInterval(() => {
      setDisplayTime(prev => {
        const newTime = Math.max(0, prev - 1)
        if (newTime <= 0 && onTimeUp) {
          onTimeUp()
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, timeLeft, onTimeUp])

  const formatTime = (seconds: number) => {
    if (seconds < 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getColorClass = () => {
    if (!timeLeft || displayTime > 30) return 'text-white'
    if (displayTime > 10) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (!timeLeft) return null

  return (
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-gray-400" />
      <span className={`font-mono font-semibold ${getColorClass()}`}>
        {formatTime(displayTime)}
      </span>
    </div>
  )
}

