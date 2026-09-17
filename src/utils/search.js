// Case-insensitive "does this query match any of these fields" helper.
// An empty query always matches, so pages can run this unconditionally.
export const matchesQuery = (query, ...fields) => {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  return fields.some((f) => String(f ?? '').toLowerCase().includes(q));
};
