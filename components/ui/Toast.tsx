'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

class ToastManager {
  private listeners: Set<(toasts: Toast[]) => void> = new Set()
  private toasts: Toast[] = []

  subscribe(listener: (toasts: Toast[]) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]))
  }

  add(message: string, type: ToastType = 'info', duration: number = 3000) {
    const id = Math.random().toString(36).substring(7)
    const toast: Toast = { id, message, type, duration }
    this.toasts.push(toast)
    this.notify()

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id)
      }, duration)
    }

    return id
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id)
    this.notify()
  }

  success(message: string, duration?: number) {
    return this.add(message, 'success', duration)
  }

  error(message: string, duration?: number) {
    return this.add(message, 'error', duration || 5000)
  }

  warning(message: string, duration?: number) {
    return this.add(message, 'warning', duration)
  }

  info(message: string, duration?: number) {
    return this.add(message, 'info', duration)
  }
}

export const toastManager = new ToastManager()

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    return toastManager.subscribe(setToasts)
  }, [])

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      case 'error':
        return <XCircle className="w-5 h-5" />
      case 'warning':
        return <AlertCircle className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/50 text-green-400'
      case 'error':
        return 'bg-red-500/20 border-red-500/50 text-red-400'
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
      default:
        return 'bg-blue-500/20 border-blue-500/50 text-blue-400'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full sm:max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`glass-dark rounded-xl p-4 border-2 ${getColors(toast.type)} shadow-lg`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(toast.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium break-words">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => toastManager.remove(toast.id)}
                className="flex-shrink-0 p-1 hover:bg-black/20 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

