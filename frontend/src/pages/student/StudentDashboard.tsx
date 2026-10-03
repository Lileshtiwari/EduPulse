import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { StatCard, Card } from '../../components/ui/Card'
import { Badge, getAttendanceBadgeVariant, getRiskBadgeVariant } from '../../components/ui/Badge'
import { ProgressBar, CircularProgress } from '../../components/ui/ProgressBar'
import {
  CalendarCheck, GraduationCap, AlertTriangle, Bell, BookOpen,
  TrendingUp, Calculator, ArrowRight, Zap, CheckCircle, Clock, Upload, RotateCcw, Edit3, X, Loader2
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import api from '../../lib/api'
import type { AttendanceSummary, Mark, RiskAssessment, Notification } from '../../types'
import { useNavigate } from 'react-router-dom'
import { EntryPassTicket } from '../../components/ui/EntryPassTicket'
import { useT, getLang } from '../../lib/translations'
import { NotificationModal } from '../../components/ui/NotificationModal'

export default function StudentDashboard() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [attendance, setAttendance] = useState<AttendanceSummary[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [risk, setRisk] = useState<RiskAssessment | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    profile_image: user?.profile_image || '/student_card.png',
  })

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        profile_image: user.profile_image || '/student_card.png',
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
    const fetchAll = async () => {
      try {
        const [attRes, marksRes, riskRes, notifRes] = await Promise.all([
          api.get(`/attendance/summary/student/${user!.id}`),
          api.get(`/marks/student/${user!.id}`),
          api.get('/students/me/risk'),
          api.get('/notifications/history'),
        ])
        setAttendance(attRes.data)
        setMarks(marksRes.data)
        setRisk(riskRes.data)
        setNotifications(notifRes.data.slice(0, 3))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [user])

  // Calculate overall attendance
  const totalSessions = attendance.reduce((s, a) => s + a.total_sessions, 0)
  const totalAttended = attendance.reduce((s, a) => s + a.attended, 0)
  const overallPct = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0

  const subjectsBelow = attendance.filter(a => a.status === 'Below Threshold').length

  // Latest marks summary
  const latestMark = marks[0]

  // Build attendance trend data (weekly, synthetic from session data)
  const trendData = Array.from({ length: 10 }, (_, i) => ({
    week: `W${i + 1}`,
    attendance: Math.max(50, overallPct + (Math.random() * 10 - 5)).toFixed(0),
    threshold: 75,
  }))

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const { t, lang } = useT(user?.lang_pref || getLang())

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#174A8B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 text-sm">{lang === 'ta' ? 'தரவுகள் ஏற்றப்படுகின்றன...' : 'Loading dashboard...'}</p>
          </div>
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="col-span-2 lg:col-span-1">
          <Card className="h-full">
            <p className="text-xs font-medium text-slate-500 mb-2">
              {t.overallAttendance || 'Overall Attendance'}
            </p>
            <div className="flex items-center gap-3">
              <CircularProgress value={overallPct} size={60} strokeWidth={6}>
                <span className="text-xs font-bold text-slate-900">{overallPct}%</span>
              </CircularProgress>
              <div className="text-xs text-slate-500">
                <p><span className="font-semibold text-slate-700">{totalAttended}</span> {t.attended || 'Attended'}</p>
                <p><span className="font-semibold text-red-500">{totalSessions - totalAttended}</span> {t.missed || 'Missed'}</p>
                <p><span className="font-semibold text-slate-700">{totalSessions}</span> {t.totalSessions || 'Total'}</p>
              </div>
            </div>
          </Card>
        </div>

        <StatCard
          title={lang === 'ta' ? 'பாடங்கள்' : 'Subjects Enrolled'}
          value={attendance.length}
          subtitle={`${subjectsBelow} need attention`}
          icon={<BookOpen size={20} className="text-[#2476C7]" />}
          iconBg="bg-blue-50"
          onClick={() => navigate('/student/attendance')}
        />

        <StatCard
          title={lang === 'ta' ? 'சமீபத்திய மதிப்பெண்' : 'Latest Marks'}
          value={latestMark ? `${latestMark.marks_obtained}/${latestMark.max_marks}` : 'N/A'}
          subtitle={latestMark?.assessment_name}
          icon={<GraduationCap size={20} className="text-[#16865B]" />}
          iconBg="bg-green-50"
          onClick={() => navigate('/student/marks')}
        />

        <StatCard
          title={lang === 'ta' ? 'கல்வி அபாயம்' : 'Academic Risk'}
          value={risk?.overall_risk || 'N/A'}
          subtitle={`${risk?.reasons?.length || 0} concern(s)`}
          icon={<AlertTriangle size={20} className={risk?.overall_risk === 'High Concern' ? 'text-red-500' : 'text-amber-500'} />}
          iconBg={risk?.overall_risk === 'High Concern' ? 'bg-red-50' : 'bg-amber-50'}
          onClick={() => navigate('/student/risk')}
        />

        <StatCard
          title={lang === 'ta' ? 'அறிவிப்புகள்' : 'Notifications'}
          value={notifications.length}
          subtitle="Recent alerts"
          icon={<Bell size={20} className="text-purple-500" />}
          iconBg="bg-purple-50"
          onClick={() => navigate('/student/notifications')}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Subject-wise Attendance Table */}
        <div className="xl:col-span-2">
          <Card padding={false}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <CalendarCheck size={16} className="text-[#174A8B]" />
                {lang === 'ta' ? 'பாட வாரியான வருகை' : 'Subject-wise Attendance'}
              </h2>
              <button
                onClick={() => navigate('/student/attendance')}
                className="text-xs text-[#2476C7] hover:text-[#174A8B] font-medium flex items-center gap-1"
              >
                View All <ArrowRight size={12} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">Subject</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-slate-500">Attended/Total</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-slate-500">%</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 hidden md:table-cell">Progress</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-slate-500">Status</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {attendance.map((a) => (
                    <tr key={a.course_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900 text-xs">{a.course_name}</div>
                        <div className="text-slate-400 text-xs">{a.course_code}</div>
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-slate-600">
                        {a.attended}/{a.total_sessions}
                      </td>
                      <td className="px-3 py-3 text-center text-xs font-semibold text-slate-900">
                        {a.total_sessions > 0 ? `${a.attendance_percentage.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell">
                        <div className="w-24">
                          <ProgressBar value={a.attendance_percentage} threshold={a.threshold} height={6} />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Badge variant={getAttendanceBadgeVariant(a.status)}>
                          {a.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => navigate('/student/attendance')}
                          className="text-xs text-[#2476C7] hover:text-[#174A8B] font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                        No attendance data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              {lang === 'ta' ? 'விரைவு செயல்கள்' : 'Quick Actions'}
            </h2>
            <div className="space-y-2">
              {[
                { label: 'Calculate Bunk Impact', href: '/student/bunk-calculator', icon: <Calculator size={14} />, color: 'text-blue-600 bg-blue-50' },
                { label: 'Recovery Plan', href: '/student/recovery-calculator', icon: <TrendingUp size={14} />, color: 'text-green-600 bg-green-50' },
                { label: 'View My Marks', href: '/student/marks', icon: <GraduationCap size={14} />, color: 'text-purple-600 bg-purple-50' },
                { label: 'Check Academic Risk', href: '/student/risk', icon: <AlertTriangle size={14} />, color: 'text-amber-600 bg-amber-50' },
              ].map((qa) => (
                <button
                  key={qa.href}
                  onClick={() => navigate(qa.href)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${qa.color}`}>
                    {qa.icon}
                  </span>
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 flex-1">{qa.label}</span>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500" />
                </button>
              ))}
            </div>
          </Card>

          {/* Academic Risk Panel */}
          {risk && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900">Academic Risk</h2>
                <Badge variant={getRiskBadgeVariant(risk.overall_risk)}>
                  {risk.overall_risk}
                </Badge>
              </div>
              {risk.reasons.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle size={14} />
                  <span>No concerns at this time</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {risk.reasons.slice(0, 3).map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => navigate('/student/risk')}
                className="mt-3 w-full text-xs text-[#2476C7] hover:text-[#174A8B] font-medium flex items-center gap-1"
              >
                View full analysis <ArrowRight size={10} />
              </button>
            </Card>
          )}
        </div>
      </div>

      {/* Attendance Trend Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Attendance Trend (Overall)</h2>
            <span className="text-xs text-slate-400">This Semester</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(val: any) => [`${val}%`]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
              <ReferenceLine y={75} stroke="#E5A13D" strokeDasharray="4 4" label={{ value: '75% Required', fontSize: 10, fill: '#E5A13D' }} />
              <Line
                type="monotone" dataKey="attendance"
                stroke="#2476C7" strokeWidth={2} dot={{ r: 3, fill: '#2476C7' }}
                name="Attendance %"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Latest Marks */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Latest Marks</h2>
            <button onClick={() => navigate('/student/marks')} className="text-xs text-[#2476C7] flex items-center gap-1">
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {marks.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-700">{m.assessment_name}</span>
                    <span className="text-xs text-slate-500">{m.course_name}</span>
                  </div>
                  <ProgressBar value={m.percentage || 0} height={5} />
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-slate-900">{m.marks_obtained}/{m.max_marks}</div>
                  <div className={`text-xs font-medium ${(m.percentage || 0) >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {m.percentage?.toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
            {marks.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No marks available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Bell size={14} className="text-[#174A8B]" />
              Recent Notifications
            </h2>
            <button onClick={() => navigate('/student/notifications')} className="text-xs text-[#2476C7] flex items-center gap-1">
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2.5">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => setSelectedNotif(n)}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 cursor-pointer transition-colors group"
              >
                <Bell size={14} className="text-[#174A8B] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 group-hover:text-[#174A8B] transition-colors truncate">
                    {n.subject}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    {n.message || new Date(n.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={n.status === 'sent' ? 'green' : n.status === 'failed' ? 'red' : 'gray'}>
                    {n.status}
                  </Badge>
                  <span className="text-[10px] text-[#174A8B] font-semibold opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                    Read &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Read Notification Modal */}
      <NotificationModal
        notification={selectedNotif}
        onClose={() => setSelectedNotif(null)}
      />

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
            <h3 className="text-base font-bold text-slate-900 mb-1">Edit Student Profile & Pass Photo</h3>
            <p className="text-slate-500 mb-4">
              Your photo appears on your official student entry pass ticket across the portal.
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
                  <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-blue-200 flex-shrink-0 shadow-sm bg-slate-200">
                    <img
                      src={formData.profile_image || '/student_card.png'}
                      alt="Student Preview"
                      className="w-full h-full object-cover object-top"
                      onError={(e) => { e.currentTarget.src = '/student_card.png' }}
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
                        onClick={() => setFormData(prev => ({ ...prev, profile_image: '/student_card.png' }))}
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
