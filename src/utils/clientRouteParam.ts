/**
 * Decode a client id / phone segment from a URL path or query string.
 * Handles percent-encoding (e.g. %20 for spaces) while leaving plain values unchanged.
 */
export function decodeClientRouteParam(raw: string): string {
  const trimmed = raw.trim()
  try {
    return decodeURIComponent(trimmed)
  } catch {
    return trimmed
  }
}
