import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Eye,
  Filter,
  MapPin,
  Monitor,
  Search,
  Users,
  Wrench,
  X,
} from "lucide-react";

const API = axios.create({ baseURL: "/api" });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const getAllResources = () => API.get("/resources").then((response) => response.data);

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const formatLocation = (location) => {
  if (!location) return "Not assigned";
  if (typeof location === "string") return location;

  return [location.building, location.floor, location.room].filter(Boolean).join(", ") || "Not assigned";
};

const formatDate = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
};

const formatAvailability = (windows = []) => {
  if (!Array.isArray(windows) || windows.length === 0) return "Not configured";

  return windows
    .map((window) =>
      [window.day, [window.startTime, window.endTime].filter(Boolean).join(" - ")]
        .filter(Boolean)
        .join(": ")
    )
    .join(", ");
};

const statusStyles = {
  Available: {
    color: "#047857",
    background: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  AVAILABLE: {
    color: "#047857",
    background: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  Booked: {
    color: "#1d4ed8",
    background: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  BOOKED: {
    color: "#1d4ed8",
    background: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  Maintenance: {
    color: "#b45309",
    background: "#fffbeb",
    borderColor: "#fde68a",
  },
  MAINTENANCE: {
    color: "#b45309",
    background: "#fffbeb",
    borderColor: "#fde68a",
  },
  Unavailable: {
    color: "#be123c",
    background: "#fff1f2",
    borderColor: "#fecdd3",
  },
  UNAVAILABLE: {
    color: "#be123c",
    background: "#fff1f2",
    borderColor: "#fecdd3",
  },
};

const typeIcons = {
  "Lecture Hall": Building2,
  HALL: Building2,
  Hall: Building2,
  "Meeting Room": Users,
  ROOM: Users,
  Room: Users,
  "Computer Lab": Monitor,
  LAB: Monitor,
  Lab: Monitor,
  "Seminar Room": CalendarClock,
  Auditorium: Building2,
  AUDITORIUM: Building2,
};

const defaultStatusStyle = {
  color: "#475569",
  background: "#f8fafc",
  borderColor: "#cbd5e1",
};

export default function AdminResourcesInterface() {
  const [resources, setResources] = useState([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedResource, setSelectedResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getAllResources()
      .then((result) => {
        if (active) setResources(toArray(result));
      })
      .catch((requestError) => {
        if (!active) return;
        setResources([]);
        setError(
          requestError?.response?.data?.message ||
            requestError?.message ||
            "Unable to load resources from the database."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const resourceTypes = useMemo(
    () => ["All Types", ...new Set(resources.map((resource) => resource.type).filter(Boolean))],
    [resources]
  );

  const resourceStatuses = useMemo(
    () => ["All Status", ...new Set(resources.map((resource) => resource.status).filter(Boolean))],
    [resources]
  );

  const filteredResources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return resources.filter((resource) => {
      const location = formatLocation(resource.location);
      const matchesQuery =
        !normalizedQuery ||
        [
          resource.name,
          resource.id,
          resource.type,
          resource.status,
          resource.createdBy,
          location,
          resource.description,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesType = typeFilter === "All Types" || resource.type === typeFilter;
      const matchesStatus = statusFilter === "All Status" || resource.status === statusFilter;

      return matchesQuery && matchesType && matchesStatus;
    });
  }, [query, resources, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const totalCapacity = resources.reduce((sum, resource) => sum + Number(resource.capacity || 0), 0);
    const available = resources.filter((resource) =>
      String(resource.status || "").toLowerCase().includes("available")
    ).length;
    const maintenance = resources.filter((resource) =>
      String(resource.status || "").toLowerCase().includes("maintenance")
    ).length;
    const equipmentCount = resources.reduce((sum, resource) => sum + Number(resource.eqCount || 0), 0);

    return { totalCapacity, available, maintenance, equipmentCount };
  }, [resources]);

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroCopy}>
          <span style={styles.eyebrow}>Resource Operations</span>
          <h2 style={styles.title}>Admin Resource Control Center</h2>
          <p style={styles.subtitle}>
            Live resource records from your database, with capacity, location, availability, and
            operational status in one organized workspace.
          </p>
        </div>

        <div style={styles.heroPanel}>
          <div style={styles.heroMetric}>
            <span style={styles.heroMetricValue}>{resources.length}</span>
            <span style={styles.heroMetricLabel}>Database records</span>
          </div>
          <div style={styles.heroMetricDivider} />
          <div style={styles.heroMetric}>
            <span style={styles.heroMetricValue}>{stats.equipmentCount}</span>
            <span style={styles.heroMetricLabel}>Equipment count</span>
          </div>
        </div>
      </section>

      <section style={styles.statsGrid} aria-label="Resource summary">
        <SummaryCard icon={<Building2 size={20} />} label="Total Resources" value={resources.length} tone="#155e75" />
        <SummaryCard icon={<CheckCircle2 size={20} />} label="Available Now" value={stats.available} tone="#047857" />
        <SummaryCard icon={<Users size={20} />} label="Total Capacity" value={stats.totalCapacity} tone="#4338ca" />
        <SummaryCard icon={<Wrench size={20} />} label="Maintenance" value={stats.maintenance} tone="#b45309" />
      </section>

      <section style={styles.toolbar}>
        <label style={styles.searchBox}>
          <Search size={18} color="#64748b" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, ID, type, location, creator..."
            style={styles.searchInput}
          />
        </label>

        <div style={styles.filterGroup}>
          <Filter size={17} color="#475569" />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            style={styles.select}
          >
            {resourceTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={styles.select}
          >
            {resourceStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
      </section>

      {error && <div style={styles.errorBox}>{error}</div>}

      <section style={styles.tableShell}>
        <div style={styles.tableHeader}>
          <div>
            <h3 style={styles.tableTitle}>Resource Directory</h3>
            <p style={styles.tableSubtitle}>
              {loading ? "Loading database resources..." : `${filteredResources.length} resources matching current view`}
            </p>
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyState}>
            <div style={styles.spinner} />
            <h3 style={styles.emptyTitle}>Loading resources</h3>
            <p style={styles.emptyText}>Reading records from your backend API.</p>
          </div>
        ) : (
        <div style={styles.tableScroller}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Resource</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>Capacity</th>
                <th style={styles.th}>Eq Count</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Availability</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((resource) => {
                const Icon = typeIcons[resource.type] || Building2;

                return (
                  <tr key={resource.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.resourceCell}>
                        <div style={styles.resourceIcon}>
                          <Icon size={20} />
                        </div>
                          <div>
                          <strong style={styles.resourceName}>{resource.name || "Unnamed Resource"}</strong>
                          <span style={styles.resourceId}>{resource.id || "No ID"}</span>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.typeBadge}>{resource.type || "Not set"}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.locationText}>
                        <MapPin size={14} />
                        {formatLocation(resource.location)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.capacityText}>{resource.capacity || 0}</span>
                    </td>
                    <td style={styles.td}>{resource.eqCount || 0}</td>
                    <td style={styles.td}>
                      <StatusBadge status={resource.status || "Not set"} />
                    </td>
                    <td style={styles.td}>{formatAvailability(resource.availabilityWindows)}</td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <button
                        style={styles.viewButton}
                        type="button"
                        onClick={() => setSelectedResource(resource)}
                      >
                        <Eye size={16} />
                        View details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}

        {!loading && filteredResources.length === 0 && (
          <div style={styles.emptyState}>
            <Search size={28} />
            <h3 style={styles.emptyTitle}>No resources found</h3>
            <p style={styles.emptyText}>
              {resources.length === 0
                ? "Your database did not return any resource records."
                : "Try another keyword or clear one of the selected filters."}
            </p>
          </div>
        )}
      </section>

      {selectedResource && (
        <ResourceDetailsModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }) {
  return (
    <article style={styles.summaryCard}>
      <div style={{ ...styles.summaryIcon, color: tone, background: `${tone}14` }}>
        {icon}
      </div>
      <div>
        <span style={styles.summaryLabel}>{label}</span>
        <strong style={styles.summaryValue}>{value}</strong>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  return <span style={{ ...styles.statusBadge, ...(statusStyles[status] || defaultStatusStyle) }}>{status}</span>;
}

function ResourceDetailsModal({ resource, onClose }) {
  const availabilityWindows = Array.isArray(resource.availabilityWindows) ? resource.availabilityWindows : [];

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <section style={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <span style={styles.resourceId}>{resource.id}</span>
            <h3 style={styles.modalTitle}>{resource.name || "Unnamed Resource"}</h3>
          </div>
          <button type="button" style={styles.closeButton} onClick={onClose} aria-label="Close details">
            <X size={20} />
          </button>
        </div>

        {resource.imageUrl && <img src={resource.imageUrl} alt={resource.name} style={styles.modalImage} />}

        <p style={styles.modalDescription}>
          {resource.description || "No description has been added for this resource."}
        </p>

        <div style={styles.detailGrid}>
          <DetailItem label="Type" value={resource.type || "Not set"} />
          <DetailItem label="Status" value={<StatusBadge status={resource.status || "Not set"} />} />
          <DetailItem label="Capacity" value={`${resource.capacity || 0} people`} />
          <DetailItem label="Equipment Count" value={resource.eqCount || 0} />
          <DetailItem label="Location" value={formatLocation(resource.location)} />
          <DetailItem label="Created By" value={resource.createdBy || "Not recorded"} />
          <DetailItem label="Created At" value={formatDate(resource.createdAt)} />
          <DetailItem label="Updated At" value={formatDate(resource.updatedAt)} />
        </div>

        <div style={styles.equipmentSection}>
          <h4 style={styles.sectionTitle}>Availability Windows</h4>
          {availabilityWindows.length > 0 ? (
            <div style={styles.equipmentList}>
              {availabilityWindows.map((window, index) => (
                <span key={`${window.day}-${window.startTime}-${index}`} style={styles.equipmentTag}>
                  {[window.day, [window.startTime, window.endTime].filter(Boolean).join(" - ")]
                    .filter(Boolean)
                    .join(": ")}
                </span>
              ))}
            </div>
          ) : (
            <p style={styles.emptyText}>No availability windows configured.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailLabel}>{label}</span>
      <strong style={styles.detailValue}>{value}</strong>
    </div>
  );
}

const styles = {
  page: {
    display: "grid",
    gap: 24,
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    gap: 24,
    padding: 24,
    borderRadius: 8,
    background:
      "linear-gradient(135deg, rgba(15, 118, 110, 0.1), rgba(37, 99, 235, 0.1)), #f8fafc",
    border: "1px solid #e2e8f0",
  },
  heroCopy: {
    maxWidth: 680,
  },
  eyebrow: {
    display: "inline-flex",
    marginBottom: 10,
    color: "#0f766e",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: 34,
    fontWeight: 800,
    lineHeight: 1.12,
    letterSpacing: 0,
  },
  subtitle: {
    marginTop: 10,
    color: "#475569",
    fontSize: 15,
    lineHeight: 1.6,
  },
  heroPanel: {
    minWidth: 230,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    padding: 18,
    borderRadius: 8,
    background: "rgba(255, 255, 255, 0.76)",
    border: "1px solid rgba(148, 163, 184, 0.28)",
  },
  heroMetric: {
    display: "grid",
    gap: 4,
    textAlign: "center",
  },
  heroMetricValue: {
    color: "#0f172a",
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1,
  },
  heroMetricLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: 600,
  },
  heroMetricDivider: {
    width: 1,
    height: 54,
    background: "#cbd5e1",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  summaryCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 18,
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#ffffff",
  },
  summaryIcon: {
    width: 42,
    height: 42,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  summaryLabel: {
    display: "block",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
  },
  summaryValue: {
    display: "block",
    color: "#0f172a",
    fontSize: 24,
    lineHeight: 1.1,
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  },
  searchBox: {
    flex: "1 1 360px",
    minHeight: 46,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 14px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#ffffff",
  },
  searchInput: {
    width: "100%",
    border: 0,
    outline: 0,
    color: "#0f172a",
    background: "transparent",
    font: "inherit",
    fontSize: 14,
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  select: {
    height: 46,
    minWidth: 148,
    padding: "0 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#ffffff",
    color: "#334155",
    fontWeight: 700,
    outline: 0,
  },
  errorBox: {
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#991b1b",
    fontWeight: 700,
  },
  tableShell: {
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    background: "#ffffff",
    overflow: "hidden",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    padding: "18px 20px",
    borderBottom: "1px solid #e2e8f0",
  },
  tableTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: 18,
    fontWeight: 800,
  },
  tableSubtitle: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 13,
  },
  tableScroller: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: 1080,
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    padding: "14px 18px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: "uppercase",
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  tr: {
    borderTop: "1px solid #edf2f7",
  },
  td: {
    padding: "16px 18px",
    color: "#334155",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  resourceCell: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  resourceIcon: {
    width: 42,
    height: 42,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    background: "#f1f5f9",
    color: "#155e75",
  },
  resourceName: {
    display: "block",
    color: "#0f172a",
    fontSize: 14,
  },
  resourceId: {
    display: "block",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
  },
  typeBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 8,
    color: "#334155",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    fontWeight: 700,
    fontSize: 12,
  },
  locationText: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    maxWidth: 260,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  capacityText: {
    fontWeight: 800,
    color: "#0f172a",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid",
    fontSize: 12,
    fontWeight: 800,
  },
  viewButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 36,
    padding: "0 12px",
    border: "1px solid #0f766e",
    borderRadius: 8,
    background: "#0f766e",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
  },
  emptyState: {
    display: "grid",
    placeItems: "center",
    gap: 8,
    padding: 48,
    color: "#64748b",
    textAlign: "center",
    borderTop: "1px solid #e2e8f0",
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "3px solid #dbeafe",
    borderTopColor: "#2563eb",
  },
  emptyTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: 18,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "rgba(15, 23, 42, 0.56)",
    backdropFilter: "blur(8px)",
  },
  modal: {
    width: "min(720px, 100%)",
    maxHeight: "88vh",
    overflowY: "auto",
    borderRadius: 8,
    background: "#ffffff",
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    padding: 24,
    borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: {
    margin: "4px 0 0",
    color: "#0f172a",
    fontSize: 24,
    fontWeight: 800,
  },
  closeButton: {
    width: 38,
    height: 38,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    background: "#ffffff",
    color: "#475569",
    cursor: "pointer",
  },
  modalDescription: {
    padding: "20px 24px 0",
    color: "#475569",
    lineHeight: 1.6,
  },
  modalImage: {
    width: "100%",
    maxHeight: 260,
    objectFit: "cover",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: 12,
    padding: 24,
  },
  detailItem: {
    display: "grid",
    gap: 5,
    padding: 14,
    borderRadius: 8,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  detailLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: 800,
  },
  detailValue: {
    color: "#0f172a",
    fontSize: 14,
  },
  equipmentSection: {
    padding: "0 24px 24px",
  },
  sectionTitle: {
    margin: "0 0 12px",
    color: "#0f172a",
    fontSize: 16,
  },
  equipmentList: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  equipmentTag: {
    padding: "8px 10px",
    borderRadius: 8,
    background: "#ecfeff",
    color: "#155e75",
    border: "1px solid #a5f3fc",
    fontSize: 12,
    fontWeight: 800,
  },
};
