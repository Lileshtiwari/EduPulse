import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { CalendarCheck, CheckCircle2, UserCheck, UserX, Save, RefreshCw, Edit3, PlusCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { useT, tStr } from '../../lib/translations'

export default function ProfessorAttendance() {
  const { user } = useAuth()
  const { t, lang } = useT()
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedSection, setSelectedSection] = useState<string>(user?.section || 'ALL')
  const [students, setStudents] = useState<any[]>([])
  const [records, setRecords] = useState<{ [id: number]: 'present' | 'absent' }>({})
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [topic, setTopic] = useState('')
  const [sessionNum, setSessionNum] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Mode: 'new' | 'edit'
  const [mode, setMode] = useState<'new' | 'edit'>('new')
  const [pastSessions, setPastSessions] = useState<any[]>([])
  const [selectedPastSession, setSelectedPastSession] = useState<string>('')

  // Load professor's courses
  useEffect(() => {
    api.get('/courses').then(res => {
      setCourses(res.data)
      if (res.data.length > 0) {
        setSelectedCourse(String(res.data[0].id))
      }
    })
  }, [])

  // Load students and past sessions when selectedCourse changes
  useEffect(() => {
    if (!selectedCourse) return
    loadCourseStudents()
    loadPastSessions()
  }, [selectedCourse])

  const loadCourseStudents = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/courses/${selectedCourse}/students`)
      setStudents(res.data)
      const initial: any = {}
      res.data.forEach((s: any) => { initial[s.id] = 'present' })
      setRecords(initial)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadPastSessions = async () => {
    try {
      const res = await api.get(`/attendance/sessions/${selectedCourse}`)
      setPastSessions(res.data)
      if (res.data.length > 0) {
        setSelectedPastSession(String(res.data[0].id))
      } else {
        setSelectedPastSession('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Load past session details when selectedPastSession changes in edit mode
  useEffect(() => {
    if (mode === 'edit' && selectedPastSession) {
      loadPastSessionDetails(Number(selectedPastSession))
    }
  }, [mode, selectedPastSession])

  const loadPastSessionDetails = async (sessId: number) => {
    setLoading(true)
    try {
      const res = await api.get(`/attendance/sessions/${sessId}/detail`)
      setTopic(res.data.topic || '')
      setSessionDate(res.data.session_date)
      setSessionNum(res.data.session_number)
      
      const loadedRecords: any = {}
      res.data.students.forEach((s: any) => {
        loadedRecords[s.student_id] = s.status
      })
      setRecords(loadedRecords)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleStudent = (id: number) => {
    setRecords(prev => ({
      ...prev,
      [id]: prev[id] === 'present' ? 'absent' : 'present'
    }))
  }

  const displayedStudents = selectedSection === 'ALL'
    ? students
    : students.filter(s => (s.section || 'A').toUpperCase() === selectedSection.toUpperCase())

  const markAll = (status: 'present' | 'absent') => {
    const updated: any = { ...records }
    displayedStudents.forEach(s => { updated[s.id] = status })
    setRecords(updated)
  }

  const handleSave = async () => {
    if (!selectedCourse) return
    setSaving(true)
    try {
      let targetSessionId = selectedPastSession

      if (mode === 'new') {
        const sessRes = await api.post('/attendance/sessions', {
          course_id: Number(selectedCourse),
          session_date: sessionDate,
          session_number: Number(sessionNum),
          topic: topic || 'Regular Lecture',
        })
        targetSessionId = String(sessRes.data.id)
      }

      const bulkList = displayedStudents.map(st => ({
        student_id: st.id,
        status: records[st.id] || 'present',
      }))

      await api.post(`/attendance/sessions/${targetSessionId}/records`, bulkList)
      setToast(mode === 'new' ? 'Attendance session successfully recorded & updated across system!' : 'Past attendance records successfully updated!')
      setTimeout(() => setToast(null), 5000)
      loadPastSessions()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  const presentCount = displayedStudents.filter(s => records[s.id] === 'present').length
  const absentCount = displayedStudents.filter(s => records[s.id] === 'absent').length

  return (
    <DashboardLayout>
      {toast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 size={16} className="flex-shrink-0" />
          <span className="flex-1">{toast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck size={22} className="text-[#174A8B] flex-shrink-0" />
            <span>Attendance Management & Entry Portal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
            Record lecture sessions or edit and rectify past student attendance.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#174A8B] hover:bg-[#123868] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Save size={16} />
          <span>{saving ? tStr('Saving...', 'சேமிக்கிறது...', lang) : mode === 'new' ? tStr('Save Attendance Session', 'வருகை அமர்வைச் சேமி', lang) : tStr('Update Existing Attendance', 'முந்தைய வருகையைப் புதுப்பி', lang)}</span>
        </button>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => { setMode('new'); setTopic(''); setSessionDate(new Date().toISOString().split('T')[0]); loadCourseStudents(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            mode === 'new'
              ? 'bg-[#174A8B] text-white border-[#174A8B] shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <PlusCircle size={15} />
          <span>{tStr('Record New Session', 'புதிய அமர்வைப் பதிவு செய்', lang)}</span>
        </button>
        <button
          type="button"
          onClick={() => { setMode('edit'); if (pastSessions.length > 0) loadPastSessionDetails(Number(pastSessions[0].id)); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            mode === 'edit'
              ? 'bg-[#174A8B] text-white border-[#174A8B] shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Edit3 size={15} />
          <span>{tStr('Edit / Rectify Past Session', 'முந்தைய அமர்வைத் திருத்து', lang)}</span>
        </button>
      </div>

      {/* Course & Session Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs mb-6 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">{tStr('Select Course', 'பாடநெறியைத் தேர்ந்தெடு', lang)}</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.course_code} - {c.course_name} (Sec {c.section})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">{tStr('Assigned Section', 'பிரிவு', lang)}</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white text-slate-800"
            >
              <option value="ALL">{tStr('All Enrolled Sections', 'அனைத்துப் பிரிவுகள்', lang)}</option>
              {['A', 'B', 'C', 'D'].map(sec => (
                <option key={sec} value={sec}>{tStr('Section', 'பிரிவு', lang)} {sec}</option>
              ))}
            </select>
          </div>

          {mode === 'edit' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{tStr('Select Past Session', 'முந்தைய அமர்வைத் தேர்ந்தெடு', lang)}</label>
              <select
                value={selectedPastSession}
                onChange={(e) => {
                  setSelectedPastSession(e.target.value)
                  loadPastSessionDetails(Number(e.target.value))
                }}
                className="w-full px-3 py-2 rounded-xl border border-blue-400 bg-blue-50/50 font-semibold"
              >
                {pastSessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.session_date} — Period {s.session_number} ({s.topic || 'Lecture'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">{tStr('Session Date', 'அமர்வு தேதி', lang)}</label>
            <input
              type="date"
              value={sessionDate}
              disabled={mode === 'edit'}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">{tStr('Period No.', 'பாடவேளை எண்', lang)}</label>
            <input
              type="number"
              min="1"
              max="8"
              value={sessionNum}
              disabled={mode === 'edit'}
              onChange={(e) => setSessionNum(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold bg-white disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div className={mode === 'edit' ? 'sm:col-span-5' : 'sm:col-span-1'}>
            <label className="block font-semibold text-slate-700 mb-1">{tStr('Topic / Chapter', 'தலைப்பு / அத்தியாயம்', lang)}</label>
            <input
              type="text"
              placeholder="e.g. Binary Search Trees"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
            />
          </div>
        </div>

        {/* Counter & Bulk action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              {t.present || 'Present'}: {presentCount}
            </span>
            <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-lg">
              {t.absent || 'Absent'}: {absentCount}
            </span>
            <span className="text-slate-500">
              {tStr('Filtered Students', 'வடிகட்டப்பட்ட மாணவர்கள்', lang)}: {displayedStudents.length} ({tStr('Total', 'மொத்தம்', lang)}: {students.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => markAll('present')}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 cursor-pointer"
            >
              {tStr('Mark All Present', 'அனைவருக்கும் வருகை', lang)}
            </button>
            <button
              type="button"
              onClick={() => markAll('absent')}
              className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 font-semibold hover:bg-red-100 cursor-pointer"
            >
              {tStr('Mark All Absent', 'அனைவருக்கும் விடுப்பு', lang)}
            </button>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400">{tStr('Loading student roster...', 'மாணவர் பட்டியல் ஏற்றப்படுகிறது...', lang)}</div>
        ) : displayedStudents.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-400">
            {students.length === 0
              ? tStr('No students enrolled in this course yet.', 'இந்த பாடத்தில் இதுவரை மாணவர்கள் சேரவில்லை.', lang)
              : tStr(`No students found in Section ${selectedSection}.`, `பிரிவு ${selectedSection}-ல் மாணவர்கள் இல்லை.`, lang)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[500px]">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">{tStr('Roll Number', 'பதிவு எண்', lang)}</th>
                  <th className="py-3 px-4">{tStr('Student Name', 'மாணவர் பெயர்', lang)}</th>
                  <th className="py-3 px-4">{tStr('Section', 'பிரிவு', lang)}</th>
                  <th className="py-3 px-4 text-right">{tStr('Status Action (Click to toggle)', 'நிலை (மாற்ற கிளிக் செய்க)', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedStudents.map((st) => {
                  const isPresent = records[st.id] === 'present'
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{st.student_id || `24CS${String(st.id).padStart(3, '0')}`}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{st.full_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {tStr('Section', 'பிரிவு', lang)} {st.section || 'A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => toggleStudent(st.id)}
                          className={`px-4 py-1.5 rounded-xl font-bold transition-all shadow-2xs cursor-pointer ${
                            isPresent
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          {isPresent ? `✓ ${t.present || 'Present'}` : `✗ ${t.absent || 'Absent'}`}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
