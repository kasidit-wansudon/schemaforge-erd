import { VERSION, DEVELOPER, TC } from '../constants';

export function renderERDtoSVG(tables, relations) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const TW = 260, HDR = 42, ROW = 25, PAD = 40;
  for (const t of tables) { minX = Math.min(minX, t.x); minY = Math.min(minY, t.y); maxX = Math.max(maxX, t.x + TW); maxY = Math.max(maxY, t.y + HDR + t.fields.length * ROW); }
  minX -= PAD; minY -= PAD; maxX += PAD; maxY += PAD; const w = maxX - minX, h = maxY - minY;
  const fc = (tN, fN) => { const t = tables.find(tb => tb.name === tN); if (!t) return { x: 0, y: 0 }; const fi = t.fields.findIndex(f => f.name === fN); return { x: t.x + TW / 2, y: t.y + HDR + (fi >= 0 ? fi : 0) * ROW + ROW / 2 }; };
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${minX} ${minY} ${w} ${h}" style="background:#06080f"><defs><marker id="ea" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="#f59e0b" opacity=".8"/></marker></defs><style>text{font-family:'JetBrains Mono','Courier New',monospace}</style>`;
  for (const rel of relations) { const from = fc(rel.from, rel.fromField), to = fc(rel.to, rel.toField); const cp = Math.abs(from.x - to.x) * .35 + 50; const sX = from.x + (to.x > from.x ? TW / 2 + 4 : -TW / 2 - 4), eX = to.x + (from.x > to.x ? TW / 2 + 4 : -TW / 2 - 4); svg += `<path d="M ${sX} ${from.y} C ${sX + (to.x > from.x ? cp : -cp)} ${from.y},${eX + (from.x > to.x ? cp : -cp)} ${to.y},${eX} ${to.y}" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity=".6" marker-end="url(#ea)" stroke-dasharray="6 3"/>`; }
  for (const t of tables) { const th = HDR + t.fields.length * ROW; svg += `<rect x="${t.x}" y="${t.y}" width="${TW}" height="${th}" rx="10" fill="#0a101e" stroke="rgba(255,255,255,.12)"/><rect x="${t.x}" y="${t.y}" width="${TW}" height="${HDR}" rx="10" fill="rgba(52,211,153,.06)"/><rect x="${t.x}" y="${t.y + HDR - 10}" width="${TW}" height="10" fill="rgba(52,211,153,.06)"/><line x1="${t.x}" y1="${t.y + HDR}" x2="${t.x + TW}" y2="${t.y + HDR}" stroke="rgba(255,255,255,.08)"/><text x="${t.x + 14}" y="${t.y + 27}" fill="#e2e8f0" font-size="13" font-weight="600">${t.name}</text>`;
    t.fields.forEach((f, fi) => { const fy = t.y + HDR + fi * ROW; const col = f.isPrimary || f.name === "id" ? "#f59e0b" : f.isForeign ? "#a78bfa" : "#cbd5e1"; const tag = f.isPrimary || f.name === "id" ? "PK" : f.isForeign ? "FK" : ""; if (tag) svg += `<text x="${t.x + 14}" y="${fy + 20}" fill="${col}" font-size="9" font-weight="700">${tag}</text>`; svg += `<text x="${t.x + 36}" y="${fy + 20}" fill="${col}" font-size="11">${f.name}</text>`; const tl = f.size ? `${f.type}(${f.size})` : f.type; svg += `<text x="${t.x + TW - 14}" y="${fy + 20}" fill="${TC[f.type] || "#64748b"}" font-size="9" text-anchor="end">${tl}</text>`; });
  }
  svg += `<text x="${minX + PAD}" y="${maxY - 10}" fill="#334155" font-size="10">ERD Builder v${VERSION} · ${DEVELOPER}</text></svg>`;
  return { svg, w, h };
}
