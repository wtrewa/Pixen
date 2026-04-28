import React from 'react'

type BadgeColor = 'amber' | 'green' | 'red' | 'blue' | 'slate' | 'purple' | 'orange'

interface BadgeProps {
  children: React.ReactNode
  color?: BadgeColor
}

const colors: Record<BadgeColor, string> = {
  amber: 'bg-amber-100 text-amber-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  slate: 'bg-slate-100 text-slate-700',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'slate' }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]}`}>
    {children}
  </span>
)

export function bookingStatusColor(status: string): BadgeColor {
  const map: Record<string, BadgeColor> = {
    PENDING: 'amber',
    CONFIRMED: 'blue',
    CANCELLED: 'red',
    SHOOT_COMPLETED: 'purple',
    DELIVERED: 'orange',
    COMPLETED: 'green',
  }
  return map[status] ?? 'slate'
}
