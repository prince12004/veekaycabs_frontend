// Remembers where a visitor came from (Google Ads click, Meta ad, organic
// search, direct) from the page they LANDED on, so a lead form filled in
// several pages later still reaches the CRM with the right source. Without
// this, a Google Ads visitor who lands on the homepage and then opens
// /contact arrives with no utm_* in the URL and gets tagged plain "Website".
//
// Kept in sessionStorage: one browsing session = one attribution. A fresh
// paid click (gclid/fbclid/utm_*) always overwrites what was stored, since
// that is the click the ad spend should get credit for.

const STORAGE_KEY = "vk_attribution";

export type Attribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  gclid?: string;
  fbclid?: string;
  landingPage?: string;
  referrer?: string;
};

const SEARCH_ENGINES = /google\.|bing\.|yahoo\.|duckduckgo\.|yandex\.|ecosia\./i;

export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl: Attribution = {
      source: params.get("utm_source") || undefined,
      medium: params.get("utm_medium") || undefined,
      campaign: params.get("utm_campaign") || undefined,
      term: params.get("utm_term") || undefined,
      content: params.get("utm_content") || undefined,
      gclid: params.get("gclid") || params.get("gbraid") || params.get("wbraid") || undefined,
      fbclid: params.get("fbclid") || undefined,
    };
    const isPaidClick = Object.values(fromUrl).some(Boolean);
    const alreadyStored = sessionStorage.getItem(STORAGE_KEY);
    if (!isPaidClick && alreadyStored) return;

    // Referrer from our own domain is just internal navigation, not a source.
    const referrer = document.referrer && !document.referrer.includes(window.location.host)
      ? document.referrer
      : undefined;

    const attribution: Attribution = {
      ...fromUrl,
      landingPage: window.location.pathname + window.location.search,
      referrer,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // sessionStorage can be blocked (private mode, strict cookie settings) —
    // attribution is a nice-to-have, never break the page over it.
  }
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Maps an attribution to one of the CRM's lead sources (crm/server Lead.SOURCES).
export function resolveLeadSource(a: Attribution): string {
  const src = a.source || "";
  if (a.gclid || /google/i.test(src)) return "Google Ads";
  if (a.fbclid || /facebook|meta|instagram|fb|ig/i.test(src)) return "Meta Ads";
  if (a.referrer && SEARCH_ENGINES.test(a.referrer)) return "SEO/Organic";
  return "Website";
}
