/**
 * In-place browsing for the prompt library. Every card is already in the HTML;
 * this script adds fuzzy search, tag refinement, sorting and the phase/purpose
 * filters without a round trip. Structural filters still resolve to their static
 * URLs (/prompts/<phase>/<purpose>), while search, tags and sort are shareable
 * query parameters. Without this script the phase and purpose pills remain plain
 * links, so the catalog itself never depends on JavaScript.
 */

import { fuzzyScore, relevantFuzzyScore, type FuzzyDocument } from "@/lib/fuzzy";
import { trackGalleryFilter } from "./analytics";

const EASE_TRAVEL = "cubic-bezier(0.45, 0, 0.1, 1)";
const EASE_ARRIVE = "cubic-bezier(0.25, 0.8, 0.25, 1)";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

type SortKey = "recommended" | "updated" | "copies" | "views" | "title";
const SORT_KEYS = new Set<SortKey>(["recommended", "updated", "copies", "views", "title"]);
const DEFAULT_SORT: SortKey = "recommended";

interface GalleryRecord extends FuzzyDocument {
  id: string;
  updated?: string;
  views: number;
  copies: number;
}

interface Entry {
  record: GalleryRecord;
  element: HTMLElement;
  /** Original server order, the final tie-breaker for stable sorting. */
  position: number;
}

interface GalleryState {
  /** "", "<phase>" or "<phase>/<purpose>" — the part encoded in the path. */
  key: string;
  query: string;
  /** Tags are additive: a prompt may match any selected tag. */
  tags: Set<string>;
  sort: SortKey;
}

function init(root: HTMLElement) {
  const grid = root.querySelector<HTMLElement>("[data-gallery-grid]")!;
  const status = root.querySelector<HTMLElement>("[data-gallery-status]")!;
  const empty = root.querySelector<HTMLElement>("[data-gallery-empty]");
  const summary = root.querySelector<HTMLElement>("[data-gallery-summary]");
  const searchInput = root.querySelector<HTMLInputElement>("[data-gallery-search]");
  const clearSearch = root.querySelector<HTMLButtonElement>("[data-gallery-clear-search]");
  const sortSelect = root.querySelector<HTMLSelectElement>("[data-gallery-sort]");
  const reset = root.querySelector<HTMLButtonElement>("[data-gallery-reset]");
  const resetAdvanced = root.querySelector<HTMLButtonElement>("[data-gallery-reset-advanced]");
  const tagsToggle = root.querySelector<HTMLButtonElement>("[data-tags-toggle]");
  const tagsToggleLabel = root.querySelector<HTMLElement>("[data-tags-toggle-label]");
  const tagButtons = [...root.querySelectorAll<HTMLButtonElement>("button[data-tag-filter]")];
  const items = [...grid.querySelectorAll<HTMLElement>("[data-gallery-item]")];
  const contribute = grid.querySelector<HTMLElement>("[data-contribute]");
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

  /* Catalog index ---------------------------------------------------------- */

  const indexScript = root.querySelector<HTMLScriptElement>("script[data-gallery-index]");
  let records: GalleryRecord[] = [];
  try {
    records = JSON.parse(indexScript?.textContent ?? "[]") as GalleryRecord[];
  } catch (error) {
    // The static page and its real filter links still work without enhancement.
    console.error("Gallery index could not be parsed", error);
    return;
  }
  const elementsById = new Map(
    items
      .filter((el) => el.dataset.galleryPromptId)
      .map((el) => [el.dataset.galleryPromptId!, el] as const),
  );
  const entries: Entry[] = [];
  records.forEach((record, position) => {
    const element = elementsById.get(record.id);
    if (element) entries.push({ record, element, position });
  });
  if (!entries.length) return;
  const collator = new Intl.Collator("en", { sensitivity: "base" });

  const validTags = new Set(tagButtons.map((button) => button.dataset.tagFilter!));

  function readState(): GalleryState {
    const params = new URLSearchParams(location.search);
    const tags = new Set<string>();
    for (const value of params.getAll("tag")) {
      if (validTags.has(value)) tags.add(value);
    }
    // Accept the compact ?tags=a,b spelling too, even though this app writes repeated tag params.
    for (const value of (params.get("tags") ?? "").split(",")) {
      if (validTags.has(value)) tags.add(value);
    }
    const sortParam = params.get("sort") as SortKey | null;
    return {
      key: keyFromPath(),
      query: params.get("q") ?? "",
      tags,
      sort: sortParam && SORT_KEYS.has(sortParam) ? sortParam : DEFAULT_SORT,
    };
  }

  let state = readState();
  // Filtering rewrites the address bar in place, so the tab title follows it.
  const titles: Record<string, string> = JSON.parse(root.dataset.titles ?? "{}");
  let run = 0;

  /* URLs ------------------------------------------------------------------- */

  function urlFor(key = state.key) {
    const params = new URLSearchParams();
    const query = state.query.trim();
    if (query) params.set("q", query);
    for (const tag of [...state.tags].sort()) params.append("tag", tag);
    if (state.sort !== DEFAULT_SORT) params.set("sort", state.sort);
    const search = params.toString();
    return hrefFor(key) + (search ? "?" + search : "");
  }

  /** Keep every structural link carrying the current refinements for keyboard/cmd-click use. */
  function syncLinks() {
    for (const link of root.querySelectorAll<HTMLAnchorElement>("a[data-filter-key]")) {
      link.href = urlFor(link.dataset.filterKey ?? "");
    }
  }

  function writeUrl(push: boolean) {
    const next = urlFor();
    const here = location.pathname + location.search;
    syncLinks();
    if (next === here) return;
    if (push) history.pushState(null, "", next);
    else history.replaceState(null, "", next);
  }

  let urlTimer: number | undefined;
  function writeUrlSoon() {
    window.clearTimeout(urlTimer);
    urlTimer = window.setTimeout(() => writeUrl(false), 300);
  }

  /* Fuzzy matching and sorting --------------------------------------------- */

  let scoredQuery: string | undefined;
  let scores = new Map<string, number>();
  let maxScore = 0;
  let maxScoreScope = "";
  // Once a strong match exists, weak incidental fuzzy matches are noise rather
  // than useful results (for example "seo" as scattered letters in other words).

  function scoreFor(entry: Entry): number {
    const query = state.query.trim();
    if (!query) return 0;
    if (scoredQuery !== query) {
      scoredQuery = query;
      scores = new Map(
        entries.map((entry) => [entry.record.id, fuzzyScore(query, entry.record).score] as const),
      );
      maxScoreScope = "";
    }
    return scores.get(entry.record.id) ?? 0;
  }

  /** Best score inside the current phase/purpose, so outside results never set the cutoff. */
  function currentMaxScore(): number {
    if (!state.query.trim()) return 0;
    const scope = state.key + "\n" + state.query.trim();
    if (maxScoreScope !== scope) {
      maxScoreScope = scope;
      maxScore = Math.max(0, ...entries.filter(matchesStructure).map(scoreFor));
    }
    return maxScore;
  }

  function relevantScore(entry: Entry): boolean {
    const score = scoreFor(entry);
    return relevantFuzzyScore(score, currentMaxScore());
  }

  const updatedTime = (entry: Entry) => {
    const time = entry.record.updated ? Date.parse(entry.record.updated) : 0;
    return Number.isFinite(time) ? time : 0;
  };
  const popularity = (entry: Entry) => entry.record.copies * 5 + entry.record.views;
  const byTitle = (a: Entry, b: Entry) =>
    collator.compare(a.record.title, b.record.title) || a.position - b.position;
  const byUpdated = (a: Entry, b: Entry) => updatedTime(b) - updatedTime(a) || byTitle(a, b);
  const byPopularity = (a: Entry, b: Entry) => popularity(b) - popularity(a) || byUpdated(a, b);

  function compareEntries(a: Entry, b: Entry): number {
    switch (state.sort) {
      case "title":
        return byTitle(a, b);
      case "updated":
        return byUpdated(a, b);
      case "copies":
        return b.record.copies - a.record.copies || byPopularity(a, b);
      case "views":
        return b.record.views - a.record.views || byPopularity(a, b);
      case "recommended": {
        if (state.query.trim()) {
          return scoreFor(b) - scoreFor(a) || byPopularity(a, b);
        }
        // With no query, "recommended" means proven first, then fresh, then title.
        return byPopularity(a, b);
      }
    }
  }

  function matchesStructure(entry: Entry): boolean {
    const { phase, purpose } = parse(state.key);
    return (
      (!phase || entry.record.phase === phase) && (!purpose || entry.record.purpose === purpose)
    );
  }

  /** Structural + query match, intentionally ignoring selected tags for facet counts. */
  function matchesBase(entry: Entry): boolean {
    if (!matchesStructure(entry)) return false;
    return !state.query.trim() || relevantScore(entry);
  }

  function matchesEntry(entry: Entry): boolean {
    if (!matchesBase(entry)) return false;
    if (!state.tags.size) return true;
    return (entry.record.tags ?? []).some((tag) => state.tags.has(tag));
  }

  const orderedEntries = () => [...entries].sort(compareEntries);

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
    const { phase, purpose } = parse(state.key);
    morph(slot("title"), state.key, animate);
    morph(slot("count"), state.key, animate);
    morph(slot("blurb"), state.key, animate);
    // The breadcrumb keeps its last crumbs while it folds away, so nothing flickers on the way out.
    const crumbs = slot("crumbs");
    morph(crumbs, phase ? "on" : null, animate);
    const trail = crumbs.querySelector<HTMLElement>("nav");
    if (phase && trail) {
      trail.dataset.depth = purpose ? "2" : "1";
      morph(slot("crumb-phase"), phase, animate);
      morph(slot("crumb-purpose"), purpose ? state.key : null, animate);
      for (const link of trail.querySelectorAll<HTMLElement>("a[data-filter-key]")) {
        const key = link.dataset.filterKey!;
        const last = key === state.key;
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
    const { phase } = parse(state.key);
    for (const nav of navs) {
      const level = nav.dataset.filterNav;
      const mine = nav.dataset.purposesFor;
      for (const pill of nav.querySelectorAll<HTMLElement>("a[data-filter-key]")) {
        const on =
          level === "phase"
            ? pill.dataset.filterKey === phase
            : mine === phase && pill.dataset.filterKey === state.key;
        pill.toggleAttribute("aria-current", on);
        if (on) pill.setAttribute("aria-current", "page");
      }
      place(nav, true);
    }
  }

  /* Controls ---------------------------------------------------------------- */

  let tagsExpanded = false;
  const countLabel = (n: number) => n + (n === 1 ? " prompt" : " prompts");

  function syncTagVisibility() {
    let collapsedCount = 0;
    for (const button of tagButtons) {
      const selected = state.tags.has(button.dataset.tagFilter!);
      const collapsed = button.hasAttribute("data-tag-extra") && !tagsExpanded && !selected;
      button.hidden = collapsed;
      if (collapsed) collapsedCount++;
    }
    if (tagsToggle) {
      tagsToggle.hidden = !tagsExpanded && collapsedCount === 0;
      tagsToggle.setAttribute("aria-expanded", String(tagsExpanded));
      if (tagsToggleLabel) {
        tagsToggleLabel.textContent = tagsExpanded ? "Show fewer" : collapsedCount + " more";
      }
    }
  }

  function syncControls(resultCount: number) {
    const query = state.query.trim();
    if (searchInput && searchInput.value !== state.query) searchInput.value = state.query;
    if (clearSearch) clearSearch.hidden = !state.query;
    if (sortSelect && sortSelect.value !== state.sort) sortSelect.value = state.sort;

    for (const button of tagButtons) {
      const tag = button.dataset.tagFilter!;
      const selected = state.tags.has(tag);
      const count = entries.filter(
        (entry) => matchesBase(entry) && (entry.record.tags ?? []).includes(tag),
      ).length;
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = count === 0 && !selected;
      const countElement = button.querySelector<HTMLElement>("[data-tag-count]");
      if (countElement) countElement.textContent = String(count);
    }
    syncTagVisibility();

    if (summary) {
      summary.textContent =
        resultCount === entries.length
          ? countLabel(entries.length)
          : "Showing " + resultCount + " of " + countLabel(entries.length);
    }
    if (reset) {
      reset.hidden = !query && state.tags.size === 0 && state.sort === DEFAULT_SORT;
    }
    if (empty) empty.hidden = resultCount !== 0;
  }

  /* Cards ------------------------------------------------------------------ */

  function currentOrder() {
    return [...grid.children].filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute("data-gallery-item"),
    );
  }

  function orderDiffers(order: HTMLElement[]) {
    const current = currentOrder();
    return current.length !== order.length || current.some((el, i) => el !== order[i]);
  }

  function applyOrder(order: HTMLElement[]): boolean {
    if (!orderDiffers(order)) return false;
    const fragment = document.createDocumentFragment();
    for (const el of order) fragment.append(el);
    grid.append(fragment);
    return true;
  }

  async function syncCards(animate: boolean) {
    const mine = ++run;
    for (const el of items) for (const a of el.getAnimations()) a.cancel();
    grid.getAnimations().forEach((a) => a.cancel());
    grid.style.overflow = "";

    const ordered = orderedEntries();
    const matching = ordered.filter(matchesEntry);
    const order = ordered.map((entry) => entry.element);
    if (contribute) order.push(contribute);
    const next = new Set<HTMLElement>(matching.map((entry) => entry.element));
    if (contribute) next.add(contribute); // the contribution card is always there

    const before = items.filter((el) => !el.hidden);
    const leaving = before.filter((el) => !next.has(el));
    const entering = items.filter((el) => el.hidden && next.has(el));
    const staying = before.filter((el) => next.has(el));
    const n = matching.length;
    status.textContent = countLabel(n) + " shown";
    syncControls(n);

    const mutate = () => {
      applyOrder(order);
      for (const el of leaving) el.hidden = true;
      for (const el of entering) {
        el.hidden = false;
        el.setAttribute("data-in", "");
      }
    };

    const changedOrder = orderDiffers(order);
    if (!leaving.length && !entering.length && !changedOrder) return;

    if (!animate || reducedMotion) {
      mutate();
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

    // 2. Sort and change visibility, then play the movement backwards (FLIP).
    mutate();
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
      el.style.animation = "none"; // the scroll-reveal entrance would fight this one
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

  /* Rendering and state changes -------------------------------------------- */

  function render(animate: boolean) {
    if (titles[state.key]) document.title = titles[state.key];
    syncPills();
    syncMorphs(animate);
    void syncCards(animate);
  }

  function commit(push = false, animate = true) {
    render(animate);
    writeUrl(push);
  }

  function go(key: string, push: boolean) {
    if (key === state.key) return;
    state.key = key;
    commit(push, true);
  }

  function clearAdvanced() {
    state.query = "";
    state.tags.clear();
    commit(false, true);
    searchInput?.focus();
  }

  /* Wiring ------------------------------------------------------------------ */

  root.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target as Element;

    const pill = target.closest<HTMLAnchorElement>("a[data-filter-key]");
    if (pill) {
      event.preventDefault();
      const key = pill.dataset.filterKey!;
      if (event.isTrusted && key !== state.key) trackGalleryFilter(key);
      go(key, true);
      return;
    }

    const tag = target.closest<HTMLButtonElement>("button[data-tag-filter]");
    if (tag && !tag.disabled) {
      const name = tag.dataset.tagFilter!;
      if (state.tags.has(name)) state.tags.delete(name);
      else state.tags.add(name);
      commit(false, true);
      return;
    }

    if (resetAdvanced?.contains(target)) {
      clearAdvanced();
      return;
    }

    if (reset?.contains(target)) {
      state.sort = DEFAULT_SORT;
      clearAdvanced();
    }
  });

  searchInput?.addEventListener("input", () => {
    state.query = searchInput.value;
    render(true);
    syncLinks();
    writeUrlSoon();
  });

  searchInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (searchInput.value) {
      state.query = "";
      commit(false, true);
    } else {
      searchInput.blur();
    }
  });

  clearSearch?.addEventListener("click", () => {
    state.query = "";
    commit(false, true);
    searchInput?.focus();
  });

  sortSelect?.addEventListener("change", () => {
    const value = sortSelect.value as SortKey;
    state.sort = SORT_KEYS.has(value) ? value : DEFAULT_SORT;
    commit(false, true);
  });

  tagsToggle?.addEventListener("click", () => {
    tagsExpanded = !tagsExpanded;
    syncTagVisibility();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    const typing =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target instanceof HTMLElement && target.isContentEditable);
    if (typing) return;
    event.preventDefault();
    searchInput?.focus();
  });

  addEventListener("popstate", () => {
    state = readState();
    render(true);
    syncLinks();
  });

  // Keep the highlight under its pill when the pills reflow.
  new ResizeObserver(() => {
    for (const nav of navs) place(nav, false);
  }).observe(root);

  tagsExpanded = [...state.tags].some((tag) =>
    tagButtons.some(
      (button) => button.dataset.tagFilter === tag && button.hasAttribute("data-tag-extra"),
    ),
  );

  for (const nav of navs) place(nav, false);
  render(false);
  syncLinks();
  void document.fonts?.ready.then(() => {
    for (const nav of navs) place(nav, false);
  });
}

const root = document.querySelector<HTMLElement>("[data-gallery]");
if (root) init(root);
