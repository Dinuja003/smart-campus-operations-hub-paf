import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Send,
  Ticket,
  X,
  CalendarCheck2
} from "lucide-react"
import { createTicket, getTicketById, updateTicket } from "@/features/ticket/services/ticketService.js"
import bookingService from "@/features/booking/Services/BookingService"
import resourceService from "@/features/resources/services/resourceService"
import { toast } from "sonner"

const CATEGORIES = ["ELECTRICAL", "HARDWARE", "SOFTWARE", "FURNITURE", "NETWORK", "OTHER"]
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"]

const priorityColors = {
  LOW: "bg-emerald-100 text-emerald-700 border-emerald-200",
  MEDIUM: "bg-[#f5b800]/15 text-[#b08800] border-[#f5b800]/30",
  HIGH: "bg-red-100 text-red-600 border-red-200",
}

function CreateTicketPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const initialForm = {
    resourceId: "",
    category: "HARDWARE",
    subject: "",
    description: "",
    priority: "MEDIUM",
    location: "",
    preferredContact: "",
    bookingId: ""
  }

  const [formData, setFormData] = useState(initialForm)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [bookings, setBookings] = useState([])
  const [resources, setResources] = useState([])
  const [fetchingData, setFetchingData] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setFetchingData(true)
      try {
        const [bookingsRes, resourcesRes] = await Promise.allSettled([
          bookingService.getMyBookings(),
          resourceService.getAllResources()
        ])

        if (bookingsRes.status === 'fulfilled') {
          setBookings(Array.isArray(bookingsRes.value) ? bookingsRes.value : [])
        }
        if (resourcesRes.status === 'fulfilled') {
          setResources(Array.isArray(resourcesRes.value) ? resourcesRes.value : [])
        }
      } catch (err) {
        console.error("Failed to load data:", err)
      } finally {
        setFetchingData(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (isEdit) {
      const fetchTicket = async () => {
        setFetchingData(true)
        try {
          const ticket = await getTicketById(id)
          setFormData({
            resourceId: ticket.resourceId || "",
            category: ticket.category,
            subject: ticket.subject,
            description: ticket.description,
            priority: ticket.priority,
            location: ticket.location || "",
            preferredContact: ticket.preferredContact || "",
            bookingId: ""
          })
        } catch (err) {
          toast.error("Failed to load ticket for editing")
          navigate("/tickets")
        } finally {
          setFetchingData(false)
        }
      }
      fetchTicket()
    }
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === "bookingId") {
      const selectedBooking = bookings.find(b => b.id === value)
      if (selectedBooking) {
        const res = resources.find(r => r.id === selectedBooking.resourceId)
        const locStr = res?.location ? [res.location.building, res.location.floor, res.location.room].filter(Boolean).join(", ") : ""

        setFormData(prev => ({
          ...prev,
          bookingId: value,
          resourceId: selectedBooking.resourceId,
          category: selectedBooking.resourceType === "EQUIPMENT" ? "HARDWARE" : "OTHER",
          location: locStr
        }))
      } else {
        setFormData(prev => ({ ...prev, bookingId: "", resourceId: "" }))
      }
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (files.length + selectedFiles.length > 3) {
      toast.error("Maximum 3 images allowed")
      return
    }
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    if (!formData.subject.trim()) return "Subject is required."
    if (!formData.description.trim()) return "Description is required."
    if (!formData.location.trim()) return "Location is required."
    if (!formData.preferredContact.trim()) return "Preferred contact is required."
    if (files.length > 3) return "You can upload up to 3 images only."
    return ""
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const validationError = validate()
      if (validationError) throw new Error(validationError)

      const userId = sessionStorage.getItem("userId")
      if (!userId) {
        toast.error("You must be logged in to create a ticket")
        return
      }

      const payload = {
        userId,
        resourceId: formData.resourceId || null,
        category: formData.category,
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        location: formData.location.trim(),
        preferredContact: formData.preferredContact.trim(),
      }

      if (isEdit) {
        await updateTicket(id, payload)
        toast.success("Ticket updated successfully!")
      } else {
        await createTicket(payload, files)
        toast.success("Ticket created successfully!")
      }
      setTimeout(() => navigate("/tickets"), 1500)
    } catch (err) {
      console.error("Ticket creation error:", err)
      toast.error(err.response?.data?.message || err.message || "Failed to create ticket")
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/5"

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[26px] border border-white/60 bg-white/80 p-5 shadow-[0_14px_40px_rgba(21,32,85,0.10)] backdrop-blur-sm sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/8 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-0.5 text-[10px] font-semibold tracking-wide text-brand uppercase">
            <Ticket className="h-3.5 w-3.5" /> Support Desk
          </p>
          <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
            {isEdit ? "Edit Support Ticket" : "Create Support Ticket"}
          </h1>
          <p className="mt-1 text-sm text-[#5a6b98]">
            {isEdit 
              ? "Update the details of your existing report below." 
              : "Report an issue or request technical assistance from the campus facilities team."}
          </p>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <section className="rounded-[26px] border border-white/60 bg-white p-5 shadow-sm sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">
                  Related Booking <span className="normal-case text-slate-400">(optional)</span>
                </label>
                <select
                  name="bookingId"
                  value={formData.bookingId}
                  onChange={handleChange}
                  className={inputCls}
                  disabled={fetchingData}
                >
                  <option value="">No related booking</option>
                  {bookings
                    .filter(b => b.status && String(b.status).toUpperCase() === "APPROVED")
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        {b.date} - {b.resourceType}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">
                  Affected Resource
                </label>
                <select
                  name="resourceId"
                  value={formData.resourceId}
                  onChange={handleChange}
                  className={inputCls}
                  disabled={fetchingData}
                >
                  <option value="">Select a resource...</option>
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.location ? `(${r.location.building}, ${r.location.floor}, ${r.location.room})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Priority</label>
                <select name="priority" value={formData.priority} onChange={handleChange} className={inputCls}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="e.g. Monitor not working"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the issue clearly..."
                  rows={4}
                  className={`${inputCls} resize-vertical`}
                />
              </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">
                  <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Location</div>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Lab 04, Level 2"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Preferred Contact</label>
                <input
                  type="text"
                  name="preferredContact"
                  value={formData.preferredContact}
                  onChange={handleChange}
                  placeholder="Email or Phone number"
                  className={inputCls}
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[26px] border border-white/60 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-navy uppercase tracking-widest text-[10px]">Attachments</h3>
            <p className="mt-1 text-xs text-[#8494c2]">Up to 3 image attachments are allowed.</p>

            <div className="mt-4 space-y-3">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                      <ImageIcon className="h-4 w-4 text-brand" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-navy">{file.name}</p>
                      <p className="text-[10px] text-[#8494c2]">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {files.length < 3 && (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 py-6 transition hover:border-brand/30 hover:bg-brand/5">
                  <ImageIcon className="h-6 w-6 text-[#8494c2]" />
                  <span className="mt-2 text-xs font-semibold text-[#8494c2]">Choose images</span>
                  <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
          </section>

          <section className="rounded-[26px] border border-white/60 bg-[#001d45] p-6 text-white shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 text-[10px]">Guidelines</h3>
            <ul className="mt-4 space-y-3">
              {[
                "Be specific about the issue",
                "Mention exact error codes if any",
                "Include location for faster response"
              ].map((txt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-white/80">
                  <div className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand" />
                  {txt}
                </li>
              ))}
            </ul>
            <button
              type="submit"
              disabled={loading}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,94,43,0.3)] transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Save Changes" : "Create Ticket")}
            </button>
          </section>
        </aside>
      </form>
    </div>
  )
}

export default CreateTicketPage