import { useState } from 'react';
import ModalShell from '../ui/ModalShell';
import FieldRow from '../ui/FieldRow';
import Btn from '../ui/Btn';
import { uid } from '../../utils/uid';
import { DS } from '../../constants';

function EditTableModal({ table, onClose, onSave, onDelete }) {
  const [name, setName] = useState(table.name);
  const [fields, setFields] = useState(table.fields.map(f => ({ ...f })));
  const addField = () => { const nf = { id: uid(), name: "", type: "varchar", size: "255", isPrimary: false, isForeign: false, nullable: true }; const ts = fields.slice(-2); const h = ts.some(f => f.name === "created_at") && ts.some(f => f.name === "updated_at"); setFields(h ? [...fields.slice(0, -2), nf, ...fields.slice(-2)] : [...fields, nf]); };
  const updateField = (idx, key, val) => { setFields(fields.map((f, i) => { if (i !== idx) return f; const u = { ...f, [key]: val }; if (key === "name") u.isForeign = val.endsWith("_id") && val !== "id"; return u; })); };
  const moveField = (idx, dir) => { const a = [...fields]; const t = idx + dir; if (t < 0 || t >= a.length) return; [a[idx], a[t]] = [a[t], a[idx]]; setFields(a); };
  return (
    <ModalShell title={`✎ Edit — ${table.name}`} onClose={onClose} width={680}>
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}><label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Table Name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 12px", color: "#e2e8f0", fontFamily: "'JetBrains Mono'", fontSize: 13 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Fields ({fields.length})</span><Btn variant="cyan" onClick={addField}>+ Field</Btn></div>
        <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 86px 56px 38px 38px 30px", gap: 4, padding: "0 8px 4px", fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 1 }}><span /><span>Name</span><span>Type</span><span>Size</span><span>PK</span><span>Null</span><span /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {fields.map((f, i) => <FieldRow key={f.id} field={f} index={i} total={fields.length} onChange={updateField} onRemove={idx => setFields(fields.filter((_, j) => j !== idx))} onMove={moveField} canRemove={true} />)}
        </div>
        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between" }}>
          <Btn variant="danger" onClick={() => { onDelete(table.id); onClose(); }}>🗑 Delete Table</Btn>
          <div style={{ display: "flex", gap: 8 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="cyanSolid" onClick={() => { onSave({ ...table, name: name.trim().toLowerCase().replace(/\s+/g, "_"), fields: fields.filter(f => f.name.trim()) }); onClose(); }} style={{ padding: "9px 24px", fontSize: 13 }}>Save Changes</Btn></div>
        </div>
      </div>
    </ModalShell>
  );
}

export default EditTableModal;
