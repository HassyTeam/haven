import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { GEO_COOKIE, GEO_UNKNOWN, parseGeoCookie } from "$lib/geo";
import { clientIp, lookupIp } from "$lib/server/ip";

const FOUND_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const UNKNOWN_MAX_AGE = 60 * 60 * 24; // retry a failed lookup the next day

export const GET: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const cached = parseGeoCookie(cookies.get(GEO_COOKIE));
  if (cached !== undefined) return json(cached);

  const ip = clientIp(request, getClientAddress);
  const point = ip ? await lookupIp(ip) : null;

  cookies.set(GEO_COOKIE, point ? `${point.lat},${point.lng}` : GEO_UNKNOWN, {
    path: "/",
    maxAge: point ? FOUND_MAX_AGE : UNKNOWN_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
  });

  return json(point);
};
