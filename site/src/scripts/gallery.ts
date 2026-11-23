/**
 * In-place filtering for the browse pages. Every card is already in the HTML; a
 * filter click re-decides which are shown, animates the change and keeps the
 * address bar on the matching static URL. Without this script each pill is just
 * a link to that URL, so nothing here is required for the page to work.
 */

import { trackGalleryFilter } from "./analytics";

const EASE_TRAVEL = "cubic-bezier(0.45, 0, 0.1, 1)";
const EASE_ARRIVE = "cubic-bezier(0.25, 0.8, 0.25, 1)";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const root = document.querySelector<HTMLElement>("[data-gallery]");
if (root) init(root);

function init(root: HTMLElement) {
  const grid = root.querySelector<HTMLElement>("[data-gallery-grid]")!;
  const status = root.querySelector<HTMLElement>("[data-gallery-status]")!;
  const items = [...grid.querySelectorAll<HTMLElement>("[data-gallery-item]")];
  const navs = [...root.querySelectorAll<HTMLElement>("[data-filter-nav]")];
  const known = new Set(
    [...root.querySelectorAll<HTMLElement>('[data-slot="title"] > [data-variant]')].map(
      (v) => v.dataset.variant!,
    ),
  );

  const parse = (key: string) => {
    const [phase = "", purpose = ""] = key.split("/");
    return { phase, purpose };
  };
  const keyFromPath = () => {
    const key = location.pathname
      .replace(/^\/prompts\/?/, "")
      .replace(/\.html$/, "")
      .replace(/\/$/, "");
    return known.has(key) ? key : "";
  };
  const hrefFor = (key: string) => (key ? "/prompts/" + key : "/prompts");

  let current = root.dataset.current ?? "";
  // Filtering rewrites the address bar in place, so the tab title follows it.
  const titles: Record<string, string> = JSON.parse(root.dataset.titles ?? "{}");
  let run = 0;

  /* Morphing slots -------------------------------------------------------- */

  /**
   * Swaps which variant of a slot is active. The slot's size is pinned to the old
   * variant's, then animated to the new one's while the two cross-fade (see app.css).
   */
  function morph(slot: HTMLElement, key: string | null, animate: boolean) {
    const axis = slot.dataset.morph === "y" ? "height" : "width";
    const variants = [...slot.querySelectorAll<HTMLElement>(":scope > [data-variant]")];
    const next = variants.find((v) => v.dataset.variant === key);
    const prev = variants.find((v) => v.hasAttribute("data-active"));
    if (next === prev) return;

    const read = () => (axis === "height" ? slot.offsetHeight : slot.offsetWidth);
    const from = read();
    for (const a of slot.getAnimations()) a.cancel();
    if (prev) {
      prev.setAttribute("data-leaving", "");
      setTimeout(() => prev.removeAttribute("data-leaving"), 600);
    }
    prev?.removeAttribute("data-active");
    next?.setAttribute("data-active", "");
    const to = read();
    if (!animate || reducedMotion || from === to) return;
    slot.animate({ [axis]: [from + "px", to + "px"] }, { duration: 520, easing: EASE_TRAVEL });
  }

  const slot = (name: string) => root.querySelector<HTMLElement>('[data-slot="' + name + '"]')!;

  function syncMorphs(animate: boolean) {
    const { phase, purpose } = parse(current);
    morph(slot("title"), current, animate);
    morph(slot("count"), current, animate);
    morph(slot("blurb"), current, animate);
    // The breadcrumb keeps its last crumbs while it folds away, so nothing flickers on the way out.
    const crumbs = slot("crumbs");
    morph(crumbs, phase ? "on" : null, animate);
    const trail = crumbs.querySelector<HTMLElement>("nav");
    if (phase && trail) {
      trail.dataset.depth = purpose ? "2" : "1";
      morph(slot("crumb-phase"), phase, animate);
      morph(slot("crumb-purpose"), purpose ? current : null, animate);
      for (const link of trail.querySelectorAll<HTMLElement>("a[data-filter-key]")) {
        const key = link.dataset.filterKey!;
        const last = key === current;
        link.toggleAttribute("aria-current", last);
        if (last) link.setAttribute("aria-current", "page");
      }
    }
    const purposes = slot("purposes");
    const has = purposes.querySelector('[data-variant="' + phase + '"]');
    const entering = has && !has.hasAttribute("data-active");
    morph(purposes, phase && has ? phase : null, animate);
    if (entering && animate && !reducedMotion) {
      // The new row's pills settle in one after another.
      has!
        .querySelectorAll<HTMLElement>("a")
        .forEach((pill, i) =>
          pill.animate(
            { opacity: [0, 1], transform: ["translateY(8px) scale(0.94)", "none"] },
            { duration: 420, delay: 120 + i * 45, easing: EASE_ARRIVE, fill: "backwards" },
          ),
        );
    }
  }

  /* Sliding highlight ------------------------------------------------------ */

  function place(nav: HTMLElement, animate: boolean) {
    const indicator = nav.querySelector<HTMLElement>(".filter-indicator");
    const active = nav.querySelector<HTMLElement>("a[aria-current]");
    if (!indicator) return;
    if (!active) {
      indicator.style.opacity = "0";
      return;
    }
    const width = active.offsetWidth + "px";
    const height = active.offsetHeight + "px";
    const transform = "translate(" + active.offsetLeft + "px," + active.offsetTop + "px)";
    // Unchanged target (a resize that moved nothing): leave any slide in progress alone.
    const target = width + height + transform;
    if (indicator.dataset.placed !== undefined && indicator.dataset.target === target) {
      indicator.style.opacity = "";
      return;
    }
    const jump = !animate || reducedMotion || indicator.dataset.placed === undefined;
    if (jump) indicator.style.transition = "none";
    indicator.style.opacity = "";
    indicator.style.width = width;
    indicator.style.height = height;
    indicator.style.transform = transform;
    indicator.dataset.placed = "";
    indicator.dataset.target = target;
    nav.setAttribute("data-ready", "");
    if (jump) {
      void indicator.offsetWidth;
      indicator.style.transition = "";
    }
  }

  function syncPills() {
    const { phase } = parse(current);
    for (const nav of navs) {
      const level = nav.dataset.filterNav;
      const mine = nav.dataset.purposesFor;
      for (const pill of nav.querySelectorAll<HTMLElement>("a[data-filter-key]")) {
        const on =
          level === "phase"
            ? pill.dataset.filterKey === phase
            : mine === phase && pill.dataset.filterKey === current;
        pill.toggleAttribute("aria-current", on);
        if (on) pill.setAttribute("aria-current", "page");
      }
      place(nav, true);
    }
  }

  /* Cards ------------------------------------------------------------------ */

  const matches = (el: HTMLElement, key: string) => {
    const { phase, purpose } = parse(key);
    if (!el.dataset.phase) return true; // the "contribute" card is always there
    return (!phase || el.dataset.phase === phase) && (!purpose || el.dataset.purpose === purpose);
  };

  async function syncCards(animate: boolean) {
    const mine = ++run;
    for (const el of items) for (const a of el.getAnimations()) a.cancel();
    grid.getAnimations().forEach((a) => a.cancel());
    grid.style.overflow = "";

    const shown = items.filter((el) => matches(el, current));
    const next = new Set(shown);
    const before = items.filter((el) => !el.hidden);
    const leaving = before.filter((el) => !next.has(el));
    const entering = items.filter((el) => el.hidden && next.has(el));
    const staying = before.filter((el) => next.has(el));
    const n = shown.filter((el) => el.dataset.phase).length;
    status.textContent = n + (n === 1 ? " prompt" : " prompts") + " shown";

    if (!animate || reducedMotion || (!leaving.length && !entering.length)) {
      for (const el of leaving) el.hidden = true;
      for (const el of entering) el.hidden = false;
      for (const el of entering) el.setAttribute("data-in", "");
      return;
    }

    const firstRects = new Map(staying.map((el) => [el, el.getBoundingClientRect()]));
    const heightBefore = grid.getBoundingClientRect().height;

    // 1. Cards that no longer match step back and fade.
    if (leaving.length) {
      const exits = leaving.map(
        (el) =>
          el.animate(
            { opacity: [1, 0], transform: ["none", "scale(0.94)"] },
            { duration: 170, easing: EASE_TRAVEL, fill: "forwards" },
          ).finished,
      );
      try {
        await Promise.all(exits);
      } catch {
        return; // a newer filter cancelled this one
      }
      if (mine !== run) return;
    }

    // 2. Change the layout, then play it backwards (FLIP) so cards glide to their new slots.
    for (const el of leaving) {
      for (const a of el.getAnimations()) a.cancel();
      el.hidden = true;
    }
    for (const el of entering) {
      el.hidden = false;
      el.setAttribute("data-in", "");
      el.style.animation = "none"; // the scroll-reveal entrance would fight this one
    }
    const heightAfter = grid.getBoundingClientRect().height;

    for (const el of staying) {
      const from = firstRects.get(el)!;
      const to = el.getBoundingClientRect();
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      el.animate(
        { transform: ["translate(" + dx + "px," + dy + "px)", "none"] },
        { duration: 460, easing: EASE_TRAVEL },
      );
    }

    // 3. New matches rise in, staggered in reading order.
    entering.forEach((el, i) => {
      el.animate(
        { opacity: [0, 1], transform: ["translateY(16px) scale(0.96)", "none"] },
        {
          duration: 480,
          delay: 140 + Math.min(i * 50, 350),
          easing: EASE_ARRIVE,
          fill: "backwards",
        },
      );
    });

    // 4. The grid's height eases so the footer doesn't jump.
    if (Math.abs(heightAfter - heightBefore) > 1) {
      grid.style.overflow = "clip";
      grid.style.overflowClipMargin = "12px";
      const resize = grid.animate(
        { height: [heightBefore + "px", heightAfter + "px"] },
        { duration: 460, easing: EASE_TRAVEL },
      );
      resize.onfinish = resize.oncancel = () => {
        if (mine === run) grid.style.overflow = "";
      };
    }
  }

  /* Wiring ----------------------------------------------------------------- */

  function go(key: string, push: boolean) {
    if (key === current) return;
    current = key;
    if (push) history.pushState(null, "", hrefFor(key));
    if (titles[key]) document.title = titles[key];
    syncPills();
    syncMorphs(true);
    void syncCards(true);
  }

  root.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const pill = (event.target as Element).closest<HTMLAnchorElement>("a[data-filter-key]");
    if (!pill) return;
    event.preventDefault();
    const key = pill.dataset.filterKey!;
    if (event.isTrusted && key !== current) trackGalleryFilter(key);
    go(key, true);
  });

  addEventListener("popstate", () => go(keyFromPath(), false));

  // Keep the highlight under its pill when the pills reflow.
  new ResizeObserver(() => {
    for (const nav of navs) place(nav, false);
  }).observe(root);

  for (const nav of navs) place(nav, false);
  syncMorphs(false);
  void document.fonts?.ready.then(() => {
    for (const nav of navs) place(nav, false);
  });
}
