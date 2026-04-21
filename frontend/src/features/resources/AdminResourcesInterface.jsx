import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  AlertCircle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Download,
  Eye,
  Filter,
  MapPin,
  Monitor,
  Pencil,
  Plus,
  Search,
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
const formatAvailability = (windows = []) => { if (!Array.isArray(windows) || !windows.length) return "Not configured"; return windows.map((w) => [w.day, [w.startTime, w.endTime].filter(Boolean).join(" – ")].filter(Boolean).join(": ")).join(", "); };
const addMinutes = (time, mins) => { if (!time) return ""; const [h, m] = time.split(":").map(Number); const d = new Date(); d.setHours(h, m + mins, 0, 0); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; };

const dayIndex = { SUNDAY:0, MONDAY:1, TUESDAY:2, WEDNESDAY:3, THURSDAY:4, FRIDAY:5, SATURDAY:6 };

const statusCls = {
  AVAILABLE:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  Available:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  BOOKED:      "bg-[#001d45]/10 text-[#001d45] border-[#001d45]/20",
  Booked:      "bg-[#001d45]/10 text-[#001d45] border-[#001d45]/20",
  MAINTENANCE: "bg-brand/10 text-brand border-brand/20",
  Maintenance: "bg-brand/10 text-brand border-brand/20",
  UNAVAILABLE: "bg-red-100 text-red-600 border-red-200",
  Unavailable: "bg-red-100 text-red-600 border-red-200",
};

const typeIcons = { "Lecture Hall": Building2, HALL: Building2, Hall: Building2, "Meeting Room": Users, ROOM: Users, Room: Users, "Computer Lab": Monitor, LAB: Monitor, Lab: Monitor, "Seminar Room": CalendarClock, Auditorium: Building2, AUDITORIUM: Building2 };

const emptyForm = { name:"", type:"MEETING_ROOM", eqCount:"", capacity:"1", building:"", floor:"", room:"", status:"AVAILABLE", description:"", imageUrl:"", createdBy:"", day:"MONDAY", startTime:"09:00", endTime:"17:00" };

const getFormValues = (r = {}) => {
  const w = Array.isArray(r.availabilityWindows) ? r.availabilityWindows[0] : null;
  return { name: r.name||"", type: r.type||"MEETING_ROOM", eqCount: String(r.eqCount??""), capacity: String(r.capacity||1), building: r.location?.building||"", floor: r.location?.floor||"", room: r.location?.room||"", status: r.status||"AVAILABLE", description: r.description||"", imageUrl: r.imageUrl||"", createdBy: r.createdBy||"", day: w?.day||"MONDAY", startTime: w?.startTime||"09:00", endTime: w?.endTime||"17:00" };
};

const buildPayload = (f) => {
  const eq = f.type === "EQUIPMENT";
  return { name: f.name.trim(), type: f.type.trim(), eqCount: eq ? Number(f.eqCount||0) : 0, capacity: eq ? 1 : Number(f.capacity||0), location: { building: f.building.trim(), floor: f.floor.trim(), room: f.room.trim() }, availabilityWindows: (f.day||f.startTime||f.endTime) ? [{ day:f.day, startTime:f.startTime, endTime:f.endTime }] : [], status: f.status.trim(), description: f.description.trim(), imageUrl: f.imageUrl.trim(), createdBy: f.createdBy.trim() };
};

const validateForm = (f) => {
  const eq = f.type === "EQUIPMENT";
  const req = [["Resource name",f.name],["Type",f.type],["Status",f.status],["Building",f.building],["Floor",f.floor],["Room",f.room],["Day",f.day],["Start time",f.startTime],["End time",f.endTime],["Resource image",f.imageUrl],["Description",f.description],["Created by",f.createdBy]];
  const miss = req.find(([,v]) => !String(v||"").trim());
  if (miss) return `${miss[0]} is required.`;
  if (!eq && Number(f.capacity||0) <= 0) return "Capacity must be greater than 0.";
  if (eq && Number(f.eqCount||0) <= 0) return "Equipment count must be greater than 0.";
  if (!/^\d+$/.test(f.floor.trim())) return "Floor must be a number.";
  if (f.endTime <= f.startTime) return "End time must be after start time.";
  const now = new Date();
  const todayName = Object.keys(dayIndex).find((d) => dayIndex[d] === now.getDay());
  const cur = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  if (f.day === todayName && f.startTime < cur) return "Start time must be current or future.";
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

const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-navy outline-none placeholder-slate-400 transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10";
const labelCls = "mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#8494c2]";
const titleCase = (value = "") => value.includes(" ") ? value : `${value.charAt(0)}${value.slice(1).toLowerCase()}`;

export default function AdminResourcesInterface() {
  const [resources, setResources]         = useState([]);
  const [query, setQuery]                 = useState("");
  const [typeFilter, setTypeFilter]       = useState("All Types");
  const [statusFilter, setStatusFilter]   = useState("All Status");
  const [selectedResource, setSelectedResource] = useState(null);
  const [reportPreviewResource, setReportPreviewResource] = useState(null);
  const [directoryReportOpen, setDirectoryReportOpen] = useState(false);
  const [showForm, setShowForm]           = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [form, setForm]                   = useState(emptyForm);
  const [formError, setFormError]         = useState("");
  const [saving, setSaving]               = useState(false);
  const [deleting, setDeleting]           = useState(false);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");

  useEffect(() => {
    let a = true;
    getAllResources()
      .then((r) => { if (a) setResources(toArray(r)); })
      .catch((e) => { if (!a) return; setResources([]); setError(e?.response?.data?.message || e?.message || "Unable to load resources."); })
      .finally(() => { if (a) setLoading(false); });
    return () => { a = false; };
  }, []);

  const resourceTypes    = useMemo(() => ["All Types", ...new Set(resources.map((r) => r.type).filter(Boolean))], [resources]);
  const resourceStatuses = useMemo(() => {
    const pref = ["BOOKED","AVAILABLE","MAINTENANCE","UNAVAILABLE"];
    const existing = new Set(resources.map((r) => r.status).filter(Boolean));
    return ["All Status", ...pref.filter((s) => existing.has(s)), ...[...existing].filter((s) => !pref.includes(s))];
  }, [resources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      const loc = formatLocation(r.location);
      const match = !q || [r.name,r.id,r.type,r.status,r.createdBy,loc,r.description].join(" ").toLowerCase().includes(q);
      return match && (typeFilter === "All Types" || r.type === typeFilter) && (statusFilter === "All Status" || r.status === statusFilter);
    });
  }, [query, resources, statusFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: resources.length,
    available: resources.filter((r) => String(r.status||"").toLowerCase() === "available").length,
    maintenance: resources.filter((r) => String(r.status||"").toLowerCase().includes("maintenance")).length,
    capacity: resources.reduce((s, r) => s + Number(r.capacity||0), 0),
  }), [resources]);

  const updateForm  = (field, value) => setForm((c) => { if (field === "startTime") { const minEnd = addMinutes(value, 1); return { ...c, startTime: value, endTime: c.endTime <= value ? minEnd : c.endTime }; } return { ...c, [field]: value }; });
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
      const saved   = editingResource
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
    <div className="space-y-5">

      {/* ── Header ── */}
      <section className="relative overflow-hidden rounded-[26px] border border-white/60 bg-white/80 p-5 shadow-[0_14px_40px_rgba(21,32,85,0.10)] backdrop-blur-sm sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/8 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-0.5 text-[10px] font-semibold tracking-wide text-brand">
              <Wrench className="h-3 w-3" /> Resource Operations
            </p>
            <h1 className="mt-1.5 text-2xl font-bold text-navy sm:text-3xl">Resource Control Center</h1>
            <p className="mt-0.5 text-sm text-[#5a6b98]">Manage campus resources — capacity, location, availability, and operational status.</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/70 bg-white px-5 py-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-navy">{resources.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8494c2]">Total</p>
            </div>
            <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/60 px-5 py-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{stats.available}</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500">Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stat cards ── */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Resources", value: stats.total,       icon: Building2,    iconBg: "bg-brand" },
          { label: "Available Now",   value: stats.available,   icon: CheckCircle2, iconBg: "bg-emerald-500" },
          { label: "Total Capacity",  value: stats.capacity,    icon: Users,        iconBg: "bg-[#f5b800]" },
          { label: "Maintenance",     value: stats.maintenance, icon: Wrench,       iconBg: "bg-[#152055]" },
        ].map(({ label, value, icon: Icon, iconBg }) => (
          <article key={label} className="rounded-[22px] border border-white/60 bg-white p-4 shadow-[0_8px_30px_rgba(21,32,85,0.07)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">{label}</p>
                <p className="mt-1.5 text-2xl font-bold text-navy">{value}</p>
              </div>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                <Icon className="h-3.5 w-3.5 text-white" />
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex flex-1 min-w-48 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-[#8494c2]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, ID, type, location…"
            className="w-full bg-transparent text-sm text-navy outline-none placeholder-slate-400"
          />
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <Filter className="h-4 w-4 text-[#8494c2]" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-transparent text-sm font-semibold text-navy outline-none">
            {resourceTypes.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* ── Status filter tabs ── */}
      <div className="flex flex-wrap gap-2">
        {resourceStatuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${statusFilter === s ? "bg-brand text-white shadow-[0_4px_12px_rgba(85,120,210,0.30)]" : "border border-slate-200 bg-white text-slate-500 hover:border-brand/30 hover:text-brand"}`}
          >
            {titleCase(s)}
          </button>
        ))}
      </div>

      {error && <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-[26px] border border-white/60 bg-white shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-navy">Resource Directory</h3>
            <p className="mt-0.5 text-[11px] text-[#8494c2]">
              {loading ? "Loading…" : `${filtered.length} resource${filtered.length !== 1 ? "s" : ""} matching current view`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDirectoryReportOpen(true)}
              disabled={loading || resources.length === 0}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#5a6b98] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" /> Export PDF
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-[0_4px_12px_rgba(85,120,210,0.25)] transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add Resource
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#8494c2]">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-brand" />
            <p className="mt-3 text-sm">Loading resources…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
              <Search className="h-5 w-5 text-brand" />
            </div>
            <p className="mt-3 text-sm font-semibold text-navy">No resources found</p>
            <p className="mt-1 text-xs text-[#8494c2]">{resources.length === 0 ? "No records in the database." : "Try adjusting your filters."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Resource","Type","Location","Capacity","Status","Availability",""].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const Icon = typeIcons[r.type] || Building2;
                  return (
                    <tr key={r.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50/60 last:border-0">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                            <Icon className="h-4 w-4 text-brand" />
                          </span>
                          <div>
                            <p className="font-semibold text-navy">{r.name || "Unnamed"}</p>
                            <p className="text-[10px] text-[#8494c2] font-mono">{(r.id||"").slice(0,16)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1 text-[11px] font-semibold text-[#6677a4]">{r.type || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-1.5 text-xs text-[#6677a4]">
                          <MapPin className="h-3 w-3 shrink-0 text-[#8494c2]" />
                          {formatLocation(r.location)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-navy">{r.capacity || 0}</td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${statusCls[r.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>{r.status || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#8494c2]">{formatAvailability(r.availabilityWindows)}</td>
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => setSelectedResource(r)}
                          className="flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-[11px] font-semibold text-brand transition hover:bg-brand/20"
                        >
                          <Eye className="h-3.5 w-3.5" /> Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                { label:"Status",     value: <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusCls[selectedResource.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>{selectedResource.status||"—"}</span> },
                { label:"Capacity",   value: `${selectedResource.capacity||0} people` },
                { label:"Eq Count",   value: selectedResource.eqCount||0 },
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
              <button
                type="button"
                onClick={() => setReportPreviewResource(selectedResource)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#5a6b98] transition hover:bg-slate-100"
              >
                <Eye className="h-4 w-4" /> Print
              </button>
              <button type="button" disabled={deleting} onClick={() => handleDelete(selectedResource)} className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60">
                <Trash2 className="h-4 w-4" />{deleting ? "Deleting…" : "Delete"}
              </button>
              <button type="button" onClick={() => openEdit(selectedResource)} className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition hover:opacity-90">
                <Pencil className="h-4 w-4" /> Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {directoryReportOpen && (
        <ResourceDirectoryReportPreview resources={resources} onClose={() => setDirectoryReportOpen(false)} />
      )}
      {reportPreviewResource && (
        <ResourceReportPreview resource={reportPreviewResource} onClose={() => setReportPreviewResource(null)} />
      )}

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
                    {["AVAILABLE","BOOKED","MAINTENANCE","UNAVAILABLE"].map((s) => <option key={s}>{s}</option>)}
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
                <p className="mb-3 text-xs font-bold text-navy">Availability Window</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className={labelCls}>Day *</label>
                    <select value={form.day} onChange={(e) => updateForm("day",e.target.value)} required className={inputCls}>
                      {["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"].map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Start Time *</label><input type="time" value={form.startTime} onChange={(e) => updateForm("startTime",e.target.value)} required className={inputCls} /></div>
                  <div><label className={labelCls}>End Time *</label><input type="time" value={form.endTime} min={addMinutes(form.startTime,1)} onChange={(e) => updateForm("endTime",e.target.value)} required className={inputCls} /></div>
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
