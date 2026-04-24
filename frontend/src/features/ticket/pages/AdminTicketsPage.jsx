import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  Clock3,
  Filter,
  Loader2,
  MessageSquare,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react"
import {
  assignTechnician,
  deleteTicket,
  getAllTickets,
  getTechnicians,
  updateTicketStatus,
} from "@/features/ticket/services/ticketService.js"
import { toast } from "sonner"

const STAGES = [
  {
    key: "OPEN",
    label: "Open",
    dot: "bg-brand",
    cardBorder: "border-brand/30",
    columnBg: "bg-gradient-to-b from-[#fff5f1] to-white",
    columnBorder: "border-brand/15",
    badgeBg: "bg-brand/10 text-brand",
    emptyBorder: "border-brand/20",
  },
  {
    key: "IN_PROGRESS",
    label: "In progress",
    dot: "bg-[#f5b800]",
    cardBorder: "border-[#f5b800]/30",
    columnBg: "bg-gradient-to-b from-[#fff9e8] to-white",
    columnBorder: "border-[#f5b800]/25",
    badgeBg: "bg-[#f5b800]/15 text-[#b08800]",
    emptyBorder: "border-[#f5b800]/25",
  },
  {
    key: "RESOLVED",
    label: "Resolved",
    dot: "bg-emerald-500",
    cardBorder: "border-emerald-200",
    columnBg: "bg-gradient-to-b from-[#ecfdf5] to-white",
    columnBorder: "border-emerald-200",
    badgeBg: "bg-emerald-100 text-emerald-700",
    emptyBorder: "border-emerald-200",
  },
]

const priorityBadge = {
  LOW: "text-[#6d7faa]",
  MEDIUM: "text-[#b08800]",
  HIGH: "text-red-500",
}

const statusLabel = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
}

function safeArray(v) {
  return Array.isArray(v) ? v : []
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [assigningId, setAssigningId] = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const navigate = useNavigate()

  const refreshTickets = async () => {
    const data = await getAllTickets()
    setTickets(safeArray(data))
  }

  useEffect(() => {
    let active = true
    async function loadData() {
      setLoading(true)
      setError("")
      try {
        const [ticketsData, techsData] = await Promise.allSettled([getAllTickets(), getTechnicians()])
        if (!active) return

        if (ticketsData.status === "fulfilled") {
          setTickets(safeArray(ticketsData.value))
        } else {
          setError("Failed to load support tickets")
        }

        if (techsData.status === "fulfilled") {
          setTechnicians(safeArray(techsData.value))
        }
      } catch (_) {
        if (!active) return
        setError("Failed to load support tickets")
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const subject = String(t.subject || "").toLowerCase()
      const user = String(t.userId || "").toLowerCase()
      const query = searchTerm.toLowerCase().trim()
      const matchesSearch = !query || subject.includes(query) || user.includes(query)
      const matchesStatus = statusFilter === "ALL" || t.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [tickets, searchTerm, statusFilter])

  const stageMap = useMemo(() => {
    const map = {
      OPEN: [],
      IN_PROGRESS: [],
      RESOLVED: [],
    }

    filtered.forEach((t) => {
      if (t.status === "OPEN") map.OPEN.push(t)
      else if (t.status === "IN_PROGRESS") map.IN_PROGRESS.push(t)
      else if (t.status === "RESOLVED" || t.status === "CLOSED") map.RESOLVED.push(t)
    })

    return map
  }, [filtered])

  const handleAssign = async (ticketId, technicianId) => {
    try {
      await assignTechnician(ticketId, technicianId)
      toast.success("Technician assigned")
      setAssigningId(null)
      await refreshTickets()
    } catch (err) {
      toast.error(err?.message || "Assignment failed")
    }
  }

  const handleAdvance = async (ticketId, currentStatus) => {
    const next = currentStatus === "OPEN" ? "IN_PROGRESS" : currentStatus === "IN_PROGRESS" ? "RESOLVED" : null
    if (!next) return

    try {
      await updateTicketStatus(ticketId, next)
      toast.success(`Ticket moved to ${statusLabel[next]}`)
      await refreshTickets()
    } catch (err) {
      toast.error(err?.message || "Failed to update ticket")
    }
  }

  const handleRemove = async () => {
    if (!confirmModal) return
    const ticketId = confirmModal.id
    setRemovingId(ticketId)
    setConfirmModal(null)
    try {
      await deleteTicket(ticketId)
      toast.success("Ticket removed from queue")
      await refreshTickets()
    } catch (err) {
      toast.error(err?.message || "Failed to remove ticket")
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">OPERATIONS · TICKETS</p>
        <div className="mt-1.5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[2rem] font-bold leading-tight text-navy">
              Maintenance & incidents.
            </h1>
            <p className="mt-1 text-sm text-[#5a6b98]">
              Board view of active support work. Assign technicians, move statuses, and monitor live ticket flow.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8494c2]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subject or requester"
            className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2.5 text-sm text-navy outline-none transition focus:border-brand"
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Filter className="h-4 w-4 text-[#8494c2]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-sm font-semibold text-navy outline-none"
          >
            <option value="ALL">All status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
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
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {STAGES.map((stage) => {
            const items = stageMap[stage.key]
            return (
              <section
                key={stage.key}
                className={`min-h-[320px] rounded-[20px] border p-3 shadow-[0_8px_30px_rgba(21,32,85,0.08)] ${stage.columnBg} ${stage.columnBorder}`}
              >
                <div className="mb-2 flex items-center justify-between border-b border-slate-100 px-1 pb-2">
                  <p className="flex items-center gap-2 text-xs font-bold text-navy">
                    <span className={`h-2 w-2 rounded-full ${stage.dot}`} />
                    {stage.label}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${stage.badgeBg}`}>{items.length}</span>
                </div>

                <div className="space-y-2">
                  {items.length === 0 ? (
                    <div className={`rounded-xl border border-dashed px-3 py-5 text-center text-xs text-[#8494c2] ${stage.emptyBorder}`}>
                      No tickets
                    </div>
                  ) : (
                    items.map((ticket) => (
                      <article
                        key={ticket.id}
                        onClick={() => navigate(`/admin/tickets/${ticket.id}`)}
                        className={`cursor-pointer rounded-xl border bg-white px-3 py-2.5 transition hover:shadow-sm hover:-translate-y-0.5 ${stage.cardBorder}`}
                      >
                        <p className="text-[10px] font-mono text-[#97a4c9]">TK-{ticket.id.slice(-4).toUpperCase()}</p>
                        <div className="mt-0.5 flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 text-sm font-semibold text-navy">{ticket.subject}</h3>
                          <span className={`text-[10px] font-bold uppercase ${priorityBadge[ticket.priority] || "text-[#6d7faa]"}`}>
                            {ticket.priority || "MED"}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-[#6d7faa]">
                          <span className="truncate">{ticket.location || "Unknown location"}</span>
                          <span className="flex items-center gap-1">
                            <Clock3 className="h-3 w-3" />
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#8494c2]">
                            <MessageSquare className="h-3 w-3" />
                            {ticket.messages?.length || 0}
                          </span>

                          <div className="flex items-center gap-1">
                            {!ticket.assignedTechnicianId && stage.key !== "RESOLVED" && (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setAssigningId(assigningId === ticket.id ? null : ticket.id)}
                                  className="rounded-md bg-brand/10 px-2 py-1 text-[10px] font-bold text-brand hover:bg-brand hover:text-white transition-colors"
                                >
                                  <UserPlus className="h-3 w-3" />
                                </button>
                                {assigningId === ticket.id && (
                                  <div className="absolute right-0 z-50 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                                    {technicians.length ? (
                                      technicians.map((tech) => (
                                        <button
                                          key={tech.id}
                                          type="button"
                                          onClick={() => handleAssign(ticket.id, tech.id)}
                                          className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-navy hover:bg-slate-50"
                                        >
                                          {tech.firstName} {tech.lastName}
                                        </button>
                                      ))
                                    ) : (
                                      <p className="px-2 py-3 text-center text-[10px] text-[#8494c2]">No technicians</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {stage.key !== "RESOLVED" && (
                              <button
                                type="button"
                                onClick={() => handleAdvance(ticket.id, ticket.status)}
                                className="rounded-md bg-[#001d45]/10 px-2 py-1 text-[10px] font-bold text-[#001d45] hover:bg-[#001d45] hover:text-white transition-colors"
                                title="Move to next stage"
                              >
                                Next
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setConfirmModal(ticket)}
                              disabled={removingId === ticket.id}
                              className="rounded-md p-1 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                              title="Remove"
                            >
                              {removingId === ticket.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
          <div className="relative w-full max-w-sm rounded-[26px] border border-white/60 bg-white p-6 shadow-[0_30px_70px_rgba(21,32,85,0.25)]">
            <h2 className="text-center text-lg font-bold text-navy">Remove ticket from dashboard?</h2>
            <p className="mt-2 text-center text-sm text-[#5a6b98]">The ticket stays in campus records and is removed from your active queue view.</p>
            <div className="mt-6 flex gap-2">
              <button
                onClick={handleRemove}
                className="flex-1 rounded-xl bg-[#001d45] py-2.5 text-sm font-bold text-white hover:bg-[#002a66]"
              >
                Remove
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-[#6677a4] hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
