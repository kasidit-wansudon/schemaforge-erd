import { useState } from 'react';
import ModalShell from '../ui/ModalShell';
import Btn from '../ui/Btn';
import { uid } from '../../utils/uid';

const TYPES = [
  { key: 'trigger', label: 'Trigger', icon: '⚡', color: '#f59e0b' },
  { key: 'function', label: 'Function', icon: 'ƒ', color: '#a78bfa' },
  { key: 'procedure', label: 'Procedure', icon: '⚙', color: '#38bdf8' },
  { key: 'event', label: 'Event', icon: '⏱', color: '#fb923c' },
];

const TIMINGS = ['BEFORE', 'AFTER', 'INSTEAD OF'];
const EVENTS = ['INSERT', 'UPDATE', 'DELETE'];

function EventModal({ event: editEvent, tables, onClose, onSave, onDelete }) {
  const isEdit = !!editEvent;
  const [type, setType] = useState(editEvent?.type || 'trigger');
  const [name, setName] = useState(editEvent?.name || '');
  const [linkedTable, setLinkedTable] = useState(editEvent?.linkedTable || (tables[0]?.name || ''));
  const [timing, setTiming] = useState(editEvent?.timing || 'AFTER');
  const [triggerEvent, setTriggerEvent] = useState(editEvent?.triggerEvent || 'INSERT');
  const [schedule, setSchedule] = useState(editEvent?.schedule || 'EVERY 1 HOUR');
  const [body, setBody] = useState(editEvent?.body || '-- SQL body here\nBEGIN\n  \nEND');
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim()) { setError('Name is required'); return; }
    onSave({
      id: editEvent?.id || uid(),
      type, name: name.trim(),
      linkedTable: (type === 'trigger' || type === 'event') ? linkedTable : null,
      timing: type === 'trigger' ? timing : null,
      triggerEvent: type === 'trigger' ? triggerEvent : null,
      schedule: type === 'event' ? schedule : null,
      body,
      x: editEvent?.x ?? 100,
      y: editEvent?.y ?? 100,
    });
    onClose();
  };

  const typeInfo = TYPES.find(t => t.key === type);

  return (
    <ModalShell title={isEdit ? `✎ Edit ${typeInfo.label}` : `+ New ${typeInfo.label}`} onClose={onClose} width={600}>
      <div style={{ padding: 20 }}>
        {/* Type selector */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 20 }}>
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)}
              style={{ padding: "10px 8px", borderRadius: 10, border: type === t.key ? `2px solid ${t.color}` : "1px solid rgba(255,255,255,.08)", background: type === t.key ? `${t.color}15` : "rgba(255,255,255,.02)", color: type === t.key ? t.color : "#94a3b8", cursor: "pointer", textAlign: "center", fontSize: 12, fontFamily: "'DM Sans'", fontWeight: 500, transition: "all .15s" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon}</div>
              {t.label}
            </button>
          ))}
        </div>

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Name</label>
          <input value={name} onChange={e => { setName(e.target.value); setError(''); }}
            placeholder={`e.g. ${type === 'trigger' ? 'trg_audit_log' : type === 'function' ? 'fn_calculate_total' : type === 'procedure' ? 'sp_generate_report' : 'evt_cleanup_old'}`}
            style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontFamily: "'JetBrains Mono'", fontSize: 13, boxSizing: "border-box" }} />
          {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{error}</div>}
        </div>

        {/* Trigger-specific: table, timing, event */}
        {type === 'trigger' && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Table</label>
              <select value={linkedTable} onChange={e => setLinkedTable(e.target.value)}
                style={{ width: "100%", background: "#0a0e1a", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 10px", color: "#e2e8f0", fontFamily: "'JetBrains Mono'", fontSize: 12, cursor: "pointer" }}>
                {tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Timing</label>
              <select value={timing} onChange={e => setTiming(e.target.value)}
                style={{ width: "100%", background: "#0a0e1a", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 10px", color: "#f59e0b", fontFamily: "'JetBrains Mono'", fontSize: 12, cursor: "pointer" }}>
                {TIMINGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Event</label>
              <select value={triggerEvent} onChange={e => setTriggerEvent(e.target.value)}
                style={{ width: "100%", background: "#0a0e1a", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 10px", color: "#a78bfa", fontFamily: "'JetBrains Mono'", fontSize: 12, cursor: "pointer" }}>
                {EVENTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Event-specific: table, schedule */}
        {type === 'event' && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Table</label>
              <select value={linkedTable} onChange={e => setLinkedTable(e.target.value)}
                style={{ width: "100%", background: "#0a0e1a", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 10px", color: "#e2e8f0", fontFamily: "'JetBrains Mono'", fontSize: 12, cursor: "pointer" }}>
                {tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Schedule</label>
              <input value={schedule} onChange={e => setSchedule(e.target.value)}
                placeholder="EVERY 1 HOUR"
                style={{ width: "100%", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "9px 14px", color: "#e2e8f0", fontFamily: "'JetBrains Mono'", fontSize: 12, boxSizing: "border-box" }} />
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>SQL Body</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} spellCheck={false}
            style={{ width: "100%", minHeight: 120, padding: 14, background: "#080c18", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, resize: "vertical", color: "#6ee7b7", fontFamily: "'JetBrains Mono'", fontSize: 12, lineHeight: 1.7, boxSizing: "border-box" }} />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: isEdit ? "space-between" : "flex-end" }}>
          {isEdit && <Btn variant="danger" onClick={() => { onDelete(editEvent.id); onClose(); }}>🗑 Delete</Btn>}
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn variant="cyanSolid" onClick={submit} style={{ padding: "10px 28px", fontSize: 14 }}>{isEdit ? 'Save' : 'Create'}</Btn>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

export default EventModal;
