import type { GeoPoint } from "$lib/geo";

/**
 * Behind the production proxy the socket address is the proxy's, so prefer the
 * forwarded client address. Spoofing it only changes what the lookup says about
 * your own location.
 */
export function clientIp(request: Request, fallback: () => string): string | null {
  const forwarded =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip");
  if (forwarded) return forwarded;
  try {
    return fallback();
  } catch {
    return null;
  }
}

/** Geocodes an IP with ip.hackclub.com, or null when it can't be placed. */
export async function lookupIp(ip: string): Promise<GeoPoint | null> {
  try {
    const res = await fetch(`https://ip.hackclub.com/ip/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const body = await res.json();
    const lat = Number(body.latitude);
    const lng = Number(body.longitude);
    // Unresolvable addresses come back with null coordinates, which Number() turns into 0.
    if (body.latitude == null || body.longitude == null) return null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
