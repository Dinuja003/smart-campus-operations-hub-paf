// frontend/src/features/booking/pages/AdminBookingsPage.jsx
import { useEffect, useState } from 'react';
import { CheckCircle, Clock, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { useBooking } from '@/hooks/useBooking';
import BookingStatusBadge from '@/components/BookingStatusBadge';

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const FILTERS = ['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export default function AdminBookingsPage() {
  const { getAllBookings, reviewBooking, deleteBooking, loading, error } = useBooking();
  const [bookings, setBookings]         = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal]   = useState(null);
  const [adminNote, setAdminNote]       = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadBookings = (filter) => {
    getAllBookings(filter || undefined)
      .then((result) => setBookings(toArray(result)))
      .catch(() => setBookings([]));
  };

  useEffect(() => { loadBookings(statusFilter); }, [statusFilter]);

  const openReview = (booking) => { setReviewModal(booking); setAdminNote(''); };

  const submitReview = async (approved) => {
    if (!approved && !adminNote.trim()) {
      alert('Please provide a reason when rejecting a booking.');
      return;
    }
    setActionLoading(true);
    try {
      const updated = await reviewBooking(reviewModal.id, { approved, adminNote });
      setBookings((prev) => toArray(prev).map((b) => (b.id === updated.id ? updated : b)));
      setReviewModal(null);
    } catch (_) {}
    setActionLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this booking?')) return;
    try {
      await deleteBooking(id);
      setBookings((prev) => toArray(prev).filter((b) => b.id !== id));
    } catch (_) {}
  };

  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <section className="relative overflow-hidden rounded-[26px] border border-white/60 bg-white/80 p-5 shadow-[0_14px_40px_rgba(21,32,85,0.10)] backdrop-blur-sm sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/8 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-[#001d45] px-3 py-0.5 text-[10px] font-semibold tracking-wide text-white">
              <ShieldCheck className="h-3 w-3" /> Admin Panel
            </p>
            <h1 className="mt-1.5 text-2xl font-bold text-navy sm:text-3xl">Booking Management</h1>
            <p className="mt-0.5 text-sm text-[#5a6b98]">Review, approve and manage all campus resource bookings.</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-[#001d45]/20 bg-[#001d45] px-5 py-3 text-center">
              <p className="text-2xl font-bold text-white">{bookings.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Total</p>
            </div>
            <div className="rounded-2xl border border-brand/30 bg-brand/10 px-5 py-3 text-center">
              <p className="text-2xl font-bold text-brand">{pendingCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-brand/70">Pending</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              statusFilter === s
                ? 'bg-brand text-white shadow-[0_4px_12px_rgba(244,94,43,0.30)]'
                : 'border border-slate-200 bg-white text-slate-500 hover:border-brand/30 hover:text-brand'
            }`}
          >
            {s || 'All Bookings'}
          </button>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* ── Loading ── */}
      {loading && bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[26px] border border-white/60 bg-white py-16 shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand" />
          <p className="mt-4 text-sm text-[#8494c2]">Loading bookings…</p>
        </div>
      )}

      {/* ── Table ── */}
      {bookings.length > 0 && (
        <div className="overflow-hidden rounded-[26px] border border-white/60 bg-white shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
          <div className="w-full">
            <table className="w-full table-fixed text-[13px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="w-[25%] px-2.5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8494c2] md:px-3">Reason</th>
                  <th className="w-[13%] px-2.5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8494c2] md:px-3">Resource</th>
                  <th className="w-[12%] px-2.5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8494c2] md:px-3">Date</th>
                  <th className="w-[12%] px-2.5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8494c2] md:px-3">Time</th>
                  <th className="hidden w-[12%] px-2.5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8494c2] 2xl:table-cell md:px-3">Requested By</th>
                  <th className="w-[8%] px-2.5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8494c2] md:px-3">Attendees</th>
                  <th className="w-[10%] px-2.5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#8494c2] md:px-3">Status</th>
                  <th className="w-[14%] px-2.5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#8494c2] md:px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, idx) => (
                  <tr key={b.id} className={idx < bookings.length - 1 ? 'border-b border-slate-50 hover:bg-slate-50/60 transition-colors' : 'hover:bg-slate-50/60 transition-colors'}>
                    <td className="px-2.5 py-3 md:px-3">
                      <p className="truncate font-semibold text-navy">{b.bookingReason}</p>
                      <p className="mt-0.5 truncate text-[11px] text-[#8494c2]">{b.purpose?.slice(0, 55)}{b.purpose?.length > 55 ? '…' : ''}</p>
                    </td>
                    <td className="px-2.5 py-3 md:px-3">
                      <span className="rounded-lg bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">{b.resourceType || '—'}</span>
                    </td>
                    <td className="whitespace-nowrap px-2.5 py-3 text-[#6677a4] md:px-3">{b.date}</td>
                    <td className="whitespace-nowrap px-2.5 py-3 text-[#6677a4] md:px-3">{b.startTime} – {b.endTime}</td>
                    <td className="hidden px-2.5 py-3 text-[#6677a4] 2xl:table-cell md:px-3">
                      <span className="block truncate">{b.requestedBy?.slice(0, 14)}…</span>
                    </td>
                    <td className="px-2.5 py-3 md:px-3">
                      <span className="font-semibold text-brand">{b.expectedAttendees}</span>
                    </td>
                    <td className="px-2.5 py-3 md:px-3"><BookingStatusBadge status={b.status} /></td>
                    <td className="px-2.5 py-3 md:px-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={b.status !== 'PENDING'}
                          onClick={() => b.status === 'PENDING' && openReview(b)}
                          title={b.status !== 'PENDING' ? 'Only pending bookings can be reviewed.' : 'Review booking'}
                          className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-all md:px-2.5 ${
                            b.status === 'PENDING'
                              ? 'bg-[#001d45] text-white hover:bg-[#002a66] hover:opacity-90'
                              : 'cursor-not-allowed bg-slate-200 text-slate-500'
                          }`}
                        >
                          <Clock className="h-3 w-3" /> Review
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b.id)}
                          className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 transition-colors hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* ── Empty state ── */}
      {bookings.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-slate-200 bg-white py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
            <ShieldCheck className="h-6 w-6 text-brand" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-navy">No bookings found</h3>
          <p className="mt-1 text-sm text-[#8494c2]">No bookings match the selected filter.</p>
        </div>
      )}

      {/* ── Review Modal ── */}
      {reviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setReviewModal(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-[26px] bg-white shadow-[0_30px_80px_rgba(21,32,85,0.25)]"
            onClick={e => e.stopPropagation()}
          >
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
                { label: 'Reason', value: reviewModal.bookingReason },
                { label: 'Date & Time', value: `${reviewModal.date} · ${reviewModal.startTime}–${reviewModal.endTime}` },
                { label: 'Purpose', value: reviewModal.purpose },
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
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => submitReview(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600 disabled:opacity-60"
              >
                <CheckCircle className="h-4 w-4" /> Approve
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => submitReview(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-600 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
              <button
                type="button"
                onClick={() => setReviewModal(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
