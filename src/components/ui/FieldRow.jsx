import { FIELD_TYPES, TC, DS } from '../../constants';

const FieldRow = ({ field: f, index: i, total, onChange, onRemove, onMove, canRemove }) => (
  <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 86px 56px 38px 38px 30px", gap: 4, alignItems: "center", padding: "4px 8px", background: "rgba(255,255,255,.02)", borderRadius: 8, border: `1px solid ${f.isPrimary ? "rgba(245,158,11,.12)" : f.isForeign ? "rgba(167,139,250,.12)" : "rgba(255,255,255,.04)"}` }}>
    <div style={{ display: "flex", flexDirection: "column" }}>
      <button onClick={() => onMove(i, -1)} disabled={i === 0} style={{ background: "none", border: "none", color: i === 0 ? "#1e293b" : "#64748b", cursor: "pointer", fontSize: 9, padding: 0, lineHeight: 1 }}>▲</button>
      <button onClick={() => onMove(i, 1)} disabled={i === total - 1} style={{ background: "none", border: "none", color: i === total - 1 ? "#1e293b" : "#64748b", cursor: "pointer", fontSize: 9, padding: 0, lineHeight: 1 }}>▼</button>
    </div>
    <input value={f.name} onChange={e => onChange(i, "name", e.target.value)} placeholder="field_name" style={{ background: "transparent", border: "1px solid rgba(255,255,255,.06)", borderRadius: 6, padding: "5px 8px", color: "#e2e8f0", fontFamily: "'JetBrains Mono'", fontSize: 11, outline: "none" }} />
    <select value={f.type} onChange={e => { onChange(i, "type", e.target.value); onChange(i, "size", DS[e.target.value] || ""); }} style={{ background: "#0a0e1a", border: "1px solid rgba(255,255,255,.06)", borderRadius: 6, padding: "5px 3px", color: TC[f.type] || "#94a3b8", fontFamily: "'JetBrains Mono'", fontSize: 10, cursor: "pointer", outline: "none", minWidth: 0 }}>
      {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
    <input value={f.size || ""} onChange={e => onChange(i, "size", e.target.value)} placeholder="size" style={{ background: "transparent", border: "1px solid rgba(255,255,255,.06)", borderRadius: 6, padding: "4px 5px", color: "#94a3b8", fontFamily: "'JetBrains Mono'", fontSize: 10, outline: "none", width: "100%" }} />
    <div style={{ textAlign: "center" }}><input type="checkbox" checked={f.isPrimary} onChange={e => onChange(i, "isPrimary", e.target.checked)} style={{ accentColor: "#f59e0b" }} title="PK" /></div>
    <div style={{ textAlign: "center" }}><input type="checkbox" checked={f.nullable} onChange={e => onChange(i, "nullable", e.target.checked)} style={{ accentColor: "#64748b" }} title="Null" /></div>
    {canRemove ? <button onClick={() => onRemove(i)} style={{ background: "rgba(239,68,68,.08)", border: "none", color: "#ef4444", borderRadius: 6, cursor: "pointer", fontSize: 12, width: 24, height: 24 }}>×</button> : <div style={{ width: 24 }} />}
  </div>
);

export default FieldRow;
