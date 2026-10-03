import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Settings, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react'
import api from '../../lib/api'
import { useT, tStr } from '../../lib/translations'

export default function AcademicSettings() {
  const { lang } = useT()
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [form, setForm] = useState({
    attendance_threshold: 75.0,
    warning_margin: 5.0,
    marks_warning_threshold: 40.0,
    email_enabled: true,
    test_mode_enabled: false,
  })

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
          }))
        }
      })
      .catch(() => {})
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
      showToast('success', tStr('Academic thresholds saved successfully!', 'கல்வி வரம்புகள் வெற்றிகரமாக சேமிக்கப்பட்டன!', lang))
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || 'Failed to save settings')
    } finally {
      setSaving(false)
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
          <span>{tStr('Academic Risk & Threshold Settings', 'கல்வி ஆபத்து & வரம்பு அமைப்புகள்', lang)}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {tStr('Configure attendance shortage thresholds, warning margins, and passing criteria for automated student alerts.', 'மாணவர் தானியங்கி எச்சரிக்கைகளுக்கான வருகைப் பற்றாக்குறை வரம்புகள் மற்றும் தேர்ச்சி அளவுகோல்களை உள்ளமைக்கவும்.', lang)}
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-600" />
            <span>{tStr('Academic Attendance & Risk Thresholds', 'கல்வி வருகை & ஆபத்து வரம்புகள்', lang)}</span>
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            {tStr('These percentages govern when warning emails are triggered and risk badges appear across student records.', 'மாணவர் பதிவுகளில் எச்சரிக்கை மின்னஞ்சல்கள் எப்போது தூண்டப்படுகின்றன மற்றும் ஆபத்து பேட்ஜ்கள் எப்போது தோன்றும் என்பதை இந்த சதவீதங்கள் தீர்மானிக்கின்றன.', lang)}
          </p>

          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 text-xs">
                {tStr('Mandatory Attendance Threshold (%)', 'கட்டாய வருகை வரம்பு (%)', lang)}
              </label>
              <input
                type="number"
                step="0.5"
                value={form.attendance_threshold}
                onChange={(e) => setForm({ ...form, attendance_threshold: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-[#174A8B]/30"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {tStr('Default: 75.0% (Students below this are marked shortage and flagged for disciplinary alert)', 'இயல்புநிலை: 75.0% (இதற்குக் கீழே உள்ள மாணவர்கள் பற்றாக்குறையாகக் குறிக்கப்படுவார்கள்)', lang)}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 text-xs">
                {tStr('Warning Margin (%)', 'எச்சரிக்கை விளிம்பு (%)', lang)}
              </label>
              <input
                type="number"
                step="0.5"
                value={form.warning_margin}
                onChange={(e) => setForm({ ...form, warning_margin: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-[#174A8B]/30"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {tStr("Default: 5.0% (75% to 80% is considered 'Near Threshold')", "இயல்புநிலை: 5.0% (75% முதல் 80% வரை 'வரம்பிற்கு அருகில்' கருதப்படுகிறது)", lang)}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5 text-xs">
                {tStr('Marks Warning Threshold (%)', 'மதிப்பெண் எச்சரிக்கை வரம்பு (%)', lang)}
              </label>
              <input
                type="number"
                step="0.5"
                value={form.marks_warning_threshold}
                onChange={(e) => setForm({ ...form, marks_warning_threshold: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-[#174A8B]/30"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                {tStr('Default: 40.0% (Passing mark criterion for internal assessments)', 'இயல்புநிலை: 40.0% (உள் மதிப்பீடுகளுக்கான தேர்ச்சி மதிப்பெண் அளவுகோல்)', lang)}
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold text-xs shadow mt-3 cursor-pointer transition-colors"
            >
              {saving ? tStr('Saving...', 'சேமிக்கிறது...', lang) : tStr('Save Academic Thresholds', 'வரம்புகளைச் சேமி', lang)}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
