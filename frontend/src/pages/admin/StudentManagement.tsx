import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import {
  GraduationCap, Plus, Search, Filter, Mail, Trash2,
  CheckCircle, AlertTriangle, Eye, ShieldAlert, CheckCircle2, Edit3, Image,
  Upload, RotateCcw, Camera, Send, Loader2
} from 'lucide-react'
import api from '../../lib/api'
import { useT, tStr } from '../../lib/translations'

export default function StudentManagement() {
  const { t, lang } = useT()
  const [students, setStudents] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('ALL')
  const [filterSection, setFilterSection] = useState('ALL')

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [editingStudent, setEditingStudent] = useState<any | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [blastingAlerts, setBlastingAlerts] = useState(false)
  const [sendingAlertId, setSendingAlertId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    full_name: '', email: '', student_id: '', department_id: '',
    section: 'A', semester: 5, password: 'Student@123', phone: '',
    profile_image: '/student_card.png',
  })

  const [editFormData, setEditFormData] = useState({
    full_name: '', phone: '', section: 'A', semester: 5,
    profile_image: '/student_card.png',
  })

  const handleImageCompressAndSet = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new (window as any).Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxDim = 400
        let w = img.width
        let h = img.height
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w)
          w = maxDim
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h)
          h = maxDim
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, w, h)
        const compressed = canvas.toDataURL('image/jpeg', 0.85)
        callback(compressed)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [stRes, dRes] = await Promise.all([
        api.get('/admin/students-detailed'),
        api.get('/departments'),
      ])
      setStudents(stRes.data)
      setDepartments(dRes.data)
      if (dRes.data.length > 0 && !formData.department_id) {
        setFormData(prev => ({ ...prev, department_id: dRes.data[0].id }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const showSuccess = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/admin/users', {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: 'student',
        student_id: formData.student_id,
        department_id: Number(formData.department_id),
        section: formData.section,
        semester: Number(formData.semester),
        phone: formData.phone,
        profile_image: formData.profile_image || '/student_card.png',
      })
      showSuccess(`Student ${formData.full_name} created & welcome credentials email sent!`)
      setShowAddModal(false)
      setFormData({
        full_name: '', email: '', student_id: '', department_id: departments[0]?.id || '',
        section: 'A', semester: 5, password: 'Student@123', phone: '',
        profile_image: '/student_card.png',
      })
      loadData()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create student')
    }
  }

  const openEditModal = (student: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingStudent(student)
    setEditFormData({
      full_name: student.full_name,
      phone: student.phone || '',
      section: student.section || 'A',
      semester: student.semester || 5,
      profile_image: student.profile_image || '/student_card.png',
    })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStudent) return
    try {
      await api.patch(`/admin/users/${editingStudent.id}`, {
        full_name: editFormData.full_name,
        phone: editFormData.phone,
        section: editFormData.section,
        semester: Number(editFormData.semester),
        profile_image: editFormData.profile_image,
      })
      showSuccess(`Student ${editFormData.full_name} profile updated successfully!`)
      setEditingStudent(null)
      loadData()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update student')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      showSuccess('Student removed')
      loadData()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Error deleting student')
    }
  }

  const handleSendEmail = async (id: number) => {
    setSendingAlertId(id)
    try {
      const res = await api.post(`/notifications/send-student-alert/${id}`)
      showSuccess(res.data.message || 'Alert email dispatched to student!')
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to send alert email')
    } finally {
      setSendingAlertId(null)
    }
  }

  const handleSendBulkAlerts = async () => {
    if (!confirm('Send official attendance shortage alert emails to all students below threshold?')) return
    setBlastingAlerts(true)
    try {
      const res = await api.post('/notifications/send-attendance-shortage-alerts')
      showSuccess(`Dispatched shortage alerts to ${res.data.sent_count ?? res.data.total_shortage_students ?? 0} students!`)
      loadData()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to execute shortage alert blast')
    } finally {
      setBlastingAlerts(false)
    }
  }

  const filtered = students.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    const matchesDept = filterDept === 'ALL' || s.department_code === filterDept
    const matchesSec = filterSection === 'ALL' || s.section === filterSection
    return matchesSearch && matchesDept && matchesSec
  })

  return (
    <DashboardLayout>
      {toast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap size={24} className="text-[#174A8B]" />
            <span>{tStr('Student Management & Profiles', 'மாணவர் மேலாண்மை & சுயவிவரங்கள்', lang)}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {tStr('Manage student records, set official entry photos, and dispatch instant notifications.', 'மாணவர் பதிவுகளை நிர்வகிக்கவும், அதிகாரப்பூர்வ புகைப்படங்களை அமைக்கவும், உடனடி அறிவிப்புகளை அனுப்பவும்.', lang)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleSendBulkAlerts}
            disabled={blastingAlerts}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Scan attendance records and send shortage warning emails to students below threshold"
          >
            {blastingAlerts ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            <span>{blastingAlerts ? tStr('Dispatching...', 'அனுப்பப்படுகிறது...', lang) : tStr('Send Shortage Alerts (1-Click)', 'பற்றாக்குறை எச்சரிக்கைகளை அனுப்பு', lang)}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#174A8B] hover:bg-[#123868] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>{t.addStudent || 'Add New Student'}</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={tStr('Search by student name, roll number, or email...', 'மாணவர் பெயர், பதிவு எண் அல்லது மின்னஞ்சல் மூலம் தேடுக...', lang)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#174A8B]"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
          >
            <option value="ALL">{tStr('All Departments', 'அனைத்துத் துறைகள்', lang)}</option>
            {departments.map(d => (
              <option key={d.id} value={d.code}>{d.code} - {d.name}</option>
            ))}
          </select>

          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
          >
            <option value="ALL">{tStr('All Sections', 'அனைத்துப் பிரிவுகள்', lang)}</option>
            <option value="A">{tStr('Section A', 'பிரிவு A', lang)}</option>
            <option value="B">{tStr('Section B', 'பிரிவு B', lang)}</option>
            <option value="C">{tStr('Section C', 'பிரிவு C', lang)}</option>
          </select>
        </div>
      </div>

      {/* Student Cards Grid */}
      {loading ? (
        <div className="text-center py-20 text-xs text-slate-400">Loading student database...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
          No students found matching current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedStudent(s)}
              className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 relative shadow-2xs">
                      <img
                        src={s.profile_image || '/student_card.png'}
                        alt={s.full_name}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          e.currentTarget.src = '/student_card.png'
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-[#174A8B] transition-colors leading-tight">
                        {s.full_name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">{s.student_id}</div>
                      <div className="text-[10px] text-slate-400">{s.department_code} • Sec {s.section}</div>
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    s.overall_risk === 'High Concern' ? 'bg-red-100 text-red-700' :
                    s.overall_risk === 'Needs Attention' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {s.overall_risk === 'High Concern' ? 'High Risk' :
                     s.overall_risk === 'Needs Attention' ? 'Moderate' : 'Low Risk'}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 text-xs">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500">Attendance:</span>
                    <span className={`font-bold ${s.overall_attendance < 75 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {s.overall_attendance}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.overall_attendance < 75 ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, s.overall_attendance)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-[11px] text-[#174A8B] font-semibold flex items-center gap-1">
                  <Eye size={12} />
                  <span>Inspect</span>
                </span>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => openEditModal(s, e)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit Profile & Photo"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleSendEmail(s.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="Send Alert Email"
                  >
                    <Mail size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                    title="Delete Student"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto text-xs">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add New Student Record</h3>
            <p className="text-slate-500 mb-5">
              Enter official details. A welcome email containing password and portal credentials will be dispatched.
            </p>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Kumar Tiwari"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Roll Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24CS263"
                    value={formData.student_id}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase()
                      setFormData(prev => ({
                        ...prev,
                        student_id: val,
                        email: (!prev.email || prev.email.includes('@kpriet.ac.in')) ? (val ? `${val.toLowerCase()}@kpriet.ac.in` : '') : prev.email
                      }))
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Institutional Email (Auto-Generated)</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. 24cs263@kpriet.ac.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold text-blue-700"
                  />
                </div>
              </div>

              {/* Profile Image Device Upload & Presets */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-2">Profile Photo (Entry Pass Image)</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-16 rounded-xl overflow-hidden border-2 border-[#174A8B]/30 flex-shrink-0 shadow-sm bg-slate-200">
                    <img
                      src={formData.profile_image || '/student_card.png'}
                      alt="Preview"
                      className="w-full h-full object-cover object-top"
                      onError={(e) => { e.currentTarget.src = '/student_card.png' }}
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold text-xs cursor-pointer shadow-xs">
                        <Upload size={12} />
                        <span>Upload from Device</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (uploadEvent) => {
                                setFormData(prev => ({ ...prev, profile_image: uploadEvent.target?.result as string }))
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, profile_image: '/student_card.png' }))}
                        className="text-[11px] text-blue-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={11} />
                        <span>Reset to Original Default</span>
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400">Default: Official KPRIET Student Entry Pass Photo</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold text-xs shadow mt-2 cursor-pointer"
              >
                Create Student Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-xs">
            <button
              onClick={() => setEditingStudent(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-1">Edit Student Profile &amp; Pass Photo</h3>
            <p className="text-slate-500 mb-4">
              Updates to profile image and details will reflect immediately in the Student Dashboard and Entry Pass.
            </p>

            <form onSubmit={handleUpdate} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              {/* Profile Image Device Upload & Presets */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-2">Profile Photo (Entry Pass Image)</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-[#174A8B]/30 flex-shrink-0 shadow-sm bg-slate-200">
                    <img
                      src={editFormData.profile_image || '/student_card.png'}
                      alt="Student Preview"
                      className="w-full h-full object-cover object-top"
                      onError={(e) => { e.currentTarget.src = '/student_card.png' }}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold text-xs cursor-pointer shadow-xs">
                        <Upload size={12} />
                        <span>Upload from Device</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleImageCompressAndSet(file, (b64) => {
                                setEditFormData(prev => ({ ...prev, profile_image: b64 }))
                              })
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, profile_image: '/student_card.png' }))}
                        className="text-[11px] text-blue-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={11} />
                        <span>Reset to Original Default</span>
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400">Loads on student dashboard as their digital ID ticket.</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section</label>
                  <select
                    value={editFormData.section}
                    onChange={(e) => setEditFormData({ ...editFormData, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={editFormData.semester}
                    onChange={(e) => setEditFormData({ ...editFormData, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold text-xs shadow cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto text-xs">
            <button onClick={() => setSelectedStudent(null)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer">✕</button>

            <div className="flex items-start gap-4 pb-4 border-b border-slate-100 mb-4">
              <div className="relative group">
                <div className="w-16 h-20 rounded-2xl overflow-hidden border-2 border-blue-200 flex-shrink-0 shadow bg-slate-200">
                  <img
                    src={selectedStudent.profile_image || '/student_card.png'}
                    alt={selectedStudent.full_name}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => { e.currentTarget.src = '/student_card.png' }}
                  />
                </div>
                <label className="absolute -bottom-1 -right-1 bg-[#174A8B] hover:bg-[#123868] text-white p-1 rounded-full shadow cursor-pointer transition" title="Change Photo from Device">
                  <Camera size={12} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImageCompressAndSet(file, async (b64) => {
                          try {
                            await api.patch(`/admin/users/${selectedStudent.id}`, { profile_image: b64 })
                            setSelectedStudent({ ...selectedStudent, profile_image: b64 })
                            showSuccess('Photo updated on student pass!')
                            loadData()
                          } catch (err: any) {
                            alert('Failed to update student photo')
                          }
                        })
                      }
                    }}
                  />
                </label>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">{selectedStudent.full_name}</h3>
                  <button
                    onClick={() => {
                      setEditingStudent(selectedStudent)
                      setEditFormData({
                        full_name: selectedStudent.full_name,
                        phone: selectedStudent.phone || '',
                        section: selectedStudent.section || 'A',
                        semester: selectedStudent.semester || 5,
                        profile_image: selectedStudent.profile_image || '/student_card.png',
                      })
                      setSelectedStudent(null)
                    }}
                    className="text-slate-400 hover:text-blue-600 p-1"
                    title="Edit Student Details"
                  >
                    <Edit3 size={13} />
                  </button>
                </div>
                <div className="text-slate-500 font-mono text-[11px] mt-0.5">{selectedStudent.student_id} • {selectedStudent.email}</div>
                <div className="text-slate-600 mt-1 font-medium">{selectedStudent.department_name} • Sec {selectedStudent.section}</div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.patch(`/admin/users/${selectedStudent.id}`, { profile_image: '/student_card.png' })
                      setSelectedStudent({ ...selectedStudent, profile_image: '/student_card.png' })
                      showSuccess('Reset to original default photo')
                      loadData()
                    } catch (err) {
                      alert('Failed to reset photo')
                    }
                  }}
                  className="text-[10px] text-blue-600 font-bold hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={10} />
                  <span>Reset to Original Default</span>
                </button>
              </div>
              <button
                onClick={() => handleSendEmail(selectedStudent.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Mail size={13} />
                <span>Send Alert</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Enrolled Courses &amp; Attendance</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {selectedStudent.courses?.map((c: any, i: number) => (
                    <div key={i} className="p-3 bg-white flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">{c.course_code} - {c.course_name}</div>
                        <div className="text-[10px] text-slate-400">Attended: {c.attended}/{c.total_sessions}</div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${c.percentage < 75 ? 'text-red-600' : 'text-emerald-600'}`}>{c.percentage}%</span>
                        <div className="text-[10px] text-slate-400">{c.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedStudent.reasons?.length > 0 && (
                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-1">Academic Flags</h4>
                  <ul className="list-disc pl-4 space-y-1 text-amber-800 text-[11px]">
                    {selectedStudent.reasons.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
