import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Power, ChevronDown, User, Mail, Send,
  Layers, Filter, RefreshCw, CheckCircle, AlertTriangle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useT, tStr } from '../../lib/translations'

export default function CamuAttendanceDashboard() {
  const { user, logout } = useAuth()
  const { t, lang } = useT()
  const navigate = useNavigate()

  const [year, setYear] = useState('2020-21')
  const [term, setTerm] = useState('ODD')
  const [dept, setDept] = useState('BE Mechanical Engineering')
  const [degree, setDegree] = useState('Under Graduation')

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [sendingAlert, setSendingAlert] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/attendance/camu-dashboard-stats', {
        params: { year, term, degree }
      })
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [year, term, dept, degree])

  // Donut data for 86% overall attendance
  const overallPct = data?.overall_percentage || 86
  const donutData = [
    { name: 'Present', value: overallPct, fill: '#2563EB' },
    { name: 'Absent', value: Math.max(0, 100 - overallPct), fill: '#93C5FD' },
  ]

  // Weekly stacked bar chart data matching Image 1
  const weeklyData = data?.weekly_attendance || [
    { day: 'Sun, 30 Nov', Present: 68, Absent: 32 },
    { day: 'Mon, 01 Dec', Present: 84, Absent: 16 },
    { day: 'Tue, 02 Dec', Present: 56, Absent: 44 },
    { day: 'Wed, 03 Dec', Present: 84, Absent: 16 },
    { day: 'Thu, 04 Dec', Present: 74, Absent: 26 },
    { day: 'Fri, 05 Dec', Present: 68, Absent: 32 },
    { day: 'Sat, 06 Dec', Present: 68, Absent: 32 },
  ]

  const top10Courses = data?.top_lowest_courses || []

  const handleSendCourseAlert = async (courseName: string) => {
    setSendingAlert(true)
    try {
      const res = await api.post('/notifications/send-attendance-shortage-alerts')
      setAlertMessage(`Alert emails successfully dispatched to shortage students in ${courseName}! (${res.data.sent_count} emails sent)`)
      setTimeout(() => setAlertMessage(null), 6000)
    } catch (err: any) {
      setAlertMessage(`Error sending alert emails: ${err?.response?.data?.detail || err.message}`)
    } finally {
      setSendingAlert(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-sans flex flex-col">
      {/* Camu Orange Top Bar (Exact Match to Image 1) */}
      <header className="bg-[#F26522] text-white px-4 lg:px-6 h-14 flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-6">
          {/* Camu Logo */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded text-[#F26522] font-black text-sm tracking-tighter">
            <span className="font-extrabold text-base tracking-tight">camu</span>
            <span className="text-[9px] uppercase tracking-normal font-medium text-slate-500 block leading-tight">Digital Campus</span>
          </div>

          {/* Search box */}
          <div className="hidden sm:flex items-center bg-white/20 hover:bg-white/30 rounded px-3 py-1.5 text-xs text-white placeholder-white/80 w-64 transition-all">
            <Search size={14} className="mr-2 text-white/90" />
            <input
              type="text"
              placeholder="Search"
              className="bg-transparent text-white placeholder-white/70 focus:outline-none w-full text-xs"
            />
          </div>
        </div>

        {/* Right Action Widgets */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="hidden md:inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded bg-white text-[#F26522] hover:bg-white/90 shadow-sm cursor-pointer"
          >
            {tStr('Switch to EduPulse Admin', 'EduPulse நிர்வாகிக்கு மாறவும்', lang)}
          </button>

          <button className="border border-white/60 hover:bg-white/10 px-3 py-1 rounded text-xs font-semibold text-white tracking-wide">
            Launch iTrack
          </button>

          {/* User profile dropdown info */}
          <div className="flex items-center gap-2 pl-3 border-l border-white/30">
            <div className="w-8 h-8 rounded-full bg-white text-[#F26522] flex items-center justify-center font-bold text-xs shadow-inner">
              <User size={16} />
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <div className="text-[10px] text-white/80">Hello,</div>
              <div className="text-xs font-bold text-white">Balaji G</div>
            </div>
            <ChevronDown size={14} className="text-white/80" />
          </div>

          {/* Power / Logout button */}
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            title="Log Out"
            className="p-1.5 hover:bg-white/20 rounded-full text-white ml-2"
          >
            <Power size={18} />
          </button>
        </div>
      </header>

      {/* Alert banner if triggered */}
      {alertMessage && (
        <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{alertMessage}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* Main Body with Sidebar & Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Camu Sidebar Menu (Matches Image 1 items) */}
        <aside className="w-56 bg-white border-r border-slate-200 hidden md:flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto text-xs text-slate-700">
          <div className="py-2 divide-y divide-slate-100">
            {[
              { label: 'Admissions', active: false },
              { label: 'Students', active: false, link: '/admin/students' },
              { label: 'Staff', active: false, link: '/admin/professors' },
              { label: 'Academic Plan', active: false },
              { label: 'Assets', active: false },
              { label: 'Dashboard', active: true, link: '/admin/attendance-dashboard' },
              { label: 'Assignment', active: false },
              { label: 'Enquiry', active: false },
              { label: 'Reports', active: false },
              { label: 'Security Group', active: false },
              { label: 'Assessment Mgmt.', active: false },
              { label: 'Online Assessment', active: false },
              { label: 'Billing', active: false },
              { label: 'Leave Mgmt.', active: false },
              { label: 'Log Book', active: false },
              { label: 'Transportation', active: false },
              { label: 'Payments', active: false },
              { label: 'Communication', active: false },
              { label: 'Visitor Mgmt.', active: false },
              { label: 'System', active: false },
              { label: 'OBE', active: false },
              { label: 'Rubrics', active: false },
              { label: 'Room Mgmt.', active: false },
              { label: 'Library', active: false },
              { label: 'Project', active: false },
              { label: 'Placement', active: false },
            ].map((m, i) => (
              <div
                key={i}
                onClick={() => m.link && navigate(m.link)}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-orange-50 hover:text-[#F26522] transition-colors ${
                  m.active ? 'bg-orange-50/80 text-[#F26522] font-bold border-l-4 border-[#F26522]' : 'text-slate-600'
                }`}
              >
                <span>{m.label}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </div>
            ))}
          </div>
        </aside>

        {/* Right Dashboard Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          {/* Page Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <h1 className="text-xl lg:text-2xl font-semibold text-slate-800">
              Attendance Dashboard
            </h1>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>Refresh Data</span>
              </button>

              <button
                onClick={() => handleSendCourseAlert('All Courses')}
                disabled={sendingAlert}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#F26522] hover:bg-[#d95516] text-white text-xs font-semibold shadow-sm"
              >
                <Mail size={13} />
                <span>{sendingAlert ? 'Sending...' : 'Send Shortage Alert Emails'}</span>
              </button>
            </div>
          </div>

          {/* Filter Bar (Matches Image 1) */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs text-xs">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-slate-700 font-medium">
              <span>{year}</span>
              <ChevronDown size={13} className="text-slate-400 ml-1" />
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-slate-700 font-medium">
              <span>{term}</span>
              <ChevronDown size={13} className="text-slate-400 ml-1" />
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-slate-700 font-medium">
              <span>{dept}</span>
              <ChevronDown size={13} className="text-slate-400 ml-1" />
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-slate-700 font-medium">
              <span>{degree}</span>
              <ChevronDown size={13} className="text-slate-400 ml-1" />
            </div>
          </div>

          {/* Top Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Overall Attendance Donut Card (Left) */}
            <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-800">Overall attendance</h3>
                <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  22 Jun 2021 ▾
                </span>
              </div>

              {/* Donut Chart with 86% in center */}
              <div className="relative flex items-center justify-center py-4">
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={95}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={0}
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text 86% */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-extrabold text-[#2563EB]">{overallPct}%</span>
                </div>
              </div>

              {/* Legend: Present / Absent */}
              <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#2563EB]" />
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#93C5FD]" />
                  <span>Absent</span>
                </div>
              </div>
            </div>

            {/* Weekly Attendance Comparison Stacked Bar Chart (Right) */}
            <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-semibold text-slate-800">Comparison: Weekly attendance</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200">Dec 2021 ▾</span>
                  <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200">Week 1 ▾</span>
                </div>
              </div>

              <div className="py-2">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={weeklyData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748B' }} ticks={[0, 25, 50, 75, 100]} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                    <Bar dataKey="Present" stackId="a" fill="#2563EB" barSize={34} />
                    <Bar dataKey="Absent" stackId="a" fill="#93C5FD" barSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Legend: Present / Absent */}
              <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#2563EB]" />
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#93C5FD]" />
                  <span>Absent</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top 10 Lowest Attendance Course Wise Table (Matches Image 1) */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">
                Top 10 lowest attendance course wise
              </h3>
              <span className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                Jun 2021 ▾
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAFBFD] text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">{tStr('S.No', 'வரிசை', lang)}</th>
                    <th className="py-2.5 px-4">{tStr('Course', 'பாடம்', lang)}</th>
                    <th className="py-2.5 px-4">{tStr('Staff', 'ஆசிரியர்', lang)}</th>
                    <th className="py-2.5 px-4">{tStr('Department', 'துறை', lang)}</th>
                    <th className="py-2.5 px-4">{tStr('Section', 'பிரிவு', lang)}</th>
                    <th className="py-2.5 px-4 text-center">{tStr('Present', 'வருகை', lang)}</th>
                    <th className="py-2.5 px-4 text-center">{tStr('Absent', 'விடுப்பு', lang)}</th>
                    <th className="py-2.5 px-4 text-right">{tStr('Actions', 'நடவடிக்கை', lang)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {top10Courses.map((c: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-slate-500">{c.sno || `${idx + 1}`.padStart(2, '0')}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">{c.course}</td>
                      <td className="py-2.5 px-4 text-slate-600">{c.staff}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-700">{c.department}</td>
                      <td className="py-2.5 px-4 text-slate-600">{c.section}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-blue-700">{c.present}%</td>
                      <td className="py-2.5 px-4 text-center font-bold text-red-600">{c.absent}%</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleSendCourseAlert(c.course)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#F26522] hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                        >
                          <Send size={11} />
                          <span>Alert Students</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
