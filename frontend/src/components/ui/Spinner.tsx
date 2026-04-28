import React from 'react'
import { Loader2 } from 'lucide-react'

export const Spinner: React.FC<{ className?: string }> = ({ className = 'h-8 w-8' }) => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className={`animate-spin text-amber-600 ${className}`} />
  </div>
)
