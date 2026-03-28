export function analyzeSchema(tables, relations) {
  const suggestions = [];

  for (const t of tables) {
    // 1. FK fields without index suggestion
    const fkFields = t.fields.filter(f => f.isForeign);
    for (const fk of fkFields) {
      suggestions.push({
        type: 'index',
        severity: 'warning',
        table: t.name,
        field: fk.name,
        title: `Add INDEX on ${t.name}.${fk.name}`,
        desc: `Foreign key fields should have an index for fast JOINs and lookups.`,
        sql: `CREATE INDEX idx_${t.name}_${fk.name} ON ${t.name}(${fk.name});`,
      });
    }

    // 2. Missing primary key
    if (!t.fields.some(f => f.isPrimary || f.name === 'id')) {
      suggestions.push({
        type: 'structure',
        severity: 'error',
        table: t.name,
        title: `Missing PRIMARY KEY on ${t.name}`,
        desc: `Every table should have a primary key for data integrity and performance.`,
        sql: `ALTER TABLE ${t.name} ADD COLUMN id INT PRIMARY KEY AUTO_INCREMENT;`,
      });
    }

    // 3. Large varchar without index consideration
    const largeVarchars = t.fields.filter(f => f.type === 'varchar' && parseInt(f.size) > 191);
    for (const lv of largeVarchars) {
      suggestions.push({
        type: 'index',
        severity: 'info',
        table: t.name,
        field: lv.name,
        title: `Consider partial INDEX on ${t.name}.${lv.name}`,
        desc: `VARCHAR(${lv.size}) is large. Use a partial index for search performance.`,
        sql: `CREATE INDEX idx_${t.name}_${lv.name}_partial ON ${t.name}(${lv.name}(100));`,
      });
    }

    // 4. Composite index for tables with multiple FK
    if (fkFields.length >= 2) {
      const fkNames = fkFields.map(f => f.name);
      suggestions.push({
        type: 'index',
        severity: 'info',
        table: t.name,
        title: `Composite INDEX on ${t.name} (${fkNames.join(', ')})`,
        desc: `Multiple foreign keys found. A composite index helps multi-column JOINs.`,
        sql: `CREATE INDEX idx_${t.name}_composite ON ${t.name}(${fkNames.join(', ')});`,
      });
    }

    // 5. Status/enum fields - suggest index
    const enumFields = t.fields.filter(f => f.type === 'enum' || f.name === 'status' || f.name === 'state' || f.name === 'type');
    for (const ef of enumFields) {
      if (!ef.isForeign && !ef.isPrimary) {
        suggestions.push({
          type: 'index',
          severity: 'info',
          table: t.name,
          field: ef.name,
          title: `Index on ${t.name}.${ef.name} for filtering`,
          desc: `Status/enum fields are commonly used in WHERE clauses. An index speeds up filtering.`,
          sql: `CREATE INDEX idx_${t.name}_${ef.name} ON ${t.name}(${ef.name});`,
        });
      }
    }

    // 6. Timestamp fields - suggest index for range queries
    const tsFields = t.fields.filter(f => f.type === 'timestamp' && f.name === 'created_at');
    for (const ts of tsFields) {
      suggestions.push({
        type: 'index',
        severity: 'info',
        table: t.name,
        field: ts.name,
        title: `Index on ${t.name}.${ts.name} for sorting/range`,
        desc: `Timestamp columns used for ORDER BY or date range queries benefit from an index.`,
        sql: `CREATE INDEX idx_${t.name}_${ts.name} ON ${t.name}(${ts.name});`,
      });
    }

    // 7. Missing created_at/updated_at
    const hasCreated = t.fields.some(f => f.name === 'created_at');
    const hasUpdated = t.fields.some(f => f.name === 'updated_at');
    if (!hasCreated || !hasUpdated) {
      suggestions.push({
        type: 'structure',
        severity: 'info',
        table: t.name,
        title: `Add timestamps to ${t.name}`,
        desc: `Missing ${!hasCreated ? 'created_at' : ''}${!hasCreated && !hasUpdated ? ' and ' : ''}${!hasUpdated ? 'updated_at' : ''}. Timestamps help with auditing and debugging.`,
        sql: `ALTER TABLE ${t.name} ADD COLUMN ${!hasCreated ? 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : ''}${!hasCreated && !hasUpdated ? ', ' : ''}${!hasUpdated ? 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' : ''};`,
      });
    }

    // 8. Suggest soft delete
    if (t.fields.length > 3 && !t.fields.some(f => f.name === 'deleted_at' || f.name === 'is_deleted')) {
      suggestions.push({
        type: 'structure',
        severity: 'info',
        table: t.name,
        title: `Consider soft delete for ${t.name}`,
        desc: `Add a deleted_at column for soft deletes instead of permanent data removal.`,
        sql: `ALTER TABLE ${t.name} ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;\nCREATE INDEX idx_${t.name}_deleted_at ON ${t.name}(deleted_at);`,
      });
    }
  }

  // 9. Orphan relations - relations pointing to non-existent tables
  const tableNames = tables.map(t => t.name);
  for (const r of relations) {
    if (!tableNames.includes(r.from)) {
      suggestions.push({ type: 'structure', severity: 'error', title: `Orphan relation: ${r.from} not found`, desc: `Relation references table "${r.from}" which doesn't exist.` });
    }
    if (!tableNames.includes(r.to)) {
      suggestions.push({ type: 'structure', severity: 'error', title: `Orphan relation: ${r.to} not found`, desc: `Relation references table "${r.to}" which doesn't exist.` });
    }
  }

  return suggestions;
}
