import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Settings, Mail, ShieldAlert, CheckCircle2, AlertTriangle, Send } from 'lucide-react'
import api from '../../lib/api'
import { useT, tStr } from '../../lib/translations'

export default function AcademicSettings() {
  const { t, lang } = useT()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [form, setForm] = useState({
    attendance_threshold: 75.0,
    warning_margin: 5.0,
    marks_warning_threshold: 40.0,
    email_enabled: true,
    test_mode_enabled: false,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_use_tls: true,
  })

  const [testEmail, setTestEmail] = useState('')

  useEffect(() => {
    api.get('/notifications/settings')
      .then(res => {
        if (res.data) {
          setForm(prev => ({
            ...prev,
            attendance_threshold: res.data.attendance_threshold ?? 75.0,
            warning_margin: res.data.warning_margin ?? 5.0,
            marks_warning_threshold: res.data.marks_warning_threshold ?? 40.0,
            email_enabled: res.data.email_enabled ?? true,
            test_mode_enabled: res.data.test_mode_enabled ?? false,
            smtp_host: res.data.smtp_host || 'smtp.gmail.com',
            smtp_port: res.data.smtp_port || 587,
            smtp_user: res.data.smtp_user || '',
            smtp_password: res.data.smtp_password || '',
            smtp_from_email: res.data.smtp_from_email || '',
            smtp_use_tls: res.data.smtp_use_tls ?? true,
          }))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 6000)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch('/notifications/settings', form)
      showToast('success', 'Academic & SMTP settings saved successfully!')
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      showToast('error', 'Please provide a test recipient email address')
      return
    }
    setTesting(true)
    try {
      await api.patch('/notifications/settings', form)
      const res = await api.post('/notifications/test-smtp', { recipient_email: testEmail })
      showToast('success', res.data.message || 'Test email verified and delivered!')
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || 'SMTP test failed. Check Google App Password.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <DashboardLayout>
      {toast && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium border text-white ${
          toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-red-600 border-red-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} className="flex-shrink-0" /> : <AlertTriangle size={18} className="flex-shrink-0" />}
          <span className="flex-1">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings size={24} className="text-[#174A8B]" />
          <span>{tStr('Academic & Email Delivery Settings', 'கல்வி & மின்னஞ்சல் விநியோக அமைப்புகள்', lang)}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {tStr('Configure attendance thresholds and real SMTP mail credentials for student alerts.', 'மாணவர் எச்சரிக்கைகளுக்கான வருகை வரம்புகள் மற்றும் SMTP சான்றுகளை உள்ளமைக்கவும்.', lang)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Academic & Threshold Settings */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-600" />
              <span>{tStr('Academic Attendance & Risk Thresholds', 'கல்வி வருகை & ஆபத்து வரம்புகள்', lang)}</span>
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              {tStr('These percentages govern when warning emails are triggered and risk badges appear.', 'எச்சரிக்கை மின்னஞ்சல்கள் மற்றும் ஆபத்து பேட்ஜ்கள் எப்போது தோன்றும் என்பதை இந்த சதவீதங்கள் தீர்மானிக்கின்றன.', lang)}
            </p>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {tStr('Mandatory Attendance Threshold (%)', 'கட்டாய வருகை வரம்பு (%)', lang)}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.attendance_threshold}
                  onChange={(e) => setForm({ ...form, attendance_threshold: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">{tStr('Default: 75.0% (Students below this are marked shortage)', 'இயல்புநிலை: 75.0% (இதற்குக் கீழே உள்ள மாணவர்கள் பற்றாக்குறையாகக் குறிக்கப்படுவார்கள்)', lang)}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {tStr('Warning Margin (%)', 'எச்சரிக்கை விளிம்பு (%)', lang)}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.warning_margin}
                  onChange={(e) => setForm({ ...form, warning_margin: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">{tStr("Default: 5.0% (75% to 80% is considered 'Near Threshold')", "இயல்புநிலை: 5.0% (75% முதல் 80% வரை 'வரம்பிற்கு அருகில்' கருதப்படுகிறது)", lang)}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {tStr('Marks Warning Threshold (%)', 'மதிப்பெண் எச்சரிக்கை வரம்பு (%)', lang)}
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={form.marks_warning_threshold}
                  onChange={(e) => setForm({ ...form, marks_warning_threshold: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">{tStr('Default: 40.0% (Passing mark criterion)', 'இயல்புநிலை: 40.0% (தேர்ச்சி மதிப்பெண் அளவுகோல்)', lang)}</span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold text-xs shadow mt-2 cursor-pointer"
              >
                {saving ? tStr('Saving...', 'சேமிக்கிறது...', lang) : tStr('Save Academic Thresholds', 'வரம்புகளைச் சேமி', lang)}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Real Email (SMTP) Configuration */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Mail size={16} className="text-purple-600" />
              <span>Real Email Delivery (Gmail / SMTP)</span>
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Enter your Gmail address and 16-digit Google App Password so alerts arrive in student inboxes.
            </p>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={form.smtp_host}
                    onChange={(e) => setForm({ ...form, smtp_host: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Port</label>
                  <input
                    type="number"
                    value={form.smtp_port}
                    onChange={(e) => setForm({ ...form, smtp_port: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sender Email Address</label>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={form.smtp_user}
                  onChange={(e) => setForm({ ...form, smtp_user: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Google App Password (16 Letters)
                </label>
                <input
                  type="password"
                  placeholder="abcd efgh ijkl mnop"
                  value={form.smtp_password}
                  onChange={(e) => setForm({ ...form, smtp_password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  How to generate: Google Account → Security → 2-Step Verification → App Passwords.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="block font-semibold text-slate-700 mb-1">Verify Email Delivery</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="student@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testing}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-xs"
                  >
                    {testing ? 'Sending...' : 'Test Send'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow"
              >
                {saving ? 'Saving...' : 'Save SMTP Credentials'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
