import React from 'react'
import { Sidebar } from './Sidebar'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Bell, Languages } from 'lucide-react'
import api from '../../lib/api'
import { getLang, setLang } from '../../lib/translations'

interface TopbarProps {
  title?: string
}

function Topbar({ title }: TopbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const currentLang = user?.lang_pref || getLang()

  const handleLogoClick = () => {
    logout()
    navigate('/', { replace: true })
  }

  const toggleLang = async () => {
    const newLang = currentLang === 'ta' ? 'en' : 'ta'
    setLang(newLang)
    const stored = localStorage.getItem('edupulse_user')
    if (stored) {
      try {
        const u = JSON.parse(stored)
        u.lang_pref = newLang
        localStorage.setItem('edupulse_user', JSON.stringify(u))
      } catch {}
    }
    try {
      await api.patch('/auth/profile', { lang_pref: newLang })
    } catch {
      // fallback
    }
    window.location.reload()
  }

  const handleNotificationsClick = () => {
    if (user?.role === 'admin') navigate('/admin/notifications')
    else if (user?.role === 'professor') navigate('/professor/notifications')
    else navigate('/student/notifications')
  }

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 pl-14 lg:pl-6">
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">KPR Institute of Engineering and Technology</span>
          <span className="text-slate-300">•</span>
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-1.5 hover:opacity-85 transition-opacity cursor-pointer"
            title="Go to Homepage (Logs out session)"
          >
            <img src="/logo.png" alt="EduPulse" className="h-6 w-auto object-contain" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
          title="Toggle Language / மொழி மாற்று"
        >
          <Languages size={14} className="text-[#174A8B]" />
          <span>{currentLang === 'ta' ? 'EN' : 'தமிழ்'}</span>
        </button>
        <button
          onClick={handleNotificationsClick}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 relative transition-colors cursor-pointer"
          title="Notifications / அறிவிப்புகள்"
        >
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden shadow-xs border border-slate-200"
            style={{ backgroundColor: '#174A8B' }}
          >
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt={user.full_name}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900 leading-tight">{user?.full_name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F7FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
