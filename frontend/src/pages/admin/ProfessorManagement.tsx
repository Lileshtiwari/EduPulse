import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Users, Plus, Search, Mail, Trash2, CheckCircle2, Edit3, Upload, RotateCcw, Camera } from 'lucide-react'
import api from '../../lib/api'
import { useT, tStr } from '../../lib/translations'

export default function ProfessorManagement() {
  const { t, lang } = useT()
  const [professors, setProfessors] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProf, setEditingProf] = useState<any | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: '', email: '', faculty_id: '', department_id: '', section: 'ALL', password: 'Prof@123', phone: '',
    profile_image: '/professor_card.png',
  })

  const [editFormData, setEditFormData] = useState({
    full_name: '', phone: '', faculty_id: '', section: 'ALL', profile_image: '/professor_card.png',
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
      const [uRes, dRes] = await Promise.all([
        api.get('/admin/users?role=professor'),
        api.get('/departments'),
      ])
      setProfessors(uRes.data)
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
        role: 'professor',
        faculty_id: formData.faculty_id,
        department_id: Number(formData.department_id),
        section: formData.section || 'ALL',
        phone: formData.phone,
        profile_image: formData.profile_image || '/professor_card.png',
      })
      showSuccess(`Faculty account for ${formData.full_name} created & welcome credentials email dispatched!`)
      setShowAddModal(false)
      setFormData({
        full_name: '', email: '', faculty_id: '', department_id: departments[0]?.id || '',
        section: 'ALL', password: 'Prof@123', phone: '', profile_image: '/professor_card.png',
      })
      loadData()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create faculty member')
    }
  }

  const openEditModal = (p: any) => {
    setEditingProf(p)
    setEditFormData({
      full_name: p.full_name,
      phone: p.phone || '',
      faculty_id: p.faculty_id || '',
      section: p.section || 'ALL',
      profile_image: p.profile_image || '/professor_card.png',
    })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProf) return
    try {
      await api.patch(`/admin/users/${editingProf.id}`, {
        full_name: editFormData.full_name,
        phone: editFormData.phone,
        faculty_id: editFormData.faculty_id,
        section: editFormData.section || 'ALL',
        profile_image: editFormData.profile_image,
      })
      showSuccess(`Faculty ${editFormData.full_name} updated successfully!`)
      setEditingProf(null)
      loadData()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to update faculty member')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this faculty member?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      showSuccess('Faculty member removed')
      loadData()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Error removing faculty')
    }
  }

  const filtered = professors.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.faculty_id && p.faculty_id.toLowerCase().includes(search.toLowerCase()))
  )

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
            <Users size={24} className="text-[#174A8B]" />
            <span>{tStr('Faculty & Professor Directory', 'ஆசிரியர் & பேராசிரியர் அடைவு', lang)}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {tStr('Manage professorial appointments, ID card photos, and departments.', 'பேராசிரியர் நியமனங்கள், அடையாள அட்டை புகைப்படங்கள் மற்றும் துறைகளை நிர்வகிக்கவும்.', lang)}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#174A8B] hover:bg-[#123868] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>{t.addProfessor || 'Add Faculty Member'}</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder={tStr('Search by name, faculty ID, or email...', 'பெயர், ஆசிரியர் எண் அல்லது மின்னஞ்சல் மூலம் தேடுக...', lang)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent focus:outline-none w-full text-slate-700"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">{filtered.length} {tStr('Faculty Members', 'ஆசிரியர்கள்', lang)}</span>
      </div>

      {/* Grid of Faculty Cards */}
      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading faculty roster...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
          No faculty members found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 rounded-xl bg-purple-50 text-purple-700 flex flex-col items-center justify-center font-bold text-sm relative overflow-hidden border border-purple-200 shadow-2xs">
                      <img
                        src={p.profile_image || '/professor_card.png'}
                        alt={p.full_name}
                        className="w-full h-full object-cover object-top"
                        onError={(e) => { e.currentTarget.src = '/professor_card.png' }}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{p.full_name}</div>
                      <div className="text-xs font-mono text-slate-500">{p.faculty_id || 'FAC001'}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    Faculty
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-600 mb-4">
                  <div><strong>Email:</strong> {p.email}</div>
                  <div><strong>Department:</strong> {p.department_name || 'Engineering'}</div>
                  <div className="flex items-center gap-1.5">
                    <strong>Assigned Section:</strong>
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {p.section ? (p.section === 'ALL' ? 'All Sections' : `Section ${p.section}`) : 'All Sections'}
                    </span>
                  </div>
                  <div><strong>Phone:</strong> {p.phone || '+91 98765 00000'}</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(p)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={13} className="text-blue-600" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                  title="Remove Faculty Member"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Faculty Member</h3>
            <p className="text-slate-500 mb-5">
              Create official teaching portal account. Credentials will be emailed directly to the faculty member.
            </p>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Priya Sharma"
                  value={formData.full_name}
                  onChange={(e) => {
                    const name = e.target.value
                    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.')
                    const autoEmail = slug ? `${slug.replace(/^\.|\.$/g, '')}@kpriet.ac.in` : ''
                    setFormData(prev => ({
                      ...prev,
                      full_name: name,
                      email: (!prev.email || prev.email.includes('@kpriet.ac.in')) ? autoEmail : prev.email
                    }))
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Faculty ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FAC101"
                    value={formData.faculty_id}
                    onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Institutional Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. priya.sharma@kpriet.ac.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold text-blue-700"
                  />
                </div>
              </div>

              {/* Photo Input & Device Upload */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-2">Faculty Profile Photo</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-16 rounded-xl overflow-hidden border-2 border-purple-200 flex-shrink-0 shadow-sm bg-slate-200">
                    <img
                      src={formData.profile_image || '/professor_card.png'}
                      alt="Preview"
                      className="w-full h-full object-cover object-top"
                      onError={(e) => { e.currentTarget.src = '/professor_card.png' }}
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
                              handleImageCompressAndSet(file, (compressed) => {
                                setFormData(prev => ({ ...prev, profile_image: compressed }))
                              })
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, profile_image: '/professor_card.png' }))}
                        className="text-[11px] text-blue-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={11} />
                        <span>Reset to Original Default</span>
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400">Default: Official KPRIET Faculty ID Photo</div>
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
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="ALL">All Sections (A, B, C, D)</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold text-xs shadow mt-2 cursor-pointer"
              >
                Create Faculty Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProf && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-xs">
            <button
              onClick={() => setEditingProf(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-1">Edit Faculty Profile</h3>
            <p className="text-slate-500 mb-4">
              Updates to faculty photo will appear in the Faculty ID ticket instantly.
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Faculty ID</label>
                  <input
                    type="text"
                    required
                    value={editFormData.faculty_id}
                    onChange={(e) => setEditFormData({ ...editFormData, faculty_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Section</label>
                  <select
                    value={editFormData.section}
                    onChange={(e) => setEditFormData({ ...editFormData, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="ALL">All Sections (A, B, C, D)</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
              </div>

              {/* Photo Input & Device Upload */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-2">Faculty Profile Photo</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-purple-200 flex-shrink-0 shadow-sm bg-slate-200">
                    <img
                      src={editFormData.profile_image || '/professor_card.png'}
                      alt="Faculty Preview"
                      className="w-full h-full object-cover object-top"
                      onError={(e) => { e.currentTarget.src = '/professor_card.png' }}
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
                              handleImageCompressAndSet(file, (compressed) => {
                                setEditFormData(prev => ({ ...prev, profile_image: compressed }))
                              })
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, profile_image: '/professor_card.png' }))}
                        className="text-[11px] text-blue-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={11} />
                        <span>Reset to Original Default</span>
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400">Updates live on faculty dashboard entry ticket.</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProf(null)}
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
    </DashboardLayout>
  )
}
