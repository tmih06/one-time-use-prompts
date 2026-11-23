/**
 * Anonymous usage analytics (PostHog). The browser client is configured by
 * PUBLIC_POSTHOG_KEY and PUBLIC_POSTHOG_HOST at build time.
 *
 * Prompt-specific events include `prompt_view` (a prompt page was opened) and
 * `prompt_copy` (the prompt's copy button was used), each with `prompt_id`,
 * `phase` and `purpose`. Purpose-built PostHog Logs records track prompt views
 * and gallery refinements; existing console output is never exported. Site-wide
 * page visits come from Cloudflare Web Analytics instead. No personal data is
 * included in these custom events or logs.
 *
 * posthog-js is loaded lazily: after idle on prompt pages, or when a visitor
 * changes a catalog filter, so it never delays first paint or navigation.
 */
import type { PostHog } from "posthog-js";

const KEY = import.meta.env.PUBLIC_POSTHOG_KEY as string | undefined;
const HOST = import.meta.env.PUBLIC_POSTHOG_HOST as string | undefined;
const missingVariable = !KEY ? "PUBLIC_POSTHOG_KEY" : !HOST ? "PUBLIC_POSTHOG_HOST" : undefined;

if (import.meta.env.DEV && missingVariable) {
  console.error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}

const enabled = Boolean(KEY && HOST) && !import.meta.env.DEV;

interface PromptContext {
  prompt_id: string;
  phase?: string;
  purpose?: string;
}

/** Read from the data attributes PromptPage puts on <main>; undefined off prompt pages. */
function promptContext(): PromptContext | undefined {
  const el = document.querySelector<HTMLElement>("[data-prompt-id]");
  if (!el?.dataset.promptId) return undefined;
  return { prompt_id: el.dataset.promptId, phase: el.dataset.phase, purpose: el.dataset.purpose };
}

/** Speculation-rules prerendering runs page scripts before the visitor arrives; count only real arrivals. */
const whenActivated = (fn: () => void) =>
  (document as Document & { prerendering?: boolean }).prerendering
    ? document.addEventListener("prerenderingchange", fn, { once: true })
    : fn();

const whenIdle = (fn: () => void) =>
  "requestIdleCallback" in window
    ? requestIdleCallback(fn, { timeout: 4000 })
    : setTimeout(fn, 1500);

let client: Promise<PostHog> | undefined;

function load(): Promise<PostHog> {
  client ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(KEY!, {
      api_host: HOST!,
      // Cookie-free, so no consent banner is needed.
      persistence: "localStorage",
      // Nothing is captured implicitly; only the explicit events below. Page
      // visits come from Cloudflare Web Analytics.
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      // The PostHog project may enable these remotely; this site wants none of them.
      disable_session_recording: true,
      disable_surveys: true,
      disable_conversations: true,
      disable_product_tours: true,
      capture_heatmaps: false,
      capture_dead_clicks: false,
      capture_performance: false,
      // Anonymous events only: cheaper, and nobody is ever identified.
      person_profiles: "identified_only",
      respect_dnt: true,
      // Keep the SDK's built-in drop of known bot user agents on.
      opt_out_useragent_filter: false,
      capture_exceptions: {
        capture_unhandled_errors: true,
        capture_unhandled_rejections: true,
        capture_console_errors: false,
      },
      logs: {
        serviceName: "one-time-use-prompts-web",
        environment: import.meta.env.MODE,
      },
    });
    const context = promptContext();
    if (context) {
      posthog.capture("prompt_view", context);
      posthog.logger.info("prompt page viewed", { event: "prompt_view", ...context });
    }
    return posthog;
  });
  return client;
}

/** On a prompt page, send its view once the page is really shown. */
export function initAnalytics() {
  if (!enabled || !promptContext()) return;
  whenActivated(() => whenIdle(() => void load()));
}

const copiedKey = (id: string) => `copied:${id}`;

/**
 * Count a prompt copy. The raw event is deliberately hard to inflate: it needs
 * a real (trusted) click, no automation flag, and counts once per prompt per
 * browser session. The trending query additionally counts distinct visitors
 * and requires a prompt_view in the same session; see ANALYTICS.md.
 */
export function trackPromptCopy(trustedClick: boolean) {
  if (!enabled || !trustedClick || navigator.webdriver) return;
  const context = promptContext();
  if (!context) return;
  try {
    if (sessionStorage.getItem(copiedKey(context.prompt_id))) return;
    sessionStorage.setItem(copiedKey(context.prompt_id), "1");
  } catch {
    /* Storage blocked: fall through and count it; the query-side checks still apply. */
  }
  void load().then((posthog) => posthog.capture("prompt_copy", context));
}

/** Record an intentional catalog refinement without sending visitor-entered data. */
export function trackGalleryFilter(key: string) {
  if (!enabled) return;
  const [phase, purpose] = key.split("/");
  void load().then((posthog) => {
    const properties = {
      filter_phase: phase || "all",
      filter_purpose: purpose || undefined,
    };
    posthog.capture("gallery_filter_selected", properties);
    posthog.logger.info("gallery filter selected", {
      event: "gallery_filter_selected",
      ...properties,
    });
  });
}
