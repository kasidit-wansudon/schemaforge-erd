const Overlay = ({ children, onClose }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(6px)", animation: "fadeIn .2s" }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ animation: "scaleIn .2s ease" }}>{children}</div>
  </div>
);

export default Overlay;
