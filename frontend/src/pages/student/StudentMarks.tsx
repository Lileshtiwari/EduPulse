import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { GraduationCap } from 'lucide-react'
import api from '../../lib/api'
import type { Mark } from '../../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useT, getLang } from '../../lib/translations'

export default function StudentMarks() {
  const { user } = useAuth()
  const { t, lang } = useT(user?.lang_pref || getLang())
  const [marks, setMarks] = useState<Mark[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/marks/student/${user!.id}`)
      .then(r => setMarks(r.data))
      .finally(() => setLoading(false))
  }, [user])

  // Group by course
  const byCourse: Record<string, Mark[]> = {}
  marks.forEach(m => {
    const key = m.course_name || 'Unknown'
    if (!byCourse[key]) byCourse[key] = []
    byCourse[key].push(m)
  })

  const chartData = marks.map(m => ({
    name: `${m.assessment_name?.slice(0, 6)} - ${m.course_name?.slice(0, 8)}`,
    obtained: m.marks_obtained,
    max: m.max_marks,
    percentage: m.percentage,
  }))

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap size={22} className="text-[#174A8B]" />
          <span>{t.myMarks}</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {lang === 'ta' ? 'செமஸ்டர் 5 தேர்வு மதிப்பெண்கள்' : 'Assessment-wise marks for Semester 5'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#174A8B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {chartData.length > 0 && (
            <Card className="mb-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">{t.marksOverview}</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: any, name: any) => [v, name === 'obtained' ? (lang === 'ta' ? 'மதிப்பெண்' : 'Marks') : (lang === 'ta' ? 'அதிகபட்சம்' : 'Max')]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="obtained" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={(entry.percentage || 0) >= 60 ? '#16865B' : '#D64545'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {Object.entries(byCourse).map(([courseName, courseMarks]) => {
            const totalObtained = courseMarks.reduce((s, m) => s + m.marks_obtained, 0)
            const totalMax = courseMarks.reduce((s, m) => s + (m.max_marks || 0), 0)
            const overallPct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
            const isPassing = overallPct >= 60

            return (
              <Card key={courseName} className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{courseName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {lang === 'ta' ? 'மொத்தம்' : 'Total'}: {totalObtained.toFixed(1)}/{totalMax} ({overallPct.toFixed(1)}%) • {t.passingRequirement}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${isPassing ? 'text-emerald-600' : 'text-red-600'}`}>
                      {overallPct.toFixed(1)}%
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPassing ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {isPassing ? t.pass : t.below60Fail}
                    </span>
                  </div>
                </div>
                <div className="mb-4">
                  <ProgressBar value={overallPct} height={6} />
                </div>
                <div className="space-y-3">
                  {courseMarks.map(m => (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium text-slate-700">{m.assessment_name}</span>
                          <span className="text-xs text-slate-500">{m.marks_obtained}/{m.max_marks}</span>
                        </div>
                        <ProgressBar value={m.percentage || 0} height={4} />
                      </div>
                      <div className={`text-xs font-bold w-20 text-right ${(m.percentage || 0) >= 60 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {m.percentage?.toFixed(0)}% {(m.percentage || 0) >= 60 ? '✓' : '✗'}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })}

          {marks.length === 0 && (
            <Card className="text-center py-12">
              <GraduationCap size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">{t.noMarksAvailable}</p>
            </Card>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
