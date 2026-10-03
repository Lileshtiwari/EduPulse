import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { AlertTriangle, Mail, CheckCircle2, ShieldAlert } from 'lucide-react'
import api from '../../lib/api'
import { useT, tStr } from '../../lib/translations'

export default function ProfessorAtRisk() {
  const { t, lang } = useT()
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    api.get('/admin/students-detailed')
      .then(res => {
        // filter students with shortage or concern
        setStudents(res.data.filter((s: any) => s.has_shortage || s.overall_risk !== 'Low Concern'))
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSendAlert = async (id: number) => {
    try {
      const res = await api.post(`/notifications/send-student-alert/${id}`)
      setToast(res.data.message || tStr('Alert email dispatched to student!', 'மாணவருக்கு எச்சரிக்கை மின்னஞ்சல் அனுப்பப்பட்டது!', lang))
      setTimeout(() => setToast(null), 5000)
    } catch (err: any) {
      alert(err?.response?.data?.detail || tStr('Failed to dispatch email', 'மின்னஞ்சல் அனுப்புவதில் தோல்வி', lang))
    }
  }

  return (
    <DashboardLayout>
      {toast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle size={24} className="text-red-600" />
          <span>{t.atRiskStudents || 'At-Risk Students Intervention'}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {tStr('Students flagged for attendance shortage or declining assessment scores requiring faculty guidance.', 'வருகைப் பற்றாக்குறை அல்லது குறைந்த மதிப்பெண்களால் ஆசிரியர்களின் வழிகாட்டுதல் தேவைப்படும் மாணவர்கள்.', lang)}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden text-xs">
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400">{tStr('Scanning for at-risk students...', 'ஆபத்தில் உள்ள மாணவர்களைத் தேடுகிறது...', lang)}</div>
        ) : students.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500">
            {tStr('Great news! No students currently flagged below critical thresholds in your courses.', 'நல்ல செய்தி! உங்கள் பாடங்களில் எந்த மாணவரும் ஆபத்தான வரம்பிற்குக் கீழே இல்லை.', lang)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">{tStr('Student', 'மாணவர்', lang)}</th>
                  <th className="py-3 px-4">{tStr('Roll Number', 'பதிவு எண்', lang)}</th>
                  <th className="py-3 px-4">{tStr('Department', 'துறை', lang)}</th>
                  <th className="py-3 px-4">{tStr('Attendance', 'வருகைப்பதிவு', lang)}</th>
                  <th className="py-3 px-4">{tStr('Risk Level', 'ஆபத்து நிலை', lang)}</th>
                  <th className="py-3 px-4 text-right">{tStr('Intervention Action', 'நடவடிக்கை', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{st.full_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{st.student_id}</td>
                    <td className="py-3 px-4">{st.department_code} • {tStr('Sec', 'பிரிவு', lang)} {st.section}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${st.overall_attendance < 75 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {st.overall_attendance}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        {st.overall_risk === 'High Shortage' ? tStr('High Shortage', 'அதிக பற்றாக்குறை', lang) : st.overall_risk === 'Shortage Risk' ? tStr('Shortage Risk', 'பற்றாக்குறை ஆபத்து', lang) : st.overall_risk}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleSendAlert(st.id)}
                        className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs cursor-pointer"
                      >
                        <Mail size={13} />
                        <span>{tStr('Send Advisory Email', 'அறிவுரை மின்னஞ்சல் அனுப்பு', lang)}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
