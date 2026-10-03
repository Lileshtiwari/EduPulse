import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { StatCard, Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import {
  LayoutDashboard, GraduationCap, Users, BookOpen, AlertTriangle,
  Mail, Settings, Plus, Send, RefreshCw, CheckCircle2, X,
  ExternalLink, UserCheck, ShieldAlert, Eye, Filter, Sparkles, Building2, BarChart3,
  Camera, Upload, RotateCcw
} from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { EntryPassTicket } from '../../components/ui/EntryPassTicket'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import { useT, tStr } from '../../lib/translations'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const { t, lang } = useT()

  // Tab: 'overview' | 'students'
  const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview')

  const [stats, setStats] = useState<any>(null)
  const [deptAnalytics, setDeptAnalytics] = useState<any[]>([])
  const [recentNotifs, setRecentNotifs] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Admin Profile Modal & Form
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [adminFormData, setAdminFormData] = useState({
    full_name: user?.full_name || 'Academic Administrator',
    email: user?.email || 'karunesh128@gmail.com',
    phone: user?.phone || '+91 98765 43210',
    profile_image: user?.profile_image || '/admin_card.png',
  })

  useEffect(() => {
    if (user) {
      setAdminFormData({
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || '+91 98765 43210',
        profile_image: user.profile_image || '/admin_card.png',
      })
    }
  }, [user])

  // Modals
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAddProf, setShowAddProf] = useState(false)
  const [showAddDept, setShowAddDept] = useState(false)
  const [showSmtpModal, setShowSmtpModal] = useState(false)
  const [showShortageBlastModal, setShowShortageBlastModal] = useState(false)
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<any | null>(null)

  // Status message toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Students Directory Filters
  const [filterDept, setFilterDept] = useState<string>('ALL')
  const [filterSection, setFilterSection] = useState<string>('ALL')
  const [detailedStudents, setDetailedStudents] = useState<any[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)

  // Forms state
  const [newStudent, setNewStudent] = useState({
    full_name: '', email: '', student_id: '', department_id: '', section: 'A', semester: 5, password: 'Student@123', phone: ''
  })
  const [newProf, setNewProf] = useState({
    full_name: '', email: '', faculty_id: '', department_id: '', section: 'ALL', password: 'Prof@123', phone: ''
  })
  const [newDept, setNewDept] = useState({ code: '', name: '' })

  // SMTP Settings form
  const [smtpSettings, setSmtpSettings] = useState({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_use_tls: true,
    attendance_threshold: 75,
  })
  const [testEmailAddr, setTestEmailAddr] = useState('')
  const [testingSmtp, setTestingSmtp] = useState(false)

  // Shortage blast state
  const [shortageResult, setShortageResult] = useState<any>(null)
  const [blasting, setBlasting] = useState(false)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 7000)
  }

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

  // Load Dashboard Data
  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [sRes, dRes, nRes, deptsRes, setRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/analytics/departments'),
        api.get('/notifications/history'),
        api.get('/departments'),
        api.get('/notifications/settings'),
      ])
      setStats(sRes.data)
      setDeptAnalytics(dRes.data)
      setRecentNotifs(nRes.data.slice(0, 7))
      setDepartments(deptsRes.data)
      if (deptsRes.data.length > 0 && !newStudent.department_id) {
        setNewStudent(prev => ({ ...prev, department_id: deptsRes.data[0].id }))
        setNewProf(prev => ({ ...prev, department_id: deptsRes.data[0].id }))
      }
      if (setRes.data) {
        setSmtpSettings({
          smtp_host: setRes.data.smtp_host || 'smtp.gmail.com',
          smtp_port: setRes.data.smtp_port || 587,
          smtp_user: setRes.data.smtp_user || '',
          smtp_password: setRes.data.smtp_password || '',
          smtp_from_email: setRes.data.smtp_from_email || '',
          smtp_use_tls: setRes.data.smtp_use_tls ?? true,
          attendance_threshold: setRes.data.attendance_threshold || 75,
        })
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Load Detailed Students when filter changes or tab switches
  const loadDetailedStudents = async () => {
    setStudentsLoading(true)
    try {
      const params: any = {}
      if (filterDept !== 'ALL') {
        const found = departments.find(d => d.code === filterDept)
        if (found) params.department_id = found.id
      }
      if (filterSection !== 'ALL') {
        params.section = filterSection
      }
      const res = await api.get('/admin/students-detailed', { params })
      setDetailedStudents(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setStudentsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'students' || activeTab === 'overview') {
      loadDetailedStudents()
    }
  }, [filterDept, filterSection, activeTab, departments])

  // Handle Add Student
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/admin/users', {
        full_name: newStudent.full_name,
        email: newStudent.email,
        password: newStudent.password,
        role: 'student',
        student_id: newStudent.student_id,
        department_id: Number(newStudent.department_id),
        section: newStudent.section,
        semester: Number(newStudent.semester),
        phone: newStudent.phone,
      })
      showToast('success', `Student profile created & login credentials dispatched via email to ${newStudent.email}!`)
      setShowAddStudent(false)
      setNewStudent({
        full_name: '', email: '', student_id: '', department_id: departments[0]?.id || '',
        section: 'A', semester: 5, password: 'Student@123', phone: ''
      })
      loadDashboardData()
      loadDetailedStudents()
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || 'Failed to create student')
    }
  }

  // Handle Add Staff / Professor
  const handleAddProfSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/admin/users', {
        full_name: newProf.full_name,
        email: newProf.email,
        password: newProf.password,
        role: 'professor',
        faculty_id: newProf.faculty_id,
        department_id: Number(newProf.department_id),
        section: newProf.section || 'ALL',
        phone: newProf.phone,
      })
      showToast('success', `Faculty profile created & login credentials dispatched via email to ${newProf.email}!`)
      setShowAddProf(false)
      setNewProf({
        full_name: '', email: '', faculty_id: '', department_id: departments[0]?.id || '',
        section: 'ALL', password: 'Prof@123', phone: ''
      })
      loadDashboardData()
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || 'Failed to create staff member')
    }
  }

  // Handle Add Department
  const handleAddDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/admin/departments', newDept)
      showToast('success', `Department ${newDept.code} created successfully!`)
      setShowAddDept(false)
      setNewDept({ code: '', name: '' })
      loadDashboardData()
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || 'Failed to create department')
    }
  }

  // Handle Save SMTP Settings
  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.patch('/notifications/settings', smtpSettings)
      showToast('success', 'Email (SMTP) and academic settings saved successfully!')
      setShowSmtpModal(false)
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || 'Failed to save SMTP settings')
    }
  }

  // Handle Test SMTP Connection
  const handleTestSmtp = async () => {
    if (!testEmailAddr) {
      showToast('error', 'Please enter a recipient test email address')
      return
    }
    setTestingSmtp(true)
    try {
      await api.patch('/notifications/settings', smtpSettings)
      const res = await api.post('/notifications/test-smtp', { recipient_email: testEmailAddr })
      showToast('success', res.data.message || 'Test email successfully delivered!')
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || 'SMTP test failed. Check host, email, and Google App Password.')
    } finally {
      setTestingSmtp(false)
    }
  }

  // Handle Send All Attendance Shortage Emails (One-Click)
  const handleExecuteShortageBlast = async () => {
    setBlasting(true)
    try {
      const res = await api.post('/notifications/send-attendance-shortage-alerts')
      setShortageResult(res.data)
      showToast('success', `Executed! Sent ${res.data.sent_count} real shortage warning emails.`)
      loadDashboardData()
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || 'Failed to execute shortage alert blast')
    } finally {
      setBlasting(false)
    }
  }

  // Handle Single Student Alert
  const handleSendSingleAlert = async (studentId: number) => {
    try {
      const res = await api.post(`/notifications/send-student-alert/${studentId}`)
      showToast('success', res.data.message || 'Alert email sent to student!')
      loadDashboardData()
    } catch (err: any) {
      showToast('error', err?.response?.data?.detail || 'Failed to send alert email')
    }
  }

  // Risk Donut Data (Image 5)
  const riskDonutData = [
    { name: 'High Risk', value: 186, count: '186 (15%)', fill: '#EF4444' },
    { name: 'Moderate Risk', value: 312, count: '312 (25%)', fill: '#F59E0B' },
    { name: 'Low Risk', value: 742, count: '742 (60%)', fill: '#10B981' },
  ]

  // Marks Submission Status Donut (Image 5)
  const marksSubmissionData = [
    { name: 'Submitted', value: 98, fill: '#10B981' },
    { name: 'Partial', value: 18, fill: '#F59E0B' },
    { name: 'Pending', value: 16, fill: '#EF4444' },
  ]

  // Attendance Trend (Institution Wide) 6 Months
  const institutionTrendData = [
    { month: 'Apr', average: 81, below75: 96 },
    { month: 'May', average: 79, below75: 128 },
    { month: 'Jun', average: 76, below75: 162 },
    { month: 'Jul', average: 74, below75: 188 },
    { month: 'Aug', average: 72, below75: 204 },
    { month: 'Sep', average: 78, below75: 142 },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-72">
          <div className="w-12 h-12 border-4 border-[#174A8B] border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium border text-white ${
          toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-red-600 border-red-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 font-bold hover:opacity-80 flex-shrink-0">✕</button>
        </div>
      )}

      {/* Top Welcome & Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>{tStr('Welcome, Admin!', 'வணக்கம், நிர்வாகி!', lang)}</span>
            <span className="text-emerald-600 text-xl">📊</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
            {tStr("Here's an overview of the academic monitoring system — KPR Institute of Engineering and Technology.", 'கல்வி கண்காணிப்பு அமைப்பின் கண்ணோட்டம் — கே.பி.ஆர் பொறியியல் மற்றும் தொழில்நுட்பக் கல்லூரி.', lang)}
          </p>
        </div>

        {/* Tab switchers & Real Mail Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'overview' ? 'bg-white text-[#174A8B] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tStr('Institution Overview', 'நிறுவன கண்ணோட்டம்', lang)}
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'students' ? 'bg-white text-[#174A8B] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tStr('Student Directory', 'மாணவர் அடைவு', lang)}
            </button>
          </div>

          {/* 1-Click Shortage Alert Blast Button */}
          <button
            onClick={() => setShowShortageBlastModal(true)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            title="Scan and send real emails to all students with attendance shortage"
          >
            <Mail size={14} />
            <span>{tStr('Send Shortage Alerts (1-Click)', 'பற்றாக்குறை எச்சரிக்கைகளை அனுப்பு', lang)}</span>
          </button>
        </div>
      </div>

      {/* Official Admin Academic Entry Pass Ticket */}
      <EntryPassTicket user={user} onEditProfile={() => setShowProfileModal(true)} className="mb-6" />

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 6 KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <GraduationCap size={22} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500">{tStr('Total Students', 'மொத்த மாணவர்கள்', lang)}</div>
                <div className="text-xl font-black text-slate-900 leading-tight">1,240</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">{tStr('↑ 5% from last sem', '↑ கடந்த பருவத்தை விட 5%', lang)}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Users size={22} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500">{tStr('Total Professors', 'மொத்த பேராசிரியர்கள்', lang)}</div>
                <div className="text-xl font-black text-slate-900 leading-tight">{stats?.total_professors || 86}</div>
                <div className="text-[10px] text-blue-600 font-semibold mt-0.5">{tStr('86 active faculty', '86 செயலில் உள்ள ஆசிரியர்கள்', lang)}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <BookOpen size={22} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500">{tStr('Total Courses', 'மொத்த பாடங்கள்', lang)}</div>
                <div className="text-xl font-black text-slate-900 leading-tight">{stats?.total_courses || 132}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{tStr('Across 6 depts', '6 துறைகளில்', lang)}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500">{t.atRiskStudents || 'At Risk Students'}</div>
                <div className="text-xl font-black text-red-600 leading-tight">186</div>
                <div className="text-[10px] text-red-500 font-semibold mt-0.5">{tStr('15% of total', 'மொத்தத்தில் 15%', lang)}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500">{tStr('Low Attendance (<75%)', 'குறைந்த வருகை (<75%)', lang)}</div>
                <div className="text-xl font-black text-amber-600 leading-tight">142</div>
                <div className="text-[10px] text-amber-600 font-semibold mt-0.5">{tStr('11% of students', '11% மாணவர்கள்', lang)}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                <BookOpen size={22} />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500">{tStr('Pending Marks', 'நிலுவை மதிப்பெண்கள்', lang)}</div>
                <div className="text-xl font-black text-slate-900 leading-tight">68</div>
                <div className="text-[10px] text-orange-600 font-semibold mt-0.5">{tStr('Across 12 courses', '12 பாடங்களில்', lang)}</div>
              </div>
            </div>
          </div>

          {/* Row: Department Attendance Chart + Risk Donut + Marks Submission Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Dept-wise Attendance Bar Chart (6 cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <BarChart3 size={15} className="text-blue-600" />
                  <span>Department-wise Attendance</span>
                </h3>
                <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  This Semester ▾
                </span>
              </div>

              <div className="py-2">
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={deptAnalytics} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="department" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="avg_attendance" name="Avg Attendance %" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#2563EB]" />
                  <span>Average Attendance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-[#F59E0B]" />
                  <span>Below 75% Students</span>
                </div>
              </div>
            </div>

            {/* Academic Risk Distribution Donut (3.5 cols) */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-amber-500" />
                  <span>Academic Risk Distribution</span>
                </h3>
              </div>

              <div className="relative flex items-center justify-center py-2">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={riskDonutData}
                      dataKey="value"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {riskDonutData.map((e, idx) => (
                        <Cell key={`cell-${idx}`} fill={e.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base font-bold text-slate-900">1,240</span>
                  <span className="text-[10px] text-slate-400">Students</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] border-t border-slate-100 pt-3">
                {riskDonutData.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.fill }} />
                      <span>{r.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Marks Submission Status Donut (3 cols) */}
            <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <span>Marks Submission</span>
                </h3>
              </div>

              <div className="relative flex items-center justify-center py-2">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={marksSubmissionData}
                      dataKey="value"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {marksSubmissionData.map((e, idx) => (
                        <Cell key={`cell-${idx}`} fill={e.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base font-bold text-slate-900">132</span>
                  <span className="text-[10px] text-slate-400">Total</span>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Submitted</span>
                  </div>
                  <span className="font-semibold text-slate-900">98 (74%)</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Partial</span>
                  </div>
                  <span className="font-semibold text-slate-900">18 (14%)</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span>Pending</span>
                  </div>
                  <span className="font-semibold text-slate-900">16 (12%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar (Add Student, Add Staff, Add Dept, Send Shortage Blast, Email Config) */}
          <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/60 p-5 rounded-2xl border border-blue-100">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Sparkles size={16} className="text-[#0066cc]" />
                <span>{tStr('Administrator Quick Actions', 'நிர்வாகியின் விரைவான நடவடிக்கைகள்', lang)}</span>
              </h3>
              <span className="text-[11px] text-slate-500">{tStr('Automated instant provisioning', 'தானியங்கி உடனடி ஏற்பாடு', lang)}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <button
                onClick={() => setShowAddStudent(true)}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 shadow-xs hover:border-blue-300 transition-all text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Plus size={16} />
                </div>
                <div>
                  <div className="font-bold">{t.addStudent || 'Add Student'}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{tStr('Auto profile & enroll', 'சுயவிவரம் & சேர்க்கை', lang)}</div>
                </div>
              </button>

              <button
                onClick={() => setShowAddProf(true)}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 shadow-xs hover:border-blue-300 transition-all text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <Users size={16} />
                </div>
                <div>
                  <div className="font-bold">{tStr('Add Staff', 'ஆசிரியரைச் சேர்', lang)}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{tStr('Create faculty profile', 'ஆசிரியர் சுயவிவரம் உருவாக்கு', lang)}</div>
                </div>
              </button>

              <button
                onClick={() => setShowAddDept(true)}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 shadow-xs hover:border-blue-300 transition-all text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                  <Building2 size={16} />
                </div>
                <div>
                  <div className="font-bold">{tStr('Add Department', 'துறையைச் சேர்', lang)}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{tStr('Create department code', 'துறை குறியீடு உருவாக்கு', lang)}</div>
                </div>
              </button>

              <button
                onClick={() => setShowShortageBlastModal(true)}
                className="flex items-center gap-2 bg-white hover:bg-red-50 p-3 rounded-xl border border-red-200 text-xs font-semibold text-red-800 shadow-xs transition-all text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                  <Mail size={16} />
                </div>
                <div>
                  <div className="font-bold">{tStr('Send Shortage Blast', 'பற்றாக்குறை மின்னஞ்சல் அனுப்பு', lang)}</div>
                  <div className="text-[10px] text-red-500 font-normal">{tStr('1-click to all <75%', 'அனைத்து <75% மாணவர்களுக்கும்', lang)}</div>
                </div>
              </button>

              <button
                onClick={() => setShowSmtpModal(true)}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 shadow-xs hover:border-blue-300 transition-all text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                  <Settings size={16} />
                </div>
                <div>
                  <div className="font-bold">{tStr('Email / SMTP Config', 'மின்னஞ்சல் அமைப்பு', lang)}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{tStr('Real Gmail delivery', 'ஜிமெயில் விநியோகம்', lang)}</div>
                </div>
              </button>
            </div>
          </div>

          {/* Department & Section Student Directory Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {tStr('Student Academic Profiles & Condition Directory', 'மாணவர் கல்வி சுயவிவரங்கள் & நிலை அடைவு', lang)}
                </h3>
                <p className="text-xs text-slate-500">
                  {tStr('Filter by Department & Section to inspect student profiles, attendance conditions, and send instant alerts.', 'துறை & பிரிவு வாரியாக வடிகட்டி மாணவர் சுயவிவரங்கள், வருகை நிலைகளை ஆய்வு செய்து உடனடி எச்சரிக்கைகளை அனுப்புங்கள்.', lang)}
                </p>
              </div>

              {/* Department & Section Filters */}
              <div className="flex items-center gap-2 text-xs">
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="ALL">{tStr('All Departments', 'அனைத்துத் துறைகள்', lang)}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.code}>{d.code} - {d.name}</option>
                  ))}
                </select>

                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-semibold focus:outline-none"
                >
                  <option value="ALL">{tStr('All Sections', 'அனைத்துப் பிரிவுகள்', lang)}</option>
                  <option value="A">{tStr('Section A', 'பிரிவு A', lang)}</option>
                  <option value="B">{tStr('Section B', 'பிரிவு B', lang)}</option>
                </select>
              </div>
            </div>

            {/* Student Cards Grid */}
            {studentsLoading ? (
              <div className="text-center py-10 text-xs text-slate-500">Loading student profiles...</div>
            ) : detailedStudents.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">No students found matching filters.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {detailedStudents.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStudentForDetail(st)}
                    className="bg-slate-50/70 hover:bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {/* Photo Placeholder image.png & Badge */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-slate-600 font-bold overflow-hidden relative">
                            <span className="text-xs text-[#174A8B] font-extrabold">
                              {st.full_name?.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="text-[8px] font-mono text-slate-400 absolute bottom-0.5">image.png</span>
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 group-hover:text-[#174A8B] transition-colors leading-tight">
                              {st.full_name}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">{st.student_id}</div>
                            <div className="text-[10px] text-slate-400">{st.department_code} • Sec {st.section}</div>
                          </div>
                        </div>

                        {/* Risk pill */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          st.overall_risk === 'High Concern' ? 'bg-red-100 text-red-700' :
                          st.overall_risk === 'Needs Attention' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {st.overall_risk === 'High Concern' ? 'High Risk' :
                           st.overall_risk === 'Needs Attention' ? 'Moderate' : 'Low Risk'}
                        </span>
                      </div>

                      {/* Attendance condition */}
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 mb-3 text-xs">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-500">Attendance:</span>
                          <span className={`font-bold ${
                            st.overall_attendance < 75 ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                            {st.overall_attendance}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${st.overall_attendance < 75 ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, st.overall_attendance)}%` }}
                          />
                        </div>
                        {st.shortage_courses_count > 0 && (
                          <div className="text-[10px] text-red-600 font-semibold mt-1">
                            ⚠️ {st.shortage_courses_count} course(s) with shortage!
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      <span className="text-[11px] text-[#174A8B] font-semibold group-hover:underline flex items-center gap-1">
                        <span>Inspect Condition</span>
                        <Eye size={12} />
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSendSingleAlert(st.id)
                        }}
                        className="text-[11px] text-red-600 hover:text-white hover:bg-red-600 font-bold px-2 py-0.5 rounded border border-red-200 transition-colors"
                      >
                        Email Alert
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row: Institution Attendance Trend (Line Chart) + Department Analytics Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <BarChart3 size={15} className="text-blue-600" />
                  <span>Attendance Trend (Institution Wide)</span>
                </h3>
                <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  Last 6 Months ▾
                </span>
              </div>

              <div className="py-2">
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={institutionTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748B' }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="average" stroke="#2563EB" strokeWidth={2.5} name="Average Attendance %" />
                    <Line type="monotone" dataKey="below75" stroke="#F59E0B" strokeWidth={2} name="Below 75% Students" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 text-[11px] font-medium text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  <span>Average Attendance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span>Below 75% Students</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 size={15} className="text-indigo-600" />
                  <span>Department Analytics</span>
                </h3>
                <span className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  This Semester ▾
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-2 px-3">Department</th>
                      <th className="py-2 px-3">Students</th>
                      <th className="py-2 px-3">Avg. Attendance</th>
                      <th className="py-2 px-3 text-red-600">At Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {deptAnalytics.map((d: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{d.department}</td>
                        <td className="py-2.5 px-3">{d.total_students}</td>
                        <td className="py-2.5 px-3 font-semibold text-blue-700">{d.avg_attendance}%</td>
                        <td className="py-2.5 px-3 font-bold text-red-600">{d.at_risk_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Student Directory */}
      {activeTab === 'students' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              Students Roster ({detailedStudents.length} Students)
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>{d.code} - {d.name}</option>
                ))}
              </select>

              <button
                onClick={() => setShowAddStudent(true)}
                className="bg-[#174A8B] hover:bg-[#123868] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Roll No</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Section</th>
                  <th className="py-2.5 px-3">Semester</th>
                  <th className="py-2.5 px-3">Attendance</th>
                  <th className="py-2.5 px-3">Risk Level</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {detailedStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{st.full_name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{st.student_id}</td>
                    <td className="py-2.5 px-3">{st.department_code}</td>
                    <td className="py-2.5 px-3 font-semibold">{st.section}</td>
                    <td className="py-2.5 px-3">{st.semester}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-bold ${st.overall_attendance < 75 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {st.overall_attendance}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        st.overall_risk === 'High Concern' ? 'bg-red-100 text-red-700' :
                        st.overall_risk === 'Needs Attention' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {st.overall_risk}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      <button
                        onClick={() => setSelectedStudentForDetail(st)}
                        className="text-[#174A8B] hover:underline font-semibold"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleSendSingleAlert(st.id)}
                        className="text-red-600 hover:underline font-bold"
                      >
                        Send Email
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD STUDENT (Profile Created Automatically + Auto-enroll) */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowAddStudent(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold">✕</button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <GraduationCap size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New Student</h3>
                <p className="text-xs text-slate-500">Student profile and course enrollments are created automatically</p>
              </div>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arun Kumar"
                  value={newStudent.full_name}
                  onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="24cs999@kpriet.ac.in"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student ID / Roll No *</label>
                  <input
                    type="text"
                    required
                    placeholder="24CS999"
                    value={newStudent.student_id}
                    onChange={(e) => setNewStudent({ ...newStudent, student_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={newStudent.department_id}
                    onChange={(e) => setNewStudent({ ...newStudent, department_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section</label>
                  <select
                    value={newStudent.section}
                    onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={newStudent.semester}
                    onChange={(e) => setNewStudent({ ...newStudent, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-all"
                >
                  Create Student & Auto-Enroll in Semester Courses
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD STAFF / PROFESSOR */}
      {showAddProf && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowAddProf(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold">✕</button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Users size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Faculty Member</h3>
                <p className="text-xs text-slate-500">Create professor account with department affiliation</p>
              </div>
            </div>

            <form onSubmit={handleAddProfSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={newProf.full_name}
                  onChange={(e) => setNewProf({ ...newProf, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="rajesh.kumar@kpriet.ac.in"
                    value={newProf.email}
                    onChange={(e) => setNewProf({ ...newProf, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Faculty ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="FAC009"
                    value={newProf.faculty_id}
                    onChange={(e) => setNewProf({ ...newProf, faculty_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newProf.department_id}
                    onChange={(e) => setNewProf({ ...newProf, department_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Section</label>
                  <select
                    value={newProf.section}
                    onChange={(e) => setNewProf({ ...newProf, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                  >
                    <option value="ALL">All Sections (A, B, C, D)</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={newProf.password}
                    onChange={(e) => setNewProf({ ...newProf, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={newProf.phone}
                    onChange={(e) => setNewProf({ ...newProf, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition-all"
                >
                  Create Faculty Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD DEPARTMENT */}
      {showAddDept && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowAddDept(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold">✕</button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Add Department</h3>
            <p className="text-xs text-slate-500 mb-4">Register new academic department</p>

            <form onSubmit={handleAddDeptSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IT, BIOTECH"
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Information Technology"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#174A8B] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow mt-2 transition-all"
              >
                Create Department
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REAL EMAIL (SMTP) CONFIGURATION */}
      {showSmtpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowSmtpModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold">✕</button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Mail size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Email (SMTP) Settings</h3>
                <p className="text-xs text-slate-500">Configure real email sending to student inboxes</p>
              </div>
            </div>

            <form onSubmit={handleSaveSmtp} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={smtpSettings.smtp_host}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_host: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Port</label>
                  <input
                    type="number"
                    value={smtpSettings.smtp_port}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_port: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Your Sender Email (e.g. Gmail)</label>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={smtpSettings.smtp_user}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_user: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Gmail 16-Letter App Password
                </label>
                <input
                  type="password"
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={smtpSettings.smtp_password}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, smtp_password: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Generated in Google Account → Security → 2-Step Verification → App passwords.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <label className="block font-semibold text-slate-700 mb-1">Test Email Delivery</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={testEmailAddr}
                    onChange={(e) => setTestEmailAddr(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={testingSmtp}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs"
                  >
                    {testingSmtp ? 'Sending...' : 'Test Send'}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold text-xs shadow"
                >
                  Save Email Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ONE-CLICK ATTENDANCE SHORTAGE BLAST */}
      {showShortageBlastModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={() => setShowShortageBlastModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold">✕</button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                <Mail size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">One-Click Attendance Shortage Blast</h3>
                <p className="text-xs text-slate-500">Send personalized academic warning emails to all students &lt;75%</p>
              </div>
            </div>

            <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 text-xs text-red-800 space-y-2 mb-4">
              <p className="font-semibold">
                ⚠️ This will scan all students in the database and send an official warning email detailing:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Their registered student roll number and full name</li>
                <li>Each specific subject where attendance is below 75%</li>
                <li>Classes attended vs total sessions and current percentage</li>
                <li>Number of consecutive sessions required to recover eligibility</li>
              </ul>
            </div>

            {shortageResult ? (
              <div className="space-y-3 mb-4">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-bold">
                  ✓ Successfully processed {shortageResult.total_shortage_students} students ({shortageResult.sent_count} emails sent, {shortageResult.failed_count} failed).
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs border border-slate-200 rounded-xl">
                  {shortageResult.students?.map((s: any, idx: number) => (
                    <div key={idx} className="p-2 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{s.name}</span> ({s.roll_number})
                        <div className="text-[10px] text-slate-400">{s.email} • {s.overall_attendance}% att</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${s.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowShortageBlastModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Close
              </button>

              <button
                type="button"
                disabled={blasting}
                onClick={handleExecuteShortageBlast}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow flex items-center justify-center gap-2"
              >
                {blasting ? 'Dispatching Emails...' : 'Send All Warning Emails Now ⚡'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: STUDENT DETAIL & CONDITION DRAWER (Click on Student Profile) */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedStudentForDetail(null)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>

            {/* Student Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-slate-200 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-50 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-slate-700 relative overflow-hidden">
                <span className="text-base font-extrabold text-[#174A8B]">
                  {selectedStudentForDetail.full_name?.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-[9px] font-mono text-slate-400 mt-0.5">image.png</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {selectedStudentForDetail.full_name}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedStudentForDetail.overall_risk === 'High Concern' ? 'bg-red-100 text-red-700' :
                    selectedStudentForDetail.overall_risk === 'Needs Attention' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {selectedStudentForDetail.overall_risk}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedStudentForDetail.student_id} • {selectedStudentForDetail.email}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  <strong>{selectedStudentForDetail.department_name}</strong> • Section {selectedStudentForDetail.section} • Semester {selectedStudentForDetail.semester}
                </p>
              </div>

              {/* Direct Send Single Email */}
              <button
                onClick={() => handleSendSingleAlert(selectedStudentForDetail.id)}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all flex-shrink-0"
              >
                <Mail size={13} />
                <span>Send Alert Email</span>
              </button>
            </div>

            {/* Attendance Condition Breakdown */}
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center justify-between">
                  <span>Course-wise Attendance Condition</span>
                  <span className="font-mono text-slate-500">Overall: {selectedStudentForDetail.overall_attendance}%</span>
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedStudentForDetail.courses?.map((c: any, i: number) => (
                    <div key={i} className="p-3 bg-white flex items-center justify-between hover:bg-slate-50/80">
                      <div>
                        <div className="font-semibold text-slate-900">{c.course_code} - {c.course_name}</div>
                        <div className="text-[11px] text-slate-400">Attended {c.attended} of {c.total_sessions} classes</div>
                      </div>

                      <div className="text-right">
                        <span className={`font-bold text-sm ${c.percentage < 75 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {c.percentage}%
                        </span>
                        <div className={`text-[10px] font-semibold ${c.status === 'Below Threshold' ? 'text-red-500' : 'text-slate-400'}`}>
                          {c.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Risk Reasons & Diagnosis */}
              {selectedStudentForDetail.reasons?.length > 0 && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle size={15} className="text-amber-700" />
                    <span>Academic Diagnosis & Risk Factors</span>
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-amber-800 text-[11px]">
                    {selectedStudentForDetail.reasons.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN PROFILE EDIT MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#174A8B] flex items-center justify-center font-bold">
                <Camera size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Administrator Profile &amp; Pass Card</h3>
                <p className="text-[11px] text-slate-500">Update your details and upload your official pass card photo.</p>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!user) return
                try {
                  const res = await api.patch(`/admin/users/${user.id}`, {
                    full_name: adminFormData.full_name,
                    email: adminFormData.email,
                    phone: adminFormData.phone,
                    profile_image: adminFormData.profile_image,
                  })
                  updateUser(res.data)
                  setToast({ type: 'success', message: 'Administrator profile & photo updated successfully!' })
                  setShowProfileModal(false)
                } catch (err: any) {
                  alert(err?.response?.data?.detail || 'Failed to update profile')
                }
              }}
              className="space-y-4"
            >
              {/* Photo Upload & Preview */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-2">Official Entry Pass Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-24 rounded-xl overflow-hidden border-2 border-[#174A8B]/40 shadow-sm bg-slate-200 flex-shrink-0">
                    <img
                      src={adminFormData.profile_image || '/admin_card.png'}
                      alt="Admin Preview"
                      className="w-full h-full object-cover object-top"
                      onError={(e) => { e.currentTarget.src = '/admin_card.png' }}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold text-xs shadow-xs cursor-pointer">
                      <Upload size={13} />
                      <span>Upload from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageCompressAndSet(file, (compressed) => {
                              setAdminFormData(prev => ({ ...prev, profile_image: compressed }))
                            })
                          }
                        }}
                      />
                    </label>
                    <div>
                      <button
                        type="button"
                        onClick={() => setAdminFormData(prev => ({ ...prev, profile_image: '/admin_card.png' }))}
                        className="text-[11px] text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <RotateCcw size={11} />
                        <span>Reset to Default Photo</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={adminFormData.full_name}
                  onChange={(e) => setAdminFormData({ ...adminFormData, full_name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={adminFormData.phone}
                  onChange={(e) => setAdminFormData({ ...adminFormData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold text-xs shadow cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
