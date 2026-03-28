import ModalShell from '../ui/ModalShell';

function RelationsModal({ relations, onClose, onDelete }) {
  return (
    <ModalShell title={`🔗 Relations (${relations.length})`} onClose={onClose} width={560}>
      <div style={{ padding: 16 }}>
        {relations.length === 0 && <p style={{ color: "#475569", textAlign: "center", padding: 32, fontSize: 13 }}>No relations yet. Use Link mode to connect fields.</p>}
        {relations.map(r => (
          <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderRadius: 8, marginBottom: 4, background: "rgba(245,158,11,.05)", border: "1px solid rgba(245,158,11,.1)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'JetBrains Mono'", color: "#f59e0b", fontWeight: 600 }}>FK</span>
              <span style={{ fontFamily: "'JetBrains Mono'", color: "#e2e8f0" }}>{r.from}</span><span style={{ color: "#475569" }}>.</span>
              <span style={{ fontFamily: "'JetBrains Mono'", color: "#a78bfa" }}>{r.fromField}</span><span style={{ color: "#475569" }}>→</span>
              <span style={{ fontFamily: "'JetBrains Mono'", color: "#e2e8f0" }}>{r.to}</span><span style={{ color: "#475569" }}>.</span>
              <span style={{ fontFamily: "'JetBrains Mono'", color: "#34d399" }}>{r.toField}</span>
            </div>
            <button onClick={() => onDelete(r.id)} style={{ background: "rgba(239,68,68,.1)", border: "none", color: "#ef4444", borderRadius: 6, cursor: "pointer", fontSize: 12, padding: "4px 10px", fontFamily: "'JetBrains Mono'" }}>✕</button>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

export default RelationsModal;
