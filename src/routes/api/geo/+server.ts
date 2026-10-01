import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { GEO_COOKIE, GEO_UNKNOWN, parseGeoCookie, type GeoPoint } from "$lib/geo";

const FOUND_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const UNKNOWN_MAX_AGE = 60 * 60 * 24; // retry a failed lookup the next day

/**
 * Behind the production proxy the socket address is the proxy's, so prefer the
 * forwarded client address. Spoofing it only changes where your own map opens.
 */
function clientIp(request: Request, fallback: () => string): string | null {
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

async function lookup(ip: string): Promise<GeoPoint | null> {
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

export const GET: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const cached = parseGeoCookie(cookies.get(GEO_COOKIE));
  if (cached !== undefined) return json(cached);

  const ip = clientIp(request, getClientAddress);
  const point = ip ? await lookup(ip) : null;

  cookies.set(GEO_COOKIE, point ? `${point.lat},${point.lng}` : GEO_UNKNOWN, {
    path: "/",
    maxAge: point ? FOUND_MAX_AGE : UNKNOWN_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
  });

  return json(point);
};
