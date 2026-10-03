import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Bell, RefreshCw, Loader2, Send, Mail, Trash2, Eye } from 'lucide-react'
import api from '../../lib/api'
import type { Notification } from '../../types'
import { NotificationModal } from '../../components/ui/NotificationModal'
import { useT, tStr } from '../../lib/translations'

export default function NotificationHistory() {
  const { t, lang } = useT()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [retrying, setRetrying] = useState<number | null>(null)
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null)

  const fetchNotifications = () => {
    setLoading(true)
    api.get('/notifications/history').then(r => setNotifications(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchNotifications() }, [])

  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      alert('Failed to delete notification')
    }
  }

  const clearAllHistory = async () => {
    if (!confirm('Are you sure you want to clear all notification history?')) return
    try {
      await api.delete('/notifications/clear/all')
      setNotifications([])
    } catch (err) {
      alert('Failed to clear notifications')
    }
  }

  const sendTest = async () => {
    if (!testEmail) return
    setSending(true)
    setMessage('')
    try {
      const r = await api.post('/notifications/send-test', {
        recipient_email: testEmail,
        notification_type: 'test',
      })
      setMessage(`✓ ${r.data.message}`)
      setTimeout(() => fetchNotifications(), 1500)
    } catch (e: any) {
      setMessage(`✗ ${e?.response?.data?.detail || 'Failed to queue'}`)
    } finally {
      setSending(false)
    }
  }

  const retry = async (id: number) => {
    setRetrying(id)
    try {
      await api.post(`/notifications/${id}/retry`)
      setTimeout(() => fetchNotifications(), 1500)
    } finally {
      setRetrying(null)
    }
  }

  const batchTest = async () => {
    setSending(true)
    setMessage('')
    try {
      const r = await api.post('/notifications/batch-test')
      setMessage(`✓ ${r.data.message}`)
      setTimeout(() => fetchNotifications(), 2000)
    } catch (e: any) {
      setMessage(`✗ ${e?.response?.data?.detail || 'Failed'}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Bell size={22} className="text-[#174A8B]" />
          <span>{tStr('Email Test & Notification History', 'மின்னஞ்சல் சோதனை & அறிவிப்பு வரலாறு', lang)}</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">{tStr('Send test emails and view notification delivery history', 'சோதனை மின்னஞ்சல்களை அனுப்பி அறிவிப்பு வரலாற்றைக் காண்க', lang)}</p>
      </div>

      {/* Send Test Email */}
      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">{tStr('Send Test Email', 'சோதனை மின்னஞ்சல் அனுப்பு', lang)}</h2>
        <div className="flex gap-3 flex-wrap">
          <input
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="recipient@kpriet.ac.in"
            className="flex-1 min-w-48 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2476C7]"
          />
          <button
            onClick={sendTest}
            disabled={sending || !testEmail}
            className="px-4 py-2 bg-[#174A8B] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[#2476C7] transition-colors disabled:opacity-50"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Send Test
          </button>
          <button
            onClick={batchTest}
            disabled={sending}
            className="px-4 py-2 bg-[#16865B] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Mail size={14} />
            Batch Test (All Consented)
          </button>
          <button onClick={fetchNotifications}
            className="px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
        {message && (
          <p className={`mt-2 text-sm font-medium ${message.startsWith('✓') ? 'text-emerald-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
          <strong>Mock Mode:</strong> Emails are simulated (stored in DB as "sent"). Configure Gmail OAuth in .env to send real emails.
        </div>
      </Card>

      {/* History Table */}
      <Card padding={false}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">{tStr('Notification History', 'அறிவிப்பு வரலாறு', lang)} ({notifications.length})</h2>
          {notifications.length > 0 && (
            <button
              onClick={clearAllHistory}
              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>{t.clearAll || 'Clear All History'}</span>
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-6 h-6 border-4 border-[#174A8B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">{tStr('Subject', 'பொருள்', lang)}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">{tStr('Recipient', 'பெறுநர்', lang)}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">{tStr('Type', 'வகை', lang)}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">{tStr('Status', 'நிலை', lang)}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">{tStr('Created', 'உருவாக்கப்பட்டது', lang)}</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">{tStr('Action', 'செயல்', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {notifications.map(n => (
                  <tr
                    key={n.id}
                    onClick={() => setSelectedNotif(n)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3 text-xs font-semibold text-slate-900 max-w-xs truncate group-hover:text-[#174A8B]">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{n.subject}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{n.recipient_email}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="blue">{n.notification_type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={n.status === 'sent' ? 'green' : n.status === 'failed' ? 'red' : 'gray'}>
                        {n.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(n.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedNotif(n)}
                          className="p-1.5 text-[#174A8B] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Read message"
                        >
                          <Eye size={14} />
                        </button>
                        {n.status === 'failed' && (
                          <button
                            onClick={() => retry(n.id)}
                            disabled={retrying === n.id}
                            className="text-xs text-[#2476C7] font-medium flex items-center gap-1 cursor-pointer"
                          >
                            {retrying === n.id ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                            Retry
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {notifications.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-400">No notifications yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Readable Message Modal */}
      <NotificationModal
        notification={selectedNotif}
        onClose={() => setSelectedNotif(null)}
        onDelete={deleteNotification}
      />
    </DashboardLayout>
  )
}
