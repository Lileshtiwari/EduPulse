import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card } from '../../components/ui/Card'
import { Badge, getAttendanceBadgeVariant } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'
import {
  CalendarCheck, TrendingUp, AlertTriangle, BarChart2,
  Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, User
} from 'lucide-react'
import api from '../../lib/api'
import type { AttendanceSummary } from '../../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useT, getLang } from '../../lib/translations'

interface DailySession {
  session_id: number
  course_id: number
  course_code: string
  course_name: string
  period: number
  topic: string
  faculty_name: string
  status: 'present' | 'absent' | 'excused'
  session_date: string
  updated_at?: string
}

interface CalendarDateInfo {
  date: string
  total: number
  present: number
  absent: number
  all_present: boolean
}

export default function StudentAttendance() {
  const { user } = useAuth()
  const { t, lang } = useT(user?.lang_pref || getLang())
  const [attendance, setAttendance] = useState<AttendanceSummary[]>([])
  const [loading, setLoading] = useState(true)

  // Daily calendar tracker state
  const [calendarDates, setCalendarDates] = useState<CalendarDateInfo[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [dailySessions, setDailySessions] = useState<DailySession[]>([])
  const [loadingDaily, setLoadingDaily] = useState(false)

  const loadSummary = async () => {
    try {
      const r = await api.get(`/attendance/summary/student/${user!.id}`)
      setAttendance(r.data)
    } catch (err) {
      console.error(err)
    }
  }

  const loadCalendarDates = async () => {
    try {
      const res = await api.get(`/attendance/calendar-dates/student/${user!.id}`)
      setCalendarDates(res.data)
      if (res.data.length > 0 && !selectedDate) {
        setSelectedDate(res.data[0].date)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadDailyAttendance = async (dateStr: string) => {
    if (!dateStr) return
    setLoadingDaily(true)
    try {
      const res = await api.get(`/attendance/daily/student/${user!.id}?date_str=${dateStr}`)
      setDailySessions(res.data.sessions || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDaily(false)
    }
  }

  useEffect(() => {
    Promise.all([loadSummary(), loadCalendarDates()])
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (selectedDate) {
      loadDailyAttendance(selectedDate)
    }
  }, [selectedDate])

  const chartData = attendance.map(a => ({
    name: a.course_code,
    percentage: parseFloat(a.attendance_percentage.toFixed(1)),
    threshold: a.threshold,
  }))

  const getBarColor = (pct: number, threshold: number) => {
    if (pct >= threshold) return '#16865B'
    if (pct >= threshold - 5) return '#E5A13D'
    return '#D64545'
  }

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck size={22} className="text-[#174A8B]" />
            {t.myAttendance || 'My Attendance'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {lang === 'ta'
              ? 'செமஸ்டர் 5 க்கான தினசரி மற்றும் பாட வாரியான வருகைப் பதிவு'
              : 'Daily session tracker and subject-wise metrics for Semester 5'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#174A8B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* DAILY ATTENDANCE TRACKER WITH STYLISH CALENDAR */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#174A8B] flex items-center justify-center font-bold">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {t.dailyAttendanceTitle || 'Daily Attendance Tracker'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {t.dailyAttendanceDesc || 'Pick a date to track period-by-period class attendance'}
                  </p>
                </div>
              </div>

              {/* Stylish Date Picker Input */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">{t.selectDate || 'Select Date'}:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#174A8B] bg-slate-50"
                />
              </div>
            </div>

            {/* Quick Date Selector Pills */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {lang === 'ta' ? 'சமீபத்திய வகுப்புகள்' : 'Recent Recorded Dates'}
                </span>
                <span className="text-xs text-slate-400">
                  {calendarDates.length} {lang === 'ta' ? 'நாட்கள் பதிவு செய்யப்பட்டுள்ளன' : 'sessions available'}
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {calendarDates.slice(0, 14).map((cd) => {
                  const isSelected = cd.date === selectedDate
                  return (
                    <button
                      key={cd.date}
                      onClick={() => setSelectedDate(cd.date)}
                      className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-[#174A8B] text-white border-[#174A8B] shadow-md scale-102'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          cd.all_present ? 'bg-emerald-400' : cd.absent > 0 ? 'bg-red-400' : 'bg-slate-400'
                        }`} />
                        <span>{formatDateDisplay(cd.date)}</span>
                      </div>
                      <div className={`text-[10px] mt-0.5 font-normal ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {cd.present}/{cd.total} {lang === 'ta' ? 'வருகை' : 'attended'}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected Date Summary & Periods */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {formatDateDisplay(selectedDate)}
                  </span>
                  {dailySessions.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#174A8B] border border-blue-200">
                      {dailySessions.filter(s => s.status === 'present').length} / {dailySessions.length} {lang === 'ta' ? 'வகுப்புகள் பங்கேற்றவை' : 'Attended'}
                    </span>
                  )}
                </div>
              </div>

              {loadingDaily ? (
                <div className="py-12 flex justify-center items-center">
                  <div className="w-6 h-6 border-3 border-[#174A8B] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : dailySessions.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CalendarCheck size={36} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">
                    {t.noClassesOnDate || 'No attendance sessions recorded on this date.'}
                  </p>
                  {calendarDates.length > 0 && (
                    <button
                      onClick={() => setSelectedDate(calendarDates[0].date)}
                      className="mt-3 text-xs text-[#174A8B] font-bold hover:underline"
                    >
                      {lang === 'ta' ? 'சமீபத்திய வகுப்புத் தேதியைக் காண்க' : 'Jump to latest recorded date'} ({calendarDates[0].date})
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dailySessions.map((sess) => {
                    const isPresent = sess.status === 'present'
                    return (
                      <div
                        key={sess.session_id}
                        className={`p-4 rounded-xl border transition-all ${
                          isPresent
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-red-50/50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                            {t.period || 'Period'} {sess.period}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {isPresent ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                            <span>{isPresent ? (t.present || 'Present') : (t.absent || 'Absent')}</span>
                          </span>
                        </div>

                        <div className="font-bold text-slate-900 text-xs">
                          {sess.course_name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {sess.course_code}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate">{sess.topic}</span>
                          <span className="flex-shrink-0 font-medium text-slate-700 ml-2">
                            {sess.faculty_name}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <Card className="mb-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-[#174A8B]" />
              {t.subjectWiseAttendance || 'Attendance by Subject'}
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: any) => [`${v}%`, 'Attendance']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={getBarColor(entry.percentage, entry.threshold)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 justify-center">
              <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 rounded-sm bg-[#16865B]" />{t.onTrack || 'On Track'}</div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 rounded-sm bg-[#E5A13D]" />{t.nearThreshold || 'Near Threshold'}</div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 rounded-sm bg-[#D64545]" />{t.belowThreshold || 'Below Threshold'}</div>
            </div>
          </Card>

          {/* Detail Table */}
          <Card padding={false}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                {lang === 'ta' ? 'முழுமையான பாட வருகைப் பதிவு' : 'Detailed Attendance Record'}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-500">{t.subject || 'Subject'}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">{lang === 'ta' ? 'நடத்தப்பட்டவை' : 'Conducted'}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">{t.attended || 'Attended'}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">{t.missed || 'Missed'}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">{lang === 'ta' ? 'சதவீதம்' : 'Percentage'}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">{t.progress || 'Progress'}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">{t.safeToMiss || 'Safe to Miss'}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">{t.status || 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {attendance.map((a) => (
                    <tr key={a.course_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900 text-xs">{a.course_name}</div>
                        <div className="text-slate-400 text-xs mt-0.5">{a.course_code}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm font-medium text-slate-700">{a.total_sessions}</td>
                      <td className="px-4 py-3.5 text-center text-sm font-medium text-emerald-600">{a.attended}</td>
                      <td className="px-4 py-3.5 text-center text-sm font-medium text-red-500">{a.missed}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-sm font-bold ${
                          a.attendance_percentage >= a.threshold ? 'text-emerald-600' :
                          a.attendance_percentage >= a.threshold - 5 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {a.total_sessions > 0 ? `${a.attendance_percentage.toFixed(1)}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="w-32">
                          <ProgressBar value={a.attendance_percentage} threshold={a.threshold} height={6} />
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-sm font-semibold ${a.max_safe_to_miss > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {a.max_safe_to_miss}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Badge variant={getAttendanceBadgeVariant(a.status)}>{a.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Warnings */}
          {attendance.filter(a => a.status === 'Below Threshold').length > 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">{lang === 'ta' ? 'வருகை எச்சரிக்கை' : 'Attendance Alert'}</p>
                  <p className="text-xs text-red-600 mt-1">
                    {lang === 'ta'
                      ? `நீங்கள் ${attendance.filter(a => a.status === 'Below Threshold').length} பாடங்களில் 75% வரம்பிற்குக் கீழே உள்ளீர்கள். வருகையை மேம்படுத்த மீட்புக் கணிப்பானைப் பயன்படுத்தவும்.`
                      : `You are below the 75% threshold in ${attendance.filter(a => a.status === 'Below Threshold').length} subject(s). Use the Recovery Calculator to plan how many classes you need to attend to recover.`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
