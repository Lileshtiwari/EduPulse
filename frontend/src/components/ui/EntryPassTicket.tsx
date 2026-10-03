import React from 'react'
import { GraduationCap, ShieldCheck, QrCode, Sparkles, Building, CheckCircle2, Edit3 } from 'lucide-react'
import type { User } from '../../types'
import { useT, getLang } from '../../lib/translations'

interface EntryPassTicketProps {
  user: User | null
  className?: string
  onEditProfile?: () => void
}

export function EntryPassTicket({ user, className = '', onEditProfile }: EntryPassTicketProps) {
  const { t, lang } = useT(user?.lang_pref || getLang())
  if (!user) return null

  const isAdmin = user.role === 'admin'
  const isStudent = user.role === 'student'
  const defaultPhoto = isAdmin ? '/admin_card.png' : isStudent ? '/student_card.png' : '/professor_card.png'
  const profilePhoto = user.profile_image || defaultPhoto

  const identifier = isAdmin
    ? (user.student_id || user.faculty_id || 'ADM-2026')
    : isStudent
      ? user.student_id || '24CS263'
      : user.faculty_id || `FAC-${user.id}`

  const idLabel = isAdmin
    ? (lang === 'ta' ? 'நிர்வாகி எண்' : 'Admin ID')
    : isStudent
      ? (lang === 'ta' ? 'பதிவு எண்' : 'Roll Number')
      : (lang === 'ta' ? 'ஆசிரியர் எண்' : 'Faculty ID')

  const titleHeader = isAdmin
    ? (lang === 'ta' ? 'அதிகாரப்பூர்வ கல்வி நிர்வாகி அடையாள அட்டை' : 'OFFICIAL ACADEMIC ADMINISTRATOR PASS')
    : (lang === 'ta' ? 'அதிகாரப்பூர்வ கல்வி நுழைவு அட்டை & அடையாள சான்று' : 'OFFICIAL ACADEMIC ENTRY PASS & IDENTIFICATION')

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d2557] via-[#174A8B] to-[#2476C7] text-white shadow-xl border border-blue-400/20 ${className}`}>
      {/* Background Decorative Rings */}
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none blur-xl" />
      <div className="absolute right-40 -bottom-20 w-64 h-64 rounded-full bg-blue-400/10 pointer-events-none" />

      {/* Ticket Cutout Notches (Left & Right) */}
      <div className="hidden lg:block absolute right-72 -top-4 w-8 h-8 rounded-full bg-[#F7FAFC] z-10 shadow-inner" />
      <div className="hidden lg:block absolute right-72 -bottom-4 w-8 h-8 rounded-full bg-[#F7FAFC] z-10 shadow-inner" />

      <div className="flex flex-col lg:flex-row items-stretch">
        {/* Main Pass Body */}
        <div className="flex-1 p-5 sm:p-6 lg:border-r lg:border-dashed lg:border-blue-300/30 relative">
          {/* Institution Header */}
          <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-xs flex items-center justify-center font-bold text-white shadow-xs">
                <Building size={16} />
              </div>
              <div>
                <div className="text-[10px] tracking-wider uppercase font-semibold text-blue-200">
                  {lang === 'ta' ? 'கேபிஆர் பொறியியல் தொழில்நுட்பக் கல்லூரி (தன்னாட்சி)' : 'KPR Institute of Engineering and Technology (Autonomous)'}
                </div>
                <div className="text-xs font-bold tracking-wide text-white">
                  {titleHeader}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onEditProfile && (
                <button
                  onClick={onEditProfile}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold transition cursor-pointer border border-white/30 shadow-xs"
                >
                  <Edit3 size={12} />
                  <span>{lang === 'ta' ? 'சுயவிவரம் மாற்று' : 'Edit Profile & Photo'}</span>
                </button>
              )}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>{lang === 'ta' ? 'சரிபார்க்கப்பட்டது • செயலில் உள்ளது' : 'VERIFIED • ACTIVE PASS'}</span>
              </div>
            </div>
          </div>

          {/* Profile & Credentials Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Student/Faculty/Admin Photo */}
            <div className="relative flex-shrink-0 group">
              <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden border-2 border-white/60 shadow-lg bg-slate-800 relative">
                <img
                  src={profilePhoto}
                  alt={user.full_name}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    e.currentTarget.src = defaultPhoto
                  }}
                />
                <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs py-0.5 text-center text-[9px] font-mono text-white/90">
                  {identifier}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-[#174A8B] shadow">
                <CheckCircle2 size={12} />
              </div>
            </div>

            {/* Info Columns */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="col-span-2 sm:col-span-3">
                <span className="text-[10px] uppercase font-semibold text-blue-200">
                  {lang === 'ta' ? 'முழு பெயர்' : 'Full Name'}
                </span>
                <div className="text-base sm:text-lg font-bold text-white leading-tight">
                  {user.full_name}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-blue-200">{idLabel}</span>
                <div className="font-mono font-bold text-white text-xs mt-0.5">{identifier}</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-blue-200">{lang === 'ta' ? 'பொறுப்பு' : 'Role'}</span>
                <div className="font-bold text-white text-xs mt-0.5 capitalize">{user.role}</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-blue-200">{lang === 'ta' ? 'கல்வி ஆண்டு' : 'Academic Year'}</span>
                <div className="font-bold text-white text-xs mt-0.5">2025 - 2026</div>
              </div>

              <div className="col-span-2">
                <span className="text-[10px] uppercase font-semibold text-blue-200">{lang === 'ta' ? 'துறை / அலுவலகம்' : 'Department / Office'}</span>
                <div className="font-semibold text-blue-100 text-xs mt-0.5">
                  {isAdmin
                    ? (lang === 'ta' ? 'கல்வி விவகாரங்கள் & நிர்வாக அலுவலகம்' : 'Office of Academic Affairs & Administration')
                    : 'Computer Science & Engineering'}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-blue-200">{lang === 'ta' ? 'நிலை' : 'Status / Group'}</span>
                <div className="font-bold text-white text-xs mt-0.5">
                  {isAdmin
                    ? (lang === 'ta' ? 'தலைமை நிர்வாகி' : 'Lead Administrator')
                    : isStudent
                      ? `Sem ${user.semester || 5} — Sec ${user.section || 'A'}`
                      : 'Faculty Advisor'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Stub (Barcode & Security Validation) */}
        <div className="lg:w-64 xl:w-72 p-4 sm:p-5 bg-black/20 backdrop-blur-xs flex flex-col justify-between border-t lg:border-t-0 border-white/10">
          <div>
            <div className="flex items-center justify-between text-[10px] text-blue-200 uppercase font-semibold pb-2 border-b border-white/10 mb-3">
              <span>{lang === 'ta' ? 'நுழைவு அனுமதி சீட்டு' : 'PASS STUB'}</span>
              <span>2025 - 2026</span>
            </div>

            <div className="bg-white/10 rounded-xl p-3 text-center border border-white/15 mb-3">
              <div className="text-[10px] text-blue-200 uppercase tracking-widest font-semibold mb-1">
                {lang === 'ta' ? 'சரிபார்ப்பு குறியீடு' : 'ENTRY VALIDATION HASH'}
              </div>
              <div className="font-mono text-xs font-bold tracking-widest text-amber-300">
                KPR-{identifier}-2025
              </div>
            </div>

            {/* Stylized Barcode Graphic */}
            <div className="bg-white p-2.5 rounded-xl shadow-xs">
              <div className="flex items-center justify-between h-9 px-1 gap-[2px]">
                {Array.from({ length: 42 }).map((_, i) => (
                  <div
                    key={i}
                    className={`bg-slate-900 h-full ${
                      (i % 5 === 0 || i % 7 === 0) ? 'w-[3px]' : (i % 2 === 0) ? 'w-[1.5px]' : 'w-[1px]'
                    }`}
                  />
                ))}
              </div>
              <div className="text-center font-mono text-[9px] text-slate-600 mt-1 tracking-wider font-semibold">
                * {identifier} *
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-blue-200">
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="text-amber-300" />
              <span>{lang === 'ta' ? 'அனைத்து கல்வி அணுகலுக்கும் அனுமதிக்கப்பட்டது' : 'Authorized for Campus & System Access'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
