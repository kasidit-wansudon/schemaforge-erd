import { useState } from 'react';
import ModalShell from '../ui/ModalShell';
import Btn from '../ui/Btn';
import { analyzeSchema } from '../../utils/optimizeSchema';

const SEV = { error: { color: '#ef4444', bg: 'rgba(239,68,68,.08)', label: 'CRITICAL' }, warning: { color: '#f59e0b', bg: 'rgba(245,158,11,.08)', label: 'RECOMMEND' }, info: { color: '#34d399', bg: 'rgba(52,211,153,.08)', label: 'SUGGEST' } };
const TYPE_ICON = { index: '⚡', structure: '🏗' };

function OptimizeModal({ tables, relations, onClose }) {
  const suggestions = analyzeSchema(tables, relations);
  const [filter, setFilter] = useState('all');
  const [copied, setCopied] = useState(null);

  const filtered = filter === 'all' ? suggestions : suggestions.filter(s => s.type === filter);
  const counts = { all: suggestions.length, index: suggestions.filter(s => s.type === 'index').length, structure: suggestions.filter(s => s.type === 'structure').length };

  const copySQL = (sql, idx) => {
    navigator.clipboard?.writeText(sql);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  };

  const copyAll = () => {
    const allSQL = filtered.filter(s => s.sql).map(s => s.sql).join('\n\n');
    navigator.clipboard?.writeText(allSQL);
    setCopied('all');
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <ModalShell title="⚡ Schema Optimization" onClose={onClose} width={720}>
      <div style={{ padding: "0 20px 20px" }}>
        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,.06)", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ key: 'all', label: 'All' }, { key: 'index', label: '⚡ Index' }, { key: 'structure', label: '🏗 Structure' }].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: "6px 14px", borderRadius: 8, border: filter === f.key ? "1px solid rgba(52,211,153,.4)" : "1px solid rgba(255,255,255,.08)", background: filter === f.key ? "rgba(52,211,153,.1)" : "transparent", color: filter === f.key ? "#34d399" : "#94a3b8", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans'", fontWeight: 500 }}>
                {f.label} ({counts[f.key]})
              </button>
            ))}
          </div>
          {filtered.some(s => s.sql) && (
            <Btn variant="cyan" size="sm" onClick={copyAll}>
              {copied === 'all' ? '✓ Copied!' : '📋 Copy All SQL'}
            </Btn>
          )}
        </div>

        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Critical', count: suggestions.filter(s => s.severity === 'error').length, color: '#ef4444' },
            { label: 'Recommended', count: suggestions.filter(s => s.severity === 'warning').length, color: '#f59e0b' },
            { label: 'Suggestions', count: suggestions.filter(s => s.severity === 'info').length, color: '#34d399' },
          ].map((s, i) => (
            <div key={i} style={{ padding: "12px 16px", background: "rgba(255,255,255,.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,.06)", textAlign: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 22, fontWeight: 700, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Suggestions list */}
        <div style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 && <p style={{ color: "#475569", textAlign: "center", padding: 32, fontSize: 13 }}>No suggestions found. Your schema looks good!</p>}
          {filtered.map((s, i) => {
            const sev = SEV[s.severity];
            return (
              <div key={i} style={{ padding: "12px 16px", borderRadius: 10, background: sev.bg, border: `1px solid ${sev.color}22` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{TYPE_ICON[s.type]}</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fontWeight: 700, color: sev.color, background: `${sev.color}18`, padding: "2px 8px", borderRadius: 4 }}>{sev.label}</span>
                    {s.table && <span style={{ fontSize: 11, color: "#64748b" }}>{s.table}</span>}
                  </div>
                  {s.sql && (
                    <button onClick={() => copySQL(s.sql, i)}
                      style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: copied === i ? "#34d399" : "#94a3b8", cursor: "pointer", padding: "3px 10px", borderRadius: 6, fontSize: 10, fontFamily: "'JetBrains Mono'" }}>
                      {copied === i ? '✓' : '📋'}
                    </button>
                  )}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{s.desc}</div>
                {s.sql && (
                  <pre style={{ marginTop: 8, padding: "8px 12px", background: "rgba(0,0,0,.3)", borderRadius: 8, fontFamily: "'JetBrains Mono'", fontSize: 10, color: "#6ee7b7", lineHeight: 1.6, overflowX: "auto", whiteSpace: "pre-wrap" }}>{s.sql}</pre>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ModalShell>
  );
}

export default OptimizeModal;
