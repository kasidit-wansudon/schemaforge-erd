import { useState } from 'react';
import ModalShell from '../ui/ModalShell';
import Btn from '../ui/Btn';
import { uid } from '../../utils/uid';

const VIEW_TYPES = [
  { key: 'page', label: 'Page', icon: '📄', color: '#22d3ee' },
  { key: 'component', label: 'Component', icon: '🧩', color: '#a78bfa' },
  { key: 'api', label: 'API Response', icon: '{ }', color: '#34d399' },
  { key: 'email', label: 'Email Template', icon: '✉', color: '#fb923c' },
];

function ViewModal({ view: edit, onClose, onSave, onDelete }) {
  const isEdit = !!edit;
  const [name, setName] = useState(edit?.name || '');
  const [type, setType] = useState(edit?.type || 'page');
  const [route, setRoute] = useState(edit?.route || '');
  const [description, setDescription] = useState(edit?.description || '');
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim()) { setError('View name is required'); return; }
    onSave({
      id: edit?.id || uid(),
      name: name.trim(), type, route: route.trim(), description,
      x: edit?.x ?? 600, y: edit?.y ?? 200,
    });
    onClose();
  };

  return (
    <ModalShell title={isEdit ? `✎ Edit View` : `+ New View`} onClose={onClose} width={520}>
      <div style={{ padding: 20 }}>
        {/* Type */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
          {VIEW_TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)}
              style={{ padding: "10px 6px", borderRadius: 10, border: type === t.key ? `2px solid ${t.color}` : "1px solid rgba(255,255,255,.08)", background: type === t.key ? `${t.color}15` : "rgba(255,255,255,.02)", color: type === t.key ? t.color : "#94a3b8", cursor: "pointer", textAlign: "center", fontSize: 11, fontFamily: "'DM Sans'", fontWeight: 500 }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{t.icon}</div>
              {t.label}
            </button>
          ))}
        </div>

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>View Name</label>
          <input value={name} onChange={e => { setName(e.target.value); setError(''); }}
            placeholder="e.g. UserList, ProductDetail, DashboardPage"
            style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontFamily: "'JetBrains Mono'", fontSize: 13, boxSizing: "border-box" }} />
          {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{error}</div>}
        </div>

        {/* Route */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Route / URL</label>
          <input value={route} onChange={e => setRoute(e.target.value)}
            placeholder="/users, /dashboard, /api/products"
            style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "10px 14px", color: "#94a3b8", fontFamily: "'JetBrains Mono'", fontSize: 12, boxSizing: "border-box" }} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What this view displays..."
            style={{ width: "100%", minHeight: 70, padding: 12, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, resize: "vertical", color: "#e2e8f0", fontFamily: "'DM Sans'", fontSize: 12, lineHeight: 1.6, boxSizing: "border-box" }} />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: isEdit ? "space-between" : "flex-end" }}>
          {isEdit && <Btn variant="danger" onClick={() => { onDelete(edit.id); onClose(); }}>🗑 Delete</Btn>}
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn variant="cyanSolid" onClick={submit} style={{ padding: "10px 28px", fontSize: 14 }}>{isEdit ? 'Save' : 'Create'}</Btn>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

export default ViewModal;
