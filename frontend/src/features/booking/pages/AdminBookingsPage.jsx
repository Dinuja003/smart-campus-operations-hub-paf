// frontend/src/features/booking/pages/AdminBookingsPage.jsx
import { useEffect, useState } from 'react';
import { Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
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
  const [reviewModal, setReviewModal]  = useState(null);
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
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Booking Management</h1>
          <p style={styles.subtitle}>Review and manage all campus resource bookings</p>
        </div>
        <div style={styles.badgeCount}>
          <span style={styles.badge}>{bookings.length}</span>
          <span style={styles.badgeLabel}>Total Bookings</span>
        </div>
      </div>

      {/* Filter bar */}
      <div style={styles.filterBar}>
        {['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
          <button key={s}
            style={{ ...styles.filterBtn, ...(statusFilter === s ? styles.filterBtnActive : {}) }}
            onClick={() => setStatusFilter(s)}>
            {s || 'All Bookings'}
          </button>
        ))}
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {loading && bookings.length === 0 && <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading bookings…</p>
      </div>}

      {/* Table */}
      {bookings.length > 0 && <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Reason</th>
              <th style={styles.th}>Resource</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Time</th>
              <th style={styles.th}>Requested By</th>
              <th style={styles.th}>Attendees</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id} style={styles.tr}>
                <td style={styles.td}>
                  <div style={styles.reasonCol}>
                    <strong style={styles.reasonTitle}>{b.bookingReason}</strong>
                    <span style={styles.purpose}>{b.purpose?.slice(0, 60)}{b.purpose?.length > 60 ? '…' : ''}</span>
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={styles.badge}>{b.resourceType || '—'}</span>
                </td>
                <td style={styles.td}>{b.date}</td>
                <td style={styles.td}>
                  <span style={styles.time}>{b.startTime} – {b.endTime}</span>
                </td>
                <td style={styles.td}>{b.requestedBy?.slice(0, 12)}…</td>
                <td style={styles.td}><span style={styles.attendees}>{b.expectedAttendees}</span></td>
                <td style={styles.td}><BookingStatusBadge status={b.status} /></td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    {b.status === 'PENDING' && (
                      <button style={styles.reviewBtn} onClick={() => openReview(b)} title="Review this booking">
                        <Clock size={15} />
                        <span>Review</span>
                      </button>
                    )}
                    <button style={styles.deleteBtn} onClick={() => handleDelete(b.id)} title="Delete this booking">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}

      {bookings.length === 0 && !loading && (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📋</div>
          <h3 style={styles.emptyTitle}>No bookings found</h3>
          <p style={styles.emptyText}>There are no bookings matching your filters</p>
        </div>
      )}

      {/* Review modal */}
      {reviewModal && (
        <div style={styles.overlay} onClick={() => setReviewModal(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Review Booking</h3>
              <button style={styles.closeBtn} onClick={() => setReviewModal(null)}>✕</button>
            </div>
            
            <div style={styles.modalContent}>
              <div style={styles.bookingDetail}>
                <span style={styles.detailLabel}>Reason</span>
                <span style={styles.detailValue}>{reviewModal.bookingReason}</span>
              </div>
              <div style={styles.bookingDetail}>
                <span style={styles.detailLabel}>Time</span>
                <span style={styles.detailValue}>{reviewModal.date} · {reviewModal.startTime}–{reviewModal.endTime}</span>
              </div>
              <div style={styles.bookingDetail}>
                <span style={styles.detailLabel}>Purpose</span>
                <span style={styles.detailValue}>{reviewModal.purpose}</span>
              </div>
              
              <label style={styles.label}>Admin Note {!reviewModal.approved && <span style={{color: '#dc2626'}}>*</span>}</label>
              <textarea rows={4} value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="Add your note here…"
                style={styles.textarea} />
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.approveBtn} disabled={actionLoading}
                onClick={() => submitReview(true)}>
                <CheckCircle size={16} style={{marginRight: 6}} />
                Approve
              </button>
              <button style={styles.rejectBtn} disabled={actionLoading}
                onClick={() => submitReview(false)}>
                <XCircle size={16} style={{marginRight: 6}} />
                Reject
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

/* ── modern styles ────────────────────────────────────────────────────── */
const styles = {
  page: { 
    padding: '32px 24px', 
    maxWidth: 1400, 
    margin: '0 auto',
    minHeight: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottom: '1px solid #e5e7eb',
  },
  heading: { 
    fontSize: 32, 
    fontWeight: 800, 
    color: '#0f172a', 
    margin: 0,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 6,
    margin: '6px 0 0 0',
  },
  badgeCount: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    fontSize: 20,
    fontWeight: 700,
    color: '#2563eb',
  },
  badgeLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  filterBar: { 
    display: 'flex', 
    gap: 8, 
    marginBottom: 28, 
    flexWrap: 'wrap' 
  },
  filterBtn: { 
    padding: '8px 16px', 
    border: '1px solid #e2e8f0', 
    borderRadius: 8,
    background: '#fff', 
    color: '#64748b',
    cursor: 'pointer', 
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s ease',
    ':hover': { borderColor: '#cbd5e1' },
  },
  filterBtnActive: { 
    background: '#2563eb', 
    color: '#fff', 
    borderColor: '#2563eb',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
  },
  tableWrap: { 
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    background: '#fff',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  table: { 
    width: '100%', 
    borderCollapse: 'collapse', 
    fontSize: 14 
  },
  th: { 
    background: '#f8fafc',
    padding: '14px 16px', 
    textAlign: 'left',
    borderBottom: '2px solid #e2e8f0', 
    fontWeight: 700, 
    color: '#334155',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  tr: { 
    borderBottom: '1px solid #e5e7eb',
    transition: 'background-color 0.15s ease',
    ':hover': { backgroundColor: '#f8fafc' },
  },
  td: { 
    padding: '16px',
    verticalAlign: 'middle',
    color: '#334155',
  },
  reasonCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  reasonTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 600,
  },
  purpose: {
    fontSize: 12,
    color: '#94a3b8',
  },
  time: {
    fontSize: 13,
    fontWeight: 500,
    color: '#475569',
  },
  attendees: {
    fontSize: 13,
    fontWeight: 600,
    color: '#2563eb',
  },
  actions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  reviewBtn: { 
    padding: '8px 12px', 
    background: '#2563eb', 
    color: '#fff',
    border: 'none', 
    borderRadius: 6, 
    cursor: 'pointer', 
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
  },
  deleteBtn: { 
    padding: '8px 10px', 
    background: '#fef2f2', 
    color: '#dc2626',
    border: '1px solid #fecaca', 
    borderRadius: 6, 
    cursor: 'pointer', 
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px rgba(220, 38, 38, 0.1)',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    color: '#94a3b8',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: 16,
  },
  error: { 
    background: '#fef2f2', 
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: 8, 
    marginBottom: 24,
    border: '1px solid #fecaca',
    fontSize: 14,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 80,
    textAlign: 'center',
    background: '#f8fafc',
    borderRadius: 12,
    border: '2px dashed #e2e8f0',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    margin: '8px 0 0 0',
  },
  // modal styles
  overlay: { 
    position: 'fixed', 
    inset: 0, 
    background: 'rgba(0,0,0,0.5)',
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: { 
    background: '#fff', 
    borderRadius: 16, 
    width: '100%', 
    maxWidth: 540,
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    overflow: 'hidden',
    animation: 'slideUp 0.3s ease-out',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 16px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 24,
    color: '#94a3b8',
    cursor: 'pointer',
    padding: 0,
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  bookingDetail: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: 500,
  },
  label: { 
    fontSize: 12, 
    fontWeight: 700, 
    color: '#334155', 
    display: 'block', 
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  textarea: { 
    width: '100%', 
    padding: '12px 14px', 
    borderRadius: 8, 
    border: '1px solid #e2e8f0',
    fontSize: 14, 
    fontFamily: 'inherit', 
    boxSizing: 'border-box', 
    resize: 'vertical',
    color: '#334155',
    transition: 'all 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#2563eb',
      boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
    },
  },
  modalFooter: {
    display: 'flex',
    gap: 12,
    padding: 24,
    borderTop: '1px solid #e5e7eb',
    background: '#f8fafc',
  },
  approveBtn: { 
    flex: 1, 
    padding: '12px 16px', 
    background: '#16a34a', 
    color: '#fff',
    border: 'none', 
    borderRadius: 8, 
    fontWeight: 700, 
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    fontSize: 14,
  },
  rejectBtn: { 
    flex: 1, 
    padding: '12px 16px', 
    background: '#dc2626', 
    color: '#fff',
    border: 'none', 
    borderRadius: 8, 
    fontWeight: 700, 
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    fontSize: 14,
  },
  cancelBtn: { 
    flex: 1, 
    padding: '12px 16px', 
    background: '#e2e8f0', 
    color: '#334155',
    border: 'none', 
    borderRadius: 8, 
    fontWeight: 700, 
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: 14,
  },
};