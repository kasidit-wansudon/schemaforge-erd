import { uid } from './uid';
import { DS } from '../constants';

function splitColumns(body) {
  const results = []; let depth = 0, cur = "", inStr = false, strCh = "";
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inStr) { cur += ch; if (ch === strCh && body[i - 1] !== "\\") inStr = false; continue; }
    if (ch === "'" || ch === '"') { inStr = true; strCh = ch; cur += ch; continue; }
    if (ch === "(") { depth++; cur += ch; continue; }
    if (ch === ")") { depth--; cur += ch; continue; }
    if (ch === "," && depth === 0) { results.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) results.push(cur.trim());
  return results.filter(Boolean);
}

function extractTableName(header) {
  let h = header.replace(/IF\s+NOT\s+EXISTS\s+/i, "").trim();
  const m = h.match(/(?:`([^`]+)`|(\w+))(?:\s*\.\s*(?:`([^`]+)`|(\w+)))?$/);
  if (!m) return null;
  return m[3] || m[4] || m[1] || m[2] || null;
}

export function parseSQL(sql) {
  const tables = [];

  let clean = sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*SET\s+.*?;\s*$/gm, "")
    .replace(/^\s*DROP\s+.*?;\s*$/gm, "")
    .replace(/^\s*INSERT\s+.*?;\s*$/gm, "")
    .replace(/^\s*LOCK\s+.*?;\s*$/gm, "")
    .replace(/^\s*UNLOCK\s+.*?;\s*$/gm, "");

  const ctRe = /CREATE\s+TABLE\s+((?:IF\s+NOT\s+EXISTS\s+)?[^\(]+?)\s*\(/gi;
  let ctMatch;

  while ((ctMatch = ctRe.exec(clean)) !== null) {
    const tableName = extractTableName(ctMatch[1]);
    if (!tableName) continue;

    const startIdx = ctMatch.index + ctMatch[0].length;
    let depth = 1, pos = startIdx, inStr = false, strCh = "";

    while (pos < clean.length && depth > 0) {
      const ch = clean[pos];
      if (inStr) {
        if (ch === strCh && clean[pos - 1] !== "\\") inStr = false;
      } else {
        if (ch === "'" || ch === '"') { inStr = true; strCh = ch; }
        else if (ch === "(") depth++;
        else if (ch === ")") depth--;
      }
      if (depth > 0) pos++;
    }

    if (depth !== 0) continue;

    const body = clean.substring(startIdx, pos);
    const fields = [];
    const lines = splitColumns(body);

    for (const line of lines) {
      if (line.match(/^\s*(PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE(\s+KEY|\s+INDEX)?|INDEX|KEY\s+`|KEY\s+"|CONSTRAINT|CHECK|EXCLUDE)\b/i)) continue;

      const fm = line.match(/^\s*(?:`([^`]+)`|"([^"]+)"|(\w+))\s+(\w+)(?:\s*\(([^)]*(?:\([^)]*\))*[^)]*)\))?/i);
      if (!fm) continue;

      const fieldName = fm[1] || fm[2] || fm[3];
      if (!fieldName) continue;

      let rawType = fm[4].toLowerCase();
      let size = fm[5] || "";

      if (rawType === "enum" || rawType === "set") {
        const enumMatch = line.match(/(?:enum|set)\s*\(((?:[^)]*(?:'(?:[^'\\]|\\.)*')?)*[^)]*)\)/i);
        if (enumMatch) {
          const vals = (enumMatch[1].match(/'(?:[^'\\]|\\.)*'/g)) || [];
          size = vals.length + " vals";
        }
      }

      let type = rawType;
      if (rawType === "tinyint" && (size === "1" || line.match(/tinyint\s*\(\s*1\s*\)/i))) type = "boolean";
      else if (rawType.includes("bigint")) type = "bigint";
      else if (rawType.includes("serial")) type = rawType === "bigserial" ? "bigint" : "int";
      else if (rawType.includes("int") || rawType === "integer" || rawType === "mediumint" || rawType === "smallint") type = "int";
      else if (rawType.includes("varchar") || rawType === "character" || rawType === "char" || rawType === "nvarchar") type = "varchar";
      else if (rawType.includes("text") || rawType === "longtext" || rawType === "mediumtext" || rawType === "tinytext") type = "text";
      else if (rawType.includes("decimal") || rawType.includes("numeric") || rawType === "money") type = "decimal";
      else if (rawType.includes("float") || rawType.includes("double") || rawType === "real") type = "float";
      else if (rawType === "date") type = "date";
      else if (rawType.includes("timestamp") || rawType.includes("datetime") || rawType === "timestamptz") type = "timestamp";
      else if (rawType === "time" || rawType === "timetz") type = "timestamp";
      else if (rawType === "enum" || rawType === "set") type = "enum";
      else if (rawType.includes("bool")) type = "boolean";
      else if (rawType.includes("json") || rawType === "jsonb") type = "json";
      else if (rawType === "uuid") type = "uuid";
      else if (rawType === "blob" || rawType === "longblob" || rawType === "mediumblob" || rawType === "binary" || rawType === "varbinary" || rawType === "bytea" || rawType === "tinyblob") type = "text";

      if (type !== "enum") size = (size || "").replace(/'/g, "").trim();
      if (type === "boolean") size = "";
      if (!size && DS[type]) size = DS[type];

      const lineUpper = line.toUpperCase();
      fields.push({
        id: uid(), name: fieldName, type, size,
        isPrimary: lineUpper.includes("PRIMARY KEY") || fieldName === "id",
        isForeign: fieldName.endsWith("_id") && fieldName !== "id",
        nullable: !lineUpper.includes("NOT NULL") && !lineUpper.includes("PRIMARY KEY"),
      });
    }

    tables.push({ id: uid(), name: tableName, fields });
  }

  return tables;
}
