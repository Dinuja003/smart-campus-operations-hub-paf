import { useState } from "react";
import { Download, FileText, X } from "lucide-react";
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
      resolve(src);
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
        resolve(canvas.toDataURL("image/jpeg", 0.92));
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

const addWrappedText = (pdf, text, x, y, maxWidth, lineHeight = 6) => {
  const lines = pdf.splitTextToSize(text || "-", maxWidth);
  pdf.text(lines, x, y);
  return y + lines.length * lineHeight;
};

const addFieldRow = (pdf, label, value, x, y, width) => {
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(132, 148, 194);
  pdf.setFontSize(10);
  pdf.text(label.toUpperCase(), x, y);

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(28, 44, 91);
  pdf.setFontSize(11);

  const finalY = addWrappedText(pdf, String(value || "-"), x, y + 6, width, 5);
  return finalY + 3;
};

export default function ResourceReportPreview({ resource, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  if (!resource) return null;

  const fields = [
    { label: "Type", value: resource.type || "-" },
    { label: "Status", value: resource.status || "-" },
    { label: "Capacity", value: `${resource.capacity || 0} people` },
    { label: "Equipment Count", value: resource.eqCount || 0 },
    { label: "Location", value: formatLocation(resource.location) },
    { label: "Created By", value: resource.createdBy || "-" },
    { label: "Created", value: formatDate(resource.createdAt) },
    { label: "Updated", value: formatDate(resource.updatedAt) },
  ];

  const availabilityLines = formatWindows(resource.availabilityWindows);

  const handleDownloadPdf = async () => {
    if (downloading) return;

    setDownloading(true);
    setDownloadError("");

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 16;
      const contentWidth = pageWidth - margin * 2;
      let y = 18;

      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(132, 148, 194);
      pdf.setFontSize(10);
      pdf.text("CAMPUS RESOURCE REPORT", margin, y);

      y += 7;
      pdf.setTextColor(28, 44, 91);
      pdf.setFontSize(20);
      pdf.text(resource.name || "Unnamed Resource", margin, y);

      y += 8;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(90, 107, 152);
      y = addWrappedText(pdf, resource.description || "No description provided for this resource.", margin, y, contentWidth, 5);

      y += 3;
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;

      if (resource.imageUrl) {
        try {
          const imageData = await loadImageAsDataUrl(resource.imageUrl);
          const imageHeight = 60;
          pdf.addImage(imageData, "JPEG", margin, y, contentWidth, imageHeight, undefined, "FAST");
          y += imageHeight + 8;
        } catch {
          // Keep PDF download reliable even when the image cannot be embedded.
        }
      }

      const leftX = margin;
      const rightX = margin + contentWidth / 2 + 4;
      const columnWidth = contentWidth / 2 - 4;

      for (let index = 0; index < fields.length; index += 2) {
        const leftField = fields[index];
        const rightField = fields[index + 1];
        const startY = y;

        const leftEndY = addFieldRow(pdf, leftField.label, leftField.value, leftX, startY, columnWidth);
        let rightEndY = startY;

        if (rightField) {
          rightEndY = addFieldRow(pdf, rightField.label, rightField.value, rightX, startY, columnWidth);
        }

        y = Math.max(leftEndY, rightEndY) + 3;

        if (y > pageHeight - 45 && index < fields.length - 2) {
          pdf.addPage();
          y = 20;
        }
      }

      if (y > pageHeight - 55) {
        pdf.addPage();
        y = 20;
      }

      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(margin, y, contentWidth, 28, 3, 3, "S");
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(132, 148, 194);
      pdf.setFontSize(10);
      pdf.text("AVAILABILITY WINDOWS", margin + 4, y + 7);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(255, 107, 53);
      pdf.setFontSize(11);
      const availabilityText = availabilityLines.join("   |   ");
      addWrappedText(pdf, availabilityText, margin + 4, y + 14, contentWidth - 8, 5);

      y += 38;
      if (y > pageHeight - 30) {
        pdf.addPage();
        y = 20;
      }

      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(margin, y, contentWidth, 28, 3, 3, "S");
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(28, 44, 91);
      pdf.setFontSize(11);
      pdf.text("Report Summary", margin + 4, y + 8);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(90, 107, 152);
      pdf.setFontSize(10);
      addWrappedText(
        pdf,
        "This report contains the current resource profile, operational status, location details, availability windows, and audit timestamps for campus administration use.",
        margin + 4,
        y + 15,
        contentWidth - 8,
        5
      );

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[26px] bg-white shadow-[0_30px_80px_rgba(21,32,85,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Resource Report Preview</p>
            <p className="mt-0.5 text-lg font-bold text-navy">{resource.name || "Unnamed Resource"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-[#8494c2] transition-colors hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-slate-50/60 px-6 py-6">
          {downloadError && (
            <div className="mx-auto mb-4 w-full max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {downloadError}
            </div>
          )}

          <div className="mx-auto w-full max-w-3xl rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Campus Resource Report</p>
                <h2 className="mt-1 text-2xl font-bold text-navy">{resource.name || "Unnamed Resource"}</h2>
                <p className="mt-2 max-w-2xl text-sm text-[#6677a4]">
                  {resource.description || "No description provided for this resource."}
                </p>
              </div>
              <div className="rounded-2xl border border-brand/20 bg-brand/8 px-4 py-3 text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Generated On</p>
                <p className="mt-1 text-sm font-semibold text-brand">{formatDate(new Date().toISOString())}</p>
              </div>
            </div>

            {resource.imageUrl && (
              <img src={resource.imageUrl} alt={resource.name} className="mt-5 h-64 w-full rounded-[22px] object-cover" />
            )}

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {fields.map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">{label}</p>
                  <div className="mt-2 text-sm font-semibold text-navy">
                    {label === "Status" ? (
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                          statusCls[resource.status] || "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {value}
                      </span>
                    ) : (
                      value
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Availability Windows</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {availabilityLines.map((windowText) => (
                  <span key={windowText} className="rounded-lg border border-brand/20 bg-brand/8 px-3 py-1.5 text-xs font-semibold text-brand">
                    {windowText}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-white px-4 py-4">
              <div className="flex items-center gap-2 text-navy">
                <FileText className="h-4 w-4 text-brand" />
                <p className="text-sm font-semibold">Report Summary</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#5a6b98]">
                This report contains the current resource profile, operational status, location details, availability
                windows, and audit timestamps for campus administration use.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-[#5a6b98] transition hover:bg-slate-100"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Generating PDF..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
