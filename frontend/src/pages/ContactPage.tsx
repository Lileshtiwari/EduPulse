import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, CheckCircle2, Loader2, AlertCircle, Languages } from 'lucide-react'
import api from '../lib/api'
import { useT, getLang, setLang, type Language, tStr } from '../lib/translations'

const socials = [
  {
    name: 'X (Twitter)',
    handle: '@karunesh108',
    url: 'https://x.com/karunesh108',
    color: '#000000',
    hoverBg: '#1a1a1a',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    handle: '@tiwari_official-o9v',
    url: 'https://youtube.com/@tiwari_official-o9v?si=3DepDVWzmKm01jAA',
    color: '#FF0000',
    hoverBg: '#cc0000',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    handle: 'Lilesh Kumar Tiwari',
    url: 'https://www.linkedin.com/in/lilesh-kumar-tiwari-2a939732b',
    color: '#0A66C2',
    hoverBg: '#004182',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    handle: '@edupulse.kpriet',
    url: 'https://share.google/4e9TpAHdbM6ro4Rmt',
    color: '#E1306C',
    hoverBg: '#C13584',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    name: 'Facebook',
    handle: 'Lilesh Kumar Tiwari',
    url: 'https://www.facebook.com/lileshkumar.tiwari',
    color: '#1877F2',
    hoverBg: '#0d6efd',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
]

export default function ContactPage() {
  const navigate = useNavigate()
  const [lang, setLangState] = useState<Language>(getLang())
  const { t } = useT(lang)

  const toggleLanguage = () => {
    const next: Language = lang === 'en' ? 'ta' : 'en'
    setLang(next)
    setLangState(next)
  }

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      await api.post('/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      })
      setSent(true)
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        (lang === 'ta'
          ? 'செய்தியை அனுப்ப முடியவில்லை. உங்கள் இணைய இணைப்பைச் சரிபார்க்கவும்.'
          : 'Unable to send message at this moment. Please check your network or try again later.')
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#174A8B] transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{t.backToHome}</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              title="Toggle Language / மொழி மாற்று"
            >
              <Languages size={14} className="text-[#174A8B]" />
              <span>{lang === 'ta' ? 'English' : 'தமிழ்'}</span>
            </button>
            <img
              src="/logo.png"
              alt="EduPulse AI"
              className="h-8 w-auto object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        {/* Hero */}
        <div className="text-center mb-14">
          <img
            src="/logo.png"
            alt="EduPulse"
            className="h-16 w-auto object-contain mx-auto mb-5"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {t.getInTouch}
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            {t.contactSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left — Social Links */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">{t.connectWithUs}</h2>
            <p className="text-slate-500 text-xs mb-6">{t.socialsSubtitle}</p>

            <div className="space-y-3">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-transparent hover:shadow-lg transition-all group"
                  style={{ '--hover-bg': s.hoverBg } as React.CSSProperties}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 group-hover:text-[#174A8B] transition-colors">
                      {s.name}
                    </div>
                    <div className="text-xs text-slate-500">{s.handle}</div>
                  </div>
                  <div className="ml-auto text-slate-300 group-hover:text-[#174A8B] transition-colors text-lg">→</div>
                </a>
              ))}
            </div>

            <div className="mt-8 p-5 bg-gradient-to-br from-[#174A8B]/5 to-[#0066cc]/10 border border-[#174A8B]/15 rounded-2xl">
              <div className="text-xs font-semibold text-[#174A8B] uppercase tracking-widest mb-1">{t.builtBy}</div>
              <div className="text-slate-900 font-bold text-base">Team NexByte</div>
              <div className="text-slate-500 text-xs mt-1">
                KPR Institute of Engineering and Technology, Coimbatore — 641 407
              </div>
            </div>
          </div>

          {/* Right — Contact Form */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-7 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1">{t.sendMessage}</h2>
            <p className="text-slate-500 text-xs mb-6">{t.weWillGetBack}</p>

            {sent ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{t.messageSent}</h3>
                <p className="text-slate-500 text-sm">{t.thankYouContact}</p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 text-sm font-semibold text-[#0066cc] hover:underline cursor-pointer"
                >
                  {t.sendAnotherMessage}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.yourName}</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder={lang === 'ta' ? 'எ.கா. கருணேஷ் திவாரி' : 'e.g. Karunesh Tiwari'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174A8B] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.emailAddress}</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174A8B] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{lang === 'ta' ? 'பொருள்' : 'Subject'}</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174A8B] transition bg-white text-slate-700"
                  >
                    <option value="">{lang === 'ta' ? 'பொருளைத் தேர்ந்தெடுக்கவும்...' : 'Select a subject...'}</option>
                    <option value="General Inquiry">{lang === 'ta' ? 'பொதுவான விசாரணை' : 'General Inquiry'}</option>
                    <option value="Technical Support">{lang === 'ta' ? 'தொழில்நுட்ப ஆதரவு' : 'Technical Support'}</option>
                    <option value="Feature Request">{lang === 'ta' ? 'புதிய வசதிக்கான கோரிக்கை' : 'Feature Request'}</option>
                    <option value="Bug Report">{lang === 'ta' ? 'பிழை அறிக்கை' : 'Bug Report'}</option>
                    <option value="Partnership">{lang === 'ta' ? 'கூட்டாண்மை' : 'Partnership'}</option>
                    <option value="Other">{lang === 'ta' ? 'பிற' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t.message}</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder={lang === 'ta' ? 'உங்கள் செய்தியை இங்கே உள்ளிடவும்...' : 'Write your message here...'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174A8B] transition resize-none"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle size={15} className="flex-shrink-0 text-red-500" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  {sending
                    ? <><Loader2 size={16} className="animate-spin" /><span>{t.sending}</span></>
                    : <><Send size={15} /><span>{t.sendButton}</span></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-10">
        © {new Date().getFullYear()} EduPulse — KPR Institute of Engineering and Technology.
        {lang === 'ta' ? ' நெக்ஸ்பைட் குழுவால் உருவாக்கப்பட்டது.' : ' Designed by Team NexByte.'}
      </footer>
    </div>
  )
}
