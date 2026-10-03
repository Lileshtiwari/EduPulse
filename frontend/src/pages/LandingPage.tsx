import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  GraduationCap, Users, Shield, ArrowRight, CheckCircle2,
  CalendarCheck, BarChart3, Mic, Mail, Bell,
  ChevronRight, Lock, Building, BookOpen, AlertTriangle, Loader2,
  Languages, Menu, X
} from 'lucide-react'
import { useT, getLang, setLang, type Language } from '../lib/translations'

export default function LandingPage() {
  const { loginInit, verifyOtp, resendOtp, user } = useAuth()
  const navigate = useNavigate()
  const [lang, setLangState] = useState<Language>(getLang())
  const { t } = useT(lang)

  const toggleLanguage = () => {
    const nl = lang === 'ta' ? 'en' : 'ta'
    setLang(nl)
    setLangState(nl)
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Login modal state
  const [modalRole, setModalRole] = useState<'student' | 'professor' | 'admin' | null>(null)
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  const openLogin = (role: 'student' | 'professor' | 'admin') => {
    setModalRole(role)
    setStep('credentials')
    setEmail('')
    setPassword('')
    setOtp('')
    setError('')
    setInfoMessage('')
  }

  const scrollToFeatures = () => {
    document.getElementById('portals')?.scrollIntoView({ behavior: 'smooth' })
  }

  const modalConfig = {
    student: {
      label: lang === 'ta' ? 'மாணவர் உள்நுழைவு' : 'Student Portal',
      image: '/student_card.png',
      color: '#0066cc',
      placeholder: 'e.g. 24cs263@kpriet.ac.in',
    },
    professor: {
      label: lang === 'ta' ? 'ஆசிரியர் உள்நுழைவு' : 'Professor Portal',
      image: '/professor_card.png',
      color: '#128a5b',
      placeholder: 'e.g. karunesh789tiwari@gmail.com',
    },
    admin: {
      label: lang === 'ta' ? 'நிர்வாக உள்நுழைவு' : 'Administrator Portal',
      image: '/admin_card.png',
      color: '#d97706',
      placeholder: 'e.g. karunesh128@gmail.com',
    },
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfoMessage('')
    setLoading(true)
    try {
      const res = await loginInit(email.trim(), password)
      setStep('otp')
      setInfoMessage(res.message || `A 6-digit verification code has been dispatched to ${email}.`)
    } catch (err: any) {
      setError(err?.response?.data?.detail || (lang === 'ta' ? 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்.' : 'Invalid email or password. Please verify your credentials.'))
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const authenticatedUser = await verifyOtp(email.trim(), otp.trim())
      if (authenticatedUser.role === 'admin') navigate('/admin/dashboard')
      else if (authenticatedUser.role === 'professor') navigate('/professor/dashboard')
      else navigate('/student/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.detail || (lang === 'ta' ? 'தவறான OTP குறியீடு.' : 'Invalid or expired OTP code. Please enter the correct code.'))
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError('')
    setResending(true)
    try {
      const res = await resendOtp(email.trim())
      setInfoMessage(res.message || `A fresh 6-digit OTP code has been sent to ${email}.`)
    } catch (err: any) {
      setError(err?.response?.data?.detail || (lang === 'ta' ? 'OTP மீண்டும் அனுப்புவதில் தோல்வி.' : 'Failed to resend verification code. Please try again.'))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Institute logo only — clean display */}
          <div className="flex items-center gap-3">
            <img
              src="/instuite.png"
              alt="KPRIET"
              className="h-12 w-auto object-contain cursor-pointer"
              onClick={() => navigate('/')}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#home" className="text-[#174A8B] font-semibold border-b-2 border-[#174A8B] pb-0.5">{t.home || 'Home'}</a>
            <a href="#features" className="hover:text-[#174A8B] transition-colors">{t.features || 'Features'}</a>
            <a href="#portals" className="hover:text-[#174A8B] transition-colors">{t.portals || 'Roles & Portals'}</a>
            <a href="#workflow" className="hover:text-[#174A8B] transition-colors">{t.howItWorks || 'How it Works'}</a>
            <button onClick={() => navigate('/contact')} className="hover:text-[#174A8B] transition-colors cursor-pointer">{t.contact || 'Contact'}</button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
              title="Toggle Language / மொழி மாற்று"
            >
              <Languages size={15} className="text-[#174A8B]" />
              <span>{lang === 'ta' ? 'EN' : 'தமிழ்'}</span>
            </button>

            {user ? (
              <button
                onClick={() => {
                  if (user.role === 'admin') navigate('/admin/dashboard')
                  else if (user.role === 'professor') navigate('/professor/dashboard')
                  else navigate('/student/dashboard')
                }}
                className="flex items-center gap-2 bg-[#174A8B] hover:bg-[#123868] text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold shadow transition-all cursor-pointer"
              >
                <span className="hidden sm:inline">{t.goToDashboard || 'Go to Dashboard'}</span>
                <span className="sm:hidden">Dashboard</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => openLogin('student')}
                  className="hidden sm:inline-flex text-sm font-semibold text-slate-700 hover:text-[#174A8B] px-3 py-2 transition-colors cursor-pointer"
                >
                  {t.login || 'Login'}
                </button>
                <button
                  onClick={() => openLogin('admin')}
                  className="hidden sm:flex items-center gap-2 bg-[#0066cc] hover:bg-[#0052a3] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <span>{t.getStarted || 'Get Started'}</span>
                  <ArrowRight size={16} />
                </button>
              </>
            )}

            {/* Mobile hamburger — only on small screens */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 pb-4 pt-2 space-y-1 shadow-lg">
            <a href="#home" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-[#174A8B] bg-blue-50 rounded-lg">{t.home || 'Home'}</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">{t.features || 'Features'}</a>
            <a href="#portals" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">{t.portals || 'Roles & Portals'}</a>
            <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg">{t.howItWorks || 'How it Works'}</a>
            <button onClick={() => { navigate('/contact'); setMobileMenuOpen(false) }} className="block w-full text-left py-2.5 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer">{t.contact || 'Contact'}</button>
            {!user && (
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button onClick={() => { openLogin('student'); setMobileMenuOpen(false) }} className="py-2.5 rounded-xl bg-[#174A8B] text-white text-sm font-bold text-center shadow">
                  {t.login || 'Login'}
                </button>
                <button onClick={() => { openLogin('admin'); setMobileMenuOpen(false) }} className="py-2.5 rounded-xl bg-[#0066cc] text-white text-sm font-bold text-center shadow">
                  {t.getStarted || 'Get Started'}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-br from-[#e8f0fb] via-white to-[#f0f7ff] min-h-[580px] flex items-center">
        {/* Decorative blurs */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-100/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 right-0 w-96 h-96 rounded-full bg-indigo-100/30 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch min-h-[560px]">

            {/* Left Column */}
            <div className="flex flex-col justify-center space-y-6 py-12 lg:pr-10">
              {/* Prominent EduPulse Logo */}
              <div>
                <img
                  src="/logo.png"
                  alt="EduPulse"
                  className="h-12 w-auto object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>

              {lang === 'ta' ? (
                <h1 className="text-3xl sm:text-4xl lg:text-[3.1rem] font-extrabold text-slate-950 tracking-tight leading-tight">
                  <span className="text-[#0066cc]">உங்கள்</span>{' '}
                  <span className="text-slate-800">கல்வி</span>{' '}
                  <span className="text-[#128a5b]">முன்னேற்றம்,</span>{' '}
                  <span className="text-slate-800">எளிய முறையில்.</span>
                </h1>
              ) : (
                <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-slate-950 tracking-tight leading-tight">
                  <span className="text-[#0066cc]">Your</span>{' '}
                  <span className="text-slate-800">Academic</span>{' '}
                  <span className="text-[#128a5b]">Progress,</span>{' '}
                  <span className="text-slate-800">Made Simple.</span>
                </h1>
              )}

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl">
                {t.homeSubtitle || 'EduPulse brings attendance, marks, and academic insights together in one place—helping students stay informed and faculty support better learning.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  onClick={() => openLogin('student')}
                  className="flex items-center gap-2 bg-[#174A8B] hover:bg-[#123868] text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all cursor-pointer"
                >
                  <span>{t.login || 'Login'}</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={scrollToFeatures}
                  className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-7 py-3.5 rounded-xl font-semibold text-sm border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <span>{lang === 'ta' ? 'அம்சங்களை அறிக' : 'Explore Features'}</span>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              </div>

              {/* Feature badges — clickable */}
              <div id="features" className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {[
                  { icon: <CalendarCheck size={15} className="text-blue-600" />, label: lang === 'ta' ? 'வருகை கண்காணிப்பு' : 'Attendance Monitoring' },
                  { icon: <BarChart3 size={15} className="text-indigo-600" />, label: lang === 'ta' ? 'மதிப்பெண்கள் & தேர்வுகள்' : 'Marks & Assessments' },
                  { icon: <AlertTriangle size={15} className="text-amber-600" />, label: lang === 'ta' ? 'கல்வி அபாய பகுப்பாய்வு' : 'Academic Risk Analysis' },
                  { icon: <Mic size={15} className="text-purple-600" />, label: lang === 'ta' ? 'குரல் வழி மதிப்பெண் பதிவு' : 'Voice Mark Entry' },
                  { icon: <Mail size={15} className="text-emerald-600" />, label: lang === 'ta' ? 'மின்னஞ்சல் எச்சரிக்கைகள்' : 'Email Notifications' },
                  { icon: <Users size={15} className="text-sky-600" />, label: lang === 'ta' ? 'மூன்று தனித்துவ போர்டல்கள்' : 'Role Dashboards' },
                ].map((f, i) => (
                  <button
                    key={i}
                    onClick={scrollToFeatures}
                    className="flex items-center gap-2 bg-white hover:bg-blue-50 p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 shadow-xs transition-all text-left group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-white flex items-center justify-center flex-shrink-0">{f.icon}</div>
                    <span className="text-[11px] font-semibold text-slate-700 leading-tight">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column — Hero image */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src="/students_hero.png"
                  alt="KPRIET Students"
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fb = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fb) fb.style.display = 'flex';
                  }}
                />
                <div style={{ display: 'none' }} className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 items-center justify-center">
                  <GraduationCap size={96} className="text-blue-300" />
                </div>
              </div>

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Floating notification badge */}
              <div className="absolute top-8 right-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-3.5 border border-white/60 flex items-center gap-3 max-w-[210px] animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0066cc] flex items-center justify-center flex-shrink-0">
                  <Bell size={18} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-900">{lang === 'ta' ? 'முன்னேறுங்கள்' : 'Stay Ahead'}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{lang === 'ta' ? 'வருகை & மதிப்பெண் நுண்ணறிவு' : 'Attendance, marks & insights'}</div>
                </div>
              </div>

              {/* Bottom overlay */}
              <div className="absolute bottom-0 inset-x-0 p-5 z-10 flex items-end justify-between">
                <div className="text-white">
                  <p className="text-[11px] italic text-blue-100">"Education is not just a destination,</p>
                  <p className="text-[11px] italic text-blue-100">but a journey we support."</p>
                  <span className="text-[10px] text-blue-300 font-semibold uppercase tracking-wide">— KPRIET</span>
                </div>
                <div className="bg-[#174A8B]/90 text-white px-3 py-1.5 rounded-xl text-[10px] font-semibold">
                  KPRIET — Accredited A+
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats Ribbon */}
      <section className="bg-white border-y border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0066cc] flex items-center justify-center">
                <Users size={24} />
              </div>
              <div className="text-left">
                <div className="text-2xl font-extrabold text-slate-900">1,200+</div>
                <div className="text-xs text-slate-500 font-medium">{lang === 'ta' ? 'மாணவர்கள்' : 'Students'}</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <GraduationCap size={24} />
              </div>
              <div className="text-left">
                <div className="text-2xl font-extrabold text-slate-900">80+</div>
                <div className="text-xs text-slate-500 font-medium">{lang === 'ta' ? 'பேராசிரியர்கள்' : 'Faculty Members'}</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BookOpen size={24} />
              </div>
              <div className="text-left">
                <div className="text-2xl font-extrabold text-slate-900">130+</div>
                <div className="text-xs text-slate-500 font-medium">{lang === 'ta' ? 'பாடப்பிரிவுகள்' : 'Courses'}</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Building size={24} />
              </div>
              <div className="text-left">
                <div className="text-2xl font-extrabold text-slate-900">6</div>
                <div className="text-xs text-slate-500 font-medium">{lang === 'ta' ? 'துறைகள்' : 'Departments'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Separate Login Portals Section */}
      <section id="portals" className="py-16 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#0066cc] bg-blue-50 px-3 py-1 rounded-full mb-3">
              {lang === 'ta' ? 'உங்கள் போர்ட்டலை அணுகவும்' : 'Access Your Portal'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {lang === 'ta' ? 'ஒரே தளம். மூன்று பொறுப்புகள்.' : 'One Platform. Three Roles.'}
            </h2>
            <p className="mt-3 text-slate-500 text-sm leading-relaxed">
              {lang === 'ta'
                ? 'உங்கள் கல்லூரி மின்னஞ்சல் மூலம் உள்நுழையவும். நிர்வாகியால் கணக்குகள் முன்கூட்டியே உருவாக்கப்பட்டுள்ளன.'
                : 'Sign in with your institutional credentials. Profiles are provisioned automatically — no signup required.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Student Portal Card */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
              <div>
                <div className="h-64 rounded-2xl overflow-hidden mb-6 relative">
                  <img
                    src="/student_card.png"
                    alt="Student"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fb = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fb) fb.style.display = 'flex';
                    }}
                  />
                  <div style={{ display: 'none' }} className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 flex items-center justify-center">
                    <GraduationCap size={48} className="text-[#0066cc]" />
                  </div>
                  <div className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {lang === 'ta' ? 'மாணவர்' : 'Student'}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">{t.studentPortal || 'Student Portal'}</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-5">
                  {lang === 'ta'
                    ? 'வருகைப்பதிவைக் கண்காணிக்கவும், மதிப்பெண்களைப் பார்க்கவும், தனிப்பயனாக்கப்பட்ட நுண்ணறிவுகளைப் பெறவும்.'
                    : 'Track your attendance, view marks, get personalized insights and receive timely notifications.'}
                </p>

                <div className="space-y-2.5 mb-6 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-blue-600 flex-shrink-0" />
                    <span>{lang === 'ta' ? 'வருகைப்பதிவு & போக்குகளைக் காண்க' : 'View Attendance & Trends'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-blue-600 flex-shrink-0" />
                    <span>{lang === 'ta' ? 'உள் மதிப்பீட்டு மதிப்பெண்களை அறிக' : 'Check Internal Assessment Marks'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-blue-600 flex-shrink-0" />
                    <span>{lang === 'ta' ? 'வருகை இழப்பு & மீட்புக் கணிப்பான்' : 'Bunk Impact & Recovery Calculator'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-blue-600 flex-shrink-0" />
                    <span>{lang === 'ta' ? 'அதிகாரப்பூர்வ கல்வி நுழைவு அட்டை' : 'Official Academic Entry Pass Ticket'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openLogin('student')}
                className="w-full flex items-center justify-center gap-2 bg-[#0066cc] hover:bg-[#0052a3] text-white py-3 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
              >
                <span>{t.studentLogin || 'Student Login'}</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Professor Portal Card */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
              <div>
                <div className="h-64 rounded-2xl overflow-hidden mb-6 relative">
                  <img
                    src="/professor_card.png"
                    alt="Professor"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fb = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fb) fb.style.display = 'flex';
                    }}
                  />
                  <div style={{ display: 'none' }} className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-teal-50 flex items-center justify-center">
                    <Users size={48} className="text-emerald-700" />
                  </div>
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {lang === 'ta' ? 'ஆசிரியர்' : 'Faculty'}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">{t.professorPortal || 'Professor Portal'}</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-5">
                  {lang === 'ta'
                    ? 'வருகைப்பதிவை நிர்வகிக்கவும், மதிப்பெண்களை உள்ளிடவும், தவறுகளை திருத்தவும்.'
                    : 'Manage attendance, enter marks (with voice support), rectify errors and monitor students.'}
                </p>

                <div className="space-y-2.5 mb-6 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                    <span>{lang === 'ta' ? 'பாடவேளை வருகைப்பதிவு & திருத்தும் வசதி' : 'Session Attendance & Edit Facility'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                    <span>{lang === 'ta' ? 'மதிப்பீட்டு மதிப்பெண்களை பதிவு செய்தல்' : 'Enter IA & Model Exam Marks'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                    <span>{lang === 'ta' ? 'குரல் வழி மதிப்பெண் உள்ளீடு' : 'Voice-Assisted Mark Entry'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 flex-shrink-0" />
                    <span>{lang === 'ta' ? 'ஆசிரியர் அடையாள அட்டை & நுழைவுச் சீட்டு' : 'Faculty ID Entry Pass'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openLogin('professor')}
                className="w-full flex items-center justify-center gap-2 bg-[#128a5b] hover:bg-[#0e6f49] text-white py-3 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
              >
                <span>{t.facultyLogin || 'Faculty Login'}</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Administrator Portal Card */}
            <div className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group">
              <div>
                <div className="h-64 rounded-2xl overflow-hidden mb-6 relative">
                  <img
                    src="/admin_card.png"
                    alt="Administrator"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fb = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fb) fb.style.display = 'flex';
                    }}
                  />
                  <div style={{ display: 'none' }} className="absolute inset-0 bg-gradient-to-tr from-amber-100 to-orange-50 flex items-center justify-center">
                    <Shield size={48} className="text-amber-600" />
                  </div>
                  <div className="absolute top-3 right-3 bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {lang === 'ta' ? 'நிர்வாகம்' : 'Admin'}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">{t.adminPortal || 'Administrator Portal'}</h3>
                <p className="text-slate-600 text-xs leading-relaxed mb-5">
                  {lang === 'ta'
                    ? 'மாணவர்கள் மற்றும் ஆசிரியர்களை சேர்க்கவும், புகைப்படங்களை புதுப்பிக்கவும், நிறுவனப் புள்ளிவிவரங்களைக் காணவும்.'
                    : 'Manage students, faculty, update profile photos, and view institution-wide metrics.'}
                </p>

                <div className="space-y-2.5 mb-6 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-amber-600 flex-shrink-0" />
                    <span>{lang === 'ta' ? 'மாணவர் மற்றும் ஆசிரியர் சுயவிவர படங்கள்' : 'Student & Faculty Profile Images'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-amber-600 flex-shrink-0" />
                    <span>{lang === 'ta' ? 'கல்லூரி அளவிலான வருகை கண்காணிப்பு' : 'Camu-Style Attendance Tracker'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-amber-600 flex-shrink-0" />
                    <span>{lang === 'ta' ? 'ஒட்டுமொத்த மின்னஞ்சல் அறிவிப்புகள்' : 'Bulk Warning Email Dispatch'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-amber-600 flex-shrink-0" />
                    <span>{lang === 'ta' ? 'முழுமையான தணிக்கைப் பதிவுகள்' : 'Comprehensive System Audit Logs'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => openLogin('admin')}
                className="w-full flex items-center justify-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white py-3 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer"
              >
                <span>{t.adminLogin || 'Admin Login'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How EduPulse Works */}
      <section id="workflow" className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2a5c 50%, #0a1628 100%)' }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-400 bg-blue-900/40 px-3 py-1 rounded-full mb-3 border border-blue-700/40">
              {t.howItWorks || 'How It Works'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {lang === 'ta' ? 'உள்நுழைவு முதல் நுண்ணறிவு வரை' : 'From Login to Insight'}
            </h2>
            <p className="text-sm text-blue-200/70 mt-2 max-w-lg mx-auto">
              {lang === 'ta'
                ? 'மாணவர்கள், ஆசிரியர்கள் மற்றும் நிர்வாகத்தை இணைக்கும் ஒருமைப்படுத்தப்பட்ட அமைப்பு.'
                : 'A seamless 5-step pipeline connecting students, faculty, and administration.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { step: '01', icon: <Lock size={22} />, title: lang === 'ta' ? 'பாதுகாப்பான உள்நுழைவு' : 'Secure Login', desc: lang === 'ta' ? 'கல்லூரி மின்னஞ்சல் மூலம் 2FA பாதுகாப்பு' : 'Sign in with your KPRIET institutional email — 2FA protected', color: 'from-blue-500 to-blue-700' },
              { step: '02', icon: <CalendarCheck size={22} />, title: lang === 'ta' ? 'கல்வி தரவுகள்' : 'Academic Data', desc: lang === 'ta' ? 'வருகைப்பதிவு & மதிப்பெண்கள் நேரடி ஒத்திசைவு' : 'Attendance, marks, and course data synced in real-time', color: 'from-indigo-500 to-indigo-700' },
              { step: '03', icon: <BarChart3 size={22} />, title: lang === 'ta' ? 'நுண்ணறிவு பகுப்பாய்வு' : 'Smart Analysis', desc: lang === 'ta' ? 'கல்வி அபாயங்களை முன்கூட்டியே கணிக்கும் தளம்' : 'Predicts risk levels and identifies patterns early', color: 'from-violet-500 to-violet-700' },
              { step: '04', icon: <Mail size={22} />, title: lang === 'ta' ? 'தானியங்கி எச்சரிக்கைகள்' : 'Auto Alerts', desc: lang === 'ta' ? 'வருகைக் குறைவு மின்னஞ்சல் எச்சரிக்கைகள்' : 'Real email notifications sent for attendance shortage', color: 'from-emerald-500 to-emerald-700' },
              { step: '05', icon: <CheckCircle2 size={22} />, title: lang === 'ta' ? 'முன்னேற்ற நடவடிக்கை' : 'Take Action', desc: lang === 'ta' ? 'மீட்புத் திட்டத்தின் மூலம் முன்னேறுங்கள்' : 'Students and faculty act on insights to improve outcomes', color: 'from-amber-500 to-amber-600' },
            ].map((s, idx) => (
              <div key={idx} className="relative group">
                {idx < 4 && (
                  <div className="hidden lg:block absolute top-10 -right-2.5 w-5 h-0.5 bg-white/10 z-10" />
                )}
                <div className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 h-full cursor-default">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {s.icon}
                  </div>
                  <div className="text-[10px] font-bold tracking-widest text-white/25 mb-1">{s.step}</div>
                  <h4 className="font-bold text-sm text-white mb-2">{s.title}</h4>
                  <p className="text-[11px] text-blue-200/60 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="EduPulse"
              className="h-7 w-auto object-contain cursor-pointer"
              onClick={() => navigate('/')}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-slate-500">— KPR Institute of Engineering and Technology</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-right">
            <span>© {new Date().getFullYear()} EduPulse — KPRIET. {lang === 'ta' ? 'கல்வி கண்காணிப்பு தளம்.' : 'Academic Monitoring & Support System.'}</span>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {modalRole && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setModalRole(null)}
              className="absolute top-4 right-4 z-20 text-white/80 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition cursor-pointer"
            >
              ×
            </button>

            {/* Header: card image thumbnail */}
            <div className="h-36 relative overflow-hidden">
              <img
                src={modalConfig[modalRole].image}
                alt={modalConfig[modalRole].label}
                className="w-full h-full object-cover object-top"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
                <div>
                  <h3 className="text-xl font-extrabold text-white">{modalConfig[modalRole].label}</h3>
                  <p className="text-xs text-white/70">
                    {lang === 'ta' ? 'பதிவு செய்யப்பட்ட மின்னஞ்சல் வழி 2FA சரிபார்ப்பு' : '2-Factor Authentication via Registered Email'}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-7">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 mb-4 flex items-start gap-2">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-red-500" />
                  <span>{error}</span>
                </div>
              )}
              {infoMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 mb-4 flex items-start gap-2">
                  <Mail size={14} className="flex-shrink-0 mt-0.5 text-emerald-600" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {step === 'credentials' && (
                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.registeredEmail || 'Registered Email'}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder={modalConfig[modalRole].placeholder}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174A8B] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t.password || 'Password'}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#174A8B] transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Lock size={11} className="text-slate-400" />
                    {lang === 'ta' ? 'சரிபார்ப்பிற்காக 6-இலக்க OTP உங்கள் மின்னஞ்சலுக்கு அனுப்பப்படும்.' : 'A 6-digit OTP will be sent to your email for verification.'}
                  </p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm shadow transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
                    style={{ backgroundColor: modalConfig[modalRole].color }}
                  >
                    {loading
                      ? <><Loader2 size={15} className="animate-spin" /><span>{lang === 'ta' ? 'OTP அனுப்பப்படுகிறது...' : 'Sending OTP...'}</span></>
                      : <><span>{t.sendOtp || 'Send Verification OTP'}</span><ArrowRight size={15} /></>}
                  </button>
                </form>
              )}

              {step === 'otp' && (
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        {t.enterOtp || 'Enter 6-Digit OTP'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setStep('credentials')}
                        className="text-xs hover:underline cursor-pointer"
                        style={{ color: modalConfig[modalRole].color }}
                      >
                        {lang === 'ta' ? 'மின்னஞ்சலை மாற்று' : 'Change Email'}
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      required
                      placeholder="••••••"
                      className="w-full px-3.5 py-3.5 rounded-xl border-2 text-center text-2xl font-mono tracking-widest font-bold text-slate-900 focus:outline-none transition"
                      style={{ borderColor: modalConfig[modalRole].color }}
                      autoFocus
                    />
                    <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                      {lang === 'ta' ? 'அனுப்பப்பட்ட மின்னஞ்சல்' : 'Sent to'} <strong className="text-slate-800">{email}</strong> — 10 mins
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    style={{ backgroundColor: modalConfig[modalRole].color }}
                  >
                    {loading
                      ? <><Loader2 size={15} className="animate-spin" /><span>{lang === 'ta' ? 'சரிபார்க்கிறது...' : 'Verifying...'}</span></>
                      : <><span>{t.verifyOtp || 'Verify OTP'}</span><ArrowRight size={15} /></>}
                  </button>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>{lang === 'ta' ? 'மின்னஞ்சல் கிடைக்கவில்லையா?' : "Didn't receive the email?"}</span>
                    <button
                      type="button"
                      disabled={resending}
                      onClick={handleResendOtp}
                      className="font-semibold hover:underline disabled:opacity-50 cursor-pointer"
                      style={{ color: modalConfig[modalRole].color }}
                    >
                      {resending ? (lang === 'ta' ? 'மீண்டும் அனுப்புகிறது...' : 'Resending...') : (t.resendOtp || 'Resend Code')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
