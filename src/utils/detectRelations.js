import { uid } from './uid';

export function detectRelations(tables) {
  const rels = [], names = tables.map(t => t.name);
  for (const t of tables) for (const f of t.fields) if (f.isForeign) {
    const ref = f.name.replace(/_id$/, "");
    const c = names.filter(n => n === ref || n === ref + "s" || n === ref + "es");
    if (c.length > 0) rels.push({ id: uid(), from: t.name, fromField: f.name, to: c[0], toField: "id" });
  }
  return rels;
}
