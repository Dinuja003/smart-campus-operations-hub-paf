import { useState } from "react"
import { AlertCircle, CheckCircle2, FileText, KeyRound, RotateCcw, Send, Tag, Ticket } from "lucide-react"

const TEMP_USER_ID = "69c038632d897c2ee8880785"
const API_USERNAME = "user"

function getApiPassword() {
  let saved = sessionStorage.getItem("apiPassword")
  if (!saved) {
    saved = prompt("Enter backend password")
    if (saved) sessionStorage.setItem("apiPassword", saved)
  }
  return saved || ""
}

const CATEGORIES = ["HARDWARE", "SOFTWARE", "NETWORK", "FACILITY"]
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"]

const priorityColors = {
  LOW: "bg-emerald-100 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-[#f5b800]/15 text-[#b08800] border-[#f5b800]/30",
  HIGH: "bg-red-100 text-red-600 border-red-200",
}

function CreateTicketPage() {
  const [formData, setFormData] = useState({
    resourceId: "",
    category: "HARDWARE",
    subject: "",
    description: "",
    priority: "HIGH",
    location: "",
    preferredContact: "",
  })
  const [message, setMessage] = useState("")
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleReset = () => {
    setFormData({ resourceId: "", category: "HARDWARE", subject: "", description: "", priority: "HIGH", location: "", preferredContact: "" })
    setMessage("")
    setError("")
  }

  const handleUpdatePassword = () => {
    sessionStorage.removeItem("apiPassword")
    const pw = prompt("Enter new backend password")
    if (pw) { sessionStorage.setItem("apiPassword", pw); setMessage("Backend password updated."); setError("") }
  }

  const validate = () => {
    if (!formData.subject.trim())          return "Subject is required."
    if (!formData.description.trim())      return "Description is required."
    if (!formData.location.trim())         return "Location is required."
    if (!formData.preferredContact.trim()) return "Preferred contact is required."
    return ""
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setMessage(""); setError("")
    try {
      const validationError = validate()
      if (validationError) throw new Error(validationError)

      const apiPassword = getApiPassword()
      if (!apiPassword) throw new Error("Backend password is required to continue.")

      const payload = {
        userId: TEMP_USER_ID,
        category: formData.category,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        location: formData.location.trim(),
        preferredContact: formData.preferredContact.trim(),
      }
      if (formData.resourceId.trim()) payload.resourceId = formData.resourceId.trim()

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Basic " + btoa(`${API_USERNAME}:${apiPassword}`) },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        if (res.status === 401) { sessionStorage.removeItem("apiPassword"); throw new Error("Unauthorized. Please update the backend password and try again.") }
        throw new Error(text || `Request failed with status ${res.status}`)
      }

      const data = await res.json()
      setMessage(`Ticket created successfully. ID: ${data.id}`)
      handleReset()
    } catch (err) {
      setError(err.message || "Failed to create ticket")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <section className="relative overflow-hidden rounded-[26px] border border-white/60 bg-white/80 p-5 shadow-[0_14px_40px_rgba(21,32,85,0.10)] backdrop-blur-sm sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/8 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#001d45] px-3 py-0.5 text-[10px] font-semibold tracking-wide text-white">
            <Ticket className="h-3 w-3" /> Maintenance & Incident Module
          </p>
          <h1 className="mt-1.5 text-2xl font-bold text-navy sm:text-3xl">Create Support Ticket</h1>
          <p className="mt-0.5 text-sm text-[#5a6b98]">Report hardware, software, network, or facility issues so the maintenance team can respond faster.</p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[280px_1fr]">

        {/* ── Sidebar ── */}
        <aside className="space-y-4">
          <div className="rounded-[22px] border border-white/60 bg-white p-5 shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#001d45]/10">
                <FileText className="h-3.5 w-3.5 text-[#001d45]" />
              </span>
              <p className="text-sm font-semibold text-navy">Guidelines</p>
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-[#6677a4]">
              <li className="flex gap-2"><span className="mt-0.5 text-[#001d45]">•</span> A temporary user ID is used until login is implemented.</li>
              <li className="flex gap-2"><span className="mt-0.5 text-[#001d45]">•</span> Provide a resource ID if the issue relates to a specific resource.</li>
              <li className="flex gap-2"><span className="mt-0.5 text-[#001d45]">•</span> Keep subject short and descriptive.</li>
              <li className="flex gap-2"><span className="mt-0.5 text-[#001d45]">•</span> Explain the issue thoroughly in description.</li>
            </ul>

            <div className="mt-4 rounded-xl border border-[#001d45]/20 bg-[#001d45]/8 px-3 py-2.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#001d45]/60">Temp User ID</p>
              <p className="mt-0.5 break-all text-[10px] font-mono font-semibold text-[#001d45]">{TEMP_USER_ID}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUpdatePassword}
            className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white py-3 text-sm font-semibold text-[#6677a4] transition-all hover:border-[#001d45]/40 hover:text-[#001d45] shadow-sm"
          >
            <KeyRound className="h-4 w-4" /> Update Backend Password
          </button>

          {/* Priority legend */}
          <div className="rounded-[22px] border border-white/60 bg-white p-4 shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Priority Levels</p>
            <div className="space-y-2">
              {PRIORITIES.map(p => (
                <div key={p} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${priorityColors[p]}`}>{p}</div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Form ── */}
        <div className="rounded-[26px] border border-white/60 bg-white p-6 shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10">
              <Ticket className="h-4 w-4 text-brand" />
            </span>
            <div>
              <p className="text-sm font-bold text-navy">New Ticket</p>
              <p className="text-[11px] text-[#8494c2]">Fill all required fields to submit</p>
            </div>
          </div>

          {message && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{message}
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Resource ID <span className="normal-case text-slate-400">(optional)</span></label>
                <input type="text" name="resourceId" value={formData.resourceId} onChange={handleChange} placeholder="Enter resource ObjectId" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Priority</label>
                <select name="priority" value={formData.priority} onChange={handleChange} className={inputCls}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Preferred Contact</label>
                <input type="text" name="preferredContact" value={formData.preferredContact} onChange={handleChange} placeholder="e.g. 0771234567" required className={inputCls} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Subject</label>
              <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="e.g. Monitor not working" required className={inputCls} />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the issue clearly..." required rows={4} className={`${inputCls} resize-vertical`} />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Lab A-105" required className={inputCls} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={handleReset} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
              <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(244,94,43,0.30)] transition-all hover:opacity-90 disabled:opacity-60">
                <Send className="h-3.5 w-3.5" /> {loading ? "Submitting…" : "Create Ticket"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-navy outline-none transition-colors placeholder-slate-400 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"

export default CreateTicketPage
