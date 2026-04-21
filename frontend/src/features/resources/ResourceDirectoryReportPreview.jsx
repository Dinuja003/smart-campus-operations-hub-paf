import { useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  Download,
  FileText,
  MapPin,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import jsPDF from "jspdf";

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

const formatLocation = (location) => {
  if (!location) return "Not assigned";
  if (typeof location === "string") return location;
  return [location.building, location.floor, location.room].filter(Boolean).join(", ") || "Not assigned";
};

const formatAvailability = (windows = []) => {
  if (!Array.isArray(windows) || windows.length === 0) return "Not configured";
  return windows
    .map((windowItem) =>
      [windowItem.day, [windowItem.startTime, windowItem.endTime].filter(Boolean).join(" - ")]
        .filter(Boolean)
        .join(": ")
    )
    .join(", ");
};

const safeFileName = (name) =>
  (name || "resource-directory-report")
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "resource-directory-report";

const titleCaseStatus = (value) => {
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const statusTone = {
  available: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pdfFill: [230, 250, 237],
    pdfText: [18, 128, 61],
  },
  booked: {
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    pdfFill: [235, 245, 255],
    pdfText: [18, 92, 164],
  },
  maintenance: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    pdfFill: [255, 247, 230],
    pdfText: [180, 108, 0],
  },
  unavailable: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    pdfFill: [255, 240, 242],
    pdfText: [190, 24, 93],
  },
  default: {
    badge: "border-slate-200 bg-white text-slate-600",
    pdfFill: [248, 250, 252],
    pdfText: [71, 85, 105],
  },
};

const getStatusTone = (status) => statusTone[String(status || "").toLowerCase()] || statusTone.default;

const drawWrappedText = (pdf, text, x, y, maxWidth, lineHeight = 5, color = [90, 107, 152]) => {
  const lines = pdf.splitTextToSize(String(text || "-"), maxWidth);
  pdf.setTextColor(...color);
  pdf.text(lines, x, y);
  return y + lines.length * lineHeight;
};

const drawMetricCard = (pdf, { x, y, w, h, label, value, fill }) => {
  pdf.setFillColor(...fill);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(x, y, w, h, 4, 4, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(132, 148, 194);
  pdf.text(label.toUpperCase(), x + 4, y + 7);
  pdf.setFontSize(16);
  pdf.setTextColor(28, 44, 91);
  pdf.text(String(value), x + 4, y + 17);
};

const drawResourceCard = (pdf, resource, index, y, pageWidth, margin) => {
  const cardX = margin;
  const cardW = pageWidth - margin * 2;
  const leftColW = 52;
  const contentX = cardX + leftColW + 8;
  const contentW = cardW - leftColW - 14;
  const tone = getStatusTone(resource.status);

  let textY = y + 12;

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(cardX, y, cardW, 52, 5, 5, "FD");

  pdf.setFillColor(239, 244, 255);
  pdf.roundedRect(cardX + 3, y + 3, leftColW, 46, 4, 4, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(132, 148, 194);
  pdf.text("RESOURCE", cardX + 8, y + 12);
  pdf.setFontSize(18);
  pdf.setTextColor(28, 44, 91);
  pdf.text(String(index + 1).padStart(2, "0"), cardX + 8, y + 25);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(90, 107, 152);
  pdf.text("Campus Asset", cardX + 8, y + 34);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(28, 44, 91);
  pdf.text(resource.name || "Unnamed Resource", contentX, textY);

  pdf.setFillColor(...tone.pdfFill);
  pdf.roundedRect(cardX + cardW - 34, y + 7, 26, 8, 4, 4, "F");
  pdf.setFontSize(8);
  pdf.setTextColor(...tone.pdfText);
  pdf.text(titleCaseStatus(resource.status), cardX + cardW - 31, y + 12.3);

  textY += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  textY = drawWrappedText(
    pdf,
    `${resource.type || "-"}  |  ${formatLocation(resource.location)}`,
    contentX,
    textY,
    contentW - 2
  );

  const meta = [
    `Capacity: ${resource.capacity || 0} people`,
    `Eq Count: ${resource.eqCount || 0}`,
    `Created By: ${resource.createdBy || "-"}`,
    `Updated: ${formatDate(resource.updatedAt)}`,
  ];

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(132, 148, 194);
  pdf.text("DETAILS", contentX, y + 30);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(90, 107, 152);
  meta.forEach((item, itemIndex) => {
    const row = Math.floor(itemIndex / 2);
    const col = itemIndex % 2;
    pdf.text(item, contentX + col * (contentW / 2), y + 37 + row * 5);
  });

  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(contentX, y + 42, contentW - 2, 7, 3, 3, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(132, 148, 194);
  pdf.text("AVAILABILITY", contentX + 3, y + 46.8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(28, 44, 91);
  pdf.text(formatAvailability(resource.availabilityWindows), contentX + 25, y + 46.8);

  return y + 60;
};

export default function ResourceDirectoryReportPreview({ resources, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const list = useMemo(() => (Array.isArray(resources) ? resources : []), [resources]);

  const summary = useMemo(() => ({
    total: list.length,
    available: list.filter((resource) => String(resource.status || "").toLowerCase() === "available").length,
    maintenance: list.filter((resource) => String(resource.status || "").toLowerCase().includes("maintenance")).length,
    capacity: list.reduce((sum, resource) => sum + Number(resource.capacity || 0), 0),
  }), [list]);

  if (list.length === 0) return null;

  const handleDownloadPdf = async () => {
    if (downloading) return;

    setDownloading(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const headerHeight = 34;
      const generatedOn = formatDate(new Date().toISOString());
      let y = 18;

      pdf.setFillColor(245, 247, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");
      pdf.setFillColor(17, 33, 78);
      pdf.roundedRect(margin, y, pageWidth - margin * 2, headerHeight, 7, 7, "F");
      pdf.setFillColor(255, 107, 53);
      pdf.circle(pageWidth - 24, y + 10, 8, "F");
      pdf.setFillColor(255, 190, 102);
      pdf.circle(pageWidth - 34, y + 20, 4.5, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(196, 208, 255);
      pdf.text("SMART CAMPUS OPERATIONS HUB", margin + 6, y + 8);
      pdf.setFontSize(20);
      pdf.setTextColor(255, 255, 255);
      pdf.text("Resource Directory Report", margin + 6, y + 19);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(223, 230, 255);
      pdf.text("A snapshot of campus spaces, status, availability, and stewardship.", margin + 6, y + 27);

      y += headerHeight + 8;

      const metricGap = 4;
      const metricW = (pageWidth - margin * 2 - metricGap * 3) / 4;
      const metricY = y;
      [
        { label: "Total Resources", value: summary.total, fill: [255, 255, 255] },
        { label: "Available Now", value: summary.available, fill: [235, 250, 239] },
        { label: "Capacity", value: summary.capacity, fill: [255, 247, 230] },
        { label: "Maintenance", value: summary.maintenance, fill: [239, 244, 255] },
      ].forEach((metric, index) => {
        drawMetricCard(pdf, {
          ...metric,
          x: margin + index * (metricW + metricGap),
          y: metricY,
          w: metricW,
          h: 24,
        });
      });

      y += 32;

      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(margin, y, pageWidth - margin * 2, 14, 5, 5, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(132, 148, 194);
      pdf.text("REPORT INSIGHT", margin + 5, y + 6);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(90, 107, 152);
      pdf.text(
        `Generated on ${generatedOn} for ${summary.total} resources. This document is designed for planning, monitoring, and operational review.`,
        margin + 5,
        y + 11
      );

      y += 22;

      list.forEach((resource, index) => {
        if (y > pageHeight - 72) {
          pdf.addPage();
          pdf.setFillColor(245, 247, 255);
          pdf.rect(0, 0, pageWidth, pageHeight, "F");
          y = 18;
        }

        y = drawResourceCard(pdf, resource, index, y, pageWidth, margin);
      });

      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8);
      pdf.setTextColor(132, 148, 194);
      pdf.text("Generated by UniSlot Resource Operations", margin, pageHeight - 10);

      await pdf.save(`${safeFileName("resource-directory-report")}.pdf`, { returnPromise: true });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-white/50 bg-[#f7f9ff] shadow-[0_36px_100px_rgba(12,22,58,0.30)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative overflow-hidden border-b border-slate-200/80 bg-[#11214e] px-7 py-10 text-white">
          <div className="absolute -left-10 top-4 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-10 top-6 h-20 w-20 rounded-full bg-[#ffbe66]/30 blur-2xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl pr-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#cbd7ff]">Resource Directory Preview</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#e2e9ff]">
                A polished preview of your full campus resource inventory, ready for export and handoff.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-start">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#11214e] shadow-[0_10px_25px_rgba(5,10,30,0.18)] transition hover:-translate-y-0.5 hover:bg-[#fff7f2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {downloading ? "Generating PDF..." : "Download PDF"}
              </button>
              <button type="button" onClick={onClose} className="rounded-2xl border border-white/20 bg-white/10 p-3 text-white transition hover:bg-white/15">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-7 py-7">
          <section className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
            <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_16px_40px_rgba(24,39,87,0.08)]">
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[#ff6b35]/10 blur-3xl" />
              <div className="relative">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#8494c2]">Campus Resource Report</p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight text-[#11214e]">Preview Before Download</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5a6b98]">
                  Review the full report composition before export. The downloadable PDF includes the same resource set with a styled
                  summary page and formatted resource cards.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Total Resources", value: summary.total, icon: Building2, card: "bg-[#eef4ff]" },
                    { label: "Available Now", value: summary.available, icon: ShieldCheck, card: "bg-[#e5f8eb]" },
                    { label: "Capacity", value: summary.capacity, icon: Users, card: "bg-[#fff1cf]" },
                    { label: "Maintenance", value: summary.maintenance, icon: Wrench, card: "bg-[#dde8ff]" },
                  ].map((item) => {
                    const MetricIcon = item.icon;
                    return (
                    <article key={item.label} className={`rounded-2xl border border-slate-100 p-4 shadow-sm ${item.card}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#7f90bf]">{item.label}</p>
                          <p className="mt-2 text-2xl font-bold text-[#11214e]">{item.value}</p>
                        </div>
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-[#11214e] shadow-sm">
                          <MetricIcon className="h-5 w-5" />
                        </span>
                      </div>
                    </article>
                    );
                  })}
                </div>
              </div>
            </div>

            <aside className="grid gap-4">
              <div className="rounded-[28px] border border-[#ffd9ca] bg-[#fff1ea] p-5 shadow-[0_16px_40px_rgba(24,39,87,0.06)]">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#ff6b35]">Generated On</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-[#11214e]">{formatDate(new Date().toISOString())}</p>
                <p className="mt-2 text-sm leading-6 text-[#7c5a48]">Fresh export timestamp for sharing, audits, and review meetings.</p>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(24,39,87,0.06)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#11214e]">
                    <CalendarClock className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#8494c2]">Report Scope</p>
                    <p className="mt-1 text-lg font-bold text-[#11214e]">{list.length} Resources Included</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#5a6b98]">
                  Includes resource identity, status, location, capacity, ownership, and configured availability windows.
                </p>
              </div>
            </aside>
          </section>

          <section className="mt-6 rounded-[30px] border border-white/70 bg-white p-6 shadow-[0_16px_40px_rgba(24,39,87,0.08)]">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#8494c2]">Report Pages</p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#11214e]">Resource Story Cards</h3>
              </div>
              <p className="max-w-xl text-sm leading-6 text-[#5a6b98]">
                Each card is designed to read like a compact briefing sheet so the report feels useful on screen and in print.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              {list.map((resource, index) => {
                const tone = getStatusTone(resource.status);
                return (
                  <article
                    key={resource.id || `${resource.name}-${index}`}
                    className="overflow-hidden rounded-[28px] border border-slate-100 bg-[#f9fbff] shadow-[0_12px_32px_rgba(24,39,87,0.06)]"
                  >
                    <div className="grid gap-0 lg:grid-cols-[210px_1fr]">
                      <div className="flex flex-col justify-between bg-[#eef4ff] p-5">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-[#8494c2]">Resource {index + 1}</p>
                          <h4 className="mt-3 text-2xl font-bold tracking-tight text-[#11214e]">{resource.name || "Unnamed Resource"}</h4>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-sm text-[#5a6b98]">
                          <MapPin className="h-4 w-4 text-[#8494c2]" />
                          <span>{formatLocation(resource.location)}</span>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-[#8494c2]">Profile Snapshot</p>
                            <p className="mt-2 text-sm leading-6 text-[#5a6b98]">
                              {resource.description || "Operational resource prepared for bookings, allocation, and campus coordination."}
                            </p>
                          </div>
                          <span className={`rounded-full border px-4 py-2 text-xs font-bold ${tone.badge}`}>
                            {titleCaseStatus(resource.status)}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          {[
                            { label: "Type", value: resource.type || "-" },
                            { label: "Capacity", value: `${resource.capacity || 0} people` },
                            { label: "Eq Count", value: resource.eqCount || 0 },
                            { label: "Created By", value: resource.createdBy || "-" },
                          ].map(({ label, value }) => (
                            <div key={label} className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">{label}</p>
                              <div className="mt-2 text-sm font-semibold text-[#11214e]">{value}</div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                          <div className="rounded-2xl border border-slate-100 bg-[#f8fbff] px-4 py-4">
                            <div className="flex items-center gap-2 text-[#11214e]">
                              <FileText className="h-4 w-4 text-[#ff6b35]" />
                              <p className="text-sm font-semibold">Availability Windows</p>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-[#5a6b98]">{formatAvailability(resource.availabilityWindows)}</p>
                          </div>

                          <div className="rounded-2xl border border-slate-100 bg-[#fffaf4] px-4 py-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#c88b4b]">Audit Summary</p>
                            <div className="mt-3 space-y-2 text-sm text-[#7c5a48]">
                              <p>Created: {formatDate(resource.createdAt)}</p>
                              <p>Updated: {formatDate(resource.updatedAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
