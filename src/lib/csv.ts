// Tiny CSV parser. LinkedIn's Connections.csv has a few "Notes:" comment
// lines at the top before the real header — we skip those.

export function parseLinkedInConnections(raw: string): Record<string, string>[] {
  const lines = raw.split(/\r?\n/);
  const headerIdx = lines.findIndex((l) => /^First Name,/i.test(l));
  if (headerIdx < 0) return [];

  const headers = splitCsvLine(lines[headerIdx]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = (cells[idx] ?? "").trim()));
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}
