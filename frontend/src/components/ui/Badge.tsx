import React from 'react'
import clsx from 'clsx'

type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'gray'

interface BadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
  gray: 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/20',
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function getAttendanceBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'On Track': return 'green'
    case 'Near Threshold': return 'amber'
    case 'Below Threshold': return 'red'
    default: return 'gray'
  }
}

export function getRiskBadgeVariant(risk: string): BadgeVariant {
  switch (risk) {
    case 'Low Concern': return 'green'
    case 'Needs Attention': return 'amber'
    case 'High Concern': return 'red'
    default: return 'gray'
  }
}
