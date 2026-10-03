import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { User, Mail, Phone, Building, GraduationCap, CheckCircle2, Save } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useT, getLang } from '../../lib/translations'

export default function StudentProfile() {
  const { user } = useAuth()
  const { t, lang } = useT(user?.lang_pref || getLang())
  const [profile, setProfile] = useState<any>(null)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    api.get('/students/me/profile')
      .then(res => {
        setProfile(res.data)
        setPhone(res.data.phone || '')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.patch('/students/me/profile', { phone })
      setToast(lang === 'ta' ? 'சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!' : 'Profile updated successfully!')
      setTimeout(() => setToast(null), 4000)
    } catch (err: any) {
      alert(err?.response?.data?.detail || (lang === 'ta' ? 'புதுப்பிக்க முடியவில்லை' : 'Failed to update'))
    }
  }

  return (
    <DashboardLayout>
      {toast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <User size={24} className="text-[#174A8B]" />
          <span>{lang === 'ta' ? 'என் கல்விசார் சுயவிவரம்' : 'My Academic Profile'}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {lang === 'ta'
            ? 'உங்கள் கல்வி பதிவுகள், சேர்க்கை நிலை மற்றும் தொடர்பு விவரங்களை காண்க.'
            : 'View your institutional records, enrollment status, and contact information.'}
        </p>
      </div>

      <div className="max-w-2xl bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        <div className="flex items-center gap-5 pb-6 border-b border-slate-100 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-50 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-700 relative overflow-hidden">
            <span className="text-xl font-black text-[#174A8B]">
              {profile?.full_name?.slice(0, 2).toUpperCase() || 'ST'}
            </span>
            <span className="text-[9px] font-mono text-slate-400 mt-0.5">image.png</span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">{profile?.full_name}</h2>
            <div className="text-xs font-mono text-slate-500">{profile?.student_id} • {profile?.email}</div>
            <div className="mt-1 inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              {lang === 'ta' ? 'நடப்பு மாணவர் நிலை' : 'Active Student Status'}
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{lang === 'ta' ? 'துறை' : 'Department'}</label>
              <input
                type="text"
                disabled
                value={profile?.department_name || (lang === 'ta' ? 'கணினி அறிவியல் & பொறியியல்' : 'Computer Science & Engineering')}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{lang === 'ta' ? 'பிரிவு' : 'Section'}</label>
              <input
                type="text"
                disabled
                value={`${lang === 'ta' ? 'பிரிவு' : 'Section'} ${profile?.section || 'A'}`}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{lang === 'ta' ? 'நடப்பு செமஸ்டர்' : 'Current Semester'}</label>
              <input
                type="text"
                disabled
                value={`${lang === 'ta' ? 'செமஸ்டர்' : 'Semester'} ${profile?.semester || 5}`}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{lang === 'ta' ? 'தொடர்பு தொலைபேசி' : 'Contact Phone'}</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-[#174A8B] hover:bg-[#123868] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow flex items-center gap-2 cursor-pointer"
            >
              <Save size={15} />
              <span>{lang === 'ta' ? 'மாற்றங்களைச் சேமி' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
