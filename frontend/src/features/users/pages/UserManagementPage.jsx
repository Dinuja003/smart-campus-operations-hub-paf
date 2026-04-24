import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle, CheckCircle2, Loader2, Pencil, Plus,
  Search, Shield, Trash2, User, Users, Wrench, X,
} from "lucide-react"
import userService from "../services/userService"

const ROLES = ["USER", "ADMIN", "TECHNICIAN"]

const roleMeta = {
  ADMIN:      { label: "Admin",      cls: "bg-[#001d45] text-white",           icon: Shield  },
  TECHNICIAN: { label: "Technician", cls: "bg-[#f45e2b]/10 text-[#f45e2b]",   icon: Wrench  },
  USER:       { label: "User",       cls: "bg-slate-100 text-slate-600",        icon: User    },
}

const toArray = (v) => {
  if (Array.isArray(v)) return v
  if (Array.isArray(v?.data)) return v.data
  if (Array.isArray(v?.content)) return v.content
  return []
}

const initials = (u) =>
  `${u?.firstName?.[0] ?? ""}${u?.lastName?.[0] ?? ""}`.toUpperCase() || "??"

const emptyForm = () => ({
  firstName: "", lastName: "", email: "", password: "", role: "USER",
})

const labelCls  = "mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#001d45]/55"
const inputCls  = "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-[#001d45] outline-none placeholder-slate-400 transition focus:border-[#f45e2b]/60 focus:bg-white focus:ring-2 focus:ring-[#f45e2b]/15"
const selectCls = inputCls

export default function UserManagementPage() {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [submitLoading, setSubmit]  = useState(false)
  const [error, setError]           = useState("")
  const [success, setSuccess]       = useState("")
  const [search, setSearch]         = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [modalMode, setModalMode]   = useState(null)   // "create" | "edit"
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm]             = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]     = useState(false)

  const load = async () => {
    setLoading(true); setError("")
    try   { setUsers(toArray(await userService.getAllUsers())) }
    catch { setError("Failed to load users. Check your connection.") }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      const matchRole = !roleFilter || u.role === roleFilter
      const matchSearch = !q ||
        `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q)
      return matchRole && matchSearch
    })
  }, [users, search, roleFilter])

  const counts = useMemo(() => ({
    total:      users.length,
    admin:      users.filter(u => u.role === "ADMIN").length,
    technician: users.filter(u => u.role === "TECHNICIAN").length,
    user:       users.filter(u => u.role === "USER").length,
  }), [users])

  const openCreate = () => { setForm(emptyForm()); setEditingUser(null); setModalMode("create"); setError(""); setSuccess("") }
  const openEdit   = (u) => {
    setForm({ firstName: u.firstName || "", lastName: u.lastName || "", email: u.email || "", password: "", role: u.role || "USER" })
    setEditingUser(u)
    setModalMode("edit")
    setError(""); setSuccess("")
  }
  const closeModal = () => { setModalMode(null); setEditingUser(null); setForm(emptyForm()) }

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmit(true); setError(""); setSuccess("")
    try {
      if (modalMode === "create") {
        const payload = { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, role: form.role }
        await userService.createUser(payload)
        setSuccess("User created successfully.")
      } else {
        const payload = { firstName: form.firstName, lastName: form.lastName, role: form.role }
        if (form.password.trim()) payload.password = form.password
        await userService.updateUser(editingUser.id, payload)
        setSuccess("User updated successfully.")
      }
      await load()
      closeModal()
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Operation failed. Please try again.")
    } finally {
      setSubmit(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await userService.deleteUser(deleteTarget.id)
      setUsers(p => p.filter(u => u.id !== deleteTarget.id))
      setSuccess(`User "${deleteTarget.firstName} ${deleteTarget.lastName}" deleted.`)
      setDeleteTarget(null)
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete user.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">ADMIN · USERS</p>
        <div className="mt-1.5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[2rem] font-bold leading-tight text-[#001d45]">People & permissions.</h1>
            <p className="mt-1 text-sm text-[#5a6b98]">
              Create, edit and remove campus accounts. Email cannot be changed after creation.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-[#f45e2b] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(244,94,43,0.35)] transition-all hover:bg-[#e04d1e] hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> New User
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{success}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users",   value: counts.total,      bg: "bg-[#001d45]",        text: "text-white",        sub: "text-white/55" },
          { label: "Admins",        value: counts.admin,      bg: "bg-white border border-[#001d45]/15", text: "text-[#001d45]", sub: "text-[#8494c2]" },
          { label: "Technicians",   value: counts.technician, bg: "bg-white border border-[#f45e2b]/20", text: "text-[#001d45]", sub: "text-[#8494c2]" },
          { label: "Regular Users", value: counts.user,       bg: "bg-white border border-slate-200",    text: "text-[#001d45]", sub: "text-[#8494c2]" },
        ].map(({ label, value, bg, text, sub }) => (
          <div key={label} className={`rounded-2xl p-4 shadow-sm ${bg}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${sub}`}>{label}</p>
            <p className={`mt-1.5 text-3xl font-bold ${text}`}>{loading ? "—" : value}</p>
          </div>
        ))}
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-[#001d45] outline-none transition focus:border-[#f45e2b]/50 focus:ring-2 focus:ring-[#f45e2b]/15"
          />
        </div>
        <div className="flex gap-2">
          {["", ...ROLES].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                roleFilter === r
                  ? "bg-[#001d45] text-white shadow-[0_4px_12px_rgba(0,29,69,0.30)]"
                  : "border border-slate-200 bg-white text-slate-500 hover:border-[#001d45]/30 hover:text-[#001d45]"
              }`}
            >
              {r || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center gap-2 rounded-[26px] border border-white/60 bg-white p-8 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-[#f45e2b]" /> Loading users…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-slate-200 bg-white py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#001d45]/8">
            <Users className="h-6 w-6 text-[#001d45]" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-[#001d45]">No users found</h3>
          <p className="mt-1 text-sm text-[#8494c2]">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[26px] border border-white/60 bg-white shadow-[0_14px_40px_rgba(0,29,69,0.08)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["User", "Email", "Role", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => {
                  const meta = roleMeta[u.role] || roleMeta.USER
                  const RoleIcon = meta.icon
                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors hover:bg-slate-50/60 ${idx < filtered.length - 1 ? "border-b border-slate-50" : ""}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#001d45] text-xs font-bold text-white">
                            {initials(u)}
                          </div>
                          <div>
                            <p className="font-semibold text-[#001d45]">
                              {u.firstName} {u.lastName}
                            </p>
                            <p className="text-[11px] text-[#8494c2]">ID: {String(u.id).slice(0, 8)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[#6677a4]">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${meta.cls}`}>
                          <RoleIcon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="flex items-center gap-1.5 rounded-lg border border-[#001d45]/20 bg-[#001d45]/8 px-3 py-1.5 text-[11px] font-semibold text-[#001d45] transition hover:bg-[#001d45]/15"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDeleteTarget(u); setError(""); setSuccess("") }}
                            className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 transition hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-[#8494c2]">
            Showing {filtered.length} of {users.length} users
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-[26px] bg-white shadow-[0_30px_80px_rgba(0,29,69,0.30)]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#001d45] px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">
                  {modalMode === "create" ? "New Account" : "Edit Account"}
                </p>
                <h3 className="mt-0.5 text-lg font-bold text-white" style={{ margin: "2px 0 0" }}>
                  {modalMode === "create" ? "Create User" : `${editingUser?.firstName} ${editingUser?.lastName}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name</label>
                  <input name="firstName" required value={form.firstName} onChange={handleChange} placeholder="First name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Last Name</label>
                  <input name="lastName" required value={form.lastName} onChange={handleChange} placeholder="Last name" className={inputCls} />
                </div>
              </div>

              {/* Email — editable only on create */}
              <div>
                <label className={labelCls}>
                  Email Address
                  {modalMode === "edit" && (
                    <span className="ml-2 normal-case font-normal text-[#8494c2]">(cannot be changed)</span>
                  )}
                </label>
                <input
                  name="email"
                  type="email"
                  required={modalMode === "create"}
                  value={form.email}
                  onChange={handleChange}
                  placeholder="user@campus.edu"
                  disabled={modalMode === "edit"}
                  className={`${inputCls} ${modalMode === "edit" ? "cursor-not-allowed opacity-50 select-none" : ""}`}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Password
                  {modalMode === "edit" && (
                    <span className="ml-2 normal-case font-normal text-[#8494c2]">(leave blank to keep current)</span>
                  )}
                </label>
                <input
                  name="password"
                  type="password"
                  required={modalMode === "create"}
                  minLength={modalMode === "create" ? 8 : 0}
                  value={form.password}
                  onChange={handleChange}
                  placeholder={modalMode === "create" ? "Min. 8 characters" : "Leave blank to keep unchanged"}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Role</label>
                <select name="role" value={form.role} onChange={handleChange} className={selectCls}>
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Modal footer */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f45e2b] py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(244,94,43,0.35)] transition hover:bg-[#e04d1e] disabled:opacity-60"
                >
                  {submitLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : modalMode === "create" ? "Create User" : "Save Changes"
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-[22px] bg-white shadow-[0_30px_80px_rgba(0,29,69,0.30)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-base font-bold text-[#001d45]" style={{ margin: 0 }}>Delete User?</h3>
              <p className="mt-2 text-sm text-[#8494c2]">
                This will permanently remove{" "}
                <span className="font-semibold text-[#001d45]">
                  {deleteTarget.firstName} {deleteTarget.lastName}
                </span>{" "}
                ({deleteTarget.email}). This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
