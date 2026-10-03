import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card } from '../../components/ui/Card'
import { Calculator, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react'
import api from '../../lib/api'
import type { AttendanceSummary, BunkImpactResult } from '../../types'
import { useT, getLang } from '../../lib/translations'

export default function BunkCalculator() {
  const { user } = useAuth()
  const { t, lang } = useT(user?.lang_pref || getLang())
  const [courses, setCourses] = useState<AttendanceSummary[]>([])
  const [selectedCourse, setSelectedCourse] = useState<number | ''>('')
  const [proposedMisses, setProposedMisses] = useState(1)
  const [result, setResult] = useState<BunkImpactResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    api.get(`/attendance/summary/student/${user!.id}`)
      .then(r => { setCourses(r.data); if (r.data.length > 0) setSelectedCourse(r.data[0].course_id) })
      .finally(() => setFetching(false))
  }, [user])

  const calculate = async () => {
    if (!selectedCourse) return
    setLoading(true)
    try {
      const r = await api.post('/attendance/calculate-bunk-impact', {
        course_id: selectedCourse,
        proposed_misses: proposedMisses,
      })
      setResult(r.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Auto-calculate on input change
  useEffect(() => {
    if (selectedCourse) calculate()
  }, [selectedCourse, proposedMisses])

  const selected = courses.find(c => c.course_id === selectedCourse)

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator size={22} className="text-[#174A8B]" />
          {t.bunkCalcTitle || 'Bunk Impact Calculator'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t.bunkCalcDesc || 'See how missing future classes will affect your attendance percentage'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
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
                {t.classesToMiss || 'Classes to Miss'}: <span className="text-[#2476C7] font-bold">{proposedMisses}</span>
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={proposedMisses}
                onChange={e => setProposedMisses(Number(e.target.value))}
                className="w-full accent-[#174A8B]"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1</span>
                <span>10</span>
                <span>20</span>
              </div>
            </div>

            {/* Current status */}
            {selected && (
              <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.currentPercentage || 'Current Attendance'}</span>
                  <span className="font-semibold text-slate-900">{selected.attendance_percentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.classesAttended || 'Classes Attended'}</span>
                  <span className="font-semibold text-slate-900">{selected.attended}/{selected.total_sessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t.safeToMiss || 'Safe to Miss'}</span>
                  <span className={`font-semibold ${selected.max_safe_to_miss > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {selected.max_safe_to_miss} {lang === 'ta' ? 'வகுப்புகள்' : 'more'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Result Panel */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-900 mb-4">{t.impactAnalysis || 'Impact Analysis'}</h2>
          {result ? (
            <div className="space-y-4">
              {/* Visual comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`rounded-xl p-4 text-center border-2 ${
                  result.current_percentage >= result.threshold
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
                }`}>
                  <div className="text-xs text-slate-500 mb-1">{t.currentPercentage || 'Current'}</div>
                  <div className={`text-3xl font-bold ${result.current_percentage >= result.threshold ? 'text-emerald-700' : 'text-red-700'}`}>
                    {result.current_percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{result.current_attended}/{result.current_total}</div>
                </div>
                <div className={`rounded-xl p-4 text-center border-2 ${
                  result.is_safe
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-red-200 bg-red-50'
                }`}>
                  <div className="text-xs text-slate-500 mb-1">{t.afterMissing || 'After Missing'} {proposedMisses}</div>
                  <div className={`text-3xl font-bold ${result.is_safe ? 'text-emerald-700' : 'text-red-700'}`}>
                    {result.projected_percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{result.current_attended}/{result.projected_total}</div>
                </div>
              </div>

              {/* Threshold indicator */}
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-4 py-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs text-slate-600">{lang === 'ta' ? 'குறைந்தபட்ச வரம்பு' : 'Threshold'}: <strong>{result.threshold}%</strong></span>
                <span className="text-xs text-slate-400 ml-auto">{t.dropBy || 'Drop'}: {(result.current_percentage - result.projected_percentage).toFixed(1)}%</span>
              </div>

              {/* Result message */}
              {result.is_safe ? (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <CheckCircle size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">{lang === 'ta' ? 'பாதுகாப்பானது' : 'Safe to Miss'}</p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      {lang === 'ta'
                        ? `${proposedMisses} வகுப்புகளைத் தவறவிட்டாலும் உங்கள் வருகை ${result.threshold}% வரம்பிற்கு மேல் இருக்கும்.`
                        : `Skipping ${proposedMisses} class(es) will keep you above the ${result.threshold}% threshold.`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">{lang === 'ta' ? 'பாதுகாப்பற்றது' : 'Not Safe'}</p>
                    <p className="text-xs text-red-600 mt-0.5">{result.warning_message}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              {fetching ? 'Loading courses...' : 'Select a course and adjust the slider above'}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
