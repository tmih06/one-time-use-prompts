import Lenis from "lenis";
import { initAnalytics, trackPromptCopy } from "./analytics";

/** All page interactivity. Pages are static HTML; this replaces client-side React. */

const TRIGGER = "[data-search], [data-search-full]";
const NESTED_SCROLLERS = ".fd-scroll-container, [role='dialog']";
const CHECK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check icon-pop"><path d="M20 6 9 17l-5-5"/></svg>';

const EASE_TRAVEL = "cubic-bezier(0.45, 0, 0.1, 1)";
const EASE_ARRIVE = "cubic-bezier(0.25, 0.8, 0.25, 1)";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

/* Theme ------------------------------------------------------------------ */

function toggleTheme() {
  const root = document.documentElement;
  const next = root.classList.contains("dark") ? "light" : "dark";
  const apply = () => {
    const freeze = document.createElement("style");
    freeze.textContent = "*,*::before,*::after{transition:none!important}";
    document.head.append(freeze);
    root.classList.remove("light", "dark");
    root.classList.add(next);
    root.style.colorScheme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* Private mode or blocked storage: the theme still applies for this visit. */
    }
    void getComputedStyle(root).opacity; // flush styles while transitions are off
    requestAnimationFrame(() => freeze.remove());
  };
  if (!document.startViewTransition || reducedMotion) return apply();

  /* data-theming lets CSS give this fade its own slower timing than the page fade. */
  root.setAttribute("data-theming", "");
  const transition = document.startViewTransition(apply);
  void transition.finished.finally(() => root.removeAttribute("data-theming"));
}

/* Search (React loads only here) ------------------------------------------ */

type SearchSetter = Awaited<ReturnType<typeof import("./search-island").mountSearch>>;
let searchSetter: SearchSetter | undefined;
let searchMounting: Promise<SearchSetter> | undefined;
const preloadSearch = () => import("./search-island");

function openSearch(toggle = false) {
  if (searchSetter) {
    searchSetter(toggle ? (open) => !open : true);
    return;
  }
  searchMounting ??= preloadSearch().then(({ mountSearch }) => mountSearch(true));
  void searchMounting.then((set) => (searchSetter = set));
}

/* Home mobile menu -------------------------------------------------------- */

let menuPanel: HTMLElement | undefined;

/** The panel grows from the header and folds back into it; its height is measured, never guessed. */
function animateMenu(panel: HTMLElement, open: boolean) {
  for (const running of panel.getAnimations()) running.cancel();
  if (reducedMotion) {
    panel.hidden = !open;
    return;
  }
  if (open) {
    panel.hidden = false;
    panel.animate(
      { height: ["0px", `${panel.scrollHeight}px`], opacity: [0, 1] },
      { duration: 320, easing: EASE_ARRIVE },
    );
  } else {
    const fold = panel.animate(
      { height: [`${panel.offsetHeight}px`, "0px"], opacity: [1, 0] },
      { duration: 200, easing: EASE_TRAVEL },
    );
    fold.onfinish = () => {
      if (!document.getElementById("nd-nav")?.hasAttribute("data-open")) panel.hidden = true;
    };
  }
}

function setMenu(open: boolean) {
  const header = document.getElementById("nd-nav");
  const nav = header?.querySelector("nav");
  const template = document.querySelector<HTMLTemplateElement>("#nd-home-menu");
  const toggle = header?.querySelector('[aria-label="Toggle Menu"]');
  if (!header || !nav || !template || !toggle) return;

  if (open && !menuPanel) {
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    menuPanel = fragment.firstElementChild as HTMLElement;
    const row = menuPanel.querySelector("[data-menu-row]")!;
    const github = header.querySelector('a[aria-label^="GitHub"]')?.cloneNode(true) as HTMLElement;
    if (github) {
      github.classList.add("-mx-1", "first:ms-0");
      row.prepend(github);
    }
    const theme = header.querySelector("[data-theme-toggle]")?.cloneNode(true);
    if (theme) row.append(theme);
    nav.append(menuPanel);
  }
  if (menuPanel) animateMenu(menuPanel, open);
  header.toggleAttribute("data-open", open);
  header.toggleAttribute("data-closed", !open);
  nav.classList.toggle("max-lg:shadow-lg", open);
  nav.classList.toggle("max-lg:rounded-b-2xl", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.querySelector("svg")?.classList.toggle("rotate-180", open);
}

/* Copy buttons ------------------------------------------------------------ */

function flashCopied(button: HTMLElement) {
  const icon = button.querySelector("svg");
  if (!icon) return;
  const original = icon.outerHTML;
  icon.outerHTML = CHECK_ICON;
  button.toggleAttribute("data-checked", true);
  setTimeout(() => {
    const check = button.querySelector("svg")!;
    check.outerHTML = original;
    button.querySelector("svg")?.classList.add("icon-pop");
    button.removeAttribute("data-checked");
  }, 1500);
}

function copyFrom(button: HTMLElement, trustedClick: boolean) {
  const figure = button.closest("figure");
  const heading = button.closest<HTMLElement>("h1,h2,h3,h4,h5,h6");
  const text = figure
    ? (figure.querySelector("pre")?.textContent ?? "")
    : heading
      ? `${location.origin}${location.pathname}#${heading.id}`
      : "";
  void navigator.clipboard.writeText(text).then(() => {
    flashCopied(button);
    // A prompt page's only code block is the whole prompt, so its copy button is a prompt copy.
    if (figure) trackPromptCopy(trustedClick);
  });
}

/* Events ------------------------------------------------------------------ */

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const menuOpen = document.getElementById("nd-nav")?.hasAttribute("data-open");
  if (menuOpen && !target.closest("#nd-nav")) setMenu(false);

  const button = target.closest<HTMLElement>("button");
  if (!button) return;
  if (button.matches("[data-theme-toggle]")) return toggleTheme();
  if (button.matches(TRIGGER)) return openSearch();

  if (button.getAttribute("aria-label") === "Toggle Menu") return setMenu(!menuOpen);
  if (button.matches("[aria-live]")) copyFrom(button, event.isTrusted);
});

for (const type of ["pointerover", "focusin"] as const) {
  document.addEventListener(
    type,
    (event) => {
      if (event.target instanceof Element && event.target.closest(TRIGGER)) void preloadSearch();
    },
    { passive: true },
  );
}

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    const gallerySearch = document.querySelector<HTMLInputElement>("[data-gallery-search]");
    if (gallerySearch) gallerySearch.focus();
    else openSearch(true);
  } else if (
    event.key.toLowerCase() === "d" &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !isTyping(event.target)
  ) {
    event.preventDefault();
    toggleTheme();
  }
});

/* "Run in" links carry the absolute page URL ------------------------------ */

for (const link of document.querySelectorAll<HTMLAnchorElement>("a[data-ask]")) {
  const url = new URL(link.href);
  url.searchParams.set(
    link.dataset.ask!,
    `Read ${location.href}, I want to ask questions about it.`,
  );
  link.href = url.href;
}

if (import.meta.env.DEV) void import("./dev-tools");

initAnalytics();

/* Browse pages filter in place; the module only loads where there is a gallery. */
if (document.querySelector("[data-gallery]")) void import("./gallery");

/* Smooth scrolling ---------------------------------------------------------- */

// Imported statically so Lenis ships in the hashed, immutable-cached site bundle
// every page loads and starts right away, instead of fetching a chunk at idle.
if (!reducedMotion) {
  new Lenis({
    autoRaf: true,
    anchors: true,
    lerp: 0.1,
    prevent: (node) => node.closest(NESTED_SCROLLERS) !== null,
  });
}

/* Entrances ----------------------------------------------------------------- */

/**
 * Items already on screen when the page loads are left alone, so navigation
 * shows content immediately. Items below the fold are hidden and rise in as
 * they enter the viewport; those arriving together (a row of cards) cascade
 * in reading order, 50ms apart.
 */
function initReveal() {
  const root = document.documentElement;
  const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (!root.hasAttribute("data-motion")) {
    for (const el of items) el.setAttribute("data-in", "");
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      const arriving = entries
        .filter((e) => e.isIntersecting)
        .sort(
          (a, b) =>
            a.boundingClientRect.top - b.boundingClientRect.top ||
            a.boundingClientRect.left - b.boundingClientRect.left,
        );
      arriving.forEach(({ target }, i) => {
        (target as HTMLElement).style.setProperty("--d", `${Math.min(i * 50, 250)}ms`);
        target.setAttribute("data-in", "");
        observer.unobserve(target);
      });
    },
    { rootMargin: "0px 0px -6% 0px" },
  );
  for (const el of items) {
    if (el.getBoundingClientRect().top < innerHeight) continue; // on screen (or scrolled past): show now
    el.setAttribute("data-wait", "");
    observer.observe(el);
  }
  root.setAttribute("data-motion-ready", "");
}
initReveal();

/* The header gets a hairline once the page has scrolled under it. */
function markScrolled() {
  document.getElementById("nd-nav")?.toggleAttribute("data-scrolled", scrollY > 8);
}
addEventListener("scroll", markScrolled, { passive: true });
markScrolled();
