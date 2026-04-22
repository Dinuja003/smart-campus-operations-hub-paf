import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Plus,
  Ticket as TicketIcon,
  X,
  Pencil,
  Trash2,
  ChevronRight,
  MessageSquare
} from "lucide-react"
import { getUserTickets, deleteTicket } from "@/features/ticket/services/ticketService.js"

const TEMP_USER_ID = "69c038632d897c2ee8880785"

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

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cancelling, setCancelling] = useState(null)
  const navigate = useNavigate()

  const loadTickets = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getUserTickets(TEMP_USER_ID)
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return
    setCancelling(id)
    try {
      await deleteTicket(id, TEMP_USER_ID)
      setTickets((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      alert(err.message || "Failed to delete ticket")
    } finally {
      setCancelling(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <section className="relative overflow-hidden rounded-[26px] border border-white/60 bg-white/80 p-5 shadow-[0_14px_40px_rgba(21,32,85,0.10)] backdrop-blur-sm sm:p-6">
        <div className="pointer-events-none absolute -left-10 top-6 h-36 w-36 rounded-full bg-brand/12 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-0.5 text-[10px] font-semibold tracking-wide text-brand">
              <TicketIcon className="h-3 w-3" /> Support Workspace
            </p>
            <h1 className="mt-1.5 text-2xl font-bold text-navy sm:text-3xl">My Support Tickets</h1>
            <p className="mt-0.5 text-sm text-[#5a6b98]">Track progress, update details, or report new incidents to the technical team.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/tickets/create")}
            className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(244,94,43,0.30)] transition-all hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Create New Ticket
          </button>
        </div>
      </section>

      {/* ── Error Alert ── */}
      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Stats Summary ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total Tickets", value: tickets.length, color: "text-navy" },
          { label: "Pending/Open", value: tickets.filter(t => t.status === "OPEN").length, color: "text-emerald-600" },
          { label: "Resolved", value: tickets.filter(t => t.status === "RESOLVED").length, color: "text-blue-600" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/60 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tickets List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#8494c2]">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
          <p className="mt-3 text-sm">Fetching your tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-slate-200 bg-white py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
            <TicketIcon className="h-6 w-6 text-brand" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-navy">No tickets yet</h3>
          <p className="mt-1 text-sm text-[#8494c2]">Everything seems to be running smoothly! Report an issue if needed.</p>
          <button 
            type="button" 
            onClick={() => navigate("/tickets/create")} 
            className="mt-5 flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(244,94,43,0.25)] hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Create First Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div 
              key={ticket.id} 
              onClick={() => navigate(`/tickets/${ticket.id}`)}
              className="cursor-pointer group relative overflow-hidden rounded-[22px] border border-white/60 bg-white p-5 shadow-[0_8px_30px_rgba(21,32,85,0.07)] transition-all hover:shadow-[0_14px_40px_rgba(21,32,85,0.11)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusColors[ticket.status] || "bg-slate-100 text-slate-600"}`}>
                      {ticket.status}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${priorityColors[ticket.priority] || "bg-slate-100 text-slate-600"}`}>
                      {ticket.priority} Priority
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-navy">{ticket.subject}</h3>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8494c2]">
                    <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> {ticket.category}</span>
                    {ticket.location && <span className="flex items-center gap-1.5">📍 {ticket.location}</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
                  {ticket.canEdit && (
                    <button 
                      onClick={() => navigate(`/tickets/edit/${ticket.id}`)}
                      className="rounded-xl p-2 text-[#8494c2] hover:bg-slate-100 hover:text-brand"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  {ticket.canDelete && (
                    <button 
                      disabled={cancelling === ticket.id}
                      onClick={() => handleDelete(ticket.id)}
                      className="rounded-xl p-2 text-[#8494c2] hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    >
                      {cancelling === ticket.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  )}
                  <button className="flex items-center gap-1 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-100">
                    Details <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              
              <p className="mt-3 line-clamp-2 text-sm text-[#6677a4]">{ticket.description}</p>
              
              {ticket.resolutionNotes && (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-xs">
                  <p className="font-bold text-blue-700 uppercase tracking-widest text-[9px]">Resolution Note</p>
                  <p className="mt-1 text-blue-800">{ticket.resolutionNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
