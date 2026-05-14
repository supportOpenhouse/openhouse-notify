/**
 * Parse a raw CSV string (uploaded file content) and extract FCM device tokens.
 *
 * Accepted formats:
 *   - Single-column CSV: one token per line
 *   - Multi-column CSV: token must be in the first column or a column named
 *     "token", "fcm_token", "device_token", or "push_token"
 *   - Plain text: one token per line (no commas)
 *
 * Tokens must be at least 20 chars long (basic sanity check).
 * Duplicate tokens are removed.
 *
 * @returns Deduplicated array of FCM tokens.
 */
export function parseFcmTokensCsv(content: string): string[] {
  const HEADER_NAMES = new Set(['token', 'fcm_token', 'device_token', 'push_token', 'fcmtoken']);
  const MIN_TOKEN_LENGTH = 20;

  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  // Detect if there is a header row
  const firstLineLower = lines[0].toLowerCase().replace(/"/g, '');
  const columns = firstLineLower.split(',').map((c) => c.trim());
  let tokenColumnIndex = 0;
  let hasHeader = false;

  // Check if any column name matches a known header
  const headerColIdx = columns.findIndex((c) => HEADER_NAMES.has(c));
  if (headerColIdx !== -1) {
    tokenColumnIndex = headerColIdx;
    hasHeader = true;
  } else if (columns.length > 1 && columns.every((c) => c.length < 30)) {
    // Looks like a header row (short column names, not token-length)
    hasHeader = true;
    tokenColumnIndex = 0;
  }

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const tokens = new Set<string>();

  for (const line of dataLines) {
    const cols = line.split(',');
    const raw = (cols[tokenColumnIndex] ?? cols[0] ?? '').trim().replace(/^"(.*)"$/, '$1');
    if (raw.length >= MIN_TOKEN_LENGTH) {
      tokens.add(raw);
    }
  }

  return Array.from(tokens);
}

/** Parse a `Buffer` (from multer memory storage) the same way. */
export function parseFcmTokensBuffer(buffer: Buffer, encoding: BufferEncoding = 'utf-8'): string[] {
  return parseFcmTokensCsv(buffer.toString(encoding));
}
