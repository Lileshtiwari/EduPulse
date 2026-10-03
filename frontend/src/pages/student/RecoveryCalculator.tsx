import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card } from '../../components/ui/Card'
import { TrendingUp, CheckCircle, AlertTriangle, Target } from 'lucide-react'
import api from '../../lib/api'
import type { AttendanceSummary, RecoveryResult } from '../../types'
import { useT, getLang } from '../../lib/translations'

export default function RecoveryCalculator() {
  const { user } = useAuth()
  const { t, lang } = useT(user?.lang_pref || getLang())
  const [courses, setCourses] = useState<AttendanceSummary[]>([])
  const [selectedCourse, setSelectedCourse] = useState<number | ''>('')
  const [targetPct, setTargetPct] = useState(75)
  const [result, setResult] = useState<RecoveryResult | null>(null)

  useEffect(() => {
    api.get(`/attendance/summary/student/${user!.id}`)
      .then(r => { setCourses(r.data); if (r.data.length > 0) setSelectedCourse(r.data[0].course_id) })
  }, [user])

  useEffect(() => {
    if (selectedCourse) {
      api.post('/attendance/calculate-recovery', {
        course_id: selectedCourse,
        target_percentage: targetPct,
      }).then(r => setResult(r.data)).catch(() => {})
    }
  }, [selectedCourse, targetPct])

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp size={22} className="text-[#16865B]" />
          {t.recoveryTitle || 'Attendance Recovery Calculator'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t.recoveryDesc || 'Find out how many classes you need to attend to reach your target'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-sm font-semibold text-slate-900 mb-4">{t.configure || 'Configure'}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.selectSubject || 'Select Subject'}</label>
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2476C7] bg-white font-medium"
              >
                {courses.map(c => (
                  <option key={c.course_id} value={c.course_id}>
                    {c.course_name} ({c.course_code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.targetThreshold || 'Target'}: <span className="text-[#16865B] font-bold">{targetPct}%</span>
              </label>
              <input
                type="range" min={50} max={100} step={1}
                value={targetPct}
                onChange={e => setTargetPct(Number(e.target.value))}
                className="w-full accent-[#16865B]"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>50%</span><span>75% ({lang === 'ta' ? 'தேவையானது' : 'Required'})</span><span>100%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-900 mb-4">{t.recoveryPlan || 'Recovery Plan'}</h2>
          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Current', value: `${result.current_percentage.toFixed(1)}%`, color: 'text-slate-900' },
                  { label: 'Target', value: `${result.target_percentage}%`, color: 'text-[#16865B]' },
                  { label: 'Classes Needed', value: result.is_already_at_target ? '0 ✓' : result.is_impossible ? '∞' : String(result.classes_needed), color: result.is_already_at_target ? 'text-emerald-600' : result.is_impossible ? 'text-red-600' : 'text-[#174A8B]' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className={`rounded-xl px-4 py-3 border flex items-start gap-3 ${
                result.is_already_at_target ? 'bg-emerald-50 border-emerald-200' :
                result.is_impossible ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
              }`}>
                {result.is_already_at_target
                  ? <CheckCircle size={16} className="text-emerald-600 mt-0.5" />
                  : result.is_impossible
                  ? <AlertTriangle size={16} className="text-red-600 mt-0.5" />
                  : <Target size={16} className="text-[#174A8B] mt-0.5" />}
                <p className={`text-sm ${
                  result.is_already_at_target ? 'text-emerald-800' :
                  result.is_impossible ? 'text-red-800' : 'text-[#172B4D]'
                }`}>
                  {result.message}
                </p>
              </div>

              {!result.is_already_at_target && !result.is_impossible && result.classes_needed !== undefined && (
                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 rounded-xl p-4">
                  <p className="font-medium text-slate-800">After attending {result.classes_needed} consecutive classes:</p>
                  <div className="flex justify-between">
                    <span>New Attended</span>
                    <span className="font-semibold">{result.current_attended + result.classes_needed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Total</span>
                    <span className="font-semibold">{result.current_total + result.classes_needed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Percentage</span>
                    <span className="font-semibold text-emerald-600">
                      {(((result.current_attended + result.classes_needed) / (result.current_total + result.classes_needed)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Select a course above</div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
