import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export const Card: React.FC<CardProps> = ({ children, className = '', padding = true }) => (
  <div className={`rounded-xl bg-white shadow-sm border border-slate-200 ${padding ? 'p-6' : ''} ${className}`}>
    {children}
  </div>
)
