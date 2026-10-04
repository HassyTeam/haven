<script lang="ts">
  import Meta from "$lib/components/Meta.svelte";
  import Fonts from "$lib/components/Fonts.svelte";
  import Hero from "$lib/components/Hero.svelte";
  import About from "$lib/components/About.svelte";
  import Pitch from "$lib/components/Pitch.svelte";
  import Schedule from "$lib/components/Schedule.svelte";
  import Steps from "$lib/components/Steps.svelte";
  import PastEvents from "$lib/components/PastEvents.svelte";
  import Sponsors from "$lib/components/Sponsors.svelte";
  import Faq from "$lib/components/Faq.svelte";
  import SiteFooter from "$lib/components/SiteFooter.svelte";
  import { navLinks } from "$lib/data/content";
  import { event } from "$lib/data/content";
  import { cssUrl } from "$lib/data/images";

  let { data } = $props();

  const origSite = $derived(data.site);
  // svelte-ignore state_referenced_locally
  let langState = $state(origSite.defaultLang);
  const site = $derived.by(() =>
    origSite.langs?.find((p) => p.lang == langState) || origSite,
  );

  const langs = $derived([...(origSite.langs ?? []), {lang: origSite.defaultLang, prettyLang: origSite.defaultPrettyLang}])

  const images = $derived(site.images);
  const pageTitle = $derived(
    site.meta.title ?? `${event.name} — ${site.title.join(" ")}`,
  );
  const signupUrl = $derived.by(() => {
    const url = new URL(data.signupUrl)
    url.searchParams.set('event', data.eventId)
    if (data.ref) url.searchParams.set('ref', data.ref)
    if (site.hero.signup.lang) url.searchParams.set('lang', site.hero.signup.lang)
    return url.toString()
  })

  // The two illustrated backdrops are CSS backgrounds, so they are swapped
  // through the custom properties `.stage-*` reads rather than an `img` src.
  const middleStage = $derived(
    `--stage-bg: ${cssUrl(images.stageMiddle)}; --stage-bg-mobile: ${cssUrl(images.stageMiddleMobile)}`,
  );
  const picnicStage = $derived(
    `--stage-bg: ${cssUrl(images.stagePicnic)}; --stage-bg-mobile: ${cssUrl(images.stagePicnicMobile)}`,
  );

  const isPoc = false;

  let scrolled = $state(false);

  // The page can load already scrolled (a reload, or a #hash target).
  $effect(() => {
    scrolled = window.scrollY > 10;
  });
</script>

<Meta
  title={pageTitle}
  description={site.meta.description}
  image={site.meta.image}
/>
<Fonts fonts={site.fonts} />

<svelte:window onscroll={() => (scrolled = window.scrollY > 10)} />

<header class="absolute inset-x-0 top-0 z-30">
  <img
    src={images.navBanner}
    alt=""
    aria-hidden="true"
    width="646"
    height="260"
    class="pointer-events-none fixed right-0 top-0 -z-10 w-[min(41rem,max(46%,calc(13rem_+_8vw)))] max-w-none select-none md:w-[45%] md:right-[clamp(-3rem,-2vw,0rem)] md:top-[clamp(-3rem,-2vw,0rem)]"
  />

  <img
    src="https://cdn.hackclub.com/01a105d1-fa2a-7248-acd2-92ce43c239a5/lang-banner.png"
    alt=""
    aria-hidden="true"
    class={["pointer-events-none fixed left-0 top-0 -z-10 w-[max(8rem,20%)] max-w-none select-none", origSite.langs ? "block" : "hidden" ]}
  >
</header>

<div
  data-nav-bar
  data-scrolled={scrolled ? "" : undefined}
  class="fixed inset-x-0 top-0 justify-end z-30 flex pb-3 pt-[clamp(0.5rem,1.4vw,1.5rem)] px-[clamp(1rem,4vw,4rem)] pointer-events-none transition-[background-color,backdrop-filter,box-shadow] duration-200"
>
  <nav class="pointer-events-auto" aria-label="Primary">
    <ul class="flex items-center gap-[clamp(1.125rem,2.2vw,2.75rem)]">
      {#each navLinks as link (link.href)}
        <li>
          <a
            href={link.href}
            class="inline-block py-1 font-display text-[clamp(1rem,3.5vw,8rem)] leading-none tracking-[-0.03em] text-haven-yellow transition-colors hover:text-white"
          >
            {site.nav[link.key]}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</div>

<div
  data-scrolled={scrolled ? "" : undefined}
  class={["fixed inset-x-0 top-0 justify-start z-30 flex pb-3 pt-[clamp(0.5rem,1.4vw,1.5rem)] px-[clamp(1rem,4vw,4rem)] pointer-events-none transition-[background-color,backdrop-filter,box-shadow] duration-200", origSite.langs ? "block" : "hidden"]}
>
  <select name="lang" class="pointer-events-auto inline-block font-display text-[clamp(1rem,3.5vw,8rem)] leading-none tracking-[-0.03em] text-haven-yellow transition-colors hover:text-white" bind:value={langState}>
    {#each langs as lang (lang.lang)}
      <option class="leading-none" value={lang.lang}>{lang.prettyLang}</option>
    {/each}
  </select>
</div>

<main id="main" class="overflow-x-clip">
  <div class="relative z-20">
    <Hero
      title={site.title}
      tagline={site.tagline}
      poc={isPoc}
      signupUrl={signupUrl}
      referral={data.referral}
      cities={data.cities}
      organizeCta={site.hero.organizeCta}
      mapLabel={site.hero.mapLabel}
      scrollLabel={site.hero.scrollLabel}
      signup={site.hero.signup}
      {images}
    />
  </div>

  <div id="about" class="stage stage-middle z-10" style={middleStage}>
    <About
      title={site.about.title}
      body={site.about.body}
      perks={site.about.perks}
      {images}
    />
    <Pitch
      poc={isPoc}
      heading={site.pitch.heading}
      items={site.pitch.items}
      {images}
    />
  </div>

  <div class="z-20">
    <Steps
      poc={isPoc}
      heading={site.steps.heading}
      subheading={site.steps.subheading}
      cta={site.steps.cta}
      {images}
    />
  </div>

  <Schedule
    heading={site.schedule.heading}
    days={site.schedule.days}
    tbd={site.schedule.tbd}
    {images}
  />

  <div class="stage stage-picnic" style={picnicStage}>
    <PastEvents
      heading={site.pastEvents.heading}
      items={site.pastEvents.items}
    />
  </div>

  <Sponsors
    heading={site.sponsors.heading}
    items={site.sponsors.items}
    {images}
  />

  <Faq
    heading={site.faq.heading}
    items={site.faq.items}
    cta={site.faq.cta}
    {images}
  />
</main>

<SiteFooter {images} footer={site.footer} />
