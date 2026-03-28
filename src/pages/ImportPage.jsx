import { useState, useRef } from 'react';
import Btn from '../components/ui/Btn';
import { VERSION, BUILD_DATE, DEVELOPER, SAMPLE_SQL } from '../constants';
import { parseSQL } from '../utils/parseSQL';
import { detectRelations } from '../utils/detectRelations';

function ImportPage({ onParse }) {
  const [sql, setSQL] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [parseInfo, setParseInfo] = useState(null);
  const fileRef = useRef(null);

  const doParse = () => {
    const src = sql || SAMPLE_SQL;
    const t = parseSQL(src);
    const r = detectRelations(t);
    setParseInfo({ lines: src.split("\n").length, chars: src.length, sqlTables: (src.match(/CREATE\s+TABLE/gi) || []).length });
    setPreview({ tables: t, relations: r });
  };

  const loadSample = () => {
    setSQL(SAMPLE_SQL);
    const t = parseSQL(SAMPLE_SQL);
    setParseInfo({ lines: SAMPLE_SQL.split("\n").length, chars: SAMPLE_SQL.length, sqlTables: (SAMPLE_SQL.match(/CREATE\s+TABLE/gi) || []).length });
    setPreview({ tables: t, relations: detectRelations(t) });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#06080f", overflow: "auto" }}>
      {/* Header */}
      <header style={{ padding: "16px 32px", display: "flex", alignItems: "center", borderBottom: "1px solid rgba(52,211,153,.08)", background: "rgba(6,8,15,.95)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#34d399,#10b981)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: 16, color: "#06080f" }}>ER</div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, fontSize: 18 }}>ERD <span style={{ color: "#34d399" }}>Builder</span></div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: -1 }}>v{VERSION}</div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontFamily: "'JetBrains Mono'", fontSize: "clamp(28px,4.5vw,44px)", fontWeight: 700, lineHeight: 1.15, margin: "0 0 12px", background: "linear-gradient(135deg,#e2e8f0 0%,#34d399 60%,#f59e0b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Paste SQL. See Relations.</h1>
          <p style={{ color: "#64748b", fontSize: 16, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>Parse SQL schema, detect FK relations, drag-and-drop ERD, export to 7 formats</p>
        </div>

        {/* Main content */}
        <div style={{ display: "grid", gridTemplateColumns: preview ? "1fr 1fr" : "1fr", gap: 28, maxWidth: preview ? 960 : 640, margin: "0 auto", alignItems: "stretch" }}>
          {/* Left: Input */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setSQL(ev.target.result); r.readAsText(f); } }}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? "#34d399" : "rgba(255,255,255,.1)"}`, borderRadius: 16, padding: "32px 24px", textAlign: "center", cursor: "pointer", marginBottom: 16, background: dragOver ? "rgba(52,211,153,.05)" : "rgba(255,255,255,.02)", transition: "all .3s" }}
            >
              <input ref={fileRef} type="file" accept=".sql,.txt" hidden onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setSQL(ev.target.result); r.readAsText(f); } }} />
              <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
              <p style={{ color: "#94a3b8", fontSize: 14 }}>Drop <code style={{ color: "#34d399", background: "rgba(52,211,153,.1)", padding: "2px 8px", borderRadius: 6 }}>.sql</code> file here or click to browse</p>
            </div>

            {/* SQL editor */}
            <div style={{ background: "#0a0e1a", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.02)" }}>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: "#64748b" }}>schema.sql</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="amber" size="sm" onClick={loadSample}>Load Sample</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => { setSQL(""); setPreview(null); }}>Clear</Btn>
                </div>
              </div>
              <textarea
                value={sql}
                onChange={e => setSQL(e.target.value)}
                placeholder="-- Paste CREATE TABLE statements here..."
                spellCheck={false}
                style={{ width: "100%", minHeight: 220, flex: 1, padding: 16, background: "transparent", border: "none", resize: "vertical", color: "#6ee7b7", fontFamily: "'JetBrains Mono'", fontSize: 13, lineHeight: 1.8, boxSizing: "border-box" }}
              />
            </div>

            {/* Parse button */}
            <button
              onClick={doParse}
              style={{ width: "100%", marginTop: 24, padding: "16px 0", background: "linear-gradient(135deg,#34d399,#10b981)", border: "none", borderRadius: 14, cursor: "pointer", fontFamily: "'JetBrains Mono'", fontWeight: 600, fontSize: 16, color: "#06080f", boxShadow: "0 4px 24px rgba(52,211,153,.25)", transition: "all .15s" }}
            >
              ⚡ Parse & Detect Relations
            </button>
          </div>

          {/* Right: Preview */}
          {!preview ? (
            !preview && <div style={{ display: "none" }} />
          ) : (
            <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, overflow: "hidden" }}>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                {[
                  { l: "Tables", v: preview.tables.length, c: "#34d399" },
                  { l: "Fields", v: preview.tables.reduce((a, t) => a + t.fields.length, 0), c: "#a78bfa" },
                  { l: "Relations", v: preview.relations.length, c: "#f59e0b" },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "16px 20px", borderRight: i < 2 ? "1px solid rgba(255,255,255,.06)" : "none", textAlign: "center" }}>
                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 28, fontWeight: 700, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, textTransform: "uppercase", letterSpacing: 1 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Parse info */}
              {parseInfo && (
                <div style={{ padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "#64748b" }}>{parseInfo.lines.toLocaleString()} lines · {(parseInfo.chars / 1024).toFixed(1)} KB</span>
                  <span style={{ color: preview.tables.length === parseInfo.sqlTables ? "#34d399" : "#f59e0b", fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>
                    {preview.tables.length === parseInfo.sqlTables ? "✓" : "⚠"} {preview.tables.length}/{parseInfo.sqlTables} tables
                  </span>
                </div>
              )}

              {/* Table list */}
              <div style={{ padding: 14, flex: 1, overflowY: "auto" }}>
                {preview.tables.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", borderRadius: 10, marginBottom: 4, background: "rgba(255,255,255,.03)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, fontWeight: 600, background: "rgba(52,211,153,.12)", color: "#34d399", padding: "3px 8px", borderRadius: 6 }}>TBL</span>
                      <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 13 }}>{t.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{t.fields.length} fields</span>
                  </div>
                ))}
              </div>

              {/* Open Canvas button */}
              <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                <button
                  onClick={() => onParse(preview)}
                  style={{ width: "100%", padding: "16px 0", background: "linear-gradient(135deg,#f59e0b,#d97706)", border: "none", borderRadius: 14, cursor: "pointer", fontFamily: "'JetBrains Mono'", fontWeight: 600, fontSize: 16, color: "#06080f", boxShadow: "0 4px 24px rgba(245,158,11,.25)", transition: "all .15s" }}
                >
                  🚀 Open Interactive Canvas
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 56, padding: "16px 0", borderTop: "1px solid rgba(255,255,255,.04)", color: "#334155", fontSize: 12 }}>
          ERD Builder v{VERSION} · {BUILD_DATE} · Developed by {DEVELOPER}
        </div>
      </div>
    </div>
  );
}

export default ImportPage;
