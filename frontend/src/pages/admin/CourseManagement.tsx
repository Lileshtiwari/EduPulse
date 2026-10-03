import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { BookOpen, Plus, Search, Users, Trash2, CheckCircle2 } from 'lucide-react'
import api from '../../lib/api'
import { useT, tStr } from '../../lib/translations'

export default function CourseManagement() {
  const { t, lang } = useT()
  const [courses, setCourses] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [professors, setProfessors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    department_id: '',
    semester: 5,
    section: 'A',
    professor_id: '',
    credits: 3,
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [cRes, dRes, pRes] = await Promise.all([
        api.get('/courses'),
        api.get('/departments'),
        api.get('/admin/users?role=professor'),
      ])
      setCourses(cRes.data)
      setDepartments(dRes.data)
      setProfessors(pRes.data)
      if (dRes.data.length > 0 && !formData.department_id) {
        setFormData(prev => ({
          ...prev,
          department_id: dRes.data[0].id,
          professor_id: pRes.data[0]?.id || '',
        }))
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
      await api.post('/courses', {
        course_code: formData.course_code.toUpperCase().trim(),
        course_name: formData.course_name.trim(),
        department_id: Number(formData.department_id),
        semester: Number(formData.semester),
        section: formData.section,
        professor_id: formData.professor_id ? Number(formData.professor_id) : null,
        credits: Number(formData.credits),
      })
      showSuccess(`Course ${formData.course_code} created!`)
      setShowAddModal(false)
      setFormData({
        course_code: '', course_name: '', department_id: departments[0]?.id || '',
        semester: 5, section: 'A', professor_id: professors[0]?.id || '', credits: 3
      })
      loadData()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create course')
    }
  }

  const filtered = courses.filter(c =>
    c.course_code.toLowerCase().includes(search.toLowerCase()) ||
    c.course_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.department_name && c.department_name.toLowerCase().includes(search.toLowerCase()))
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
            <BookOpen size={24} className="text-[#174A8B]" />
            <span>{tStr('Courses & Section Management', 'பாடங்கள் & பிரிவு மேலாண்மை', lang)}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {tStr('Manage curriculum courses, section allocations, and faculty assignments.', 'பாடத்திட்டப் பாடங்கள், பிரிவு ஒதுக்கீடுகள் மற்றும் ஆசிரியர் பணிகளை நிர்வகிக்கவும்.', lang)}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#174A8B] hover:bg-[#123868] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>{tStr('Create New Course', 'புதிய பாடத்தை உருவாக்கு', lang)}</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder={tStr('Search courses by code or title...', 'குறியீடு அல்லது தலைப்பு மூலம் பாடங்களைத் தேடுக...', lang)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent focus:outline-none w-full text-slate-700"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">{filtered.length} {tStr('Courses', 'பாடங்கள்', lang)}</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400">{tStr('Loading courses...', 'பாடங்கள் ஏற்றப்படுகின்றன...', lang)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono font-black text-sm text-[#174A8B] bg-blue-50 px-2.5 py-1 rounded-lg">
                    {c.course_code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {c.credits} Credits
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mb-1">{c.course_name}</h3>
                <div className="text-xs text-slate-500 mb-3">{c.department_name || 'Engineering'} • Semester {c.semester} • Section {c.section}</div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-600 mb-2">
                  <div className="text-[11px] text-slate-400 font-medium">Assigned Professor:</div>
                  <div className="font-semibold text-slate-800">{c.professor_name || 'Not Assigned'}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Active Course</span>
                <span className="font-mono text-[11px] text-slate-500">ID #{c.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-xs">
            <button onClick={() => setShowAddModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold">✕</button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Create Course</h3>
            <p className="text-slate-500 mb-4">Add curriculum subject and assign faculty</p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS506"
                    value={formData.course_code}
                    onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Computing & DevOps"
                  value={formData.course_name}
                  onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.code}</option>
                    ))}
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
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Professor</label>
                <select
                  value={formData.professor_id}
                  onChange={(e) => setFormData({ ...formData, professor_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="">Unassigned</option>
                  {professors.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.faculty_id})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold text-xs shadow mt-2"
              >
                Create Course
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
