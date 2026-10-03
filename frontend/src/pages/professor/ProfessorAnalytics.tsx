import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { BarChart3, TrendingUp, Users, AlertTriangle, Mail } from 'lucide-react'
import api from '../../lib/api'
import { useT, tStr } from '../../lib/translations'

export default function ProfessorAnalytics() {
  const { t, lang } = useT()
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/courses')
      .then(res => setCourses(res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 size={24} className="text-[#174A8B]" />
          <span>{t.analytics || 'Student & Class Analytics'}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {tStr('Performance breakdown, attendance distributions, and learning intervention insights.', 'செயல்திறன் பகுப்பாய்வு, வருகை விநியோகம் மற்றும் கற்றல் தலையீட்டு நுண்ணறிவு.', lang)}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400">{tStr('Loading assigned courses & class analytics...', 'பாடப்பிரிவுகள் மற்றும் வகுப்பு பகுப்பாய்வு ஏற்றப்படுகிறது...', lang)}</div>
      ) : courses.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          {tStr('No courses currently assigned to your faculty profile by the Administrator.', 'நிர்வாகியால் உங்கள் சுயவிவரத்திற்கு எந்தப் பாடமும் ஒதுக்கப்படவில்லை.', lang)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono font-bold text-xs bg-blue-50 text-[#174A8B] px-2.5 py-1 rounded-lg">
                    {c.course_code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {tStr('Sec', 'பிரிவு', lang)} {c.section}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mb-1">{c.course_name}</h3>
                <p className="text-xs text-slate-500 mb-4">{c.department_name}</p>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-slate-400 text-[10px]">{tStr('Avg Attendance', 'சராசரி வருகை', lang)}</div>
                    <div className="text-base font-bold text-blue-700">82.4%</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="text-slate-400 text-[10px]">{tStr('Avg IA Score', 'சராசரி IA மதிப்பெண்', lang)}</div>
                    <div className="text-base font-bold text-emerald-700">24.2 / 30</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-emerald-600 font-semibold text-[11px]">{tStr('Pass Rate ≥ 60%', 'தேர்ச்சி விகிதம் ≥ 60%', lang)}</span>
                <span className="text-slate-400 text-[11px]">{tStr('Enrolled', 'பதிவுசெய்யப்பட்டது', lang)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
