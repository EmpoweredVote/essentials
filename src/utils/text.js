export function normalizeNotes(s) {
  return String(s ?? "")
    .replace(/\\r\\n/g, " ")
    .replace(/\r\n/g, " ")
    .replace(/\\n/g, " ")
    .replace(/\\t/g, " ");
}

export function stripTrailingIsoDate(s) {
  return String(s).replace(/\s?\b\d{4}-\d{2}-\d{2}\b\s*$/, "");
}
