import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Loader2, BookOpen, BarChart3, CalendarCheck, Mail, ArrowRight, Lock, AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const { loginInit, verifyOtp, resendOtp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfoMessage('')
    setLoading(true)
    try {
      const res = await loginInit(email.trim(), password)
      setStep('otp')
      if (res.dev_otp) {
        setOtp(res.dev_otp)
      }
      setInfoMessage(res.message || `A 6-digit verification code has been dispatched to ${email}.`)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid email or password. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await verifyOtp(email.trim(), otp.trim())
      if (user.role === 'admin') navigate('/admin/dashboard')
      else if (user.role === 'professor') navigate('/professor/dashboard')
      else navigate('/student/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid or expired OTP code.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError('')
    setResending(true)
    try {
      const res = await resendOtp(email.trim())
      if (res.dev_otp) {
        setOtp(res.dev_otp)
      }
      setInfoMessage(res.message || `A fresh 6-digit code has been sent to ${email}.`)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to resend code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#174A8B] via-[#1a5ca8] to-[#2476C7] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl bg-white">
        
        {/* Left panel — branding */}
        <div className="hidden lg:flex flex-col justify-between bg-[#132d6b] p-10 text-white">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <img
                src="/logo.png"
                alt="EduPulse AI Logo"
                className="h-10 w-auto object-contain max-h-10"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div>
                <div className="font-bold text-xl">EduPulse AI</div>
                <div className="text-blue-300 text-sm">Academic Monitoring & Support</div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-blue-200 text-xs uppercase tracking-wider mb-1 font-semibold">KPR Institute of Engineering and Technology</p>
              <h1 className="text-3xl font-extrabold leading-tight">
                Track. Predict.<br />Alert. Support.
              </h1>
              <p className="mt-3 text-blue-200 text-sm leading-relaxed">
                Intelligent academic monitoring and automated email support for students and faculty.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: <CalendarCheck size={16} />, text: 'Real-time attendance & bunk calculation' },
                { icon: <BarChart3 size={16} />, text: 'AI-driven academic risk analysis' },
                { icon: <BookOpen size={16} />, text: 'Automatic email alerts for shortage & marks' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-blue-100">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {f.icon}
                  </div>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: '1,240+', sub: 'Students' },
                { label: '80+', sub: 'Faculty' },
                { label: '130+', sub: 'Courses' },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold">{s.label}</div>
                  <div className="text-xs text-blue-200">{s.sub}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-blue-300 text-center italic">
              "Consistency today builds confidence tomorrow." — KPRIET
            </p>
          </div>
        </div>

        {/* Right panel — login form with 2FA OTP */}
        <div className="bg-white p-8 lg:p-10 flex flex-col justify-center">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <img
              src="/logo.png"
              alt="EduPulse AI Logo"
              className="h-9 w-auto object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <div className="font-bold text-[#174A8B]">EduPulse AI</div>
              <div className="text-xs text-slate-500">KPRIET Academic Monitoring</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {step === 'credentials' ? 'Sign In to Portal' : '2-Factor Verification'}
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            {step === 'credentials' 
              ? 'Enter your institutional email & password' 
              : 'Enter the 6-digit one-time passcode sent to your inbox'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 mb-4 flex items-start gap-2">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 mb-4 flex items-start gap-2">
              <Mail size={15} className="flex-shrink-0 mt-0.5 text-emerald-600" />
              <span>{infoMessage}</span>
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email</label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2476C7] transition"
                  placeholder="e.g. 23cs263@kpriet.ac.in"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2476C7] transition pr-10"
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
                <Lock size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                <span>For enhanced security, a 6-digit OTP code will be dispatched to this email address to verify your identity.</span>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#174A8B] hover:bg-[#132d6b] text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>Verify Credentials & Send OTP</span>
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Enter 6-Digit OTP</label>
                  <button
                    type="button"
                    onClick={() => setStep('credentials')}
                    className="text-xs text-[#174A8B] hover:underline"
                  >
                    Change Email
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-blue-400 text-center text-2xl font-mono tracking-widest font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#174A8B]"
                  placeholder="••••••"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1.5 text-center">
                  Sent to <strong className="text-slate-800">{email}</strong>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-3 px-4 bg-[#174A8B] hover:bg-[#132d6b] text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>Verify OTP & Enter Portal</span>
                <ArrowRight size={16} />
              </button>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Didn't receive email?</span>
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendOtp}
                  className="text-[#174A8B] font-semibold hover:underline disabled:opacity-50"
                >
                  {resending ? 'Resending...' : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-500 hover:text-slate-800 hover:underline"
            >
              ← Back to KPRIET Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


