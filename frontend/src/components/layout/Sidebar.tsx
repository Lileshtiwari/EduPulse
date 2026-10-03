import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import clsx from 'clsx'
import {
  LayoutDashboard, BookOpen, CalendarCheck, GraduationCap, AlertTriangle,
  Bell, User, HelpCircle, LogOut, Menu, X, Calculator, TrendingUp,
  Users, Settings, FileText, Mail, ClipboardList, School, Database,
  Mic, BarChart3, ChevronRight
} from 'lucide-react'

import { getLang } from '../../lib/translations'

interface NavItem {
  label: string
  labelTa?: string
  href: string
  icon: React.ReactNode
}

const studentNav: NavItem[] = [
  { label: 'Dashboard', labelTa: 'டாஷ்போர்டு', href: '/student/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'My Attendance', labelTa: 'என் வருகை', href: '/student/attendance', icon: <CalendarCheck size={18} /> },
  { label: 'Bunk Calculator', labelTa: 'வருகை கணிப்பு', href: '/student/bunk-calculator', icon: <Calculator size={18} /> },
  { label: 'Recovery Plan', labelTa: 'மீட்பு திட்டம்', href: '/student/recovery-calculator', icon: <TrendingUp size={18} /> },
  { label: 'My Marks', labelTa: 'என் மதிப்பெண்', href: '/student/marks', icon: <GraduationCap size={18} /> },
  { label: 'Academic Risk', labelTa: 'கல்வி அபாயம்', href: '/student/risk', icon: <AlertTriangle size={18} /> },
  { label: 'Notifications', labelTa: 'அறிவிப்புகள்', href: '/student/notifications', icon: <Bell size={18} /> },
  { label: 'Profile', labelTa: 'சுயவிவரம்', href: '/student/profile', icon: <User size={18} /> },
]

const professorNav: NavItem[] = [
  { label: 'Dashboard', labelTa: 'டாஷ்போர்டு', href: '/professor/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'My Courses', labelTa: 'என் பாடங்கள்', href: '/professor/courses', icon: <BookOpen size={18} /> },
  { label: 'Attendance Entry', labelTa: 'வருகைப் பதிவு', href: '/professor/attendance', icon: <CalendarCheck size={18} /> },
  { label: 'Marks Entry', labelTa: 'மதிப்பெண் பதிவு', href: '/professor/marks', icon: <ClipboardList size={18} /> },
  { label: 'Voice Mark Entry', labelTa: 'குரல் வழி பதிவு', href: '/professor/voice-marks', icon: <Mic size={18} /> },
  { label: 'Student Analytics', labelTa: 'மாணவர் பகுப்பாய்வு', href: '/professor/analytics', icon: <BarChart3 size={18} /> },
  { label: 'At-Risk Students', labelTa: 'கவனம் தேவைப்படுபவர்கள்', href: '/professor/at-risk', icon: <AlertTriangle size={18} /> },
  { label: 'Notifications', labelTa: 'அறிவிப்புகள்', href: '/professor/notifications', icon: <Bell size={18} /> },
]

const adminNav: NavItem[] = [
  { label: 'Dashboard', labelTa: 'டாஷ்போர்டு', href: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Students', labelTa: 'மாணவர்கள்', href: '/admin/students', icon: <GraduationCap size={18} /> },
  { label: 'Professors', labelTa: 'பேராசிரியர்கள்', href: '/admin/professors', icon: <Users size={18} /> },
  { label: 'Departments', labelTa: 'துறைகள்', href: '/admin/departments', icon: <School size={18} /> },
  { label: 'Courses & Sections', labelTa: 'பாடங்கள் & பிரிவுகள்', href: '/admin/courses', icon: <BookOpen size={18} /> },
  { label: 'Academic & Email Settings', labelTa: 'கல்வி & மின்னஞ்சல் அமைப்புகள்', href: '/admin/settings', icon: <Settings size={18} /> },
  { label: 'Notifications & History', labelTa: 'அறிவிப்புகள் & வரலாறு', href: '/admin/notifications', icon: <Bell size={18} /> },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const lang = user?.lang_pref || getLang()

  const navItems =
    user?.role === 'admin' ? adminNav :
    user?.role === 'professor' ? professorNav :
    studentNav

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const handleLogoClick = () => {
    logout()
    navigate('/', { replace: true })
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Prominent Logo */}
      <div className="px-4 py-5 border-b border-blue-800 flex items-center justify-center">
        <img
          src="/logo.png"
          alt="EduPulse"
          className="h-11 w-auto max-w-[195px] object-contain cursor-pointer transition hover:opacity-90"
          onClick={handleLogoClick}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const fb = document.getElementById('sidebar-logo-fallback');
            if (fb) fb.style.display = 'flex';
          }}
        />
        <div id="sidebar-logo-fallback" style={{ display: 'none' }} className="items-center gap-2 text-white font-bold text-lg cursor-pointer" onClick={handleLogoClick}>
          <GraduationCap size={24} className="text-white" />
          <span>EduPulse</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-white text-[#174A8B] shadow-sm'
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              )
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="flex-1">
              {lang === 'ta' && item.labelTa ? item.labelTa : item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="px-3 py-4 border-t border-blue-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: '#2476C7' }}>
            {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.full_name}</p>
            <p className="text-blue-300 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-blue-200 hover:text-white hover:bg-red-600 text-sm transition-colors"
        >
          <LogOut size={16} />
          <span>{lang === 'ta' ? 'வெளியேறு' : 'Log Out'}</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-[#174A8B] text-white rounded-lg lg:hidden shadow-lg"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — mobile */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-[#174A8B] z-50 transition-transform duration-300 lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#174A8B] h-screen sticky top-0 flex-shrink-0">
        {sidebarContent}
      </aside>
    </>
  )
}
