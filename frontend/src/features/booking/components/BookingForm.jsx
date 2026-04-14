// frontend/src/features/booking/components/BookingForm.jsx
import { useState } from 'react';
import { useBooking } from '../hooks/useBooking';

/**
 * BookingForm — rendered on the resource detail page.
 * Props:
 *   resource  : { id, name, type, capacity }
 *   onSuccess : () => void   (callback after successful booking)
 */
export default function BookingForm({ resource, onSuccess }) {
  const { createBooking, loading, error } = useBooking();

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    date: today,
    startTime: '09:00',
    endTime: '10:00',
    bookingReason: '',
    purpose: '',
    expectedAttendees: 1,
  });
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    try {
      await createBooking({ ...form, resourceId: resource.id });
      setSuccess('Booking request submitted! Waiting for admin approval.');
      if (onSuccess) onSuccess();
      // reset form
      setForm({ date: today, startTime: '09:00', endTime: '10:00',
                bookingReason: '', purpose: '', expectedAttendees: 1 });
    } catch (_) { /* error displayed via hook */ }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Request a Booking</h3>
      <p style={styles.subtitle}>{resource.name} · {resource.type}</p>

      {error   && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* Date */}
        <label style={styles.label}>Select Date</label>
        <input type="date" name="date" min={today} value={form.date}
               onChange={handleChange} required style={styles.input} />

        {/* Times */}
        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Start Time</label>
            <input type="time" name="startTime" value={form.startTime}
                   onChange={handleChange} required style={styles.input} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>End Time</label>
            <input type="time" name="endTime" value={form.endTime}
                   onChange={handleChange} required style={styles.input} />
          </div>
        </div>

        {/* Short reason */}
        <label style={styles.label}>Booking Reason (short title)</label>
        <input type="text" name="bookingReason" placeholder="e.g. Final year project demo"
               value={form.bookingReason} onChange={handleChange}
               required maxLength={100} style={styles.input} />

        {/* Detailed purpose */}
        <label style={styles.label}>Purpose of Booking</label>
        <textarea name="purpose"
                  placeholder="Describe why you need this resource (min 10 chars)..."
                  value={form.purpose} onChange={handleChange}
                  required minLength={10} rows={3} style={styles.textarea} />

        {/* Attendees */}
        <label style={styles.label}>Expected Attendees</label>
        <input type="number" name="expectedAttendees"
               value={form.expectedAttendees} onChange={handleChange}
               min={1} max={resource.capacity || 1000}
               required style={{ ...styles.input, width: '120px' }} />

        <button type="submit" disabled={loading} style={styles.btn}>
          {loading ? 'Submitting…' : '➤  Send Booking Request'}
        </button>

        <p style={styles.hint}>
          By clicking send, your request will be reviewed by the Operations Centre
          for final approval. Usually 1–2 hours.
        </p>
      </form>
    </div>
  );
}

/* ── inline styles (replace with Tailwind/CSS modules as preferred) ──────── */
const styles = {
  card: {
    background: '#fff', borderRadius: 12, padding: 28,
    boxShadow: '0 2px 12px rgba(0,0,0,.09)', maxWidth: 420,
  },
  title:    { margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  subtitle: { margin: '0 0 16px', fontSize: 13, color: '#666' },
  form:     { display: 'flex', flexDirection: 'column', gap: 10 },
  label:    { fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: .5 },
  input: {
    padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db',
    fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  textarea: {
    padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db',
    fontSize: 14, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  row:   { display: 'flex', gap: 12 },
  btn: {
    marginTop: 8, padding: '12px 0', background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
    cursor: 'pointer', letterSpacing: .3,
  },
  hint:       { fontSize: 11, color: '#999', margin: '4px 0 0', textAlign: 'center' },
  error:      { background: '#fef2f2', color: '#dc2626', padding: '10px 14px',
                borderRadius: 8, fontSize: 13 },
  successBox: { background: '#f0fdf4', color: '#16a34a', padding: '10px 14px',
                borderRadius: 8, fontSize: 13 },
};