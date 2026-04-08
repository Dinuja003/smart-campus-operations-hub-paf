// frontend/src/features/booking/pages/MyBookingsPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '@/hooks/useBooking';
import BookingStatusBadge from '@/components/BookingStatusBadge';

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

export default function MyBookingsPage() {
  const { getMyBookings, cancelBooking, loading, error } = useBooking();
  const [bookings, setBookings] = useState([]);
  const [cancelling, setCancelling] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getMyBookings()
      .then((result) => setBookings(toArray(result)))
      .catch(() => setBookings([]));
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      const updated = await cancelBooking(id);
      setBookings((prev) => toArray(prev).map((b) => (b.id === id ? updated : b)));
    } catch (_) {}
    setCancelling(null);
  };

  if (loading && bookings.length === 0) return <p style={styles.msg}>Loading bookings…</p>;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.heading}>My Bookings</h2>
        <button style={styles.newBtn} onClick={() => navigate('/resources')}>
          + New Booking
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {bookings.length === 0 ? (
        <div style={styles.emptyBox}>
          <p>You have no bookings yet.</p>
          <button style={styles.newBtn} onClick={() => navigate('/resources')}>
            Browse Resources
          </button>
        </div>
      ) : (
        <div style={styles.list}>
          {bookings.map(b => (
            <div key={b.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div>
                  <div style={styles.resourceName}>{b.bookingReason}</div>
                  <div style={styles.meta}>
                    {b.date} &nbsp;·&nbsp; {b.startTime} – {b.endTime}
                    &nbsp;·&nbsp; {b.resourceType}
                  </div>
                </div>
                <BookingStatusBadge status={b.status} />
              </div>

              <p style={styles.purpose}>{b.purpose}</p>

              {b.adminNote && (
                <div style={styles.noteBox}>
                  <strong>Admin note:</strong> {b.adminNote}
                </div>
              )}

              <div style={styles.actions}>
                {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                  <button
                    style={styles.cancelBtn}
                    disabled={cancelling === b.id}
                    onClick={() => handleCancel(b.id)}
                  >
                    {cancelling === b.id ? 'Cancelling…' : 'Cancel Booking'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── styles ─────────────────────────────────────────────────────────────── */
const styles = {
  page:    { maxWidth: 760, margin: '0 auto', padding: '32px 16px' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  heading: { margin: 0, fontSize: 24, fontWeight: 700, color: '#1a1a2e' },
  list:    { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: '#fff', borderRadius: 12, padding: 20,
    boxShadow: '0 1px 8px rgba(0,0,0,.07)', border: '1px solid #e5e7eb',
  },
  cardTop:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  resourceName: { fontWeight: 700, fontSize: 16, color: '#111827' },
  meta:         { fontSize: 13, color: '#6b7280', marginTop: 2 },
  purpose:      { fontSize: 14, color: '#374151', margin: '4px 0 12px' },
  noteBox:      { background: '#fef9c3', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#713f12', marginBottom: 8 },
  actions:      { display: 'flex', gap: 8 },
  cancelBtn: {
    padding: '7px 16px', background: '#fff', color: '#dc2626',
    border: '1px solid #dc2626', borderRadius: 8, fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
  },
  newBtn: {
    padding: '9px 18px', background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  msg:      { padding: 24, textAlign: 'center', color: '#666' },
  error:    { background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 16 },
  emptyBox: { textAlign: 'center', padding: 60, color: '#6b7280' },
};