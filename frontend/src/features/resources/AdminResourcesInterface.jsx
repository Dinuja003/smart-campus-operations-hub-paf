import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  Building2,
  CalendarClock,
  ChevronDown,
  Download,
  Eye,
  MapPin,
  Monitor,
  Pencil,
  Plus,
  Trash2,
  Users,
  Wrench,
  X,
} from "lucide-react";
import ResourceDirectoryReportPreview from "./ResourceDirectoryReportPreview";
import ResourceReportPreview from "./ResourceReportPreview";

const API = axios.create({ baseURL: "/api" });
API.interceptors.request.use((cfg) => {
  const t = sessionStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

const getAllResources = () => API.get("/resources").then((r) => r.data);
const toArray = (v) => { if (Array.isArray(v)) return v; if (Array.isArray(v?.data)) return v.data; if (Array.isArray(v?.items)) return v.items; return []; };
const formatLocation = (loc) => { if (!loc) return "Not assigned"; if (typeof loc === "string") return loc; return [loc.building, loc.floor, loc.room].filter(Boolean).join(", ") || "Not assigned"; };
const formatDate = (v) => { if (!v) return "Not recorded"; const d = new Date(v); if (Number.isNaN(d.getTime())) return v; return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "2-digit" }).format(d); };
//const formatAvailability = (windows = []) => { if (!Array.isArray(windows) || !windows.length) return "Not configured"; return windows.map((w) => [w.day, [w.startTime, w.endTime].filter(Boolean).join(" – ")].filter(Boolean).join(": ")).join(", "); };
const addMinutes = (time, mins) => { if (!time) return ""; const [h, m] = time.split(":").map(Number); const d = new Date(); d.setHours(h, m + mins, 0, 0); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };

const statusCls = {
  AVAILABLE:   "bg-emerald-500/90 text-white",
  Available:   "bg-emerald-500/90 text-white",
  BOOKED:      "bg-[#001d45]/80 text-white",
  Booked:      "bg-[#001d45]/80 text-white",
  MAINTENANCE: "bg-brand/90 text-white",
  Maintenance: "bg-brand/90 text-white",
  UNAVAILABLE: "bg-red-500/90 text-white",
  Unavailable: "bg-red-500/90 text-white",
};


const typeIcons = { "Lecture Hall": Building2, HALL: Building2, Hall: Building2, "Meeting Room": Users, ROOM: Users, Room: Users, "Computer Lab": Monitor, LAB: Monitor, Lab: Monitor, "Seminar Room": CalendarClock, Auditorium: Building2, AUDITORIUM: Building2 };

const createAvailabilityWindow = (overrides = {}) => ({ day:"MONDAY", startTime:"09:00", endTime:"17:00", ...overrides });
const emptyForm = { name:"", type:"MEETING_ROOM", eqCount:"", capacity:"1", building:"", floor:"", room:"", status:"AVAILABLE", description:"", imageUrl:"", createdBy:"", availabilityWindows:[createAvailabilityWindow()] };

const getFormValues = (r = {}) => {
  const windows = Array.isArray(r.availabilityWindows) && r.availabilityWindows.length
    ? r.availabilityWindows.map((w) => createAvailabilityWindow({ day: w?.day, startTime: w?.startTime, endTime: w?.endTime }))
    : [createAvailabilityWindow()];
  return { name: r.name||"", type: r.type||"MEETING_ROOM", eqCount: String(r.eqCount??""), capacity: String(r.capacity||1), building: r.location?.building||"", floor: r.location?.floor||"", room: r.location?.room||"", status: r.status||"AVAILABLE", description: r.description||"", imageUrl: r.imageUrl||"", createdBy: r.createdBy||"", availabilityWindows: windows };
};

const resourceStatusOptions = ["AVAILABLE", "MAINTENANCE", "UNAVAILABLE"];

const buildPayload = (f) => {
  const eq = f.type === "EQUIPMENT";
  const windows = Array.isArray(f.availabilityWindows) ? f.availabilityWindows : [];
  return { name: f.name.trim(), type: f.type.trim(), eqCount: eq ? Number(f.eqCount||0) : 0, capacity: eq ? 1 : Number(f.capacity||0), location: { building: f.building.trim(), floor: f.floor.trim(), room: f.room.trim() }, availabilityWindows: windows.map((w) => ({ day:w.day, startTime:w.startTime, endTime:w.endTime })), status: f.status.trim(), description: f.description.trim(), imageUrl: f.imageUrl.trim(), createdBy: f.createdBy.trim() };
};

const validateForm = (f) => {
  const eq = f.type === "EQUIPMENT";
  const req = [["Resource name",f.name],["Type",f.type],["Status",f.status],["Building",f.building],["Floor",f.floor],["Room",f.room],["Resource image",f.imageUrl],["Description",f.description],["Created by",f.createdBy]];
  const miss = req.find(([,v]) => !String(v||"").trim());
  if (miss) return `${miss[0]} is required.`;
  if (!eq && Number(f.capacity||0) <= 0) return "Capacity must be greater than 0.";
  if (eq && Number(f.eqCount||0) <= 0) return "Equipment count must be greater than 0.";
  if (!/^\d+$/.test(f.floor.trim())) return "Floor must be a number.";
  const windows = Array.isArray(f.availabilityWindows) ? f.availabilityWindows : [];
  if (!windows.length) return "At least one availability window is required.";
  for (let i = 0; i < windows.length; i += 1) {
    const w = windows[i];
    if (!String(w.day||"").trim()) return `Day is required for window ${i+1}.`;
    if (!String(w.startTime||"").trim()) return `Start time is required for window ${i+1}.`;
    if (!String(w.endTime||"").trim()) return `End time is required for window ${i+1}.`;
    if (w.endTime <= w.startTime) return `End time must be after start time for window ${i+1}.`;
  }
  return "";
};

const readImage = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = () => rej(new Error("Unable to read image."));
  r.readAsDataURL(file);
});

const replaceById = (list, updated, origId) => {
  const uid = updated.id || origId;
  const n = { ...updated, id: uid };
  let replaced = false;
  const next = list.map((item) => { if (item.id === origId || item.id === uid) { replaced = true; return n; } return item; });
  return replaced ? next : list;
};

const formatCapacityValue = (r) => r?.type === "EQUIPMENT" ? "-" : `${r?.capacity || 0} people`;
const formatEqCount = (v) => Number(v) > 0 ? String(v) : "-";

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-navy outline-none placeholder-slate-400 transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10";
const labelCls = "mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]";

export default function AdminResourcesInterface() {
  const [resources, setResources]       = useState([]);
  const [typeFilter, setTypeFilter]     = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedResource, setSelectedResource] = useState(null);
  const [reportPreviewResource, setReportPreviewResource] = useState(null);
  const [directoryReportOpen, setDirectoryReportOpen] = useState(false);
  const [showForm, setShowForm]         = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [formError, setFormError]       = useState("");
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  useEffect(() => {
    let a = true;
    getAllResources()
      .then((r) => { if (a) setResources(toArray(r)); })
      .catch((e) => { if (!a) return; setResources([]); setError(e?.response?.data?.message || e?.message || "Unable to load resources."); })
      .finally(() => { if (a) setLoading(false); });
    return () => { a = false; };
  }, []);

  const resourceTypes    = useMemo(() => ["All Types", ...new Set(resources.map((r) => r.type).filter(Boolean))], [resources]);
  const filtered = useMemo(() => resources.filter((r) => {
    return (typeFilter === "All Types" || r.type === typeFilter) &&
           (statusFilter === "All Status" || r.status === statusFilter);
  }), [resources, statusFilter, typeFilter]);

  const updateForm  = (field, value) => setForm((c) => ({ ...c, [field]: value }));
  const updateAvailabilityWindow = (index, field, value) => setForm((current) => {
    const next = current.availabilityWindows.map((w, i) => {
      if (i !== index) return w;
      if (field === "startTime") { const minEnd = addMinutes(value, 1); return { ...w, startTime: value, endTime: w.endTime <= value ? minEnd : w.endTime }; }
      return { ...w, [field]: value };
    });
    return { ...current, availabilityWindows: next };
  });
  const addAvailabilityWindow    = () => setForm((c) => ({ ...c, availabilityWindows: [...c.availabilityWindows, createAvailabilityWindow()] }));
  const removeAvailabilityWindow = (index) => setForm((c) => c.availabilityWindows.length === 1 ? c : { ...c, availabilityWindows: c.availabilityWindows.filter((_, i) => i !== index) });
  const updateImage = async (file) => { if (!file) return; if (!file.type.startsWith("image/")) { setFormError("Select a valid image."); return; } try { const url = await readImage(file); setForm((c) => ({ ...c, imageUrl: url })); setFormError(""); } catch (e) { setFormError(e.message); } };

  const closeForm  = () => { if (saving) return; setShowForm(false); setEditingResource(null); setForm(emptyForm); setFormError(""); };
  const openCreate = () => { setEditingResource(null); setForm(emptyForm); setFormError(""); setShowForm(true); };
  const openEdit   = (r) => { setEditingResource(r); setForm(getFormValues(r)); setFormError(""); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    const err = validateForm(form);
    if (err) { setFormError(err); return; }
    setSaving(true); setFormError("");
    try {
      const payload = buildPayload(form);
      const saved = editingResource
        ? await API.put(`/resources/${editingResource.id}`, payload).then((r) => r.data)
        : await API.post("/resources", payload).then((r) => r.data);
      setResources((c) => editingResource ? replaceById(c, saved, editingResource.id) : [saved, ...c]);
      if (editingResource) setSelectedResource({ ...saved, id: saved.id || editingResource.id });
      closeForm();
    } catch (e) { setFormError(e?.response?.data?.message || e?.response?.data || e?.message || "Unable to save resource."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete ${r.name || "this resource"}?`)) return;
    setDeleting(true);
    try { await API.delete(`/resources/${r.id}`); setResources((c) => c.filter((x) => x.id !== r.id)); setSelectedResource(null); }
    catch (e) { alert(e?.response?.data?.message || e?.message || "Unable to delete."); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6 px-1">

      {/* ── Breadcrumb + Header ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">
          CAMPUS · RESOURCES
        </p>
        <div className="mt-1.5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[2rem] font-bold leading-tight text-navy">
              Rooms, labs{' '}
              <em className="not-italic font-bold text-brand" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                &amp; spaces.
              </em>
            </h1>
            <p className="mt-1 text-sm text-[#5a6b98]">
              Live occupancy, capacity and maintenance state for every bookable resource on campus.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDirectoryReportOpen(true)}
              disabled={loading || filtered.length === 0}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#5a6b98] shadow-sm hover:bg-slate-50 transition disabled:opacity-60"
            >
              <Download className="h-4 w-4" /> Export PDF
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-[#001d45] px-4 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(0,29,69,0.25)] hover:bg-[#002a66] transition"
            >
              <Plus className="h-4 w-4" /> Add Resource
            </button>
          </div>
        </div>
      </div>

      {/* ── Status tab filter + Type dropdown ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Pill tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {[
            { key: "All Status", label: "All", count: resources.length },
            { key: "AVAILABLE",  label: "Available",   count: resources.filter(r => r.status === "AVAILABLE").length },
            { key: "MAINTENANCE",label: "Maintenance",  count: resources.filter(r => r.status === "MAINTENANCE").length },
            { key: "UNAVAILABLE",label: "Unavailable",  count: resources.filter(r => r.status === "UNAVAILABLE").length },
          ].map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatusFilter(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                statusFilter === t.key
                  ? "bg-[#001d45] text-white shadow-sm"
                  : "text-[#8494c2] hover:text-navy"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-px text-[10px] font-bold leading-4 ${
                statusFilter === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-[#8494c2]"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        {/* Type dropdown */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-transparent text-sm font-semibold text-navy outline-none cursor-pointer">
            {resourceTypes.map((t) => <option key={t}>{t}</option>)}
          </select>
          <ChevronDown className="h-3.5 w-3.5 text-[#8494c2]" />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* ── Card Grid ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-brand" />
          <p className="mt-3 text-sm text-[#8494c2]">Loading resources…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-slate-200 bg-white py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
            <Wrench className="h-5 w-5 text-brand" />
          </div>
          <p className="mt-3 text-sm font-semibold text-navy">No resources found</p>
          <p className="mt-1 text-xs text-[#8494c2]">{resources.length === 0 ? "No records in the database." : "Try adjusting your filters."}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => {
            const Icon = typeIcons[r.type] || Building2;
            const nameSlug = (r.name || "resource").toLowerCase().replace(/\s+/g, "-");
            return (
              <div
                key={r.id}
                onClick={() => setSelectedResource(r)}
                className="group cursor-pointer overflow-hidden rounded-[20px] border border-white/60 bg-white shadow-[0_8px_30px_rgba(21,32,85,0.08)] transition-all hover:shadow-[0_14px_40px_rgba(21,32,85,0.14)] hover:-translate-y-0.5"
              >
                {/* Image area */}
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={r.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#001d45] to-[#001d45]/60">
                      <Icon className="h-10 w-10 text-white/25" />
                    </div>
                  )}
                  {/* Status badge */}
                  <span className={`absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase backdrop-blur-sm ${statusCls[r.status] || "bg-slate-700/80 text-white"}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                    {r.status}
                  </span>
                </div>

                {/* Card body */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-navy leading-snug">{r.name || "Unnamed"}</h3>
                    <span className="shrink-0 rounded-lg border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-[#8494c2]">
                      {r.type}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-[#8494c2]">
                    <span>Capacity {r.type === "EQUIPMENT" ? r.eqCount || "—" : r.capacity || 0}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {formatLocation(r.location).split(",")[0] || "—"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedResource(r); }}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      View details →
                    </button>
                    <span className="font-mono text-[10px] text-[#8494c2]">{nameSlug}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Details Modal ── */}
      {selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setSelectedResource(null)}>
          <div className="w-full max-w-2xl rounded-[26px] bg-white shadow-[0_30px_80px_rgba(21,32,85,0.25)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Resource Details</p>
                <p className="mt-0.5 text-lg font-bold text-navy">{selectedResource.name || "Unnamed Resource"}</p>
              </div>
              <button type="button" onClick={() => setSelectedResource(null)} className="rounded-xl p-2 text-[#8494c2] hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedResource.imageUrl && (
              <img src={selectedResource.imageUrl} alt={selectedResource.name} className="h-52 w-full object-cover" />
            )}

            <div className="px-6 py-4">
              <p className="text-sm text-[#6677a4]">{selectedResource.description || "No description provided."}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 px-6 pb-4 sm:grid-cols-4">
              {[
                { label:"Type",       value: selectedResource.type || "—" },
                { label:"Status",     value: <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusCls[selectedResource.status] || "bg-slate-100 text-slate-600"}`}>{selectedResource.status||"—"}</span> },
                { label:"Capacity",   value: formatCapacityValue(selectedResource) },
                { label:"Eq Count",   value: formatEqCount(selectedResource.eqCount) },
                { label:"Location",   value: formatLocation(selectedResource.location) },
                { label:"Created By", value: selectedResource.createdBy || "—" },
                { label:"Created",    value: formatDate(selectedResource.createdAt) },
                { label:"Updated",    value: formatDate(selectedResource.updatedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#8494c2]">{label}</p>
                  <div className="mt-1 text-xs font-semibold text-navy">{value}</div>
                </div>
              ))}
            </div>

            <div className="px-6 pb-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Availability Windows</p>
              {Array.isArray(selectedResource.availabilityWindows) && selectedResource.availabilityWindows.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedResource.availabilityWindows.map((w, i) => (
                    <span key={i} className="rounded-lg border border-brand/20 bg-brand/8 px-3 py-1.5 text-xs font-semibold text-brand">
                      {[w.day, [w.startTime, w.endTime].filter(Boolean).join(" – ")].filter(Boolean).join(": ")}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8494c2]">No windows configured.</p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button type="button" onClick={() => setReportPreviewResource(selectedResource)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#5a6b98] transition hover:bg-slate-100">
                <Eye className="h-4 w-4" /> Print
              </button>
              <button type="button" disabled={deleting} onClick={() => handleDelete(selectedResource)}
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60">
                <Trash2 className="h-4 w-4" />{deleting ? "Deleting…" : "Delete"}
              </button>
              <button type="button" onClick={() => openEdit(selectedResource)}
                className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition hover:opacity-90">
                <Pencil className="h-4 w-4" /> Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reports ── */}
      {directoryReportOpen && (
        <ResourceDirectoryReportPreview resources={filtered} onClose={() => setDirectoryReportOpen(false)} />
      )}
      {reportPreviewResource && (
        <ResourceReportPreview resource={reportPreviewResource} onClose={() => setReportPreviewResource(null)} />
      )}

      {/* ── Create / Edit Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={closeForm}>
          <form
            className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-[26px] bg-white shadow-[0_30px_80px_rgba(21,32,85,0.25)]"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">{editingResource ? "Update Resource" : "New Resource"}</p>
                <p className="mt-0.5 text-lg font-bold text-navy">{editingResource ? "Update Campus Resource" : "Add Campus Resource"}</p>
              </div>
              <button type="button" onClick={closeForm} className="rounded-xl p-2 text-[#8494c2] hover:bg-slate-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{formError}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={labelCls}>Resource Name *</label><input value={form.name} onChange={(e) => updateForm("name",e.target.value)} placeholder="Meeting Room A-105" required className={inputCls} /></div>
                <div>
                  <label className={labelCls}>Type *</label>
                  <select value={form.type} onChange={(e) => updateForm("type",e.target.value)} required className={inputCls}>
                    {["MEETING_ROOM","LECTURE_HALL","LAB","AUDITORIUM","EQUIPMENT"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status *</label>
                  <select value={form.status} onChange={(e) => updateForm("status",e.target.value)} required className={inputCls}>
                    {resourceStatusOptions.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {form.type !== "EQUIPMENT"
                  ? <div><label className={labelCls}>Capacity *</label><input type="number" min="1" value={form.capacity} onChange={(e) => updateForm("capacity",e.target.value)} required className={inputCls} /></div>
                  : <div><label className={labelCls}>Equipment Count *</label><input type="number" min="0" value={form.eqCount} onChange={(e) => updateForm("eqCount",e.target.value)} required className={inputCls} /></div>
                }
                <div><label className={labelCls}>Created By *</label><input value={form.createdBy} onChange={(e) => updateForm("createdBy",e.target.value)} placeholder="Admin name" required className={inputCls} /></div>
              </div>

              <div>
                <p className="mb-3 text-xs font-bold text-navy">Location</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div><label className={labelCls}>Building *</label><input value={form.building} onChange={(e) => updateForm("building",e.target.value)} placeholder="Block A" required className={inputCls} /></div>
                  <div><label className={labelCls}>Floor *</label><input type="number" min="0" value={form.floor} onChange={(e) => updateForm("floor",e.target.value)} placeholder="1" required className={inputCls} /></div>
                  <div><label className={labelCls}>Room *</label><input value={form.room} onChange={(e) => updateForm("room",e.target.value)} placeholder="105" required className={inputCls} /></div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-navy">Availability Windows</p>
                  <button type="button" onClick={addAvailabilityWindow} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#5a6b98] transition hover:bg-slate-50">
                    Add Window
                  </button>
                </div>
                <div className="space-y-3">
                  {form.availabilityWindows.map((w, index) => (
                    <div key={`${index}-${w.day}-${w.startTime}`} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Window {index + 1}</p>
                        {form.availabilityWindows.length > 1 && (
                          <button type="button" onClick={() => removeAvailabilityWindow(index)} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-100">
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <label className={labelCls}>Day *</label>
                          <select value={w.day} onChange={(e) => updateAvailabilityWindow(index,"day",e.target.value)} required className={inputCls}>
                            {["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"].map((d) => <option key={d}>{d}</option>)}
                          </select>
                        </div>
                        <div><label className={labelCls}>Start Time *</label><input type="time" value={w.startTime} onChange={(e) => updateAvailabilityWindow(index,"startTime",e.target.value)} required className={inputCls} /></div>
                        <div><label className={labelCls}>End Time *</label><input type="time" value={w.endTime} min={addMinutes(w.startTime,1)} onChange={(e) => updateAvailabilityWindow(index,"endTime",e.target.value)} required className={inputCls} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Resource Image *</label>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 py-6 transition hover:border-brand/40 hover:bg-brand/5">
                  <input type="file" accept="image/*" onChange={(e) => updateImage(e.target.files?.[0])} className="hidden" />
                  <Plus className="h-5 w-5 text-[#8494c2]" />
                  <span className="text-xs font-semibold text-[#8494c2]">Choose image</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG, WEBP, GIF</span>
                </label>
                {form.imageUrl && (
                  <div className="mt-3 space-y-2">
                    <img src={form.imageUrl} alt="Preview" className="h-40 w-full rounded-xl border border-slate-200 object-cover" />
                    <button type="button" onClick={() => updateForm("imageUrl","")} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition">Remove image</button>
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Description *</label>
                <textarea value={form.description} onChange={(e) => updateForm("description",e.target.value)} placeholder="Small meeting room with projector" rows={3} required className={`${inputCls} resize-y`} />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
              <button type="button" onClick={closeForm} disabled={saving} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(85,120,210,0.25)] transition hover:opacity-90 disabled:opacity-60">
                {saving ? "Saving…" : editingResource ? "Update Resource" : "Add Resource"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
