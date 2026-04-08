// frontend/src/features/booking/pages/AdminBookingsPage.jsx
import { useEffect, useState } from 'react';
import { useBooking } from '@/hooks/useBooking';
import BookingStatusBadge from '@/components/BookingStatusBadge';

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

export default function AdminBookingsPage() {
  const { getAllBookings, reviewBooking, deleteBooking, loading, error } = useBooking();
  const [bookings, setBookings]       = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviewModal, setReviewModal]  = useState(null); // booking being reviewed
  const [adminNote, setAdminNote]      = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadBookings = (filter) => {
    getAllBookings(filter || undefined)
      .then((result) => setBookings(toArray(result)))
      .catch(() => setBookings([]));
  };

  useEffect(() => { loadBookings(statusFilter); }, [statusFilter]);

  const openReview = (booking) => {
    setReviewModal(booking);
    setAdminNote('');
  };

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

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Booking Management</h2>

      {/* Filter bar */}
      <div style={styles.filterBar}>
        {['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
          <button key={s}
            style={{ ...styles.filterBtn, ...(statusFilter === s ? styles.filterBtnActive : {}) }}
            onClick={() => setStatusFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {loading && bookings.length === 0 && <p style={styles.msg}>Loading…</p>}

      {/* Table */}
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Reason', 'Resource', 'Date', 'Time', 'Requested By', 'Attendees', 'Status', 'Actions']
                .map(h => <th key={h} style={styles.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id} style={styles.tr}>
                <td style={styles.td}><strong>{b.bookingReason}</strong><br/>
                  <span style={styles.small}>{b.purpose?.slice(0,50)}{b.purpose?.length > 50 ? '…' : ''}</span>
                </td>
                <td style={styles.td}>{b.resourceType}</td>
                <td style={styles.td}>{b.date}</td>
                <td style={styles.td}>{b.startTime} – {b.endTime}</td>
                <td style={styles.td}>{b.requestedBy}</td>
                <td style={styles.td}>{b.expectedAttendees}</td>
                <td style={styles.td}><BookingStatusBadge status={b.status} /></td>
                <td style={styles.td}>
                  {b.status === 'PENDING' && (
                    <button style={styles.reviewBtn} onClick={() => openReview(b)}>
                      Review
                    </button>
                  )}
                  <button style={styles.deleteBtn} onClick={() => handleDelete(b.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && !loading && (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:32, color:'#999' }}>
                No bookings found.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Review modal */}
      {reviewModal && (
        <div style={styles.overlay} onClick={() => setReviewModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Review Booking</h3>
            <p><strong>{reviewModal.bookingReason}</strong></p>
            <p style={styles.small}>{reviewModal.date} · {reviewModal.startTime}–{reviewModal.endTime}</p>
            <p>{reviewModal.purpose}</p>
            <label style={styles.label}>Admin Note (required if rejecting)</label>
            <textarea rows={3} value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="Reason for rejection or approval note…"
              style={styles.textarea} />
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button style={styles.approveBtn} disabled={actionLoading}
                onClick={() => submitReview(true)}>
                ✔ Approve
              </button>
              <button style={styles.rejectBtn} disabled={actionLoading}
                onClick={() => submitReview(false)}>
                ✘ Reject
              </button>
              <button style={styles.cancelBtn} onClick={() => setReviewModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── styles ─────────────────────────────────────────────────────────────── */
const styles = {
  page:     { padding: '32px 24px', maxWidth: 1100, margin: '0 auto' },
  heading:  { fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 20 },
  filterBar:{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' },
  filterBtn:{ padding:'7px 16px', border:'1px solid #d1d5db', borderRadius:20,
              background:'#fff', cursor:'pointer', fontSize:13 },
  filterBtnActive:{ background:'#2563eb', color:'#fff', borderColor:'#2563eb' },
  tableWrap:{ overflowX:'auto' },
  table:    { width:'100%', borderCollapse:'collapse', fontSize:14 },
  th:       { background:'#f9fafb', padding:'12px 14px', textAlign:'left',
              borderBottom:'2px solid #e5e7eb', fontWeight:700, color:'#374151', whiteSpace:'nowrap' },
  tr:       { borderBottom:'1px solid #f3f4f6' },
  td:       { padding:'12px 14px', verticalAlign:'top', color:'#374151' },
  small:    { fontSize:12, color:'#9ca3af' },
  reviewBtn:{ padding:'5px 12px', background:'#2563eb', color:'#fff',
              border:'none', borderRadius:6, cursor:'pointer', marginRight:6, fontSize:12 },
  deleteBtn:{ padding:'5px 12px', background:'#fff', color:'#dc2626',
              border:'1px solid #dc2626', borderRadius:6, cursor:'pointer', fontSize:12 },
  msg:      { padding:24, textAlign:'center', color:'#666' },
  error:    { background:'#fef2f2', color:'#dc2626', padding:'12px 16px',
              borderRadius:8, marginBottom:16 },
  // modal
  overlay:  { position:'fixed', inset:0, background:'rgba(0,0,0,.45)',
              display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:    { background:'#fff', borderRadius:12, padding:28, width:'100%', maxWidth:460,
              boxShadow:'0 8px 40px rgba(0,0,0,.18)' },
  label:    { fontSize:12, fontWeight:600, color:'#555', display:'block', marginBottom:4 },
  textarea: { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #d1d5db',
              fontSize:14, fontFamily:'inherit', boxSizing:'border-box', resize:'vertical' },
  approveBtn:{ flex:1, padding:'10px 0', background:'#16a34a', color:'#fff',
               border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' },
  rejectBtn: { flex:1, padding:'10px 0', background:'#dc2626', color:'#fff',
               border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' },
  cancelBtn: { flex:1, padding:'10px 0', background:'#f3f4f6', color:'#374151',
               border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' },
};