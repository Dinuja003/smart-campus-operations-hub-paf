import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  Clock3,
  Loader2,
  Ticket as TicketIcon,
  ChevronRight,
  MessageSquare,
  Search,
  Filter
} from "lucide-react"
import { getAllTickets, getTechnicians, assignTechnician, updateTicketStatus } from "@/features/ticket/services/ticketService.js"
import { toast } from "sonner"

const statusColors = {
  OPEN: "bg-emerald-100 text-emerald-700 border-emerald-200",
  IN_PROGRESS: "bg-[#f5b800]/15 text-[#b08800] border-[#f5b800]/30",
  RESOLVED: "bg-blue-100 text-blue-700 border-blue-200",
  CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
}

const priorityColors = {
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
  MEDIUM: "bg-[#f5b800]/10 text-[#b08800] border-[#f5b800]/20",
  HIGH: "bg-red-50 text-red-600 border-red-100",
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [technicians, setTechnicians] = useState([])
  const [assigningId, setAssigningId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadData() {
      // Load tickets
      try {
        const ticketsData = await getAllTickets()
        setTickets(Array.isArray(ticketsData) ? ticketsData : [])
      } catch (err) {
        setError("Failed to load campus tickets")
      }

      // Load technicians
      try {
        const techsData = await getTechnicians()
        setTechnicians(Array.isArray(techsData) ? techsData : [])
      } catch (err) {
        console.error("Failed to load technicians:", err)
        // We don't set a global error here to allow tickets to show
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.userId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleAssign = async (ticketId, technicianId) => {
    try {
      await assignTechnician(ticketId, technicianId)
      toast.success("Technician assigned successfully")
      setAssigningId(null)
      // Reload tickets
      const data = await getAllTickets()
      setTickets(data)
    } catch (err) {
      toast.error(err.message || "Assignment failed")
    }
  }

  const handleStartWork = async (ticketId) => {
    try {
      await updateTicketStatus(ticketId, 'IN_PROGRESS')
      toast.success("Ticket is now in progress")
      // Reload tickets
      const data = await getAllTickets()
      setTickets(data)
    } catch (err) {
      toast.error(err.message || "Failed to start work")
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <section className="relative overflow-hidden rounded-[26px] border border-white/60 bg-white/80 p-5 shadow-[0_14px_40px_rgba(21,32,85,0.10)] backdrop-blur-sm sm:p-6">
        <div className="pointer-events-none absolute -left-10 top-6 h-36 w-36 rounded-full bg-[#001d45]/12 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#001d45]/10 px-3 py-0.5 text-[10px] font-semibold tracking-wide text-[#001d45]">
            <TicketIcon className="h-3 w-3" /> Technical Operations
          </p>
          <h1 className="mt-1.5 text-2xl font-bold text-navy sm:text-3xl">Campus Support Queue</h1>
          <p className="mt-0.5 text-sm text-[#5a6b98]">Manage incident reports, respond to users, and track campus-wide technical health.</p>
        </div>
      </section>

      {/* ── Search & Filter ── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8494c2]" />
          <input
            type="text"
            placeholder="Search by subject or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/5"
          />
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Filter className="h-4 w-4 text-[#8494c2]" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-sm font-semibold text-navy outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-[26px] border-2 border-dashed border-slate-200 bg-white py-20 text-center text-[#8494c2]">
          <p>No tickets found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map((ticket) => (
            <div 
              key={ticket.id}
              onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
              className="cursor-pointer group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/60 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[ticket.status]}`}>
                    {ticket.status}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${priorityColors[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                  <span className="text-[10px] font-bold text-[#8494c2] uppercase tracking-tighter">
                    ID: {ticket.id.slice(-6)}
                  </span>
                </div>
                <h3 className="mt-2 text-base font-bold text-navy">{ticket.subject}</h3>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <p className="text-xs text-[#8494c2]">Requested by: <span className="font-mono">{ticket.userId}</span></p>
                  {ticket.assignedTechnicianName && (
                    <p className="text-xs font-semibold text-brand">Assigned to: {ticket.assignedTechnicianName}</p>
                  )}
                </div>
              </div>

                <div className="relative flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs text-[#8494c2]">
                      <Clock3 className="h-3.5 w-3.5" />
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                    <div className="mt-1 flex items-center justify-end gap-1.5 text-xs text-[#8494c2]">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {ticket.messages?.length || 0} messages
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {!ticket.assignedTechnicianId && (
                      <div className="relative">
                        <button 
                          onClick={() => setAssigningId(assigningId === ticket.id ? null : ticket.id)}
                          className="rounded-lg bg-brand/10 px-3 py-1.5 text-[10px] font-bold text-brand hover:bg-brand hover:text-white transition-colors"
                        >
                          ASSIGN
                        </button>
                        
                        {assigningId === ticket.id && (
                          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                            <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-widest text-[#8494c2]">Select Technician</p>
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {technicians.map(tech => (
                                <button
                                  key={tech.id}
                                  onClick={() => handleAssign(ticket.id, tech.id)}
                                  className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-navy hover:bg-slate-50 transition-colors"
                                >
                                  {tech.firstName} {tech.lastName}
                                </button>
                              ))}
                              {technicians.length === 0 && (
                                <p className="px-2 py-4 text-center text-[10px] text-slate-400">No technicians available</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
