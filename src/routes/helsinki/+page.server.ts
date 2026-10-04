import z from "zod";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { resolveSiteData } from "$lib/data/site";
import { getEventBySlug, type HavenEvent } from "$lib/server/services/events";
import { baseSiteDataInputSchema, siteDataInputSchema, type SiteData } from "$lib/data/types";

/**
 * A city page exists exactly when an active event is synced under that slug —
 * the copy for it is a field on that event, so an event with nothing written
 * yet still renders, on the home page defaults.
 */
export const load: PageServerLoad = async ({ url }) => {
  const event = await getEventBySlug("helsinki");

  if (!event) error(404, "Not found");

  const ref = url.searchParams.get("ref") || undefined;
  const site = resolveHelSiteData(parseHelSiteData(event), event);

  return {
    site,
    eventId: event.id,
    ref,
  };
};

// type for each language
const langSiteDataInputSchema = baseSiteDataInputSchema.extend({
  /** Two-letter language code */
  lang: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, "must be a two-letter language code")
    .transform((value) => value.toLowerCase()),
  prettyLang: z.string().optional(),
});

// base site input type
const helSiteDataInputSchema = siteDataInputSchema.extend({
  /** Two-letter language code */
  defaultLang: z
        .string()
        .trim()
        .regex(/^[A-Za-z]{2}$/, "must be a two-letter language code")
        .transform((value) => value.toLowerCase())
        .optional(),
  defaultPrettyLang: z.string().optional(),
  langs: z.array(langSiteDataInputSchema).optional(),
})

type LangsInputType = z.infer<typeof langSiteDataInputSchema>[];
type SiteDataInput = z.infer<typeof helSiteDataInputSchema>;

interface LangsType extends SiteData {
  lang: string,
  prettyLang: string
}

interface HelSiteData extends SiteData {
  defaultLang: string,
  defaultPrettyLang: string,
  langs?: LangsType[]
}

const helSiteDataJsonSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}, helSiteDataInputSchema);

function parseHelSiteData(event: HavenEvent): SiteDataInput {
  if (!event.websiteData) return {};

  const parsed = helSiteDataJsonSchema.safeParse(event.websiteData);
  if (!parsed.success) {
    console.warn(`Ignoring invalid website data for /${event.slug}`);
    return {};
  }

  return parsed.data;
}

function resolveLangs(
  langs: LangsInputType,
  event: HavenEvent,
): LangsType[] {
  const langs2: any = [];

  if (langs) {
    langs.forEach((lang) => {
      const base = resolveSiteData(lang, event);
      langs2.push({
        ...base,
        lang: lang.lang,
        prettyLang: lang.prettyLang || lang.lang
      })
    })
  }

  return langs2;
}

function resolveHelSiteData(
  data: SiteDataInput = {},
  event: HavenEvent,
): HelSiteData {
  const base = resolveSiteData(data, event);
  const langs = data.langs ? resolveLangs(data.langs, event) : undefined;

  return {
    ...base,
    defaultLang: data.defaultLang || "fi",
    defaultPrettyLang: data.defaultPrettyLang || "Suomi",
    langs
  }
}