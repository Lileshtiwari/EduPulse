import React, { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card } from '../../components/ui/Card'
import { Mic, MicOff, CheckCircle, AlertTriangle, Loader2, Save, RotateCcw } from 'lucide-react'
import api from '../../lib/api'
import type { Course, Assessment } from '../../types'
import { useT, tStr } from '../../lib/translations'

// Browser Speech Recognition typing
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

function wordsToNumber(text: string): number | null {
  const words: Record<string, number> = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
    eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
    fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
    nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
    sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
  }
  const lower = text.toLowerCase().trim()
  // Try direct number first
  const n = parseFloat(lower)
  if (!isNaN(n)) return n
  // Try word mapping
  if (words[lower] !== undefined) return words[lower]
  // Try compound like "twenty five"
  const parts = lower.split(' ')
  let total = 0
  for (const p of parts) {
    if (words[p] !== undefined) total += words[p]
  }
  return total > 0 ? total : null
}

export default function VoiceMarksEntry() {
  const { t, lang } = useT()
  const [courses, setCourses] = useState<Course[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedAssessment, setSelectedAssessment] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [marks, setMarks] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [status, setStatus] = useState<'idle' | 'listening' | 'recognized' | 'confirmed' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState('')

  useEffect(() => {
    setHasSpeechSupport(!!(window.SpeechRecognition || window.webkitSpeechRecognition))
    api.get('/courses').then(r => setCourses(r.data))
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      api.get(`/marks/courses/${selectedCourse}/assessments`).then(r => setAssessments(r.data))
      api.get(`/courses/${selectedCourse}/students`).then(r => setStudents(r.data))
      setSelectedAssessment('')
      setSelectedStudent('')
    }
  }, [selectedCourse])

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setIsListening(true)
    setStatus('listening')
    setTranscript('')

    recognition.onresult = (e: any) => {
      const spoken = e.results[0][0].transcript
      setTranscript(spoken)
      const parsed = wordsToNumber(spoken)
      if (parsed !== null) {
        setMarks(String(parsed))
        setStatus('recognized')
      } else {
        setStatus('error')
        setErrorMsg(`Could not parse "${spoken}" as a number. Please edit manually.`)
      }
      setIsListening(false)
    }

    recognition.onerror = (e: any) => {
      setStatus('error')
      setErrorMsg(`Microphone error: ${e.error}`)
      setIsListening(false)
    }

    recognition.onend = () => setIsListening(false)
    recognition.start()
  }, [])

  const selectedAssessmentObj = assessments.find(a => String(a.id) === selectedAssessment)

  const saveMarks = async () => {
    if (!selectedAssessment || !selectedStudent || !marks) return
    const parsed = parseFloat(marks)
    if (isNaN(parsed) || parsed < 0) return setErrorMsg('Invalid marks value')
    if (selectedAssessmentObj && parsed > selectedAssessmentObj.max_marks) {
      return setErrorMsg(`Marks exceed maximum (${selectedAssessmentObj.max_marks})`)
    }
    setSaving(true)
    try {
      await api.post(`/marks/assessments/${selectedAssessment}/marks`, [
        { student_id: Number(selectedStudent), marks_obtained: parsed }
      ])
      setStatus('saved')
      setSavedFeedback(`Saved ${parsed}/${selectedAssessmentObj?.max_marks} for ${students.find(s => String(s.id) === selectedStudent)?.full_name}`)
      setMarks('')
      setTranscript('')
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.detail || 'Failed to save marks')
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Mic size={22} className="text-purple-600" />
          <span>{tStr('Voice-Assisted Marks Entry', 'குரல் வழி மதிப்பெண் பதிவு', lang)}</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {tStr('Speak the marks value — review, confirm, then save', 'மதிப்பெண்களைக் கூறுங்கள் — சரிபார்த்து, உறுதிசெய்து சேமிக்கவும்', lang)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-900 mb-4">{tStr('Select Course & Student', 'பாடநெறி & மாணவரைத் தேர்ந்தெடு', lang)}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{tStr('Course', 'பாடநெறி', lang)}</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2476C7]">
                <option value="">{tStr('Select course...', 'பாடநெறியைத் தேர்ந்தெடு...', lang)}</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{tStr('Assessment', 'மதிப்பீடு', lang)}</label>
              <select value={selectedAssessment} onChange={e => setSelectedAssessment(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2476C7]"
                disabled={!selectedCourse}>
                <option value="">{tStr('Select assessment...', 'மதிப்பீட்டைத் தேர்ந்தெடு...', lang)}</option>
                {assessments.map(a => <option key={a.id} value={a.id}>{a.assessment_name} ({tStr('Max', 'அதிகபட்சம்', lang)}: {a.max_marks})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{tStr('Student', 'மாணவர்', lang)}</label>
              <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2476C7]"
                disabled={!selectedCourse}>
                <option value="">{tStr('Select student...', 'மாணவரைத் தேர்ந்தெடு...', lang)}</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.student_id})</option>)}
              </select>
            </div>
          </div>
        </Card>

        {/* Voice Entry */}
        <Card>
          <h2 className="text-sm font-semibold text-slate-900 mb-4">{tStr('Voice Entry', 'குரல் பதிவு', lang)}</h2>

          {!hasSpeechSupport && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                {tStr('Speech recognition is not supported in your browser. Please use Chrome or Edge, or enter marks manually below.', 'உங்கள் உலாவியில் குரல் அறிதல் ஆதரிக்கப்படவில்லை. Chrome அல்லது Edge பயன்படுத்தவும், அல்லது கீழே கைமுறையாக உள்ளிடவும்.', lang)}
              </p>
            </div>
          )}

          {/* Mic button */}
          <div className="flex flex-col items-center py-6">
            <button
              onClick={startListening}
              disabled={isListening || !hasSpeechSupport || !selectedStudent || !selectedAssessment}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg cursor-pointer ${
                isListening
                  ? 'bg-red-500 animate-pulse scale-110'
                  : hasSpeechSupport && selectedStudent && selectedAssessment
                  ? 'bg-[#174A8B] hover:bg-[#2476C7] hover:scale-105'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {isListening ? <MicOff size={36} className="text-white" /> : <Mic size={36} className="text-white" />}
            </button>
            <p className="mt-3 text-sm text-slate-500">
              {isListening ? tStr('🎤 Listening...', '🎤 கேட்கிறது...', lang) : tStr('Click to speak the marks', 'மதிப்பெண்களைக் கூற கிளிக் செய்க', lang)}
            </p>
            {isListening && (
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-1.5 bg-[#174A8B] rounded-full animate-bounce"
                    style={{ height: `${Math.random() * 20 + 10}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="mb-4 bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">{tStr('Recognized Speech', 'அடையாளம் காணப்பட்ட பேச்சு', lang)}</p>
              <p className="text-sm font-medium text-slate-900 italic">"{transcript}"</p>
            </div>
          )}

          {/* Editable marks */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {tStr('Marks Value', 'மதிப்பெண் மதிப்பு', lang)} {selectedAssessmentObj && <span className="text-slate-400">({tStr('max', 'அதிகபட்சம்', lang)}: {selectedAssessmentObj.max_marks})</span>}
            </label>
            <input
              type="number"
              value={marks}
              onChange={e => { setMarks(e.target.value); setStatus('recognized') }}
              placeholder={tStr('Enter or speak marks...', 'மதிப்பெண்களை உள்ளிடவும் அல்லது கூறவும்...', lang)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2476C7] text-lg font-semibold"
              min={0}
              max={selectedAssessmentObj?.max_marks}
            />
            <p className="text-xs text-slate-400 mt-1">{tStr('Review and edit the value before saving', 'சேமிக்கும் முன் மதிப்பை சரிபார்த்து திருத்தவும்', lang)}</p>
          </div>

          {/* Error */}
          {errorMsg && status === 'error' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-600 mt-0.5" />
              <p className="text-xs text-red-700">{errorMsg}</p>
            </div>
          )}

          {/* Success */}
          {status === 'saved' && savedFeedback && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-600" />
              <p className="text-xs text-emerald-700 font-medium">{savedFeedback}</p>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={saveMarks}
            disabled={saving || !marks || !selectedStudent || !selectedAssessment}
            className="w-full py-2.5 bg-[#174A8B] hover:bg-[#2476C7] text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{tStr('Save Marks (Confirm)', 'மதிப்பெண்களைச் சேமி (உறுதிப்படுத்து)', lang)}</span>
          </button>

          <p className="text-xs text-slate-400 text-center mt-2">
            {tStr('Marks are never saved automatically. You must click Save to confirm.', 'மதிப்பெண்கள் தானாக சேமிக்கப்படாது. உறுதிப்படுத்த சேமி என்பதைக் கிளிக் செய்யவும்.', lang)}
          </p>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card className="mt-6">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">{tStr('How to Use Voice Entry', 'குரல் பதிவை எவ்வாறு பயன்படுத்துவது', lang)}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { step: '1', text: tStr('Select course, assessment, and student', 'பாடநெறி, மதிப்பீடு மற்றும் மாணவரைத் தேர்ந்தெடுக்கவும்', lang) },
            { step: '2', text: tStr('Click the microphone and speak the marks (e.g., "Eighty two")', 'மைக்ரோஃபோனைக் கிளிக் செய்து மதிப்பெண்களைக் கூறவும்', lang) },
            { step: '3', text: tStr('Review the recognized value and edit if needed', 'அங்கீகரிக்கப்பட்ட மதிப்பை மதிப்பாய்வு செய்து திருத்தவும்', lang) },
            { step: '4', text: tStr('Click Save Marks to confirm and persist', 'உறுதிசெய்து சேமிக்க சேமி என்பதைக் கிளிக் செய்யவும்', lang) },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#174A8B] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{s.step}</div>
              <p className="text-xs text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  )
}
