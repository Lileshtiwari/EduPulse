import React from 'react'

interface ProgressBarProps {
  value: number     // 0-100
  threshold?: number // optional threshold line
  color?: string
  height?: number
}

export function ProgressBar({ value, threshold, color, height = 8 }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  const barColor = color || (
    value >= (threshold || 75) ? '#16865B' :
    value >= (threshold || 75) - 5 ? '#E5A13D' : '#D64545'
  )

  return (
    <div className="relative w-full" style={{ height }}>
      <div className="w-full h-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      {threshold !== undefined && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-400 opacity-60"
          style={{ left: `${threshold}%` }}
          title={`Threshold: ${threshold}%`}
        />
      )}
    </div>
  )
}

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  children?: React.ReactNode
}

export function CircularProgress({
  value, size = 80, strokeWidth = 8, color, children
}: CircularProgressProps) {
  const pct = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (pct / 100) * circumference
  const barColor = color || (pct >= 75 ? '#16865B' : pct >= 70 ? '#E5A13D' : '#D64545')

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={barColor} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}
