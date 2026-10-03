import React, { useState } from 'react'
import { X, Clock, Mail, Check, Copy, AlertTriangle, ShieldCheck, Trash2, Send } from 'lucide-react'
import type { Notification } from '../../types'

interface NotificationModalProps {
  notification: Notification | null
  onClose: () => void
  onDelete?: (id: number) => void
}

export function NotificationModal({ notification, onClose, onDelete }: NotificationModalProps) {
  const [copied, setCopied] = useState(false)

  if (!notification) return null

  const handleCopy = () => {
    const textToCopy = `Subject: ${notification.subject}\nRecipient: ${notification.recipient_email}\nDate: ${new Date(notification.created_at).toLocaleString()}\n\n${notification.message || notification.subject}`
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'contact_message':
        return { label: 'Contact Inquiry', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' }
      case 'single_student_alert':
      case 'batch_shortage_alert':
        return { label: 'Academic Alert', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
      case 'login_otp':
        return { label: 'Security OTP', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' }
      case 'account_creation':
        return { label: 'Account Welcome', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' }
      default:
        return { label: type.replace(/_/g, ' '), bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' }
    }
  }

  const typeInfo = getTypeBadge(notification.notification_type)

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/60">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${typeInfo.bg} ${typeInfo.text} ${typeInfo.border}`}>
                {typeInfo.label}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                  notification.status === 'sent'
                    ? 'bg-emerald-100 text-emerald-800'
                    : notification.status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {notification.status}
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1 font-mono">
                <Clock size={12} />
                {new Date(notification.created_at).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
              {notification.subject}
            </h3>

            <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 font-medium text-slate-600">
                <Mail size={13} className="text-[#174A8B]" />
                <span>To: <strong className="text-slate-800">{notification.recipient_email}</strong></span>
              </span>
              {notification.provider_message_id && (
                <span className="text-[10px] text-slate-400 font-mono">
                  ID: {notification.provider_message_id}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer flex-shrink-0"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Failure banner if failed */}
        {notification.status === 'failed' && notification.error_summary && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle size={15} className="flex-shrink-0 text-red-600" />
            <span>Delivery Error: <strong>{notification.error_summary}</strong></span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-xs sm:text-sm text-slate-800 font-sans whitespace-pre-wrap leading-relaxed selection:bg-[#174A8B]/15">
            {notification.message || (
              <div className="text-slate-500 italic py-4 text-center">
                Subject: {notification.subject}
                <div className="mt-2 text-xs text-slate-400">No additional message text was stored.</div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Dispatched via EduPulse Automated Campus Notification Gateway</span>
            <span>KPRIET Coimbatore</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this notification record?')) {
                    onDelete(notification.id)
                    onClose()
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy Message'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
