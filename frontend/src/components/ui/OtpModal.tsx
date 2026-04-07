import { useState, useEffect } from 'react'
import { Button } from './Button'

interface OtpModalProps {
  isOpen: boolean
  email: string
  onVerify: (otp: string) => Promise<void>
  onClose: () => void
  isLoading?: boolean
}

export function OtpModal({ isOpen, email, onVerify, onClose, isLoading = false }: OtpModalProps) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes

  useEffect(() => {
    if (!isOpen) return
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) {
      setError('Please enter OTP')
      return
    }
    try {
      await onVerify(otp)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-950">
        <h2 className="text-xl font-bold">Verify OTP</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          We&apos;ve sent a verification code to <span className="font-medium">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Enter OTP
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                setError(null)
              }}
              maxLength={6}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-2xl font-mono tracking-widest dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Expires in: <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
            </span>
            {timeLeft === 0 && (
              <button type="button" onClick={onClose} className="text-red-600 hover:text-red-700">
                Expired
              </button>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || timeLeft === 0 || otp.length !== 6}
            className="w-full py-3"
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </form>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

