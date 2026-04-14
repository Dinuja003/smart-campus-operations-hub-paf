const STATUS_STYLES = {
  PENDING:   { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' },
  APPROVED:  { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
  REJECTED:  { background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
  CANCELLED: { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' },
};

export default function BookingStatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;
  return (
    <span style={{
      ...style,
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}
