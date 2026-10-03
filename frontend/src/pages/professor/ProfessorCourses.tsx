import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { BookOpen, Users, CalendarCheck, ClipboardList, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { useT, getLang } from '../../lib/translations'
import { useAuth } from '../../contexts/AuthContext'

export default function ProfessorCourses() {
  const { user } = useAuth()
  const { t, lang } = useT(user?.lang_pref || getLang())
  const navigate = useNavigate()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/courses')
      .then(res => setCourses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={24} className="text-[#174A8B]" />
            <span>{t.assignedCourses}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'ta'
              ? 'கற்பித்தல், வருகைப் பதிவு மற்றும் மதிப்பீட்டிற்கு உங்களுக்கு ஒதுக்கப்பட்ட நடப்பு பாடங்கள்.'
              : 'Active courses assigned to you for lecture delivery, attendance, and evaluation.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400">
          {lang === 'ta' ? 'பாடங்கள் ஏற்றப்படுகின்றன...' : 'Loading courses...'}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          {lang === 'ta'
            ? 'தற்போது உங்கள் ஆசிரியர் சுயவிவரத்திற்கு பாடங்கள் எதுவும் ஒதுக்கப்படவில்லை.'
            : 'No courses currently assigned to your faculty profile.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <span className="font-mono font-bold text-xs bg-blue-50 text-[#174A8B] px-2.5 py-1 rounded-lg">
                    {c.course_code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    {lang === 'ta' ? 'பிரிவு' : 'Sec'} {c.section}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 mb-1">{c.course_name}</h3>
                <p className="text-xs text-slate-500 mb-4">{c.department_name} • {lang === 'ta' ? 'செமஸ்டர்' : 'Semester'} {c.semester} • {c.credits} {lang === 'ta' ? 'கிரெடிட்கள்' : 'Credits'}</p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <button
                  onClick={() => navigate('/professor/attendance')}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#174A8B] font-semibold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <CalendarCheck size={15} className="text-[#174A8B]" />
                    <span>{t.markAttendance}</span>
                  </span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => navigate('/professor/marks')}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-semibold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ClipboardList size={15} className="text-emerald-600" />
                    <span>{t.enterMarks}</span>
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
