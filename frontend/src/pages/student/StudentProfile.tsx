import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { User, CheckCircle2, Save, Upload, RotateCcw, Camera } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useT, getLang } from '../../lib/translations'

export default function StudentProfile() {
  const { user, updateUser } = useAuth()
  const { t, lang } = useT(user?.lang_pref || getLang())
  const [profile, setProfile] = useState<any>(null)
  const [phone, setPhone] = useState('')
  const [profileImage, setProfileImage] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const defaultImage = '/student_card.png'

  useEffect(() => {
    api.get('/students/me/profile')
      .then(res => {
        setProfile(res.data)
        setPhone(res.data.phone || '')
        setProfileImage(res.data.profile_image || defaultImage)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleImageCompressAndSet = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new (window as any).Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxDim = 400
        let w = img.width
        let h = img.height
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w)
          w = maxDim
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h)
          h = maxDim
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, w, h)
        const compressed = canvas.toDataURL('image/jpeg', 0.85)
        callback(compressed)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.patch('/students/me/profile', { phone, profile_image: profileImage })
      setProfile(res.data)
      if (updateUser && user) {
        updateUser({ ...user, ...res.data })
      }
      setToast(lang === 'ta' ? 'சுயவிவரம் மற்றும் படம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!' : 'Profile and photo updated successfully!')
      setTimeout(() => setToast(null), 4000)
    } catch (err: any) {
      alert(err?.response?.data?.detail || (lang === 'ta' ? 'புதுப்பிக்க முடியவில்லை' : 'Failed to update'))
    } finally {
      setSaving(false)
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
        <div className="flex items-center gap-6 pb-6 border-b border-slate-100 mb-6">
          {/* Profile Photo with Upload Controls */}
          <div className="relative group flex-shrink-0">
            <div className="w-20 h-24 rounded-2xl overflow-hidden border-2 border-blue-200 shadow-sm bg-slate-100 flex items-center justify-center">
              <img
                src={profileImage || profile?.profile_image || defaultImage}
                alt={profile?.full_name || 'Student Photo'}
                className="w-full h-full object-cover object-top"
                onError={(e) => { e.currentTarget.src = defaultImage }}
              />
            </div>
            <label
              className="absolute -bottom-2 -right-2 p-1.5 bg-[#174A8B] hover:bg-[#123868] text-white rounded-full shadow-md cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
              title="Upload Photo / புகைப்படம் பதிவேற்றுக"
            >
              <Camera size={13} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImageCompressAndSet(file, (compressed) => {
                      setProfileImage(compressed)
                    })
                  }
                }}
              />
            </label>
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">{profile?.full_name}</h2>
            <div className="text-xs font-mono text-slate-500 mt-0.5">{profile?.student_id} • {profile?.email}</div>
            
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                {lang === 'ta' ? 'நடப்பு மாணவர் நிலை' : 'Active Student Status'}
              </div>
              
              <label className="text-[11px] font-bold text-[#174A8B] hover:underline inline-flex items-center gap-1 cursor-pointer">
                <Upload size={11} />
                <span>{lang === 'ta' ? 'படம் பதிவேற்றுக' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageCompressAndSet(file, (compressed) => {
                        setProfileImage(compressed)
                      })
                    }
                  }}
                />
              </label>

              {profileImage && profileImage !== defaultImage && (
                <button
                  type="button"
                  onClick={() => setProfileImage(defaultImage)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>{lang === 'ta' ? 'இயல்புநிலைக்கு மீட்டமை' : 'Reset to Default'}</span>
                </button>
              )}
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
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-[#174A8B]/20"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#174A8B] hover:bg-[#123868] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save size={15} />
              <span>{saving ? (lang === 'ta' ? 'சேமிக்கிறது...' : 'Saving...') : (lang === 'ta' ? 'மாற்றங்களைச் சேமி' : 'Save Changes')}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
