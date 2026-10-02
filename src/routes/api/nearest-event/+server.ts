import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import type { GeoPoint } from "$lib/geo";
import { getEvents } from "$lib/server/services/events";
import { clientIp, distanceKm, lookupIp } from "$lib/server/ip";

/**
 * The sign up form's custom code calls this to preselect the event closest to
 * the visitor. The browser can't do it alone: ip.hackclub.com sends no CORS
 * headers, and event coordinates only live in our synced copy of Airtable.
 */
const ALLOWED_ORIGINS = new Set(["https://forms.hackclub.com", "https://form.fillout.com"]);

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return { "access-control-allow-origin": origin, vary: "Origin" };
}

/** `?lat=&lng=` stands in for the IP lookup, so the form can be tested from anywhere. */
function pointFromQuery(url: URL): GeoPoint | null {
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  if (lat == null || lng == null) return null;
  const point = { lat: Number(lat), lng: Number(lng) };
  return Number.isFinite(point.lat) && Number.isFinite(point.lng) ? point : null;
}

export const OPTIONS: RequestHandler = ({ request }) =>
  new Response(null, { status: 204, headers: corsHeaders(request) });

/** `{ id, name, distanceKm }` for the closest active event, or null when the visitor can't be placed. */
export const GET: RequestHandler = async ({ request, url, getClientAddress }) => {
  const headers = { ...corsHeaders(request), "cache-control": "private, no-store" };

  let point = pointFromQuery(url);
  if (!point) {
    const ip = clientIp(request, getClientAddress);
    point = ip ? await lookupIp(ip) : null;
  }
  if (!point) return json(null, { headers });

  let nearest: { id: string; name: string; distanceKm: number } | null = null;
  for (const event of await getEvents()) {
    const d = distanceKm(point, { lat: event.latitude, lng: event.longitude });
    if (!nearest || d < nearest.distanceKm) {
      nearest = { id: event.id, name: event.name, distanceKm: Math.round(d) };
    }
  }

  return json(nearest, { headers });
};
