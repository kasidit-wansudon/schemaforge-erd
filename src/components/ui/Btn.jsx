const Btn = ({ children, variant = "ghost", size = "md", onClick, style: sx, ...r }) => {
  const sizes = {
    sm: { padding: "5px 12px", fontSize: 11, borderRadius: 8, gap: 4 },
    md: { padding: "8px 18px", fontSize: 13, borderRadius: 10, gap: 6 },
    lg: { padding: "12px 28px", fontSize: 15, borderRadius: 12, gap: 8 },
  };
  const base = { border: "none", cursor: "pointer", fontFamily: "'DM Sans'", transition: "all .15s", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 500, whiteSpace: "nowrap", ...sizes[size] };
  const v = {
    ghost: { background: "rgba(255,255,255,.05)", color: "#94a3b8", border: "1px solid rgba(255,255,255,.1)" },
    cyan: { background: "rgba(52,211,153,.15)", color: "#34d399", border: "1px solid rgba(52,211,153,.3)" },
    amber: { background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#06080f", fontWeight: 600, boxShadow: "0 2px 12px rgba(245,158,11,.3)" },
    cyanSolid: { background: "linear-gradient(135deg,#34d399,#10b981)", color: "#06080f", fontWeight: 600, boxShadow: "0 4px 20px rgba(52,211,153,.3)" },
    danger: { background: "rgba(239,68,68,.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,.25)" },
    green: { background: "rgba(52,211,153,.12)", color: "#34d399", border: "1px solid rgba(52,211,153,.25)" },
    purple: { background: "rgba(167,139,250,.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,.3)" },
    active: { background: "rgba(52,211,153,.25)", color: "#34d399", border: "2px solid #34d399", boxShadow: "0 0 12px rgba(52,211,153,.3)" },
  };
  return <button onClick={onClick} style={{ ...base, ...v[variant], ...sx }} {...r}>{children}</button>;
};

export default Btn;
