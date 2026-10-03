import React from 'react'
import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
  onClick?: () => void
}

export function Card({ children, className, padding = true, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-xl border border-slate-200 shadow-sm',
        padding && 'p-5',
        className
      )}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  iconBg?: string
  trend?: { value: string; positive: boolean }
  onClick?: () => void
  className?: string
}

export function StatCard({ title, value, subtitle, icon, iconBg = 'bg-blue-50', trend, onClick, className }: StatCardProps) {
  return (
    <Card
      className={clsx('cursor-pointer hover:shadow-md transition-shadow', className)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 truncate">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 truncate">{subtitle}</p>}
          {trend && (
            <p className={clsx('mt-1 text-xs font-medium', trend.positive ? 'text-emerald-600' : 'text-red-600')}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={clsx('p-2.5 rounded-lg flex-shrink-0', iconBg)}>
          {icon}
        </div>
      </div>
    </Card>
  )
}
