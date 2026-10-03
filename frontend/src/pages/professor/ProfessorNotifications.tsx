import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Bell, Mail, Clock, Trash2, ChevronRight } from 'lucide-react'
import api from '../../lib/api'
import { NotificationModal } from '../../components/ui/NotificationModal'
import { useT, tStr } from '../../lib/translations'

export default function ProfessorNotifications() {
  const { t, lang } = useT()
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
      alert(tStr('Failed to delete notification', 'அறிவிப்பை நீக்குவதில் தோல்வி', lang))
    }
  }

  const handleClearAll = async () => {
    if (!confirm(tStr('Are you sure you want to clear all notification history?', 'அனைத்து அறிவிப்பு வரலாற்றையும் அழிக்க உறுதியாக இருக்கிறீர்களா?', lang))) return
    try {
      await api.delete('/notifications/clear/all')
      setNotifs([])
    } catch (err) {
      alert(tStr('Failed to clear notifications', 'அறிவிப்புகளை அழிப்பதில் தோல்வி', lang))
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell size={24} className="text-[#174A8B]" />
            <span>{t.notifications || 'Faculty Notifications'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {tStr('System notifications, course announcements, and student risk alerts. Click any notification to read the full message.', 'கணினி அறிவிப்புகள், பாட அறிவிப்புகள் மற்றும் மாணவர் ஆபத்து எச்சரிக்கைகள். முழு செய்தியையும் படிக்க கிளிக் செய்க.', lang)}
          </p>
        </div>

        {notifs.length > 0 && (
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Trash2 size={13} />
            <span>{t.clearAll || 'Clear All Notifications'}</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden text-xs">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400">{tStr('Loading notifications...', 'அறிவிப்புகள் ஏற்றப்படுகின்றன...', lang)}</div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500">
            {t.noNotifications || 'No notifications logged.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifs.map((n) => (
              <div
                key={n.id}
                onClick={() => setSelectedNotif(n)}
                className="p-4 hover:bg-purple-50/40 transition-colors flex items-start gap-3 group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Mail size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-slate-900 text-xs group-hover:text-purple-700 transition-colors">
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
                        title="Delete notification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="text-slate-600 whitespace-pre-line text-[11px] leading-relaxed line-clamp-2">
                    {n.message || n.subject}
                  </div>
                  <div className="mt-1 text-[10px] text-purple-700 font-semibold flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                    <span>{tStr('Click to read full message', 'முழு செய்தியையும் படிக்க கிளிக் செய்க', lang)}</span>
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

