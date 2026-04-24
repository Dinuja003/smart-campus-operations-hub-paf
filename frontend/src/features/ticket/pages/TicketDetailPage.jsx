import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  Loader2,
  MessageSquare,
  Send,
  User,
  Shield,
  MapPin,
  Tag,
  Paperclip,
  CheckCircle2,
  Pencil,
  Trash2,
  Globe,
  Zap,
  Timer,
  Sparkles,
  Activity,
  Brain,
  TrendingUp,
  Target
} from "lucide-react"
import { getTicketById, addTicketMessage, updateTicket, updateTicketStatus, getTechnicians, assignTechnician, deleteTicket, deleteTicketMessage } from "@/features/ticket/services/ticketService.js"
import { toast } from "sonner"

const statusColors = {
  OPEN: "bg-emerald-500 text-white shadow-emerald-500/20",
  IN_PROGRESS: "bg-brand text-white shadow-brand/20",
  RESOLVED: "bg-[#001d45] text-white shadow-navy/20",
  CLOSED: "bg-slate-700 text-white"
}

export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cancelling, setCancelling] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [technicians, setTechnicians] = useState([])
  const [showAssign, setShowAssign] = useState(false)
  const [showPrediction, setShowPrediction] = useState(false)
  const chatEndRef = useRef(null)

  const currentUserId = sessionStorage.getItem("userId")
  const currentUserRole = sessionStorage.getItem("role") || "USER"
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadTicket = async () => {
    try {
      const data = await getTicketById(id)
      setTicket(data)
    } catch (err) {
      setError("Failed to load ticket details")
    } finally {
      setLoading(false)
    }

    // Load technicians separately (Admin only)
    if (currentUserRole === "ADMIN") {
      try {
        const techs = await getTechnicians()
        setTechnicians(techs)
      } catch (err) {
        console.error("Failed to load technician list:", err)
      }
    }
  }

  useEffect(() => {
    loadTicket()
    // Poll for new messages every 10 seconds
    const interval = setInterval(loadTicket, 10000)
    return () => clearInterval(interval)
  }, [id])

  useEffect(scrollToBottom, [ticket?.messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const messageObj = {
        senderId: currentUserId,
        senderName: sessionStorage.getItem("email")?.split('@')[0] || "User",
        senderRole: currentUserRole,
        content: newMessage.trim()
      }
      const updatedTicket = await addTicketMessage(id, messageObj)
      setTicket(updatedTicket)
      setNewMessage("")
    } catch (err) {
      alert("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await updateTicketStatus(id, newStatus)
      if (newStatus === 'IN_PROGRESS') toast.success("Ticket is now in progress")
      if (newStatus === 'RESOLVED') toast.success("Ticket successfully resolved!")
      loadTicket()
    } catch (err) {
      console.error("Status update error:", err)
      alert("Failed to update status: " + (err.response?.data?.message || err.message))
    }
  }

  const handleAssign = async (techId) => {
    try {
      await assignTechnician(id, techId)
      toast.success("Technician assigned")
      setShowAssign(false)
      loadTicket()
    } catch (err) {
      toast.error("Assignment failed")
    }
  }

  const handleDelete = async () => {
    if (!confirmModal) return
    const ticketData = confirmModal
    const isHardDelete = !ticketData.assignedTechnicianId
    
    setCancelling(true)
    setConfirmModal(null)
    try {
      await deleteTicket(id)
      toast.success(isHardDelete ? "Ticket permanently deleted" : "Ticket removed from view", {
        description: isHardDelete ? "The report has been removed." : "The ticket is hidden from your dashboard."
      })
      navigate("/tickets")
    } catch (err) {
      toast.error(err.message || "Failed to process request")
    } finally {
      setCancelling(false)
    }
  }

  const calculateDuration = (start, end) => {
    if (!start || !end) return null
    const s = new Date(start)
    const e = new Date(end)
    const diff = e - s
    if (diff < 0) return "—"
    
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours < 24) return `${hours}h ${mins}m`
    const days = Math.floor(hours / 24)
    const hrs = hours % 24
    return `${days}d ${hrs}h`
  }

  const handleDeleteMessage = async (messageId) => {
    if (!messageId) {
      toast.error("Cannot delete legacy messages without ID")
      return
    }
    
    try {
      const updatedTicket = await deleteTicketMessage(id, messageId)
      setTicket(updatedTicket)
      toast.success("Message removed")
    } catch (err) {
      toast.error("Failed to delete message")
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
  if (error) return <div className="p-10 text-center text-red-500"><AlertCircle className="mx-auto mb-2 h-10 w-10" />{error}</div>
  if (!ticket) return null

  const responseTime = calculateDuration(ticket.createdAt, ticket.firstResponseAt)
  const resolutionTime = calculateDuration(ticket.createdAt, ticket.resolvedAt)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">WORKSPACE · TICKET DETAIL</p>
        <h1 className="mt-1.5 text-[2rem] font-bold leading-tight text-navy">Incident timeline & actions.</h1>
        <p className="mt-1 text-sm text-[#5a6b98]">Track updates, collaborate in-thread, and move resolution forward.</p>
      </div>

      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold text-[#8494c2] hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" /> Back to List
      </button>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Current Status", value: ticket.status, icon: Zap, cls: statusColors[ticket.status] || "bg-[#001d45] text-white" },
          { label: "Priority", value: ticket.priority, icon: AlertCircle, cls: ticket.priority === 'HIGH' ? "bg-[#b91c1c] text-white shadow-red-500/20" : "bg-[#ea580c] text-white shadow-orange-500/20" },
          { label: "Response Time", value: responseTime || "Awaiting...", icon: Timer, cls: "bg-[#001d45] text-white shadow-navy/20 border border-white/10" },
          { label: "Resolution Time", value: resolutionTime || "In Progress", icon: Timer, cls: "bg-[#001d45] text-white shadow-navy/20 border border-white/10" },
        ].map((s) => (
          <div key={s.label} className={`rounded-[22px] px-5 py-6 relative overflow-hidden transition-transform hover:-translate-y-1 ${s.cls}`}>
            <s.icon className="absolute -right-3 -top-3 h-16 w-16 opacity-10" />
            <p className="relative z-10 text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">{s.label}</p>
            <p className="relative z-10 text-2xl font-black leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* ── Left Column: Details ── */}
        <div className="space-y-6">
          <section className="rounded-[26px] border border-white/60 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${statusColors[ticket.status]}`}>
                    {ticket.status}
                  </span>
                  <p className="text-xs text-[#8494c2]">Created on {new Date(ticket.createdAt).toLocaleString()}</p>
                </div>
                <h1 className="mt-3 text-2xl font-bold text-navy sm:text-3xl">{ticket.subject}</h1>
              </div>
              
              <div className="flex gap-2">
                {/* ── User Edit/Delete ── */}
                {ticket.userId === currentUserId && (
                  <>
                    {ticket.editable ? (
                      <button 
                        onClick={() => navigate(`/tickets/edit/${id}`)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#8494c2] hover:bg-slate-50 hover:text-brand transition-colors"
                        title="Edit Ticket"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => toast.error("Edit Locked", { description: "Technicians have already started work." })}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-200 opacity-40 cursor-not-allowed"
                        title="Editing is disabled"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {ticket.deletable ? (
                      <button 
                        onClick={() => setConfirmModal(ticket)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#8494c2] hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete Ticket"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => toast.error("Delete Locked", { description: "Work is currently in progress." })}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-200 opacity-40 cursor-not-allowed"
                        title="Deletion is disabled"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}

                {/* ── Tech/Admin Actions ── */}
                {currentUserRole === "TECHNICIAN" && currentUserId === ticket.assignedTechnicianId && (
                  <div className="flex gap-2">
                    {ticket.status === 'OPEN' && (
                      <button 
                        onClick={() => handleStatusChange('IN_PROGRESS')}
                        className="rounded-xl bg-[#001d45] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                      >
                        Start Work
                      </button>
                    )}
                    {ticket.status === 'IN_PROGRESS' && (
                      <button 
                        onClick={() => handleStatusChange('RESOLVED')}
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                )}
                
                {/* ── Tech/Admin Cleanup ── */}
                {(currentUserRole === "ADMIN" || currentUserRole === "TECHNICIAN") && (
                   <button 
                     onClick={() => setConfirmModal(ticket)}
                     className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#8494c2] hover:bg-red-50 hover:text-red-500 transition-colors"
                     title="Hide from dashboard"
                   >
                     <Trash2 className="h-4 w-4" />
                   </button>
                )}
              </div>
            </div>

            {/* ── Beautiful Delete Modal ── */}
            {confirmModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
                <div className="relative w-full max-w-sm rounded-[32px] border border-white/60 bg-white p-8 shadow-[0_30px_70px_rgba(21,32,85,0.25)]">
                  <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${!confirmModal.assignedTechnicianId ? "bg-red-50" : "bg-blue-50"}`}>
                    <Trash2 className={`h-8 w-8 ${!confirmModal.assignedTechnicianId ? "text-red-500" : "text-blue-500"}`} />
                  </div>
                  
                  <h2 className="text-center text-xl font-bold text-navy">
                    {!confirmModal.assignedTechnicianId ? "Delete for Everyone?" : "Remove from View?"}
                  </h2>
                  <p className="mt-2 text-center text-sm leading-relaxed text-[#5a6b98]">
                    {!confirmModal.assignedTechnicianId 
                      ? "This ticket hasn't been assigned. It will be permanently removed from the system."
                      : "This resolved ticket will be hidden from your dashboard but kept in campus records."}
                  </p>
                  
                  <div className="mt-8 flex flex-col gap-3">
                    <button
                      onClick={handleDelete}
                      disabled={cancelling}
                      className={`w-full rounded-2xl py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 ${!confirmModal.assignedTechnicianId ? "bg-red-500 shadow-red-500/25" : "bg-brand shadow-brand/25"}`}
                    >
                      {cancelling ? "Processing..." : (!confirmModal.assignedTechnicianId ? "Yes, Delete Permanently" : "Yes, Hide Ticket")}
                    </button>
                    <button
                      onClick={() => setConfirmModal(null)}
                      className="w-full rounded-2xl bg-slate-50 py-3 text-sm font-bold text-[#8494c2] transition hover:bg-slate-100 hover:text-navy"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-50 bg-slate-50/50 p-4">
                <Tag className="h-5 w-5 text-brand" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Category</p>
                  <p className="text-sm font-semibold text-navy">{ticket.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-50 bg-slate-50/50 p-4">
                <MapPin className="h-5 w-5 text-brand" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Location</p>
                  <p className="text-sm font-semibold text-navy">{ticket.location || "Not specified"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-50 bg-slate-50/50 p-4 sm:col-span-2">
                <AlertCircle className="h-5 w-5 text-brand" />
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Priority Level</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${
                        ticket.priority === 'HIGH' ? 'bg-red-500 w-full' : 
                        ticket.priority === 'MEDIUM' ? 'bg-[#f5b800] w-2/3' : 'bg-emerald-500 w-1/3'
                      }`} />
                    </div>
                    <span className="text-[10px] font-bold text-navy">{ticket.priority}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-bold text-navy uppercase tracking-widest text-[10px]">Description</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#5a6b98] whitespace-pre-wrap">{ticket.description}</p>
            </div>

            {ticket.attachments?.length > 0 && (
              <div className="mt-8">
                <h3 className="flex items-center gap-2 text-sm font-bold text-navy uppercase tracking-widest text-[10px]">
                  <Paperclip className="h-3 w-3" /> Attachments
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {ticket.attachments.map((file, idx) => (
                    <a 
                      key={idx}
                      href={file.path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-brand/30 hover:bg-brand/5"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <img src={file.path} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-navy">{file.fileName}</p>
                        <p className="text-[10px] text-[#8494c2]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── Chat Section ── */}
          <section className="flex h-[500px] flex-col rounded-[26px] border border-white/60 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/30">
              <h3 className="flex items-center gap-2 text-sm font-bold text-navy">
                <MessageSquare className="h-4 w-4 text-brand" /> Communication Thread
              </h3>
              <span className="text-[10px] font-bold text-[#8494c2] uppercase">
                {ticket.messages?.length || 0} Messages
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8fafc]/30">
              {ticket.messages?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[#8494c2]">
                  <MessageSquare className="h-10 w-10 opacity-20 mb-2" />
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                ticket.messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUserId
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        isMe ? 'bg-[#001d45] text-white' : 'bg-white border border-slate-100 text-navy shadow-sm'
                      }`}>
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${isMe ? 'text-white/60' : 'text-[#8494c2]'}`}>
                            {msg.senderName} • {msg.senderRole}
                          </span>
                          {(isMe || currentUserRole === 'ADMIN') && msg.id && (
                            <button 
                              onClick={() => handleDeleteMessage(msg.id)}
                              className={`p-1 rounded-md transition-colors ${isMe ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-slate-100 text-[#8494c2] hover:text-red-500'}`}
                              title="Delete Message"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`mt-1 text-[8px] ${isMe ? 'text-white/40 text-right' : 'text-[#8494c2]'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="border-t border-slate-100 p-4 bg-white">
              <div className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 pr-14 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/5"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-brand p-2 text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* ── Right Column: Info & Progress ── */}
        <div className="space-y-6">

          <section className="rounded-[26px] border border-white/60 bg-[#001d45] p-6 text-white shadow-lg">
             <div className="flex items-center gap-3 mb-6">
               <Shield className="h-6 w-6 text-brand" />
               <h3 className="text-base font-bold">Ticket Progress</h3>
             </div>
             
             <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/20">
                {[
                  { label: 'Created', status: 'COMPLETED', time: ticket.createdAt },
                  { label: ticket.assignedTechnicianName ? `Assigned to: ${ticket.assignedTechnicianName}` : 'Technician Assigned', status: ticket.assignedTechnicianId ? 'COMPLETED' : 'PENDING' },
                  { label: 'Work In Progress', status: (ticket.status === 'IN_PROGRESS' || ticket.status === 'RESOLVED') ? 'COMPLETED' : 'PENDING' },
                  { label: 'Resolved', status: ticket.status === 'RESOLVED' ? 'COMPLETED' : 'PENDING' },
                ].map((step, idx) => (
                 <div key={idx} className="relative pl-8">
                   <div className={`absolute left-0 top-1 h-6 w-6 rounded-full border-4 border-[#001d45] flex items-center justify-center ${
                     step.status === 'COMPLETED' ? 'bg-brand' : 'bg-[#152055]'
                   }`}>
                     {step.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3 text-white" />}
                   </div>
                   <p className={`text-xs font-bold ${step.status === 'COMPLETED' ? 'text-white' : 'text-white/40'}`}>{step.label}</p>
                   {step.time && <p className="text-[9px] text-white/40">{new Date(step.time).toLocaleDateString()}</p>}
                 </div>
                ))}
              </div>

              {currentUserRole === "ADMIN" && !ticket.assignedTechnicianId && (
                <div className="mt-8 border-t border-white/10 pt-6">
                  <button 
                    onClick={() => setShowAssign(!showAssign)}
                    className="w-full rounded-xl bg-brand py-3 text-xs font-bold text-white shadow-lg hover:opacity-90"
                  >
                    {showAssign ? "Cancel Assignment" : "Assign Technician"}
                  </button>

                  {showAssign && (
                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Available Technicians</p>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {technicians.map(tech => (
                          <button
                            key={tech.id}
                            onClick={() => handleAssign(tech.id)}
                            className="w-full rounded-xl bg-white/5 p-3 text-left text-xs transition hover:bg-white/10"
                          >
                            <p className="font-bold">{tech.firstName} {tech.lastName}</p>
                            <p className="text-[10px] opacity-40">{tech.email}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
           </section>

           {/* ── Smart AI Insights & Health ── */}
           <section className="rounded-[32px] border border-white/60 bg-gradient-to-br from-[#001d45] to-[#0f2e63] p-6 text-white shadow-xl relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 h-24 w-24 bg-brand/20 blur-3xl group-hover:bg-brand/40 transition-all duration-700" />
             <div className="relative">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                   <Sparkles className="h-4 w-4 text-[#f5b800]" /> Smart Insights
                 </h3>
                 <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                   ticket.healthScore > 70 ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 
                   ticket.healthScore > 40 ? 'border-[#f5b800]/50 text-[#f5b800] bg-[#f5b800]/10' : 'border-red-500/50 text-red-400 bg-red-500/10'
                 }`}>
                   {ticket.healthScore}% HEALTHY
                 </div>
               </div>

               <div className="mb-6">
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-medium text-white/50">Incident Health Meter</span>
                   <span className="text-[10px] font-bold text-white">{ticket.healthScore}%</span>
                 </div>
                 <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                   <div 
                     className={`h-full rounded-full transition-all duration-1000 ${
                       ticket.healthScore > 70 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                       ticket.healthScore > 40 ? 'bg-[#f5b800] shadow-[0_0_10px_rgba(245,184,0,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                     }`} 
                     style={{ width: `${ticket.healthScore}%` }}
                   />
                 </div>
               </div>

               <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-1">System Suggestion</p>
                 <p className="text-sm leading-relaxed text-white/90 italic font-medium">
                   "{ticket.aiInsight}"
                 </p>
               </div>
               
               <button 
                 onClick={() => setShowPrediction(true)}
                 className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-[10px] font-bold uppercase tracking-widest transition-colors"
               >
                 <Activity className="h-3 w-3" /> View Prediction Model
               </button>
             </div>
           </section>
        </div>

        {/* ── Predictive Model Modal ── */}
        {showPrediction && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-navy/60 backdrop-blur-md" onClick={() => setShowPrediction(false)} />
            <div className="relative w-full max-w-lg rounded-[40px] border border-white/20 bg-[#001d45] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-12 w-12 rounded-2xl bg-brand/20 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-brand" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">AI Resolution Forecast</h2>
                    <p className="text-xs text-white/40 font-medium uppercase tracking-widest">Model: UniSlot-Predict v2.4</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="rounded-[24px] bg-white/5 border border-white/10 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-[#f5b800]" />
                      <span className="text-[10px] font-bold text-white/60 uppercase">Est. Resolution</span>
                    </div>
                    <p className="text-2xl font-black text-white">{ticket.estimatedResolutionHours} Hours</p>
                    <p className="text-[10px] text-white/40 mt-1">Based on historical {ticket.category} trends</p>
                  </div>
                  <div className="rounded-[24px] bg-white/5 border border-white/10 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-emerald-500" />
                      <span className="text-[10px] font-bold text-white/60 uppercase">Success Rate</span>
                    </div>
                    <p className="text-2xl font-black text-white">{(ticket.successProbability * 100).toFixed(1)}%</p>
                    <p className="text-[10px] text-white/40 mt-1">Confidence in current triage path</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-brand" />
                      <span className="text-sm font-medium text-white/80">Similar Incidents Detected</span>
                    </div>
                    <span className="text-lg font-bold text-white">{ticket.similarIncidents}</span>
                  </div>
                  
                  <div className="p-5 rounded-[24px] bg-brand/10 border border-brand/20">
                    <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-2">Model Commentary</p>
                    <p className="text-sm leading-relaxed text-white/90">
                      Our predictive model suggests this incident aligns with standard {ticket.category.toLowerCase()} maintenance patterns. 
                      Optimal resolution path involves verifying physical connection stability within the first 2 hours of assignment.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowPrediction(false)}
                  className="mt-8 w-full py-4 rounded-2xl bg-white text-[#001d45] font-black text-sm uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 shadow-xl"
                >
                  Close Forecast
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
