/**
 * The visitor's approximate location, looked up from their IP by `/api/geo`
 * and cached in a cookie so the lookup happens once per visitor, not once per
 * page view. The cookie is readable from JS so the map can center itself on
 * first paint instead of waiting on a request.
 */
export const GEO_COOKIE = "haven_geo";

/** Written when the lookup fails (private IP, upstream down), so we don't retry every view. */
export const GEO_UNKNOWN = "none";

export type GeoPoint = { lat: number; lng: number };

export function parseGeoCookie(value: string | undefined | null): GeoPoint | null | undefined {
  if (value == null) return undefined;
  if (value === GEO_UNKNOWN) return null;
  const [lat, lng] = value.split(",").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return { lat, lng };
}

/** Reads the cached location in the browser: a point, `null` if known-unknown, `undefined` if never looked up. */
export function readGeoCookie(): GeoPoint | null | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${GEO_COOKIE}=([^;]*)`));
  return parseGeoCookie(match ? decodeURIComponent(match[1]) : null);
}
