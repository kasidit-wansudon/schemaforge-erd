import { useState } from 'react';
import ModalShell from '../ui/ModalShell';
import Btn from '../ui/Btn';
import { renderERDtoSVG } from '../../utils/renderERDtoSVG';

function ExportImageModal({ tables, relations, onClose }) {
  const [exporting, setExporting] = useState(false); const [format, setFormat] = useState("png");
  const doExport = async () => {
    setExporting(true);
    try {
      const { svg, w, h } = renderERDtoSVG(tables, relations); const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" }); const url = URL.createObjectURL(blob);
      if (format === "svg") { const a = document.createElement("a"); a.href = url; a.download = "schema-erd.svg"; a.click(); URL.revokeObjectURL(url); setExporting(false); return; }
      const img = new Image(); img.onload = async () => {
        const s = 2; const c = document.createElement("canvas"); c.width = w * s; c.height = h * s; const ctx = c.getContext("2d"); ctx.scale(s, s); ctx.drawImage(img, 0, 0, w, h); URL.revokeObjectURL(url);
        if (format === "png") { c.toBlob(bl => { const u = URL.createObjectURL(bl); const a = document.createElement("a"); a.href = u; a.download = "schema-erd.png"; a.click(); URL.revokeObjectURL(u); setExporting(false); }, "image/png"); }
        else if (format === "pdf") {
          const { jsPDF } = await import('jspdf');
          const o = w > h ? "landscape" : "portrait";
          const pdf = new jsPDF({ orientation: o, unit: "px", format: [w + 40, h + 40] });
          pdf.setFillColor(6, 8, 15); pdf.rect(0, 0, w + 40, h + 40, "F");
          pdf.addImage(c.toDataURL("image/png"), "PNG", 20, 20, w, h);
          pdf.save("schema-erd.pdf"); setExporting(false);
        }
      }; img.onerror = () => { setExporting(false); }; img.src = url;
    } catch (e) { alert("Export failed"); setExporting(false); }
  };
  return (
    <ModalShell title="🖼 Export ERD Image" onClose={onClose} width={420}>
      <div style={{ padding: 24 }}>
        <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>Export ERD diagram Full Frame and line relation</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {[{ key: "png", label: "PNG Image", desc: "High-res 2x print/share", icon: "🖼" }, { key: "svg", label: "SVG Vector", desc: "Scalable Figma/Illustrator", icon: "◇" }, { key: "pdf", label: "PDF Document", desc: "Full page ERD เอกสาร", icon: "📄" }].map(o =>
            <div key={o.key} onClick={() => setFormat(o.key)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 10, cursor: "pointer", background: format === o.key ? "rgba(52,211,153,.08)" : "rgba(255,255,255,.02)", border: `1.5px solid ${format === o.key ? "rgba(52,211,153,.4)" : "rgba(255,255,255,.06)"}`, transition: "all .15s" }}>
              <span style={{ fontSize: 24 }}>{o.icon}</span>
              <div><div style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 600, color: format === o.key ? "#34d399" : "#e2e8f0" }}>{o.label}</div><div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{o.desc}</div></div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="amber" onClick={doExport} disabled={exporting} style={{ padding: "10px 28px", fontSize: 13, opacity: exporting ? .6 : 1 }}>{exporting ? "Exporting..." : "↓ Export " + format.toUpperCase()}</Btn></div>
      </div>
    </ModalShell>
  );
}

export default ExportImageModal;
