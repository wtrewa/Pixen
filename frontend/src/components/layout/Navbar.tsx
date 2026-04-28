import React from 'react'
import { Link } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { useAuthStore } from '../../store/auth.store'
import { Button } from '../ui/Button'

export const Navbar: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore()

  const dashboardLink = () => {
    if (!user) return '/login'
    if (user.role === 'VENDOR') return '/vendor/dashboard'
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return '/admin/dashboard'
    return '/my/bookings'
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-amber-600">
          <Camera className="h-6 w-6" />
          Pixen
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/vendors" className="text-sm text-slate-600 hover:text-amber-600 px-3 py-2 rounded-lg hover:bg-amber-50 transition">
            Browse Vendors
          </Link>
          {isAuthenticated ? (
            <Link to={dashboardLink()}>
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
