/** All page interactivity. Pages are static HTML; this replaces client-side React. */

const TRIGGER = "[data-search], [data-search-full]";
const NESTED_SCROLLERS = ".fd-scroll-container, #nd-sidebar, #nd-sidebar-mobile, [role='dialog']";
const CHECK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>';

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
    } catch {}
    void getComputedStyle(root).opacity; // flush styles while transitions are off
    requestAnimationFrame(() => freeze.remove());
  };
  if (document.startViewTransition) document.startViewTransition(apply);
  else apply();
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

/* Sidebar folders --------------------------------------------------------- */

function toggleFolder(folder: HTMLElement, button: HTMLElement) {
  const panel = button.nextElementSibling as HTMLElement;
  const chevron = button.querySelector("[data-icon]");
  const opening = panel.hidden === true;
  button.setAttribute("aria-expanded", String(opening));
  folder.toggleAttribute("data-open", opening);
  folder.toggleAttribute("data-closed", !opening);
  chevron?.classList.toggle("-rotate-90", !opening);
  chevron?.classList.toggle("rtl:rotate-90", !opening);

  panel.hidden = false;
  const height = `${panel.scrollHeight}px`;
  const frames = [
    { height: "0px", opacity: 0 },
    { height, opacity: 1 },
  ];
  const animation = panel.animate(opening ? frames : frames.reverse(), { duration: 150 });
  if (!opening) animation.onfinish = () => (panel.hidden = true);
}

/* Desktop sidebar collapse ------------------------------------------------ */

const EXPANDED =
  "absolute flex flex-col w-full inset-s-0 inset-y-0 items-end bg-fd-card text-sm border-e duration-250 *:w-(--fd-sidebar-width)";
const COLLAPSED =
  "absolute flex flex-col inset-s-0 items-end bg-fd-card text-sm duration-250 *:w-(--fd-sidebar-width) inset-y-2 rounded-xl border w-(--fd-sidebar-width) transition-[width,inset-block,translate,background-color]";
const HIDDEN = "-translate-x-(--fd-sidebar-width) rtl:translate-x-full";
const PEEKING = "shadow-lg translate-x-2 rtl:-translate-x-2";

let collapsed = false;
let hoverStrip: HTMLElement | undefined;
let leaveTimer: number | undefined;

function paintSidebar(hovered: boolean) {
  const sidebar = document.getElementById("nd-sidebar");
  const panel = document.querySelector<HTMLElement>("[data-sidebar-panel]");
  if (!sidebar || !panel) return;
  sidebar.className = collapsed ? `${COLLAPSED} ${hovered ? PEEKING : HIDDEN}` : EXPANDED;
  sidebar.dataset.collapsed = String(collapsed);
  sidebar.dataset.hovered = String(collapsed && hovered);
  sidebar.inert = collapsed && !hovered;
  const hidePanel = !collapsed || hovered;
  panel.classList.toggle("pointer-events-none", hidePanel);
  panel.classList.toggle("opacity-0", hidePanel);
  panel.inert = hidePanel;
}

function setCollapsed(next: boolean) {
  const layout = document.getElementById("nd-docs-layout");
  const sidebar = document.getElementById("nd-sidebar");
  if (!layout || !sidebar) return;
  collapsed = next;
  layout.dataset.sidebarCollapsed = String(next);
  layout.style.setProperty("--fd-sidebar-col", next ? "0px" : "var(--fd-sidebar-width)");
  for (const button of document.querySelectorAll('[aria-label="Collapse Sidebar"]')) {
    button.setAttribute("aria-expanded", String(!next));
    button.setAttribute("data-collapsed", String(next));
  }
  if (next && !hoverStrip) {
    hoverStrip = document.createElement("div");
    hoverStrip.className = "absolute inset-s-0 inset-y-0 w-4";
    hoverStrip.addEventListener("pointerenter", () => peek(true));
    hoverStrip.addEventListener("pointerleave", () => peek(false));
    sidebar.before(hoverStrip);
    sidebar.addEventListener("pointerenter", () => peek(true));
    sidebar.addEventListener("pointerleave", () => peek(false));
  }
  if (hoverStrip) hoverStrip.hidden = !next;
  paintSidebar(false);
}

function peek(hovered: boolean) {
  if (!collapsed) return;
  clearTimeout(leaveTimer);
  if (hovered) paintSidebar(true);
  else leaveTimer = window.setTimeout(() => paintSidebar(false), 150);
}

/* Mobile drawer ----------------------------------------------------------- */

function openDrawer() {
  const template = document.querySelector<HTMLTemplateElement>("#nd-drawer");
  const sidebar = document.getElementById("nd-sidebar");
  if (!template || !sidebar || document.getElementById("nd-sidebar-mobile")) return;

  const content = template.content.cloneNode(true) as DocumentFragment;
  const drawer = content.querySelector<HTMLElement>("#nd-sidebar-mobile")!;
  const links = content.querySelector<HTMLElement>("[data-drawer-links]")!;
  for (const link of sidebar.querySelectorAll<HTMLElement>("a[aria-label]")) {
    const copy = link.cloneNode(true) as HTMLElement;
    copy.classList.replace("p-1.5", "p-2");
    links.append(copy);
  }
  const theme = sidebar.querySelector("[data-theme-toggle]")?.cloneNode(true) as HTMLElement;
  if (theme) {
    theme.className =
      "inline-flex items-center rounded-full border overflow-hidden *:rounded-full p-0";
    links.after(theme);
  }
  const tree = sidebar.querySelector(":scope > [role=presentation]")?.cloneNode(true);
  if (tree) drawer.append(tree);
  document.body.append(content);
  setDrawerButtons(true);
}

function closeDrawer() {
  const parts = document.querySelectorAll<HTMLElement>("#nd-sidebar-mobile, [data-drawer-overlay]");
  for (const part of parts) {
    part.dataset.state = "closed";
    part.addEventListener("animationend", () => part.remove(), { once: true });
  }
  setDrawerButtons(false);
}

function setDrawerButtons(open: boolean) {
  for (const button of document.querySelectorAll('[aria-label="Open Sidebar"]'))
    button.setAttribute("aria-expanded", String(open));
}

/* Home mobile menu -------------------------------------------------------- */

let menuPanel: HTMLElement | undefined;

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
    const github = header.querySelector('a[aria-label="GitHub"]')?.cloneNode(true) as HTMLElement;
    if (github) {
      github.classList.add("-mx-1", "first:ms-0");
      row.prepend(github);
    }
    const theme = header.querySelector("[data-theme-toggle]")?.cloneNode(true);
    if (theme) row.append(theme);
    nav.append(menuPanel);
  }
  if (menuPanel) menuPanel.hidden = !open;
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
    button.querySelector("svg")!.outerHTML = original;
    button.removeAttribute("data-checked");
  }, 1500);
}

function copyFrom(button: HTMLElement) {
  const figure = button.closest("figure");
  const heading = button.closest<HTMLElement>("h1,h2,h3,h4,h5,h6");
  const text = figure
    ? (figure.querySelector("pre")?.textContent ?? "")
    : heading
      ? `${location.origin}${location.pathname}#${heading.id}`
      : "";
  void navigator.clipboard.writeText(text).then(() => flashCopied(button));
}

/* Events ------------------------------------------------------------------ */

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const menuOpen = document.getElementById("nd-nav")?.hasAttribute("data-open");
  if (menuOpen && !target.closest("#nd-nav")) setMenu(false);

  if (target.closest("[data-drawer-overlay]")) return closeDrawer();

  const button = target.closest<HTMLElement>("button");
  if (!button) return;
  if (button.matches("[data-theme-toggle]")) return toggleTheme();
  if (button.matches(TRIGGER)) return openSearch();

  const label = button.getAttribute("aria-label");
  if (label === "Collapse Sidebar") return setCollapsed(!collapsed);
  if (label === "Open Sidebar") return openDrawer();
  if (label === "Close Sidebar") return closeDrawer();
  if (label === "Toggle Menu") return setMenu(!menuOpen);

  const folder = button.parentElement;
  if (folder?.matches("[data-folder]")) return toggleFolder(folder, button);
  if (button.matches("[aria-live]")) copyFrom(button);
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
    openSearch(true);
  } else if (
    (event.metaKey || event.ctrlKey) &&
    !event.shiftKey &&
    !event.altKey &&
    event.key === "b" &&
    !isTyping(event.target) &&
    matchMedia("(width >= 768px)").matches
  ) {
    event.preventDefault();
    setCollapsed(!collapsed);
  } else if (event.key === "Escape") {
    if (document.getElementById("nd-sidebar-mobile")) closeDrawer();
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

/* Keep the sidebar's scroll position across page loads --------------------- */

const SIDEBAR_SCROLL = "nd-sidebar-scroll";
const sidebarViewport = document.querySelector("#nd-sidebar [data-id$='-viewport']");
if (sidebarViewport) {
  sidebarViewport.scrollTop = Number(sessionStorage.getItem(SIDEBAR_SCROLL) ?? 0);
  addEventListener("pagehide", () =>
    sessionStorage.setItem(SIDEBAR_SCROLL, String(sidebarViewport.scrollTop)),
  );
}

if (import.meta.env.DEV) void import("./dev-tools");

/* Smooth scrolling, once the browser is idle -------------------------------- */

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const start = () =>
    void import("lenis").then(
      ({ default: Lenis }) =>
        new Lenis({
          autoRaf: true,
          lerp: 0.1,
          prevent: (node) => node.closest(NESTED_SCROLLERS) !== null,
        }),
    );
  if ("requestIdleCallback" in window) requestIdleCallback(start, { timeout: 2000 });
  else setTimeout(start, 200);
}
