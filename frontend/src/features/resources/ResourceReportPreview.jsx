import { useMemo, useState } from "react";
import { CalendarClock, Download, FileText, MapPin, ShieldCheck, Users, Wrench, X } from "lucide-react";
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

const formatWindows = (windows = []) => {
  if (!Array.isArray(windows) || windows.length === 0) return ["No availability windows configured."];
  return windows.map((windowItem) =>
    [windowItem.day, [windowItem.startTime, windowItem.endTime].filter(Boolean).join(" - ")]
      .filter(Boolean)
      .join(": ")
  );
};

const titleCaseStatus = (value) => {
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const statusCls = {
  AVAILABLE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  BOOKED: "bg-[#001d45]/10 text-[#001d45] border-[#001d45]/20",
  Booked: "bg-[#001d45]/10 text-[#001d45] border-[#001d45]/20",
  MAINTENANCE: "bg-brand/10 text-brand border-brand/20",
  Maintenance: "bg-brand/10 text-brand border-brand/20",
  UNAVAILABLE: "bg-red-100 text-red-600 border-red-200",
  Unavailable: "bg-red-100 text-red-600 border-red-200",
};

const statusPdfTone = {
  available: { fill: [230, 250, 237], text: [18, 128, 61] },
  booked: { fill: [235, 245, 255], text: [18, 92, 164] },
  maintenance: { fill: [255, 247, 230], text: [180, 108, 0] },
  unavailable: { fill: [255, 240, 242], text: [190, 24, 93] },
  default: { fill: [248, 250, 252], text: [71, 85, 105] },
};

const safeFileName = (name) =>
  (name || "resource-report")
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "resource-report";

const loadImageAsDataUrl = (src) =>
  new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error("No image source"));
      return;
    }

    if (src.startsWith("data:")) {
      const image = new Image();
      image.onload = () => resolve({
        dataUrl: src,
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
      image.onerror = () => reject(new Error("Unable to load image."));
      image.src = src;
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Unable to create image canvas."));
          return;
        }

        context.drawImage(image, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/jpeg", 0.92),
          width: image.naturalWidth || image.width,
          height: image.naturalHeight || image.height,
        });
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("Unable to load image."));
    image.src = src;
  });

const triggerBlobDownload = (pdf, fileName) => {
  const pdfBlob = pdf.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 1500);
};

const addWrappedText = (pdf, text, x, y, maxWidth, lineHeight = 5, color = [90, 107, 152]) => {
  const lines = pdf.splitTextToSize(String(text || "-"), maxWidth);
  pdf.setTextColor(...color);
  pdf.text(lines, x, y);
  return y + lines.length * lineHeight;
};

const drawInfoCard = (pdf, { x, y, w, h, label, value, fill }) => {
  pdf.setFillColor(...fill);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(x, y, w, h, 4, 4, "FD");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(132, 148, 194);
  pdf.text(label.toUpperCase(), x + 4, y + 7);
  pdf.setFontSize(9.5);
  pdf.setTextColor(28, 44, 91);
  addWrappedText(pdf, value, x + 4, y + 13, w - 8, 3.8, [28, 44, 91]);
};

export default function ResourceReportPreview({ resource, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const availabilityLines = useMemo(() => formatWindows(resource?.availabilityWindows), [resource]);

  const fields = useMemo(() => ([
    { label: "Type", value: resource?.type || "-" },
    { label: "Status", value: titleCaseStatus(resource?.status) },
    { label: "Capacity", value: `${resource?.capacity || 0} people` },
    { label: "Equipment Count", value: resource?.eqCount || 0 },
    { label: "Location", value: formatLocation(resource?.location) },
    { label: "Created By", value: resource?.createdBy || "-" },
    { label: "Created", value: formatDate(resource?.createdAt) },
    { label: "Updated", value: formatDate(resource?.updatedAt) },
  ]), [resource]);

  if (!resource) return null;

  const handleDownloadPdf = async () => {
    if (downloading) return;

    setDownloading(true);
    setDownloadError("");

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const contentWidth = pageWidth - margin * 2;
      const statusTone = statusPdfTone[String(resource.status || "").toLowerCase()] || statusPdfTone.default;
      let y = 14;

      pdf.setFillColor(246, 248, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      pdf.setFillColor(17, 33, 78);
      pdf.roundedRect(margin, y, contentWidth, 28, 7, 7, "F");
      pdf.setFillColor(255, 107, 53);
      pdf.circle(pageWidth - 24, y + 10, 8, "F");
      pdf.setFillColor(255, 190, 102);
      pdf.circle(pageWidth - 34, y + 18, 4.5, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(203, 215, 255);
      pdf.text("CAMPUS RESOURCE REPORT", margin + 6, y + 8);
      pdf.setFontSize(17);
      pdf.setTextColor(255, 255, 255);
      pdf.text(resource.name || "Unnamed Resource", margin + 6, y + 16);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(226, 233, 255);
      addWrappedText(
        pdf,
        resource.description || "No description provided for this resource.",
        margin + 6,
        y + 22,
        contentWidth - 18,
        3.8,
        [226, 233, 255]
      );

      pdf.setFillColor(...statusTone.fill);
      pdf.roundedRect(pageWidth - 50, y + 5, 24, 8, 4, 4, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(...statusTone.text);
      pdf.text(titleCaseStatus(resource.status), pageWidth - 46.5, y + 10.5);

      y += 34;

      const metricGap = 4;
      const metricW = (contentWidth - metricGap) / 2;
      drawInfoCard(pdf, { x: margin, y, w: metricW, h: 18, label: "Location", value: formatLocation(resource.location), fill: [255, 255, 255] });
      drawInfoCard(pdf, { x: margin + metricW + metricGap, y, w: metricW, h: 18, label: "Generated", value: formatDate(new Date().toISOString()), fill: [255, 244, 238] });

      y += 24;

      if (resource.imageUrl) {
        try {
          const imageAsset = await loadImageAsDataUrl(resource.imageUrl);
          const frameHeight = 48;
          const frameY = y;
          const imageRatio = imageAsset.width / imageAsset.height;
          let renderWidth = contentWidth - 8;
          let renderHeight = renderWidth / imageRatio;

          if (renderHeight > frameHeight - 8) {
            renderHeight = frameHeight - 8;
            renderWidth = renderHeight * imageRatio;
          }

          const imageX = margin + (contentWidth - renderWidth) / 2;
          const imageY = frameY + (frameHeight - renderHeight) / 2;

          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(226, 232, 240);
          pdf.roundedRect(margin, frameY, contentWidth, frameHeight, 5, 5, "FD");
          pdf.addImage(imageAsset.dataUrl, "JPEG", imageX, imageY, renderWidth, renderHeight, undefined, "FAST");
          y += frameHeight + 6;
        } catch {
          // Keep export resilient if image embedding fails.
        }
      }

      const cardGap = 3;
      const cardW = (contentWidth - cardGap * 3) / 4;
      for (let index = 0; index < fields.length; index += 4) {
        if (y > pageHeight - 52) {
          pdf.addPage();
          pdf.setFillColor(246, 248, 255);
          pdf.rect(0, 0, pageWidth, pageHeight, "F");
          y = 18;
        }

        for (let offset = 0; offset < 4; offset += 1) {
          const field = fields[index + offset];
          if (!field) continue;
          drawInfoCard(pdf, {
            x: margin + offset * (cardW + cardGap),
            y,
            w: cardW,
            h: 18,
            label: field.label,
            value: String(field.value),
            fill: [255, 255, 255],
          });
        }

        y += 23;
      }

      if (y > pageHeight - 45) {
        pdf.addPage();
        pdf.setFillColor(246, 248, 255);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");
        y = 18;
      }

      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(margin, y, contentWidth, 20, 5, 5, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.setTextColor(132, 148, 194);
      pdf.text("AVAILABILITY WINDOWS", margin + 4, y + 7);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      addWrappedText(pdf, availabilityLines.join("   |   "), margin + 4, y + 13, contentWidth - 8, 3.8, [255, 107, 53]);

      y += 26;

      pdf.setFillColor(255, 250, 244);
      pdf.setDrawColor(255, 221, 204);
      pdf.roundedRect(margin, y, contentWidth, 18, 5, 5, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(28, 44, 91);
      pdf.text("Report Summary", margin + 4, y + 8);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      addWrappedText(
        pdf,
        "This report captures the current profile, status, location details, capacity metrics, availability windows, and audit timestamps for operational decision-making.",
        margin + 4,
        y + 13,
        contentWidth - 8,
        3.8,
        [90, 107, 152]
      );

      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8);
      pdf.setTextColor(132, 148, 194);
      pdf.text("Generated by UniSlot Resource Operations", margin, pageHeight - 10);

      const fileName = `${safeFileName(resource.name)}.pdf`;

      try {
        await pdf.save(fileName, { returnPromise: true });
      } catch {
        triggerBlobDownload(pdf, fileName);
      }
    } catch (error) {
      console.error("Resource PDF download failed:", error);
      setDownloadError("Unable to generate the PDF file right now. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] border border-white/60 bg-[#f7f9ff] shadow-[0_36px_100px_rgba(12,22,58,0.30)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-[#11214e] px-6 py-5 text-white">
          <div className="absolute -left-8 top-4 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-10 top-4 h-20 w-20 rounded-full bg-[#ffbe66]/30 blur-2xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#cbd7ff]">Resource Report Preview</p>
              <h2 className="mt-1.5 text-3xl font-bold tracking-tight text-white">{resource.name || "Unnamed Resource"}</h2>
            </div>
            <div className="flex items-center gap-2 self-start">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#11214e] shadow-[0_10px_25px_rgba(5,10,30,0.18)] transition hover:-translate-y-0.5 hover:bg-[#fff7f2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {downloading ? "Generating PDF..." : "Download PDF"}
              </button>
              <button type="button" onClick={onClose} className="rounded-2xl border border-white/20 bg-white/10 p-2.5 text-white transition hover:bg-white/15">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {downloadError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {downloadError}
            </div>
          )}

          <section className="grid gap-3 lg:grid-cols-[1.25fr_0.85fr]">
            <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_16px_40px_rgba(24,39,87,0.08)]">
              {resource.imageUrl ? (
                <div className="bg-[linear-gradient(135deg,#eef4ff_0%,#fff7f2_100%)] p-3">
                  <div className="overflow-hidden rounded-[20px] border border-white/70 bg-white shadow-[0_12px_30px_rgba(24,39,87,0.10)]">
                    <img src={resource.imageUrl} alt={resource.name} className="h-56 w-full object-cover" />
                  </div>
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center bg-[linear-gradient(135deg,#11214e_0%,#20306d_60%,#ff6b35_170%)]">
                  <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4 text-center text-white backdrop-blur-sm">
                    <FileText className="mx-auto h-7 w-7" />
                    <p className="mt-2 text-base font-semibold">No resource image available</p>
                  </div>
                </div>
              )}
              <div className="border-t border-slate-100 bg-white px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#8494c2]">Campus Resource Report</p>
                    <p className="mt-1.5 text-xl font-bold tracking-tight text-[#11214e]">Visual Preview Sheet</p>
                  </div>
                  <span className={`rounded-full border px-4 py-2 text-xs font-bold ${statusCls[resource.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {titleCaseStatus(resource.status)}
                  </span>
                </div>
              </div>
            </div>

            <aside className="grid gap-3">
              <div className="rounded-[24px] border border-[#ffd9ca] bg-[#fff1ea] p-4 shadow-[0_16px_40px_rgba(24,39,87,0.06)]">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#ff6b35]">Generated On</p>
                <p className="mt-2 text-[2rem] font-bold tracking-tight text-[#11214e]">{formatDate(new Date().toISOString())}</p>
                <p className="mt-5 text-sm leading-6 text-[#7c5a48]">Designed for fast sharing, reporting, and administrative review.</p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(24,39,87,0.06)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#11214e]">
                    <MapPin className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#8494c2]">Location</p>
                    <p className="mt-1 text-base font-bold text-[#11214e]">{formatLocation(resource.location)}</p>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          <section className="mt-5 rounded-[26px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(24,39,87,0.08)]">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#8494c2]">Resource Profile</p>
                <h3 className="mt-1.5 text-xl font-bold tracking-tight text-[#11214e]">Operational Snapshot</h3>
              </div>
              <p className="max-w-xl text-sm leading-6 text-[#5a6b98]">
                A compact single-page briefing of the resource identity, condition, location, availability, and audit trail.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Type", value: resource.type || "-", icon: FileText, card: "bg-[#eef4ff]" },
                { label: "Capacity", value: `${resource.capacity || 0} people`, icon: Users, card: "bg-[#fff1cf]" },
                { label: "Eq Count", value: resource.eqCount || 0, icon: Wrench, card: "bg-[#f5f7ff]" },
                { label: "Created By", value: resource.createdBy || "-", icon: ShieldCheck, card: "bg-[#e5f8eb]" },
              ].map((item) => {
                const MetricIcon = item.icon;
                return (
                  <article key={item.label} className={`rounded-2xl border border-slate-100 p-3.5 shadow-sm ${item.card}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#7f90bf]">{item.label}</p>
                        <p className="mt-1.5 text-lg font-bold text-[#11214e]">{item.value}</p>
                      </div>
                      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/80 text-[#11214e] shadow-sm">
                        <MetricIcon className="h-4.5 w-4.5" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[22px] border border-slate-100 bg-[#f8fbff] p-4">
                <div className="flex items-center gap-2 text-[#11214e]">
                  <CalendarClock className="h-4 w-4 text-[#ff6b35]" />
                  <p className="text-sm font-semibold">Availability Windows</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {availabilityLines.map((windowText) => (
                    <span key={windowText} className="rounded-full border border-[#ffd9ca] bg-white px-3 py-1 text-xs font-semibold text-[#ff6b35]">
                      {windowText}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] border border-slate-100 bg-[#fffaf4] p-4">
                <div className="flex items-center gap-2 text-[#11214e]">
                  <FileText className="h-4 w-4 text-[#ff6b35]" />
                  <p className="text-sm font-semibold">Audit Summary</p>
                </div>
                <div className="mt-3 space-y-1.5 text-sm text-[#7c5a48]">
                  <p>Created: {formatDate(resource.createdAt)}</p>
                  <p>Updated: {formatDate(resource.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-slate-100 bg-white px-4 py-4">
              <div className="flex items-center gap-2 text-[#11214e]">
                <FileText className="h-4 w-4 text-[#ff6b35]" />
                <p className="text-sm font-semibold">Report Summary</p>
              </div>
              <p className="mt-2.5 text-sm leading-6 text-[#5a6b98]">
                This report brings together the resource identity, operational status, capacity, location, availability windows, and
                audit metadata in a presentation-friendly format for campus operations.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
