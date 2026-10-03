import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card } from '../../components/ui/Card'
import { Badge, getRiskBadgeVariant } from '../../components/ui/Badge'
import { AlertTriangle, CheckCircle, TrendingUp, BookOpen } from 'lucide-react'
import api from '../../lib/api'
import type { RiskAssessment } from '../../types'
import { useT, getLang } from '../../lib/translations'
import { useAuth } from '../../contexts/AuthContext'

export default function AcademicRisk() {
  const { user } = useAuth()
  const { t, lang } = useT(user?.lang_pref || getLang())
  const [risk, setRisk] = useState<RiskAssessment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/students/me/risk').then(r => setRisk(r.data)).finally(() => setLoading(false))
  }, [])

  const getRiskLabel = (val: string) => {
    if (val === 'Low Concern') return t.lowConcern
    if (val === 'Needs Attention') return t.needsAttention
    if (val === 'High Concern') return t.highConcern
    return val
  }

  const riskColors = {
    'Low Concern': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: <CheckCircle size={24} className="text-emerald-600" /> },
    'Needs Attention': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: <AlertTriangle size={24} className="text-amber-600" /> },
    'High Concern': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: <AlertTriangle size={24} className="text-red-600" /> },
  }

  const riskStyle = risk ? (riskColors[risk.overall_risk as keyof typeof riskColors] || riskColors['Low Concern']) : null

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">{t.academicRiskAssessment}</h1>
        <p className="text-sm text-slate-500 mt-1">{t.riskRuleAnalysis}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#174A8B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : risk ? (
        <div className="space-y-6">
          {/* Overall risk card */}
          <div className={`rounded-2xl border-2 p-6 ${riskStyle?.bg} ${riskStyle?.border}`}>
            <div className="flex items-center gap-4">
              {riskStyle?.icon}
              <div>
                <h2 className={`text-xl font-bold ${riskStyle?.text}`}>{getRiskLabel(risk.overall_risk)}</h2>
                <p className={`text-sm mt-0.5 ${riskStyle?.text} opacity-70`}>
                  {risk.reasons.length === 0
                    ? t.noConcernsDetected
                    : (lang === 'ta' ? `${risk.reasons.length} குறைபாடுகள் கண்டறியப்பட்டுள்ளன` : `${risk.reasons.length} concern(s) identified`)}
                </p>
              </div>
              <div className="ml-auto">
                <Badge variant={getRiskBadgeVariant(risk.overall_risk)} className="text-sm px-4 py-1">
                  {getRiskLabel(risk.overall_risk)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Reasons */}
          {risk.reasons.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <span>{t.whyFlagged}</span>
              </h2>
              <div className="space-y-3">
                {risk.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-amber-700">{i + 1}</div>
                    <p className="text-sm text-slate-700">{r}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Attendance Concerns */}
          {risk.attendance_concerns.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-[#174A8B]" />
                <span>{t.attendanceConcerns}</span>
              </h2>
              <div className="space-y-2">
                {risk.attendance_concerns.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                    <span className="text-sm text-slate-700">{c.course}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{c.percentage.toFixed(1)}%</span>
                      <Badge variant={c.severity === 'high' ? 'red' : 'amber'}>{c.severity}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Marks Concerns */}
          {risk.marks_concerns.length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-[#174A8B]" />
                <span>{t.marksConcerns}</span>
              </h2>
              <div className="space-y-2">
                {risk.marks_concerns.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-sm text-slate-700">{c.course}</span>
                      <p className="text-xs text-slate-400">{c.assessment}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{c.percentage.toFixed(1)}%</span>
                      <Badge variant={c.severity === 'high' ? 'red' : 'amber'}>{c.severity}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {risk.reasons.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle size={48} className="mx-auto text-emerald-500 mb-3" />
              <h2 className="text-lg font-semibold text-slate-900">{lang === 'ta' ? 'அனைத்தும் நலம்!' : 'All Good!'}</h2>
              <p className="text-sm text-slate-500 mt-1">{t.noConcernsDetected}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700">
            <p className="font-semibold mb-1">{lang === 'ta' ? 'இந்த மதிப்பீடு பற்றி' : 'About This Assessment'}</p>
            <p>
              {lang === 'ta'
                ? 'இது உங்கள் பதிவு செய்யப்பட்ட வருகை மற்றும் மதிப்பெண்களின் விதி அடிப்படையிலான பகுப்பாய்வு மூலம் உருவாக்கப்பட்ட ஒரு கண்காணிப்பு குறியீடாகும். இது அதிகாரப்பூர்வ இறுதி கல்வி முடிவு அல்ல.'
                : 'This is a monitoring indicator generated by rule-based analysis of your recorded attendance and marks. It is not an official academic decision by KPRIET. For official eligibility, consult your academic records office.'}
            </p>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  )
}
