import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Bell, Mail, Clock, AlertTriangle, CheckCircle2, Trash2, ChevronRight } from 'lucide-react'
import api from '../../lib/api'
import { NotificationModal } from '../../components/ui/NotificationModal'
import { useT, getLang } from '../../lib/translations'
import { useAuth } from '../../contexts/AuthContext'

export default function StudentNotifications() {
  const { user } = useAuth()
  const { t, lang } = useT(user?.lang_pref || getLang())
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotif, setSelectedNotif] = useState<any | null>(null)

  const loadNotifs = () => {
    setLoading(true)
    api.get('/notifications/history')
      .then(res => setNotifs(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadNotifs()
  }, [])

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`)
      setNotifs(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      alert('Failed to delete notification')
    }
  }

  const handleClearAll = async () => {
    if (!confirm(lang === 'ta' ? 'அனைத்து அறிவிப்புகளையும் நீக்க விரும்புகிறீர்களா?' : 'Are you sure you want to clear all your notification history?')) return
    try {
      await api.delete('/notifications/clear/all')
      setNotifs([])
    } catch (err) {
      alert('Failed to clear notifications')
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell size={24} className="text-[#174A8B]" />
            <span>{lang === 'ta' ? 'கல்விசார் அறிவிப்புகள்' : 'My Academic Notifications'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'ta'
              ? 'வருகை எச்சரிக்கைகள், மதிப்பெண் புதுப்பிப்புகள் மற்றும் மின்னஞ்சலுக்கு அனுப்பப்பட்ட அறிவிப்புகள். விவரங்களை அறிய அறிவிப்பை கிளிக் செய்யவும்.'
              : 'Official attendance warnings, marks updates, and academic notifications sent to your email. Click any notice to view full details.'}
          </p>
        </div>

        {notifs.length > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Trash2 size={13} />
            <span>{lang === 'ta' ? 'அனைத்தையும் நீக்கு' : 'Clear All'}</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden text-xs">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400">
            {lang === 'ta' ? 'அறிவிப்புகள் ஏற்றப்படுகின்றன...' : 'Loading notifications...'}
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500">
            {lang === 'ta' ? 'அறிவிப்புகள் எதுவும் இல்லை. அனைத்து கல்வி நிலைகளும் சீராக உள்ளன!' : 'No notifications received yet. All academic statuses are normal!'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifs.map((n) => (
              <div
                key={n.id}
                onClick={() => setSelectedNotif(n)}
                className="p-4 hover:bg-blue-50/40 transition-colors flex items-start gap-3 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#174A8B] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Mail size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-slate-900 text-xs group-hover:text-[#174A8B] transition-colors truncate">
                      {n.subject}
                    </h4>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock size={11} />
                        <span>{new Date(n.created_at).toLocaleDateString()}</span>
                      </span>
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="text-slate-300 hover:text-red-600 p-1 transition cursor-pointer"
                        title={lang === 'ta' ? 'அறிவிப்பை நீக்கு' : 'Delete notification'}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="text-slate-600 whitespace-pre-line text-[11px] leading-relaxed line-clamp-2">
                    {n.message || n.subject}
                  </div>
                  <div className="mt-1 text-[10px] text-[#174A8B] font-semibold flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                    <span>{lang === 'ta' ? 'முழு செய்தியையும் படிக்க கிளிக் செய்யவும்' : 'Click to read full message'}</span>
                    <ChevronRight size={11} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Read Notification Details Modal */}
      <NotificationModal
        notification={selectedNotif}
        onClose={() => setSelectedNotif(null)}
        onDelete={handleDelete}
      />
    </DashboardLayout>
  )
}

