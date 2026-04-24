import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useBooking } from '@/hooks/useBooking';

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.data)) return v.data;
  if (Array.isArray(v?.items)) return v.items;
  return [];
};

function statusLabel(s) { return s === 'APPROVED' ? 'CONFIRMED' : s; }

function statusCls(s) {
  if (s === 'APPROVED')   return 'bg-emerald-100 text-emerald-700';
  if (s === 'PENDING')    return 'bg-orange-100 text-orange-600';
  if (s === 'REJECTED')   return 'bg-red-100 text-red-600';
  if (s === 'CANCELLED')  return 'bg-slate-100 text-slate-500';
  return 'bg-slate-100 text-slate-500';
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }); }
  catch { return d; }
}

const PAGE_SIZE = 10;

const TABS = [
  { key: 'ALL',      label: 'All'      },
  { key: 'PENDING',  label: 'Pending'  },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'PAST',     label: 'Past'     },
];

export default function AdminBookingsPage() {
  const { getAllBookings, reviewBooking, loading, error } = useBooking();
  const [bookings, setBookings]       = useState([]);
  const [tab, setTab]                 = useState('ALL');
  const [sortDesc, setSortDesc]       = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [adminNote, setAdminNote]     = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage]               = useState(1);

  useEffect(() => {
    getAllBookings()
      .then((r) => setBookings(toArray(r)))
      .catch(() => setBookings([]));
  }, []);

  const openReview = (b) => { setReviewModal(b); setAdminNote(''); };

  const submitReview = async (approved) => {
    if (!approved && !adminNote.trim()) { alert('Please provide a reason when rejecting.'); return; }
    setActionLoading(true);
    try {
      const updated = await reviewBooking(reviewModal.id, { approved, adminNote });
      setBookings((prev) => toArray(prev).map((b) => b.id === updated.id ? updated : b));
      setReviewModal(null);
    } catch (_) {}
    setActionLoading(false);
  };

  const counts = {
    ALL:      bookings.length,
    PENDING:  bookings.filter(b => b.status === 'PENDING').length,
    APPROVED: bookings.filter(b => b.status === 'APPROVED').length,
    PAST:     bookings.filter(b => ['REJECTED','CANCELLED'].includes(b.status)).length,
  };

  const filtered = bookings.filter(b => {
    if (tab === 'PAST')     return ['REJECTED','CANCELLED'].includes(b.status);
    if (tab === 'ALL')      return true;
    return b.status === tab;
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(`${a.date}T${a.startTime || '00:00'}`);
    const db = new Date(`${b.date}T${b.startTime || '00:00'}`);
    return sortDesc ? db - da : da - db;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-5">

      {/* ── Breadcrumb + Header ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">
          OPERATIONS · BOOKINGS
        </p>
        <div className="mt-1.5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[2rem] font-bold leading-tight text-navy">
              Every request,{' '}
              <em className="not-italic font-bold text-brand" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                in order.
              </em>
            </h1>
            <p className="mt-1 text-sm text-[#5a6b98]">
              Review, approve or adjust reservations across the campus. Filters and search refine the list in real time.
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs + Sort ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {TABS.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => { setTab(t.key); setPage(1); }}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'bg-[#001d45] text-white shadow-sm'
                  : 'text-[#8494c2] hover:text-navy'
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-px text-[10px] font-bold leading-4 ${
                tab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#8494c2]'
              }`}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSortDesc(p => !p)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy shadow-sm hover:bg-slate-50 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Sort</span>
          Date — {sortDesc ? 'newest' : 'oldest'} ↕
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-[20px] border border-white/60 bg-white shadow-[0_8px_30px_rgba(21,32,85,0.08)]">
        {loading && bookings.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-brand" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-semibold text-navy">No bookings found</p>
            <p className="mt-1 text-xs text-[#8494c2]">No bookings match the selected filter.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['ID','Resource','Requested By','Date','Time Window','Status',''].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#8494c2] last:w-10">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((b, idx) => (
                    <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold text-[#8494c2]">
                          BK-{String((safePage - 1) * PAGE_SIZE + idx + 2401).padStart(4,'0')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-brand">{b.resourceType || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5 text-[#6677a4]">{b.requestedBy?.slice(0, 18) || '—'}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-[#6677a4]">{fmtDate(b.date)}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-[#6677a4]">{b.startTime} — {b.endTime}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusCls(b.status)}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {statusLabel(b.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          disabled={b.status !== 'PENDING'}
                          onClick={() => b.status === 'PENDING' && openReview(b)}
                          title={b.status === 'PENDING' ? 'Review booking' : 'Only pending bookings can be reviewed'}
                          className={`rounded-lg px-2 py-1 text-sm font-bold transition-colors ${
                            b.status === 'PENDING'
                              ? 'text-[#8494c2] hover:bg-[#001d45] hover:text-white'
                              : 'cursor-not-allowed text-slate-200'
                          }`}
                        >
                          →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-[#8494c2]">
                Showing {paginated.length} of {filtered.length} bookings
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`h-7 w-7 rounded-lg text-xs font-semibold transition-all ${
                        safePage === p
                          ? 'bg-[#001d45] text-white'
                          : 'text-[#8494c2] hover:bg-slate-100 hover:text-navy'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  {safePage < totalPages && (
                    <button
                      type="button"
                      onClick={() => setPage(p => p + 1)}
                      className="h-7 w-7 rounded-lg text-xs font-semibold text-[#8494c2] hover:bg-slate-100 hover:text-navy transition-all"
                    >
                      ›
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Review Modal ── */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setReviewModal(null)}>
          <div className="w-full max-w-lg overflow-hidden rounded-[26px] bg-white shadow-[0_30px_80px_rgba(21,32,85,0.25)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Admin Action</p>
                <h3 className="mt-0.5 text-lg font-bold text-navy">Review Booking</h3>
              </div>
              <button type="button" onClick={() => setReviewModal(null)} className="rounded-xl p-2 text-[#8494c2] hover:bg-slate-100 hover:text-navy transition-colors">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 px-6 py-5">
              {[
                { label: 'Resource',    value: reviewModal.resourceType },
                { label: 'Date & Time', value: `${reviewModal.date} · ${reviewModal.startTime}–${reviewModal.endTime}` },
                { label: 'Purpose',     value: reviewModal.purpose },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">{label}</p>
                  <p className="mt-0.5 text-sm font-medium text-navy">{value}</p>
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">
                  Admin Note <span className="text-red-400">*required for rejection</span>
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Add your note here…"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-navy placeholder-slate-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button type="button" disabled={actionLoading} onClick={() => submitReview(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600 disabled:opacity-60">
                <CheckCircle className="h-4 w-4" /> Approve
              </button>
              <button type="button" disabled={actionLoading} onClick={() => submitReview(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-600 disabled:opacity-60">
                <XCircle className="h-4 w-4" /> Reject
              </button>
              <button type="button" onClick={() => setReviewModal(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
