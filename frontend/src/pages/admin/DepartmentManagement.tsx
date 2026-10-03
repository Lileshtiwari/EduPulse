import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Building2, Plus, Trash2, CheckCircle2, BookOpen, Users } from 'lucide-react'
import api from '../../lib/api'
import { useT, tStr } from '../../lib/translations'

export default function DepartmentManagement() {
  const { t, lang } = useT()
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDept, setNewDept] = useState({ code: '', name: '' })
  const [toast, setToast] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/departments')
      setDepartments(res.data)
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
      await api.post('/admin/departments', newDept)
      showSuccess(tStr(`Department ${newDept.code} created!`, `துறை ${newDept.code} உருவாக்கப்பட்டது!`, lang))
      setShowAddModal(false)
      setNewDept({ code: '', name: '' })
      loadData()
    } catch (err: any) {
      alert(err?.response?.data?.detail || tStr('Failed to create department', 'துறையை உருவாக்குவதில் தோல்வி', lang))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(tStr('Are you sure you want to remove this department?', 'இந்த துறையை நீக்க உறுதியாக இருக்கிறீர்களா?', lang))) return
    try {
      await api.delete(`/admin/departments/${id}`)
      showSuccess(tStr('Department deleted', 'துறை நீக்கப்பட்டது', lang))
      loadData()
    } catch (err: any) {
      alert(err?.response?.data?.detail || tStr('Error deleting department', 'துறையை நீக்குவதில் பிழை', lang))
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 size={24} className="text-[#174A8B]" />
            <span>{tStr('Academic Departments', 'கல்வித் துறைகள்', lang)}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {tStr('Configure academic branches and engineering departments.', 'கல்வி பிரிவுகள் மற்றும் பொறியியல் துறைகளை உள்ளமைக்கவும்.', lang)}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#174A8B] hover:bg-[#123868] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>{tStr('Add Department', 'துறையைச் சேர்', lang)}</span>
        </button>
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400">{tStr('Loading departments...', 'துறைகள் ஏற்றப்படுகின்றன...', lang)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-sm border border-indigo-200">
                    {d.code}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    ID #{d.id}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 mb-1">{d.name}</h3>
                <p className="text-xs text-slate-500 mb-4">Department Code: <strong className="font-mono text-slate-700">{d.code}</strong></p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-emerald-600 font-semibold text-[11px]">Active Academic Division</span>
                <button
                  onClick={() => handleDelete(d.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                  title="Delete Department"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-xs">
            <button onClick={() => setShowAddModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold">✕</button>

            <h3 className="text-base font-bold text-slate-900 mb-1">Add Department</h3>
            <p className="text-slate-500 mb-4">Register new academic division</p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IT, BIOTECH"
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Information Technology"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#174A8B] hover:bg-[#123868] text-white font-bold text-xs shadow mt-2"
              >
                Create Department
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
