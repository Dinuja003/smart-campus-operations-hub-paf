// frontend/src/features/booking/pages/MyBookingsPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, BriefcaseBusiness, Building2, CalendarCheck2, CheckCircle2, ChevronRight, Clock3, Eye, FlaskConical, Loader2, Pencil, Plus, Presentation, Settings2, X } from 'lucide-react';
import { useBooking } from '@/hooks/useBooking';
import bookingService from '@/features/booking/Services/BookingService';
import BookingStatusBadge from '@/components/BookingStatusBadge';

const toArray = (v) => { if (Array.isArray(v)) return v; if (Array.isArray(v?.data)) return v.data; if (Array.isArray(v?.items)) return v.items; return []; };
const todayISO  = () => new Date().toISOString().split('T')[0];
const toMinutes = (t = '') => { const [h, m] = String(t).split(':').map(Number); if (Number.isNaN(h) || Number.isNaN(m)) return null; return h * 60 + m; };
const overlaps  = (sA, eA, sB, eB) => sA < eB && eA > sB;
const isAvailable = (s) => String(s || '').toUpperCase() === 'AVAILABLE';
const getTypeLabel = (t) => t || 'Uncategorized';
const getResourceLabel = (r) => {
  const loc = r?.location;
  const locTxt = loc ? [loc.building, loc.floor, loc.room].filter(Boolean).join(' / ') : null;
  return `${r?.name || 'Unnamed'}${r?.capacity ? ` (cap: ${r.capacity})` : ''}${locTxt ? ` – ${locTxt}` : ''}`;
};
const createEmpty = () => ({ date: todayISO(), startTime: '09:00', endTime: '10:00', resourceType: '', resourceId: '', bookingReason: '', purpose: '', expectedAttendees: '1' });

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-navy outline-none placeholder-slate-400 transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10";
const labelCls = "mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]";

const typeIcons = {
  LAB: FlaskConical,
  MEETING_ROOM: BriefcaseBusiness,
  LECTURE_HALL: Presentation,
  AUDITORIUM: Building2,
  EQUIPMENT: Settings2,
};

export default function MyBookingsPage() {
  const { getMyBookings, cancelBooking, createBooking, updateBooking, loading, error } = useBooking();
  const [bookings, setBookings]         = useState([]);
  const [resources, setResources]       = useState([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError]     = useState('');
  const [cancelling, setCancelling]     = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [submitError, setSubmitError]   = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [availChecked, setAvailChecked] = useState(false);
  const [availError, setAvailError]     = useState('');
  const [availResources, setAvailResources] = useState([]);
  const [scheduleItems, setScheduleItems]   = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [detailModal, setDetailModal]   = useState(null);
  const [showFullViewModal, setShowFullViewModal] = useState(false);
  const [form, setForm]                 = useState(() => createEmpty());
  const navigate = useNavigate();

  useEffect(() => {
    let m = true;
    (async () => {
      setResourcesLoading(true); setResourcesError('');
      try {
        const token = sessionStorage.getItem('token');
        const [myB, allR] = await Promise.all([
          getMyBookings(),
          axios.get('/api/resources', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        ]);
        if (!m) return;
        setBookings(toArray(myB));
        setResources(toArray(allR?.data));
      } catch (_) { if (m) { setBookings([]); setResources([]); setResourcesError('Unable to load resources.'); } }
      finally { if (m) setResourcesLoading(false); }
    })();
    return () => { m = false; };
  }, []);

  const typeCounts = useMemo(() => {
    const c = {}; resources.forEach(r => { const k = getTypeLabel(r.type); c[k] = (c[k] || 0) + 1; });
    return Object.entries(c).sort(([a], [b]) => a.localeCompare(b));
  }, [resources]);

  const quickAvail = useMemo(() => {
    const n = Number(form.expectedAttendees || 1);
    return resources.filter(r => isAvailable(r.status) && (!form.resourceType || getTypeLabel(r.type) === form.resourceType) && Number(r.capacity || 0) >= n);
  }, [resources, form.expectedAttendees, form.resourceType]);

  const catResources = useMemo(() => !form.resourceType ? [] : resources.filter(r => getTypeLabel(r.type) === form.resourceType).sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))), [resources, form.resourceType]);

  const allResourcesSorted = useMemo(
    () => [...resources].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''))),
    [resources],
  );

  const displayed = availChecked ? availResources : quickAvail;

  const selectedResource = useMemo(() => {
    if (form.resourceId) return resources.find(r => r.id === form.resourceId) || null;
    if (catResources.length) return catResources[0];
    if (displayed.length)   return displayed[0];
    if (resources.length)   return resources[0];
    return null;
  }, [displayed, form.resourceId, resources, catResources]);

  const editingBooking = useMemo(() => bookings.find(b => b.id === editingId) || null, [bookings, editingId]);

  const getBookingResourceLabel = (booking) => {
    const resource = resources.find((r) => r.id === booking.resourceId);
    if (resource?.name) return resource.name;
    return booking.resourceType || 'Unassigned Resource';
  };

  const daySlots = useMemo(() => ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'], []);

  const scheduleBlocks = useMemo(() => daySlots.map(slot => {
    const sS = toMinutes(slot), sE = sS + 60;
    const busy = scheduleItems.some(i => {
      if (editingId && i.id === editingId) return false;
      const s = toMinutes(i.startTime), e = toMinutes(i.endTime);
      return s !== null && e !== null && overlaps(sS, sE, s, e);
    });
    return { slot, busy };
  }), [daySlots, scheduleItems, editingId]);

  useEffect(() => {
    let a = true;
    if (!showForm || !selectedResource?.id || !form.date) { setScheduleItems([]); return () => { a = false; }; }
    (async () => {
      setScheduleLoading(true);
      try {
        const s = await bookingService.getSchedule(selectedResource.id, form.date);
        if (a) setScheduleItems(toArray(s).filter(i => !editingId || i.id !== editingId));
      } catch (_) { if (a) setScheduleItems([]); }
      finally { if (a) setScheduleLoading(false); }
    })();
    return () => { a = false; };
  }, [showForm, selectedResource?.id, form.date, editingId]);

  const resetAvail = () => { setAvailChecked(false); setAvailError(''); setAvailResources([]); };
  const isTimeValid = () => { const s = toMinutes(form.startTime), e = toMinutes(form.endTime); return s !== null && e !== null && e > s; };

  const checkAvailability = async ({ silent = false } = {}) => {
    if (!isTimeValid()) { if (!silent) setAvailError('End time must be after start time.'); return []; }
    if (!quickAvail.length) { if (!silent) setAvailError('No resources match this filter.'); setAvailChecked(true); setAvailResources([]); return []; }
    const s = toMinutes(form.startTime), e = toMinutes(form.endTime);
    setCheckingAvail(true); if (!silent) setAvailError('');
    try {
      const checks = await Promise.all(quickAvail.map(async r => {
        try {
          const sched = toArray(await bookingService.getSchedule(r.id, form.date)).filter(i => !editingId || i.id !== editingId);
          return { r, conflict: sched.some(sl => { const ss = toMinutes(sl.startTime), se = toMinutes(sl.endTime); return ss !== null && se !== null && overlaps(s, e, ss, se); }) };
        } catch (_) { return { r, conflict: true }; }
      }));
      const avail = checks.filter(c => !c.conflict).map(c => c.r);
      setAvailChecked(true); setAvailResources(avail);
      if (form.resourceId && !avail.some(r => r.id === form.resourceId)) setForm(p => ({ ...p, resourceId: '' }));
      if (!silent && !avail.length) setAvailError('All matching resources are booked for this slot.');
      return avail;
    } finally { setCheckingAvail(false); }
  };

  const startNew = () => { setEditingId(null); setForm(createEmpty()); resetAvail(); setShowForm(true); };
  const startEdit = (b) => {
    const r = resources.find(r => r.id === b.resourceId);
    setEditingId(b.id);
    setForm({ date: b.date || todayISO(), startTime: b.startTime || '09:00', endTime: b.endTime || '10:00', resourceType: r?.type || b.resourceType || '', resourceId: b.resourceId || '', bookingReason: b.bookingReason || '', purpose: b.purpose || '', expectedAttendees: String(b.expectedAttendees || 1) });
    setShowForm(true); resetAvail();
  };
  const cancelEdit = () => { setEditingId(null); setForm(createEmpty()); resetAvail(); };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancelling(id);
    try { const u = await cancelBooking(id); setBookings(p => toArray(p).map(b => b.id === id ? u : b)); } catch (_) {}
    setCancelling(null);
  };

  const handleQuickBookResource = (resource) => {
    setEditingId(null);
    setSubmitError('');
    setSubmitSuccess('');
    resetAvail();
    setForm((prev) => ({
      ...prev,
      resourceType: getTypeLabel(resource.type),
      resourceId: resource.id,
    }));
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'expectedAttendees') { setForm(p => ({ ...p, expectedAttendees: value.replace(/\D/g, '') })); resetAvail(); return; }
    setForm(p => ({ ...p, [name]: value, ...(name === 'resourceType' ? { resourceId: '' } : {}) }));
    setSubmitError(''); setSubmitSuccess(''); resetAvail();
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitError(''); setSubmitSuccess('');
    const n = Number(form.expectedAttendees);
    if (!n || n < 1 || n > 1000) { setSubmitError('Expected attendees must be 1–1000.'); return; }
    if (!form.resourceId) { setSubmitError('Please select a resource.'); return; }
    if (!isTimeValid())   { setSubmitError('End time must be after start time.'); return; }
    const latest = await checkAvailability({ silent: true });
    if (!latest.some(r => r.id === form.resourceId)) { setSubmitError('Resource is now booked. Choose another.'); setAvailChecked(true); setAvailResources(latest); return; }
    try {
      const payload = { resourceId: form.resourceId, bookingReason: form.bookingReason, date: form.date, startTime: form.startTime, endTime: form.endTime, purpose: form.purpose, expectedAttendees: n };
      if (editingId) await updateBooking(editingId, payload); else await createBooking(payload);
      const r = await getMyBookings(); setBookings(toArray(r));
      setSubmitSuccess(editingId ? 'Booking updated.' : 'Booking request submitted.');
      setShowForm(false); setEditingId(null); setForm(createEmpty()); resetAvail();
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err?.response?.data?.error || (typeof err?.response?.data === 'string' ? err.response.data : '') || err?.message || 'Could not submit. Please try again.');
    }
  };

  if (loading && !bookings.length) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white p-8 text-sm text-[#8494c2]">
        <Loader2 className="h-4 w-4 animate-spin text-brand" /> Loading bookings…
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <section className="relative overflow-hidden rounded-[26px] border border-white/60 bg-white/80 p-5 shadow-[0_14px_40px_rgba(21,32,85,0.10)] backdrop-blur-sm sm:p-6">
        <div className="pointer-events-none absolute -left-10 top-6 h-36 w-36 rounded-full bg-[#001d45]/12 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-0.5 text-[10px] font-semibold tracking-wide text-brand">
              <CalendarCheck2 className="h-3 w-3" /> Booking Workspace
            </p>
            <h1 className="mt-1.5 text-2xl font-bold text-navy sm:text-3xl">My Bookings</h1>
            <p className="mt-0.5 text-sm text-[#5a6b98]">Review requests, edit pending bookings, and schedule campus resources.</p>
          </div>
          <button
            type="button"
            onClick={() => { if (showForm) { setShowForm(false); cancelEdit(); } else startNew(); }}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${showForm ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50' : 'bg-brand text-white shadow-[0_4px_12px_rgba(244,94,43,0.30)] hover:opacity-90'}`}
          >
            {showForm ? <><X className="h-4 w-4" /> Close Form</> : <><Plus className="h-4 w-4" /> New Booking</>}
          </button>
        </div>
      </section>

      {/* ── Alerts ── */}
      {(error || resourcesError) && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error || resourcesError}
        </div>
      )}
      {submitSuccess && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{submitSuccess}
        </div>
      )}

      {/* ── Category Cards ── */}
      <section className="rounded-[26px] border border-white/60 bg-gradient-to-br from-white to-slate-50 p-5 shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-navy">Resource Categories</h3>
            <p className="mt-0.5 text-xs text-[#8494c2]">Choose a category to narrow available resources.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowFullViewModal(true);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
          >
            Full View <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {resourcesLoading ? (
          <div className="flex items-center gap-2 text-xs text-[#8494c2]"><Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />Loading categories…</div>
        ) : typeCounts.length === 0 ? (
          <p className="text-xs text-[#8494c2]">No resource categories found.</p>
        ) : (
          <>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
              {typeCounts.map(([type, count]) => (
                (() => {
                  const TypeIcon = typeIcons[type] || Building2;
                  const selected = form.resourceType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setForm(p => ({ ...p, resourceType: selected ? '' : type, resourceId: '' }));
                        resetAvail();
                      }}
                      className={`group relative overflow-hidden rounded-xl border p-3 text-left transition-all ${selected ? 'border-brand/35 bg-brand/10 shadow-[0_8px_20px_rgba(244,94,43,0.12)]' : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-sm'}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-brand text-white' : 'bg-[#001d45]/8 text-[#001d45]'}`}>
                          <TypeIcon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-bold ${selected ? 'text-brand' : 'text-navy'}`}>{type.replaceAll('_', ' ')}</p>
                          <p className="text-xs text-[#8494c2]">{count} resource{count !== 1 ? 's' : ''}</p>
                        </div>
                        {selected && <span className="ml-auto rounded-full bg-brand/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-brand">Selected</span>}
                      </div>
                    </button>
                  );
                })()
              ))}
            </div>

            {form.resourceType && catResources.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
                  <p className="text-xs font-bold text-navy">{form.resourceType}</p>
                  <span className="text-[10px] text-[#8494c2]">{catResources.length} resources</span>
                </div>
                {catResources.map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-3 border-b border-slate-50 px-4 py-3 last:border-0 hover:bg-slate-50/60 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-navy">{r.name || 'Unnamed'}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${isAvailable(r.status) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                          {r.status || 'UNKNOWN'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-[#8494c2]">Cap: {r.capacity || 0}{r.location ? ` · ${[r.location.building, r.location.floor, r.location.room].filter(Boolean).join(' / ')}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!isAvailable(r.status)}
                        onClick={() => isAvailable(r.status) && handleQuickBookResource(r)}
                        className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${isAvailable(r.status) ? 'bg-brand text-white hover:opacity-90' : 'cursor-not-allowed bg-slate-200 text-slate-500'}`}
                      >
                        Book Resource
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {showFullViewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={() => setShowFullViewModal(false)}
        >
          <div
            className="w-full max-w-4xl overflow-hidden rounded-[26px] border border-white/60 bg-white shadow-[0_30px_80px_rgba(21,32,85,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Resources</p>
                <h3 className="mt-0.5 text-lg font-bold text-navy">All Resources</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFullViewModal(false)}
                className="rounded-xl p-2 text-[#8494c2] transition-colors hover:bg-slate-100 hover:text-navy"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
              <div className="mb-3 text-xs text-[#8494c2]">{allResourcesSorted.length} resources found</div>
              {allResourcesSorted.length === 0 ? (
                <p className="text-sm text-[#8494c2]">No resources available.</p>
              ) : (
                <div className="space-y-2.5">
                  {allResourcesSorted.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-navy">{r.name || 'Unnamed'}</p>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5a6b98]">
                            {getTypeLabel(r.type)}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${isAvailable(r.status) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                            {r.status || 'UNKNOWN'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#8494c2]">Cap: {r.capacity || 0}{r.location ? ` · ${[r.location.building, r.location.floor, r.location.room].filter(Boolean).join(' / ')}` : ''}</p>
                      </div>
                      <button
                        type="button"
                        disabled={!isAvailable(r.status)}
                        onClick={() => {
                          if (!isAvailable(r.status)) return;
                          handleQuickBookResource(r);
                          setShowFullViewModal(false);
                        }}
                        className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${isAvailable(r.status) ? 'bg-brand text-white hover:opacity-90' : 'cursor-not-allowed bg-slate-200 text-slate-500'}`}
                      >
                        Book Resource
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Booking Form ── */}
      {showForm && (
        <section className="grid gap-5 xl:grid-cols-2">
          {/* Resource preview + schedule */}
          <div className="rounded-[26px] border border-white/60 bg-white p-5 shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
            <div className="overflow-hidden rounded-2xl">
              <img
                src={selectedResource?.imageUrl || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80'}
                alt={selectedResource?.name || 'Resource'}
                className="h-44 w-full object-cover"
              />
            </div>

            <div className="mt-4">
              <p className="text-xl font-bold text-navy">{selectedResource?.name || 'Select a resource'}</p>
              <p className="mt-1 text-sm text-[#6677a4]">{selectedResource?.description || 'Choose a category and resource to see details.'}</p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {[
                { label: 'Type', value: selectedResource?.type || '—' },
                { label: 'Capacity', value: selectedResource?.capacity ? `${selectedResource.capacity} seats` : '—' },
                { label: 'Location', value: selectedResource?.location ? [selectedResource.location.building, selectedResource.location.floor, selectedResource.location.room].filter(Boolean).join(', ') || '—' : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8494c2]">{label}</p>
                  <p className="mt-1 text-xs font-semibold text-navy">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 p-4">
              <p className="mb-3 text-xs font-bold text-navy">Today's Schedule</p>
              {scheduleLoading ? (
                <div className="flex items-center gap-2 text-xs text-[#8494c2]"><Loader2 className="h-3 w-3 animate-spin text-brand" />Loading…</div>
              ) : (
                <>
                  <div className="mb-2 flex gap-4 text-[10px] text-[#8494c2]">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand inline-block" />Booked</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-200 inline-block" />Free</span>
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    {scheduleBlocks.map(({ slot, busy }) => (
                      <div key={slot} className="flex flex-col items-center gap-1">
                        <div className={`h-6 w-full rounded ${busy ? 'bg-brand' : 'bg-slate-100'}`} />
                        <span className="text-[8px] text-[#8494c2]">{slot.slice(0, 5)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Form panel */}
          <div className="rounded-[26px] border border-white/60 bg-white p-5 shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-base font-bold text-navy">{editingId ? 'Edit Booking' : 'Request a Booking'}</p>
              {editingId && <button type="button" onClick={cancelEdit} className="text-xs font-semibold text-brand hover:underline">Cancel Edit</button>}
            </div>

            {editingId && editingBooking && (
              <div className="mb-4 rounded-xl border border-brand/20 bg-brand/8 px-3 py-2.5 text-xs font-semibold text-brand">
                Editing: {editingBooking.bookingReason || editingBooking.id}
              </div>
            )}

            {(submitError || availError) && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{submitError || availError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" name="date" min={todayISO()} value={form.date} onChange={handleChange} required className={inputCls} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start Time</label>
                  <input type="time" name="startTime" value={form.startTime} onChange={handleChange} required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>End Time</label>
                  <input type="time" name="endTime" value={form.endTime} onChange={handleChange} required className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Category</label>
                <select name="resourceType" value={form.resourceType} onChange={handleChange} className={inputCls}>
                  <option value="">All Categories</option>
                  {typeCounts.map(([type]) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>Select Resource</label>
                <select name="resourceId" value={form.resourceId} onChange={handleChange} required className={inputCls}>
                  <option value="">Choose available resource…</option>
                  {displayed.map(r => <option key={r.id} value={r.id}>{getResourceLabel(r)}</option>)}
                </select>
                <p className="mt-1 text-[10px] text-[#8494c2]">
                  {availChecked ? `${displayed.length} resources available for this slot.` : `${displayed.length} currently AVAILABLE resources.`}
                </p>
              </div>

              <div>
                <label className={labelCls}>Purpose</label>
                <textarea name="purpose" value={form.purpose} minLength={10} rows={3} onChange={handleChange} required placeholder="Describe why you need this resource" className={`${inputCls} resize-y`} />
              </div>

              <div>
                <label className={labelCls}>Booking Reason</label>
                <input type="text" name="bookingReason" value={form.bookingReason} maxLength={100} onChange={handleChange} required placeholder="e.g. Robotics team meeting" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Expected Attendees</label>
                <input type="text" name="expectedAttendees" inputMode="numeric" pattern="[0-9]*" value={form.expectedAttendees} onChange={handleChange} required placeholder="e.g. 24" className={inputCls} />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => checkAvailability()}
                  disabled={checkingAvail || resourcesLoading}
                  className="rounded-xl bg-[#001d45] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#002a66] disabled:opacity-60"
                >
                  {checkingAvail ? 'Checking…' : 'Check Availability'}
                </button>
                <button
                  type="submit"
                  disabled={loading || checkingAvail}
                  className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(244,94,43,0.30)] transition hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? 'Saving…' : editingId ? 'Save Changes' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* ── Bookings list ── */}
      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-slate-200 bg-white py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
            <CalendarCheck2 className="h-6 w-6 text-brand" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-navy">No bookings yet</h3>
          <p className="mt-1 text-sm text-[#8494c2]">Create your first booking to get started.</p>
          <button type="button" onClick={startNew} className="mt-5 flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(244,94,43,0.25)] hover:opacity-90">
            <Plus className="h-4 w-4" /> Create First Booking
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="rounded-[22px] border border-white/60 bg-white p-5 shadow-[0_8px_30px_rgba(21,32,85,0.07)] transition hover:shadow-[0_14px_40px_rgba(21,32,85,0.11)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-navy">{b.bookingReason}</p>
                  <p className="mt-0.5 text-xs text-[#8494c2]">
                    {b.date} · {b.startTime}–{b.endTime} · {b.resourceType}
                  </p>
                </div>
                <BookingStatusBadge status={b.status} />
              </div>

              {b.purpose && <p className="mt-2.5 text-sm text-[#6677a4]">{b.purpose}</p>}

              {b.adminNote && (
                <div className="mt-3 rounded-xl border border-[#001d45]/20 bg-[#001d45]/8 px-3 py-2.5 text-xs font-medium text-[#001d45]">
                  <span className="font-bold">Admin note:</span> {b.adminNote}
                </div>
              )}

              <div className="mt-4 flex gap-2.5">
                {b.status === 'PENDING' && (
                  <button type="button" onClick={() => startEdit(b)} className="flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/8 px-3.5 py-2 text-xs font-semibold text-brand transition hover:bg-brand/15">
                    <Pencil className="h-3 w-3" /> Edit Booking
                  </button>
                )}
                {b.status === 'APPROVED' && (
                  <button type="button" onClick={() => setDetailModal(b)} className="flex items-center gap-1.5 rounded-lg border border-[#001d45]/20 bg-[#001d45]/8 px-3.5 py-2 text-xs font-semibold text-[#001d45] transition hover:bg-[#001d45]/15">
                    <Eye className="h-3 w-3" /> View Details
                  </button>
                )}
                {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                  <button type="button" disabled={cancelling === b.id} onClick={() => handleCancel(b.id)} className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60">
                    <X className="h-3 w-3" />{cancelling === b.id ? 'Cancelling…' : 'Cancel Booking'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Approved Booking Details Modal ── */}
      {detailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-[26px] bg-white shadow-[0_30px_80px_rgba(21,32,85,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Booking Details</p>
                <h3 className="mt-0.5 text-lg font-bold text-navy">Approved Booking</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="rounded-xl p-2 text-[#8494c2] transition-colors hover:bg-slate-100 hover:text-navy"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 px-6 py-5">
              {[
                { label: 'Reason', value: detailModal.bookingReason || '—' },
                { label: 'Resource', value: getBookingResourceLabel(detailModal) },
                { label: 'Date & Time', value: `${detailModal.date || '—'} · ${detailModal.startTime || '—'}–${detailModal.endTime || '—'}` },
                { label: 'Expected Attendees', value: detailModal.expectedAttendees || '—' },
                { label: 'Status', value: detailModal.status || '—' },
                { label: 'Purpose', value: detailModal.purpose || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">{label}</p>
                  <p className="mt-0.5 text-sm font-medium text-navy">{value}</p>
                </div>
              ))}

              {detailModal.adminNote && (
                <div className="rounded-xl border border-[#001d45]/20 bg-[#001d45]/8 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Admin Note</p>
                  <p className="mt-0.5 text-sm font-medium text-[#001d45]">{detailModal.adminNote}</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
