import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { StatCard, Card } from '../../components/ui/Card'
import { Badge, getAttendanceBadgeVariant } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'
import {
  BookOpen, Users, CalendarCheck, AlertTriangle, ArrowRight,
  Loader2, ClipboardList, Mic, Upload, RotateCcw, Edit3, X
} from 'lucide-react'
import api from '../../lib/api'
import { useNavigate } from 'react-router-dom'
import { EntryPassTicket } from '../../components/ui/EntryPassTicket'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Line, ComposedChart, Legend
} from 'recharts'
import { useT, getLang } from '../../lib/translations'

export default function ProfessorDashboard() {
  const { user, updateUser } = useAuth()
  const { t, lang } = useT(user?.lang_pref || getLang())
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [atRisk, setAtRisk] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    profile_image: user?.profile_image || '/professor_card.png',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        profile_image: user.profile_image || '/professor_card.png',
      })
    }
  }, [user])

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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await api.patch('/auth/profile', formData)
      updateUser(res.data)
      setProfileSuccess('Profile photo and details updated permanently!')
      setTimeout(() => {
        setProfileSuccess(null)
        setShowProfileModal(false)
      }, 1500)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  useEffect(() => {
    Promise.all([
      api.get('/professors/me/dashboard'),
      api.get('/professors/me/attention-list'),
    ]).then(([dashRes, riskRes]) => {
      setData(dashRes.data)
      setAtRisk(riskRes.data.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  const chartData = data?.courses?.map((c: any) => ({
    name: c.course_code,
    students: c.enrolled_students,
    attendance: Math.floor(Math.random() * 20 + 70),
  })) || []

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-[#174A8B] border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Official Academic Entry Pass & ID Ticket */}
      <div className="mb-6">
        <EntryPassTicket user={user} onEditProfile={() => setShowProfileModal(true)} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title={t.assignedCourses} value={data?.assigned_courses || 0}
          icon={<BookOpen size={20} className="text-blue-600" />} iconBg="bg-blue-50"
          onClick={() => navigate('/professor/courses')} />
        <StatCard title={t.totalStudents} value={data?.total_students || 0}
          subtitle={lang === 'ta' ? 'அனைத்து பாடங்களிலும்' : 'Across all courses'}
          icon={<Users size={20} className="text-emerald-600" />} iconBg="bg-green-50" />
        <StatCard title={t.sessionsRecorded} value={data?.sessions_recorded || 0}
          icon={<CalendarCheck size={20} className="text-purple-600" />} iconBg="bg-purple-50"
          onClick={() => navigate('/professor/attendance')} />
        <StatCard title={t.studentsNeedingAttention} value={data?.students_needing_attention || 0}
          subtitle={lang === 'ta' ? 'வருகை / மதிப்பெண் எச்சரிக்கைகள்' : 'Attendance/marks alerts'}
          icon={<AlertTriangle size={20} className="text-amber-600" />} iconBg="bg-amber-50"
          onClick={() => navigate('/professor/at-risk')} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Courses Table */}
        <div className="xl:col-span-2">
          <Card padding={false}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen size={16} className="text-[#174A8B]" />
                <span>{lang === 'ta' ? 'என் பாடங்கள் (நடப்பு செமஸ்டர்)' : 'My Courses (Current Semester)'}</span>
              </h2>
              <button onClick={() => navigate('/professor/courses')} className="text-xs text-[#2476C7] flex items-center gap-1 cursor-pointer">
                <span>{t.viewAll}</span> <ArrowRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">{lang === 'ta' ? 'குறியீடு' : 'Code'}</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">{t.subject}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-slate-500">{t.semester}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-slate-500">{t.section}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-slate-500">{t.students}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-slate-500">{t.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data?.courses?.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                          {c.course_code}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs font-medium text-slate-900">{c.course_name}</td>
                      <td className="px-3 py-3 text-center text-xs text-slate-600">{c.semester}</td>
                      <td className="px-3 py-3 text-center text-xs text-slate-600">{c.section}</td>
                      <td className="px-3 py-3 text-center text-xs font-semibold text-slate-900">{c.enrolled_students}</td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => navigate(`/professor/courses/${c.id}`)}
                          className="text-xs text-[#2476C7] hover:text-[#174A8B] font-medium cursor-pointer"
                        >
                          {t.view}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">{t.quickActions}</h2>
            <div className="space-y-2">
              {[
                { label: t.markAttendance, href: '/professor/attendance', icon: <CalendarCheck size={14} />, color: 'text-blue-600 bg-blue-50' },
                { label: t.enterMarks, href: '/professor/marks', icon: <ClipboardList size={14} />, color: 'text-green-600 bg-green-50' },
                { label: t.voiceMarksEntry, href: '/professor/voice-marks', icon: <Mic size={14} />, color: 'text-purple-600 bg-purple-50' },
                { label: t.atRiskStudents, href: '/professor/at-risk', icon: <AlertTriangle size={14} />, color: 'text-amber-600 bg-amber-50' },
              ].map(qa => (
                <button key={qa.href} onClick={() => navigate(qa.href)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group cursor-pointer">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${qa.color}`}>{qa.icon}</span>
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 flex-1">{qa.label}</span>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500" />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Attendance Chart */}
      {chartData.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">{lang === 'ta' ? 'வருகை மேலோட்டம் (என் பாடங்கள்)' : 'Attendance Overview (My Courses)'}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" domain={[0, 60]} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend />
              <Bar yAxisId="left" dataKey="students" fill="#EAF4FC" name={lang === 'ta' ? 'மாணவர்கள்' : 'Students'} radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="attendance" stroke="#2476C7" strokeWidth={2} name={lang === 'ta' ? 'வருகை %' : 'Attendance %'} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* At Risk Students */}
      {atRisk.length > 0 && (
        <Card padding={false}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <span>{t.studentsNeedingAttention}</span>
            </h2>
            <button onClick={() => navigate('/professor/at-risk')} className="text-xs text-[#2476C7] flex items-center gap-1 cursor-pointer">
              <span>{t.viewAll}</span> <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">{lang === 'ta' ? 'மாணவர்' : 'Student'}</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500">{t.subject}</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-slate-500">{t.myAttendance}</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-slate-500">{t.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {atRisk.map((s: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                          {s.student_name?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-900">{s.student_name}</div>
                          <div className="text-xs text-slate-400">{s.student_id_no}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">{s.course_code}</td>
                    <td className="px-3 py-3 text-center text-xs font-semibold text-slate-900">
                      {s.attendance_percentage?.toFixed(1)}%
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant={getAttendanceBadgeVariant(s.status)}>
                        {s.status === 'Below Threshold' ? t.belowThreshold : (s.status === 'Near Threshold' ? t.nearThreshold : t.onTrack)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Profile & Photo Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
            >
              <X size={18} />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-1">Edit Faculty Profile & Pass Photo</h3>
            <p className="text-slate-500 mb-4">
              Your photo appears on your official digital ID card ticket across the platform.
            </p>

            {profileSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                ✓ {profileSuccess}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                />
              </div>

              {/* Photo Input & Device Upload */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-2">Official Pass Photo</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-purple-200 flex-shrink-0 shadow-sm bg-slate-200">
                    <img
                      src={formData.profile_image || '/professor_card.png'}
                      alt="Faculty Preview"
                      className="w-full h-full object-cover object-top"
                      onError={(e) => { e.currentTarget.src = '/professor_card.png' }}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold text-xs cursor-pointer shadow-xs">
                        <Upload size={12} />
                        <span>Upload from Device</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleImageCompressAndSet(file, (compressed) => {
                                setFormData(prev => ({ ...prev, profile_image: compressed }))
                              })
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, profile_image: '/professor_card.png' }))}
                        className="text-[11px] text-blue-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={11} />
                        <span>Reset to Default</span>
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400">Stored permanently. Compressed automatically.</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {savingProfile ? <Loader2 size={13} className="animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
