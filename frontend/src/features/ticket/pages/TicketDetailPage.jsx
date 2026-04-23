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
  CheckCircle2
} from "lucide-react"
import { getTicketById, addTicketMessage, updateTicket, getTechnicians, assignTechnician } from "@/features/ticket/services/ticketService.js"
import { toast } from "sonner"

const statusColors = {
  OPEN: "bg-emerald-100 text-emerald-700 border-emerald-200",
  IN_PROGRESS: "bg-[#f5b800]/15 text-[#b08800] border-[#f5b800]/30",
  RESOLVED: "bg-blue-100 text-blue-700 border-blue-200",
  CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
}

export default function TicketDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [technicians, setTechnicians] = useState([])
  const [showAssign, setShowAssign] = useState(false)
  const chatEndRef = useRef(null)

  const currentUserId = sessionStorage.getItem("userId")
  const currentUserRole = sessionStorage.getItem("role") || "USER"
  const isTechnician = currentUserRole === "TECHNICIAN" || currentUserRole === "ADMIN"

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
      await updateTicket(id, { status: newStatus })
      loadTicket()
    } catch (err) {
      alert("Failed to update status")
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

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
  if (error) return <div className="p-10 text-center text-red-500"><AlertCircle className="mx-auto mb-2 h-10 w-10" />{error}</div>
  if (!ticket) return null

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ── Header ── */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-semibold text-[#8494c2] hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" /> Back to List
      </button>

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
              
              {isTechnician && (
                <div className="flex gap-2">
                  {ticket.status === 'OPEN' && (
                    <button 
                      onClick={() => handleStatusChange('IN_PROGRESS')}
                      className="rounded-xl bg-[#001d45] px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                    >
                      Take Ticket
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
            </div>

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
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${isMe ? 'text-white/60' : 'text-[#8494c2]'}`}>
                            {msg.senderName} • {msg.senderRole}
                          </span>
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
          <section className="rounded-[26px] border border-white/60 bg-white p-6 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Requestor Info</h3>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
                <User className="h-5 w-5 text-brand" />
              </div>
              <div>
                <p className="text-sm font-bold text-navy">{ticket.userId.split('@')[0]}</p>
                <p className="text-[10px] text-[#8494c2]">{ticket.userId}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#8494c2]">Priority Level</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className={`h-2 w-full rounded-full bg-slate-100 overflow-hidden`}>
                    <div className={`h-full rounded-full ${
                      ticket.priority === 'HIGH' ? 'bg-red-500 w-full' : 
                      ticket.priority === 'MEDIUM' ? 'bg-[#f5b800] w-2/3' : 'bg-emerald-500 w-1/3'
                    }`} />
                  </div>
                  <span className="text-[10px] font-bold text-navy">{ticket.priority}</span>
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#8494c2]">Resource Link</p>
                <p className="mt-1 text-xs font-medium text-navy">{ticket.resourceId || "Campus General"}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[26px] border border-white/60 bg-[#001d45] p-6 text-white shadow-lg">
             <div className="flex items-center gap-3 mb-6">
               <Shield className="h-6 w-6 text-brand" />
               <h3 className="text-base font-bold">Ticket Progress</h3>
             </div>
             
             <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/20">
                {[
                  { label: 'Created', status: 'COMPLETED', time: ticket.createdAt },
                  { label: ticket.assignedTechnicianName ? `Assigned to: ${ticket.assignedTechnicianName}` : 'Technician Assigned', status: ticket.assignedTechnicianId ? 'COMPLETED' : 'PENDING' },
                  { label: 'Work In Progress', status: ticket.status === 'IN_PROGRESS' || ticket.status === 'RESOLVED' ? 'COMPLETED' : 'PENDING' },
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
        </div>
      </div>
    </div>
  )
}
