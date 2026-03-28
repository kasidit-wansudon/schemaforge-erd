import Overlay from './Overlay';

const ModalShell = ({ title, onClose, width = 560, children }) => (
  <Overlay onClose={onClose}>
    <div style={{ width, maxWidth: "94vw", maxHeight: "85vh", display: "flex", flexDirection: "column", background: "#0c1020", border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, fontSize: 15, color: "#e2e8f0" }}>{title}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18 }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
    </div>
  </Overlay>
);

export default ModalShell;
