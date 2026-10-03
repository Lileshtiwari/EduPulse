import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { ClipboardList, Plus, Save, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { useT, tStr } from '../../lib/translations'

export default function ProfessorMarks() {
  const { user } = useAuth()
  const { t, lang } = useT()
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedSection, setSelectedSection] = useState<string>(user?.section || 'ALL')
  const [assessments, setAssessments] = useState<any[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<string>('')
  const [students, setStudents] = useState<any[]>([])
  const [marks, setMarks] = useState<{ [studentId: number]: number }>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // New assessment modal
  const [showNewAssess, setShowNewAssess] = useState(false)
  const [newAssessName, setNewAssessName] = useState('IA 2')
  const [newAssessType, setNewAssessType] = useState('internal')
  const [newAssessMax, setNewAssessMax] = useState(30)

  useEffect(() => {
    api.get('/courses').then(res => {
      setCourses(res.data)
      if (res.data.length > 0) setSelectedCourse(String(res.data[0].id))
    })
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    api.get(`/marks/assessments/course/${selectedCourse}`)
      .then(res => {
        setAssessments(res.data)
        if (res.data.length > 0) setSelectedAssessment(String(res.data[0].id))
        else setSelectedAssessment('')
      })
  }, [selectedCourse])

  useEffect(() => {
    if (!selectedCourse) return
    setLoading(true)
    api.get(`/courses/${selectedCourse}/students`)
      .then(res => {
        setStudents(res.data)
        const initial: any = {}
        res.data.forEach((s: any) => { initial[s.id] = 24 })
        setMarks(initial)
      })
      .finally(() => setLoading(false))
  }, [selectedCourse])

  // Load existing marks whenever selectedAssessment changes
  useEffect(() => {
    if (!selectedAssessment) return
    api.get(`/marks/assessments/${selectedAssessment}/marks`)
      .then(res => {
        if (res.data && res.data.length > 0) {
          const loaded: any = {}
          res.data.forEach((m: any) => {
            loaded[m.student_id] = m.marks_obtained
          })
          setMarks(prev => ({ ...prev, ...loaded }))
        }
      })
      .catch(console.error)
  }, [selectedAssessment])

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await api.post('/marks/assessments', {
        course_id: Number(selectedCourse),
        assessment_name: newAssessName,
        assessment_type: newAssessType,
        max_marks: Number(newAssessMax),
      })
      setAssessments(prev => [...prev, res.data])
      setSelectedAssessment(String(res.data.id))
      setShowNewAssess(false)
      setToast('Assessment created successfully!')
      setTimeout(() => setToast(null), 4000)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create assessment')
    }
  }

  const displayedStudents = selectedSection === 'ALL'
    ? students
    : students.filter(s => (s.section || 'A').toUpperCase() === selectedSection.toUpperCase())

  const handleSaveMarks = async () => {
    if (!selectedAssessment) {
      alert('Please create or select an assessment first')
      return
    }
    setSaving(true)
    try {
      const bulkPayload = displayedStudents.map(st => ({
        student_id: st.id,
        marks_obtained: Number(marks[st.id] ?? 0),
      }))
      await api.post(`/marks/assessments/${selectedAssessment}/marks/bulk`, bulkPayload)
      setToast('Marks saved & updated across portal successfully!')
      setTimeout(() => setToast(null), 5000)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to save marks')
    } finally {
      setSaving(false)
    }
  }

  const currentAssess = assessments.find(a => String(a.id) === selectedAssessment)

  return (
    <DashboardLayout>
      {toast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList size={24} className="text-[#174A8B]" />
            <span>{t.marksEntry || 'Marks & Evaluation Entry'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {tStr('Record scores for Internal Assessments (IA), Model Exams, and lab work. Minimum Passing Mark: 60%.', 'உள் மதிப்பீடுகள் (IA), மாதிரித் தேர்வுகள் மற்றும் ஆய்வக மதிப்பெண்களைப் பதிவு செய்க. குறைந்தபட்ச தேர்ச்சி மதிப்பெண்: 60%.', lang)}
          </p>
        </div>

        <button
          onClick={handleSaveMarks}
          disabled={saving}
          className="bg-[#174A8B] hover:bg-[#123868] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Save size={16} />
          <span>{saving ? tStr('Saving...', 'சேமிக்கிறது...', lang) : tStr('Save All Marks', 'அனைத்து மதிப்பெண்களையும் சேமி', lang)}</span>
        </button>
      </div>

      {/* Selectors */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs mb-6 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">{tStr('Select Course', 'பாடநெறியைத் தேர்ந்தெடு', lang)}</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>
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

          <div>
            <label className="block font-semibold text-slate-700 mb-1">{tStr('Assessment', 'மதிப்பீடு', lang)}</label>
            <select
              value={selectedAssessment}
              onChange={(e) => setSelectedAssessment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
            >
              {assessments.map(a => (
                <option key={a.id} value={a.id}>{a.assessment_name} ({tStr('Max', 'அதிகபட்சம்', lang)}: {a.max_marks})</option>
              ))}
              {assessments.length === 0 && <option value="">{tStr('No assessments found', 'மதிப்பீடுகள் ஏதுமில்லை', lang)}</option>}
            </select>
          </div>

          <div>
            <button
              onClick={() => setShowNewAssess(true)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>{tStr('Create New Assessment', 'புதிய மதிப்பீட்டை உருவாக்கு', lang)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Marks Table */}
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
            <table className="w-full text-xs text-left min-w-[550px]">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">{tStr('Roll Number', 'பதிவு எண்', lang)}</th>
                  <th className="py-3 px-4">{tStr('Student Name', 'மாணவர் பெயர்', lang)}</th>
                  <th className="py-3 px-4">{tStr('Section', 'பிரிவு', lang)}</th>
                  <th className="py-3 px-4 text-center">{tStr('Marks Obtained', 'பெற்ற மதிப்பெண்கள்', lang)} ({tStr('Max', 'அதிகபட்சம்', lang)}: {currentAssess?.max_marks || 30})</th>
                  <th className="py-3 px-4 text-center">{tStr('Score Status (Min 60% to Pass)', 'நிலை (குறைந்தது 60% தேர்ச்சி)', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedStudents.map((st) => {
                  const markVal = marks[st.id] ?? 0
                  const maxVal = currentAssess?.max_marks || 30
                  const pct = Math.round((markVal / maxVal) * 100)
                  const isPass = pct >= 60
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{st.student_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{st.full_name}</td>
                      <td className="py-3 px-4 text-slate-500">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {tStr('Section', 'பிரிவு', lang)} {st.section || 'A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max={maxVal}
                          value={markVal}
                          onChange={(e) => setMarks({ ...marks, [st.id]: Number(e.target.value) })}
                          className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-center font-bold text-slate-900 focus:ring-2 focus:ring-[#174A8B]"
                        />
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] ${
                          isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {pct}% — {isPass ? (t.pass || 'Pass') : `${t.fail || 'Fail'} (<60%)`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showNewAssess && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-xs">
            <button onClick={() => setShowNewAssess(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold">✕</button>

            <h3 className="text-base font-bold text-slate-900 mb-1">{tStr('Create Assessment', 'மதிப்பீட்டை உருவாக்கு', lang)}</h3>
            <p className="text-slate-500 mb-4">{tStr('Add exam or test for evaluation', 'மதிப்பீட்டிற்கான தேர்வு அல்லது சோதனையைச் சேர்', lang)}</p>

            <form onSubmit={handleCreateAssessment} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{tStr('Assessment Name *', 'மதிப்பீட்டின் பெயர் *', lang)}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IA 2, Model Exam"
                  value={newAssessName}
                  onChange={(e) => setNewAssessName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{tStr('Maximum Marks', 'அதிகபட்ச மதிப்பெண்கள்', lang)}</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newAssessMax}
                  onChange={(e) => setNewAssessMax(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold text-xs shadow mt-2 cursor-pointer"
              >
                {tStr('Create Assessment', 'மதிப்பீட்டை உருவாக்கு', lang)}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
