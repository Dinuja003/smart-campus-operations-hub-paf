import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  Clock3,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Ticket as TicketIcon,
  Trash2,
} from "lucide-react"
import { deleteTicket, getAllTickets } from "@/features/ticket/services/ticketService.js"
import { toast } from "sonner"

const statusCls = {
  OPEN: "bg-emerald-100 text-emerald-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-blue-100 text-blue-700",
  CLOSED: "bg-slate-100 text-slate-600",
}

const priorityCls = {
  LOW: "text-[#6d7faa]",
  MEDIUM: "text-[#b08800]",
  HIGH: "text-red-500",
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [confirmModal, setConfirmModal] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const navigate = useNavigate()

  const loadTickets = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getAllTickets()
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return tickets
    return tickets.filter((t) => {
      const haystack = `${t.subject || ""} ${t.category || ""} ${t.location || ""}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [tickets, searchTerm])

  const handleDelete = async () => {
    if (!confirmModal) return
    const ticket = confirmModal
    const isHardDelete = !ticket.assignedTechnicianId

    setRemovingId(ticket.id)
    setConfirmModal(null)
    try {
      await deleteTicket(ticket.id)
      setTickets((prev) => prev.filter((t) => t.id !== ticket.id))
      toast.success(isHardDelete ? "Ticket deleted permanently" : "Ticket removed from your view")
    } catch (err) {
      toast.error(err?.message || "Failed to process request")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">WORKSPACE · TICKETS</p>
        <div className="mt-1.5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[2rem] font-bold leading-tight text-navy">
              My issues, tracked.
            </h1>
            <p className="mt-1 text-sm text-[#5a6b98]">Create and monitor your support requests in one structured queue.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/tickets/create")}
            className="flex items-center gap-2 rounded-xl bg-[#001d45] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(0,29,69,0.25)] hover:bg-[#002a66] transition-colors"
          >
            <Plus className="h-4 w-4" /> New ticket
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total", value: tickets.length, color: "bg-[#001d45] text-white" },
          { label: "Open", value: tickets.filter((t) => t.status === "OPEN").length, color: "bg-emerald-500 text-white" },
          { label: "Resolved", value: tickets.filter((t) => t.status === "RESOLVED").length, color: "bg-brand text-white" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl px-4 py-3 ${s.color}`}>
            <p className="text-xl font-bold leading-none">{s.value}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8494c2]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, category, location"
          className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2.5 text-sm text-navy outline-none transition focus:border-brand"
        />
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
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-slate-200 bg-white py-20 text-center">
          <TicketIcon className="h-6 w-6 text-brand" />
          <p className="mt-3 text-sm font-semibold text-navy">No tickets found</p>
          <p className="mt-1 text-xs text-[#8494c2]">Create a ticket when you need technical help.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[20px] border border-white/60 bg-white shadow-[0_8px_30px_rgba(21,32,85,0.08)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {[
                    "ID",
                    "Subject",
                    "Category",
                    "Created",
                    "Status",
                    "Priority",
                    "",
                  ].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50/50"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#8494c2]">TK-{ticket.id.slice(-4).toUpperCase()}</td>
                    <td className="px-5 py-3.5 font-semibold text-navy">{ticket.subject}</td>
                    <td className="px-5 py-3.5 text-[#6677a4]">{ticket.category || "-"}</td>
                    <td className="px-5 py-3.5 text-[#6677a4]">
                      <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusCls[ticket.status] || "bg-slate-100 text-slate-600"}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className={`px-5 py-3.5 text-xs font-bold uppercase ${priorityCls[ticket.priority] || "text-[#6d7faa]"}`}>{ticket.priority || "MEDIUM"}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!ticket.editable) {
                              toast.error("Cannot edit this ticket right now")
                              return
                            }
                            navigate(`/tickets/edit/${ticket.id}`)
                          }}
                          className={`rounded-md p-1.5 ${ticket.editable ? "text-[#8494c2] hover:bg-slate-100 hover:text-brand" : "cursor-not-allowed text-slate-300"}`}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={removingId === ticket.id}
                          onClick={() => {
                            if (!ticket.deletable) {
                              toast.error("Cannot remove this ticket at current stage")
                              return
                            }
                            setConfirmModal(ticket)
                          }}
                          className={`rounded-md p-1.5 ${ticket.deletable ? "text-[#8494c2] hover:bg-red-50 hover:text-red-500" : "cursor-not-allowed text-slate-300"}`}
                          title="Remove"
                        >
                          {removingId === ticket.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                        <button type="button" onClick={() => navigate(`/tickets/${ticket.id}`)} className="rounded-md p-1.5 text-[#8494c2] hover:bg-slate-100 hover:text-navy" title="Details">
                          <MessageSquare className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
          <div className="relative w-full max-w-sm rounded-[26px] border border-white/60 bg-white p-6 shadow-[0_30px_70px_rgba(21,32,85,0.25)]">
            <h2 className="text-center text-lg font-bold text-navy">
              {!confirmModal.assignedTechnicianId ? "Delete ticket permanently?" : "Hide ticket from your dashboard?"}
            </h2>
            <p className="mt-2 text-center text-sm text-[#5a6b98]">
              {!confirmModal.assignedTechnicianId
                ? "This unassigned ticket will be permanently removed from records."
                : "The ticket remains in campus records and is removed from your personal queue."}
            </p>
            <div className="mt-6 flex gap-2">
              <button onClick={handleDelete} className="flex-1 rounded-xl bg-[#001d45] py-2.5 text-sm font-bold text-white hover:bg-[#002a66]">Confirm</button>
              <button onClick={() => setConfirmModal(null)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-[#6677a4] hover:bg-slate-200">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
