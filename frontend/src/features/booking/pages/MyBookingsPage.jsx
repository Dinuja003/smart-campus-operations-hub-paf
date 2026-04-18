// frontend/src/features/booking/pages/MyBookingsPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useBooking } from '@/hooks/useBooking';
import bookingService from '@/features/booking/Services/BookingService';
import BookingStatusBadge from '@/components/BookingStatusBadge';

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const todayISO = () => new Date().toISOString().split('T')[0];

const toMinutes = (time = '') => {
  const [h, m] = String(time).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const overlaps = (startA, endA, startB, endB) => startA < endB && endA > startB;

const isResourceStatusAvailable = (status) => String(status || '').toUpperCase() === 'AVAILABLE';

const getTypeLabel = (type) => type || 'Uncategorized';

const getResourceLabel = (resource) => {
  const loc = resource?.location;
  const locationText = loc
    ? [loc.building, loc.floor, loc.room].filter(Boolean).join(' / ')
    : null;

  return `${resource?.name || 'Unnamed Resource'}${resource?.capacity ? ` (cap: ${resource.capacity})` : ''}${locationText ? ` - ${locationText}` : ''}`;
};

export default function MyBookingsPage() {
  const { getMyBookings, cancelBooking, createBooking, loading, error } = useBooking();
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [availableResources, setAvailableResources] = useState([]);
  const [selectedResourceSchedule, setSelectedResourceSchedule] = useState([]);
  const [resourceScheduleLoading, setResourceScheduleLoading] = useState(false);

  const [form, setForm] = useState({
    date: todayISO(),
    startTime: '09:00',
    endTime: '10:00',
    resourceType: '',
    resourceId: '',
    bookingReason: '',
    purpose: '',
    expectedAttendees: '1',
  });
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setResourcesLoading(true);
      setResourcesError('');

      try {
        const token = localStorage.getItem('token');
        const [myBookings, allResources] = await Promise.all([
          getMyBookings(),
          axios.get('/api/resources', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        ]);

        if (!mounted) return;
        setBookings(toArray(myBookings));
        setResources(toArray(allResources?.data));
      } catch (_) {
        if (!mounted) return;
        setBookings([]);
        setResources([]);
        setResourcesError('Unable to load resource categories right now.');
      } finally {
        if (mounted) setResourcesLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const typeCounts = useMemo(() => {
    const counts = {};
    resources.forEach((resource) => {
      const key = getTypeLabel(resource.type);
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));
  }, [resources]);

  const quickAvailableResources = useMemo(() => {
    const attendeeCount = Number(form.expectedAttendees || 1);
    return resources.filter((resource) => {
      if (!isResourceStatusAvailable(resource.status)) return false;
      if (form.resourceType && getTypeLabel(resource.type) !== form.resourceType) return false;
      return Number(resource.capacity || 0) >= attendeeCount;
    });
  }, [resources, form.expectedAttendees, form.resourceType]);

  const selectedCategoryResources = useMemo(() => {
    if (!form.resourceType) return [];
    return resources
      .filter((resource) => getTypeLabel(resource.type) === form.resourceType)
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [resources, form.resourceType]);

  const displayedResources = availabilityChecked ? availableResources : quickAvailableResources;

  const selectedResource = useMemo(() => {
    if (form.resourceId) {
      return resources.find((resource) => resource.id === form.resourceId) || null;
    }
    if (selectedCategoryResources.length > 0) return selectedCategoryResources[0];
    if (displayedResources.length > 0) return displayedResources[0];
    if (resources.length > 0) return resources[0];
    return null;
  }, [displayedResources, form.resourceId, resources, selectedCategoryResources]);

  const daySlots = useMemo(
    () => [
      '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
      '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    ],
    []
  );

  const scheduleBlocks = useMemo(() => {
    return daySlots.map((slot) => {
      const slotStart = toMinutes(slot);
      const slotEnd = slotStart + 60;
      const busy = selectedResourceSchedule.some((item) => {
        const start = toMinutes(item.startTime);
        const end = toMinutes(item.endTime);
        if (start === null || end === null) return false;
        return overlaps(slotStart, slotEnd, start, end);
      });
      return { slot, busy };
    });
  }, [daySlots, selectedResourceSchedule]);

  useEffect(() => {
    let active = true;

    if (!showNewBooking || !selectedResource?.id || !form.date) {
      setSelectedResourceSchedule([]);
      return () => {
        active = false;
      };
    }

    const loadSchedule = async () => {
      setResourceScheduleLoading(true);
      try {
        const schedule = await bookingService.getSchedule(selectedResource.id, form.date);
        if (active) setSelectedResourceSchedule(toArray(schedule));
      } catch (_) {
        if (active) setSelectedResourceSchedule([]);
      } finally {
        if (active) setResourceScheduleLoading(false);
      }
    };

    loadSchedule();

    return () => {
      active = false;
    };
  }, [showNewBooking, selectedResource?.id, form.date]);

  const resetAvailability = () => {
    setAvailabilityChecked(false);
    setAvailabilityError('');
    setAvailableResources([]);
  };

  const isTimeRangeValid = () => {
    const start = toMinutes(form.startTime);
    const end = toMinutes(form.endTime);
    return start !== null && end !== null && end > start;
  };

  const checkAvailability = async ({ silent = false } = {}) => {
    if (!isTimeRangeValid()) {
      const msg = 'End time must be later than start time.';
      if (!silent) setAvailabilityError(msg);
      return [];
    }

    const targetResources = quickAvailableResources;
    if (targetResources.length === 0) {
      if (!silent) {
        setAvailabilityError('No resources match this category/capacity filter.');
      }
      setAvailabilityChecked(true);
      setAvailableResources([]);
      return [];
    }

    const start = toMinutes(form.startTime);
    const end = toMinutes(form.endTime);

    setCheckingAvailability(true);
    if (!silent) setAvailabilityError('');

    try {
      const checks = await Promise.all(
        targetResources.map(async (resource) => {
          try {
            const schedule = toArray(await bookingService.getSchedule(resource.id, form.date));
            const hasConflict = schedule.some((slot) => {
              const slotStart = toMinutes(slot.startTime);
              const slotEnd = toMinutes(slot.endTime);
              if (slotStart === null || slotEnd === null) return false;
              return overlaps(start, end, slotStart, slotEnd);
            });

            return { resource, hasConflict };
          } catch (_) {
            // If a schedule request fails for one resource, keep it out of selectable set.
            return { resource, hasConflict: true };
          }
        })
      );

      const available = checks.filter((r) => !r.hasConflict).map((r) => r.resource);
      setAvailabilityChecked(true);
      setAvailableResources(available);

      if (form.resourceId && !available.some((r) => r.id === form.resourceId)) {
        setForm((prev) => ({ ...prev, resourceId: '' }));
      }

      if (!silent && available.length === 0) {
        setAvailabilityError('All matching resources are already booked for this time slot.');
      }

      return available;
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleCheckAvailability = async () => {
    await checkAvailability();
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      const updated = await cancelBooking(id);
      setBookings((prev) => toArray(prev).map((b) => (b.id === id ? updated : b)));
    } catch (_) {}
    setCancelling(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (name === 'expectedAttendees') {
      const digitsOnly = value.replace(/\D/g, '');
      setForm((prev) => ({
        ...prev,
        expectedAttendees: digitsOnly,
      }));
      setSubmitError('');
      setSubmitSuccess('');
      resetAvailability();
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'resourceType' ? { resourceId: '' } : {}),
    }));
    setSubmitError('');
    setSubmitSuccess('');
    resetAvailability();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    const attendeeCount = Number(form.expectedAttendees);
    if (!attendeeCount || attendeeCount < 1 || attendeeCount > 1000) {
      setSubmitError('Expected attendees must be a number between 1 and 1000.');
      return;
    }

    if (!form.resourceId) {
      setSubmitError('Please select a resource to continue.');
      return;
    }

    if (!isTimeRangeValid()) {
      setSubmitError('End time must be later than start time.');
      return;
    }

    const latestAvailable = await checkAvailability({ silent: true });
    const stillAvailable = latestAvailable.some((resource) => resource.id === form.resourceId);
    if (!stillAvailable) {
      setSubmitError('Selected resource is already booked for the selected slot. Choose another resource.');
      setAvailabilityChecked(true);
      setAvailableResources(latestAvailable);
      return;
    }

    try {
      await createBooking({
        resourceId: form.resourceId,
        bookingReason: form.bookingReason,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose,
        expectedAttendees: attendeeCount,
      });

      const refreshed = await getMyBookings();
      setBookings(toArray(refreshed));
      setSubmitSuccess('Booking request submitted successfully.');
      setShowNewBooking(false);
      setForm({
        date: todayISO(),
        startTime: '09:00',
        endTime: '10:00',
        resourceType: '',
        resourceId: '',
        bookingReason: '',
        purpose: '',
        expectedAttendees: '1',
      });
      resetAvailability();
    } catch (err) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === 'string' ? err.response.data : '') ||
        err?.message ||
        'Could not submit booking request. Please check the form and try again.';
      setSubmitError(backendMessage);
    }
  };

  if (loading && bookings.length === 0) return <p style={styles.msg}>Loading bookings…</p>;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.heading}>My Bookings</h2>
        <button style={styles.newBtn} onClick={() => setShowNewBooking((prev) => !prev)}>
          {showNewBooking ? 'Close New Booking' : '+ New Booking'}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {resourcesError && <div style={styles.error}>{resourcesError}</div>}
      {submitSuccess && <div style={styles.success}>{submitSuccess}</div>}

      <section style={styles.categorySection}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Booking Categories & Resources</h3>
          <button style={styles.linkBtn} onClick={() => navigate('/resources')}>
            Open Full Resources View
          </button>
        </div>

        {resourcesLoading ? (
          <p style={styles.helper}>Loading categories...</p>
        ) : typeCounts.length === 0 ? (
          <p style={styles.helper}>No resource categories found.</p>
        ) : (
          <>
            <div style={styles.typeGrid}>
              {typeCounts.map(([type, count]) => (
                <button
                  key={type}
                  type="button"
                  style={{
                    ...styles.typeCard,
                    ...(form.resourceType === type ? styles.typeCardActive : {}),
                  }}
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      resourceType: prev.resourceType === type ? '' : type,
                      resourceId: '',
                    }));
                    resetAvailability();
                  }}
                >
                  <strong>{type}</strong>
                  <span style={styles.typeCount}>{count} resources</span>
                </button>
              ))}
            </div>

            {!form.resourceType ? (
              <p style={{ ...styles.helper, marginTop: 12 }}>Click any category to list its resources.</p>
            ) : selectedCategoryResources.length === 0 ? (
              <p style={{ ...styles.helper, marginTop: 12 }}>No resources found in this category.</p>
            ) : (
              <div style={styles.categoryResourceList}>
                <div style={styles.categoryResourceHeader}>
                  <strong>{form.resourceType}</strong>
                  <span style={styles.typeCount}>{selectedCategoryResources.length} resources</span>
                </div>

                {selectedCategoryResources.map((resource) => {
                  const isAvailable = isResourceStatusAvailable(resource.status);
                  return (
                    <div key={resource.id} style={styles.categoryResourceItem}>
                      <div style={styles.categoryResourceMain}>
                        <div style={styles.categoryResourceName}>{resource.name || 'Unnamed Resource'}</div>
                        <div style={styles.categoryResourceMeta}>
                          Capacity: {resource.capacity || 0}
                          {resource?.location && (
                            <>
                              {' '}·{' '}
                              {[resource.location.building, resource.location.floor, resource.location.room]
                                .filter(Boolean)
                                .join(' / ') || 'Location not set'}
                            </>
                          )}
                        </div>
                      </div>

                      <span
                        style={{
                          ...styles.resourceStatus,
                          ...(isAvailable ? styles.resourceStatusAvailable : styles.resourceStatusUnavailable),
                        }}
                      >
                        {resource.status || 'UNKNOWN'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {showNewBooking && (
        <section style={styles.bookingStudio}>
          <div style={styles.resourceShowcase}>
            <div style={styles.resourceImageWrap}>
              <img
                src={selectedResource?.imageUrl || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80'}
                alt={selectedResource?.name || 'Resource preview'}
                style={styles.resourceImage}
              />
              <span style={styles.liveBadge}>Active Status</span>
            </div>

            <h3 style={styles.resourceHeading}>{selectedResource?.name || 'Select a resource'}</h3>
            <p style={styles.resourceDescription}>
              {selectedResource?.description || 'Choose a category or resource to view full details and request a booking.'}
            </p>

            <div style={styles.resourceStats}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Type</div>
                <div style={styles.statValue}>{selectedResource?.type || '—'}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Capacity</div>
                <div style={styles.statValue}>{selectedResource?.capacity || 0} seats</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Location</div>
                <div style={styles.statValue}>
                  {selectedResource?.location
                    ? [selectedResource.location.building, selectedResource.location.floor, selectedResource.location.room]
                        .filter(Boolean)
                        .join(', ') || 'Not set'
                    : 'Not set'}
                </div>
              </div>
            </div>

            <div style={styles.scheduleBox}>
              <div style={styles.scheduleTitle}>Today&apos;s Schedule</div>
              {resourceScheduleLoading ? (
                <p style={styles.helper}>Loading schedule...</p>
              ) : (
                <>
                  <div style={styles.scheduleLegend}>
                    <span style={styles.legendItem}><i style={{ ...styles.legendDot, background: '#1d4ed8' }} />Booked</span>
                    <span style={styles.legendItem}><i style={{ ...styles.legendDot, background: '#e2e8f0' }} />Available</span>
                  </div>
                  <div style={styles.scheduleGrid}>
                    {scheduleBlocks.map((block) => (
                      <div key={block.slot} style={styles.scheduleCellWrap}>
                        <div style={{ ...styles.scheduleCell, background: block.busy ? '#1d4ed8' : '#e2e8f0' }} />
                        <span style={styles.scheduleTime}>{block.slot.slice(0, 5)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={styles.requestPanel}>
            {(submitError || availabilityError) && (
              <div style={styles.error}>{submitError || availabilityError}</div>
            )}

            <h3 style={styles.requestTitle}>Request a Booking</h3>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Select Date</label>
                <input
                  type="date"
                  name="date"
                  min={todayISO()}
                  value={form.date}
                  onChange={handleFormChange}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Start Time</label>
                  <input
                    type="time"
                    name="startTime"
                    value={form.startTime}
                    onChange={handleFormChange}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>End Time</label>
                  <input
                    type="time"
                    name="endTime"
                    value={form.endTime}
                    onChange={handleFormChange}
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Category</label>
                <select
                  name="resourceType"
                  value={form.resourceType}
                  onChange={handleFormChange}
                  style={styles.input}
                >
                  <option value="">All Categories</option>
                  {typeCounts.map(([type]) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Select Resource</label>
                <select
                  name="resourceId"
                  value={form.resourceId}
                  onChange={handleFormChange}
                  required
                  style={styles.input}
                >
                  <option value="">Choose available resource...</option>
                  {displayedResources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {getResourceLabel(resource)}
                    </option>
                  ))}
                </select>
                <p style={styles.inputHint}>
                  {availabilityChecked
                    ? `${displayedResources.length} resources available in this time slot.`
                    : `${displayedResources.length} currently AVAILABLE resources (status-based).`}
                </p>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Purpose of Booking</label>
                <textarea
                  name="purpose"
                  value={form.purpose}
                  minLength={10}
                  rows={3}
                  onChange={handleFormChange}
                  required
                  placeholder="Describe why you need this resource"
                  style={styles.textarea}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Booking Reason</label>
                <input
                  type="text"
                  name="bookingReason"
                  value={form.bookingReason}
                  maxLength={100}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Robotics team meeting"
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Expected Attendees</label>
                <input
                  type="text"
                  name="expectedAttendees"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.expectedAttendees}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 24"
                  style={styles.input}
                />
              </div>

              <div style={styles.formActions}>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  onClick={handleCheckAvailability}
                  disabled={checkingAvailability || resourcesLoading}
                >
                  {checkingAvailability ? 'Checking...' : 'Check Availability'}
                </button>

                <button
                  type="submit"
                  style={styles.primaryActionBtn}
                  disabled={loading || checkingAvailability || resourcesLoading}
                >
                  {loading ? 'Submitting...' : 'Send Booking Request'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {bookings.length === 0 ? (
        <div style={styles.emptyBox}>
          <p>You have no bookings yet.</p>
          <button style={styles.newBtn} onClick={() => setShowNewBooking(true)}>
            Create Your First Booking
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
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' },
  categorySection: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0 1px 8px rgba(0,0,0,.05)',
  },
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 },
  typeCard: {
    border: '1px solid #d1d5db',
    borderRadius: 10,
    background: '#f8fafc',
    padding: 12,
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  typeCardActive: {
    borderColor: '#2563eb',
    background: '#eff6ff',
  },
  typeCount: { fontSize: 12, color: '#6b7280' },
  helper: { margin: 0, fontSize: 13, color: '#6b7280' },
  categoryResourceList: {
    marginTop: 12,
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    background: '#ffffff',
    overflow: 'hidden',
  },
  categoryResourceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderBottom: '1px solid #e5e7eb',
    background: '#f8fafc',
    fontSize: 14,
  },
  categoryResourceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderBottom: '1px solid #f1f5f9',
  },
  categoryResourceMain: { minWidth: 0 },
  categoryResourceName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  categoryResourceMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  resourceStatus: {
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 999,
    padding: '4px 8px',
    border: '1px solid transparent',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    whiteSpace: 'nowrap',
  },
  resourceStatusAvailable: {
    color: '#166534',
    background: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  resourceStatusUnavailable: {
    color: '#991b1b',
    background: '#fef2f2',
    borderColor: '#fecaca',
  },
  newBookingCard: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    boxShadow: '0 1px 8px rgba(0,0,0,.05)',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 },
  bookingStudio: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 16,
    marginBottom: 20,
  },
  resourceShowcase: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: 14,
    boxShadow: '0 12px 30px -24px rgba(15, 23, 42, 0.35)',
  },
  resourceImageWrap: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  resourceImage: {
    width: '100%',
    height: 'clamp(210px, 34vw, 300px)',
    objectFit: 'cover',
    display: 'block',
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    background: '#dcfce7',
    border: '1px solid #bbf7d0',
    color: '#166534',
    padding: '4px 9px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  resourceHeading: {
    margin: '0 0 6px',
    fontSize: 36,
    lineHeight: 1.1,
    color: '#0f172a',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  resourceDescription: {
    margin: '0 0 14px',
    fontSize: 14,
    color: '#475569',
    lineHeight: 1.5,
  },
  resourceStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: 10,
    background: '#f8fafc',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 700,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: 700,
  },
  scheduleBox: {
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: 10,
    background: '#ffffff',
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: 8,
  },
  scheduleLegend: {
    display: 'flex',
    gap: 14,
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  legendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    display: 'inline-block',
  },
  scheduleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
    gap: 6,
  },
  scheduleCellWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
  },
  scheduleCell: {
    width: '100%',
    height: 28,
    borderRadius: 6,
  },
  scheduleTime: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 600,
  },
  requestPanel: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
    padding: 16,
    boxShadow: '0 12px 30px -24px rgba(15, 23, 42, 0.35)',
    alignSelf: 'start',
    position: 'relative',
  },
  requestTitle: {
    margin: 0,
    fontSize: 24,
    color: '#111827',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, color: '#374151', fontWeight: 600 },
  input: {
    padding: '9px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    background: '#fff',
  },
  textarea: {
    padding: '9px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 14,
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  secondaryBtn: {
    padding: '9px 14px',
    background: '#ffffff',
    color: '#1f2937',
    border: '1px solid #9ca3af',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  primaryActionBtn: {
    padding: '10px 16px',
    background: '#1d4ed8',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  linkBtn: {
    background: 'transparent',
    border: 'none',
    color: '#2563eb',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  inputHint: { margin: '2px 0 0', fontSize: 12, color: '#6b7280' },
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
  success:  { background: '#f0fdf4', color: '#166534', padding: '12px 16px', borderRadius: 8, marginBottom: 16 },
  emptyBox: { textAlign: 'center', padding: 60, color: '#6b7280' },
};