import { parseAuthor } from "@/components/prompt-author";
import { count, getPrompts, PHASES, purposeTitle, type PromptSummary } from "@/lib/prompts";
import { appName, repoUrl } from "@/lib/shared";

/** One place for everything a crawler reads that is not page content: titles, descriptions, JSON-LD, sitemap URLs. */

export const defaultDescription =
  "A curated library of focused prompts that run exactly once — at project creation or on an existing codebase.";

/** Social image used by pages that have no image of their own (home, purpose pages, 404). */
export const defaultOgImage = "/og/prompts/image.webp";

/** Size of the generated /og images (fumadocs/takumi default). */
export const ogImageSize = { width: 1200, height: 630 } as const;

const TITLE_LIMIT = 70;

/** Document title; the site name is appended only when the whole title stays short. */
export function documentTitle(title?: string): string {
  if (!title || title === appName) return appName;
  const withSite = `${title} | ${appName}`;
  return withSite.length <= TITLE_LIMIT ? withSite : title;
}

const clip = (text: string, max = 160) =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;

export const browsePath = (phase?: string, purpose?: string) =>
  ["/prompts", phase, purpose].filter(Boolean).join("/");

/** Newest `updated` date. Compared as instants: the commit dates carry different UTC offsets. */
export const latest = (prompts: PromptSummary[]) =>
  prompts
    .map((p) => p.updated)
    .filter((d): d is string => !!d)
    .sort((a, b) => Date.parse(a) - Date.parse(b))
    .at(-1);

/** Title, description and member prompts of a browse page (library, phase or purpose). */
export function browseMeta(phase?: string, purpose?: string) {
  const info = PHASES.find((p) => p.slug === phase);
  const kicker = (info?.kicker ?? phase ?? "").toLowerCase();
  const prompts = getPrompts().filter(
    (p) => (!phase || p.phase === phase) && (!purpose || p.purpose === purpose),
  );
  const title = purpose
    ? `${purposeTitle(purpose)} prompts for ${kicker} projects`
    : info
      ? `${info.title} prompts for ${kicker} projects`
      : "All one-time-use prompts";
  const lead = purpose
    ? `${purposeTitle(purpose)} prompts for ${kicker} projects.`
    : (info?.blurb ??
      "Every prompt in the library, each run exactly once at one specific moment in a project’s life.");
  return {
    title,
    description: clip(`${lead} ${count(prompts.length)}, each run exactly once.`),
    prompts,
    modified: latest(prompts),
  };
}

export interface Crumb {
  name: string;
  path: string;
}

/** The same trail the page shows (prompt page: components/prompt-page.tsx; browse pages: components/gallery.tsx). */
export function browseCrumbs(phase?: string, purpose?: string): Crumb[] {
  const info = PHASES.find((p) => p.slug === phase);
  return [
    { name: "Library", path: "/prompts" },
    ...(info ? [{ name: info.title, path: browsePath(phase) }] : []),
    ...(info && purpose ? [{ name: purposeTitle(purpose), path: browsePath(phase, purpose) }] : []),
  ];
}

export const promptPath = (p: PromptSummary) => `/prompts/${p.splat}`;

export function promptCrumbs(p: PromptSummary): Crumb[] {
  return [...browseCrumbs(p.phase, p.purpose), { name: p.title, path: promptPath(p) }];
}

type Kind = "home" | "browse" | "prompt";

interface GraphInput {
  site: URL;
  kind: Kind;
  path: string;
  title: string;
  description: string;
  image: string;
  crumbs: Crumb[];
  modified?: string;
  /** Cards listed on the page (home and browse pages). */
  list?: PromptSummary[];
  /** The prompt a prompt page is about. */
  prompt?: PromptSummary;
}

/** JSON-LD for one page: WebSite + (Collection)WebPage + BreadcrumbList, plus ItemList or TechArticle. */
export function pageGraph(input: GraphInput) {
  const { site, kind, path, title, description, image, crumbs, modified, list, prompt } = input;
  const abs = (p: string) => new URL(p, site).href;
  const url = abs(path);
  const origin = abs("/");
  const websiteId = `${origin}#website`;
  const pageId = `${url}#webpage`;
  const crumbId = `${url}#breadcrumb`;
  const listId = `${url}#list`;
  const articleId = `${url}#article`;

  const nodes: Record<string, unknown>[] = [
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: origin,
      name: appName,
      description: defaultDescription,
      inLanguage: "en",
      sameAs: [repoUrl],
    },
    {
      "@type": kind === "prompt" ? "WebPage" : "CollectionPage",
      "@id": pageId,
      url,
      name: title,
      description,
      inLanguage: "en",
      isPartOf: { "@id": websiteId },
      breadcrumb: { "@id": crumbId },
      primaryImageOfPage: { "@type": "ImageObject", url: abs(image), ...ogImageSize },
      ...(modified && { dateModified: modified }),
      ...(kind === "prompt"
        ? { mainEntity: { "@id": articleId } }
        : { mainEntity: { "@id": listId } }),
    },
    {
      "@type": "BreadcrumbList",
      "@id": crumbId,
      itemListElement: crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: abs(c.path),
      })),
    },
  ];

  if (list) {
    nodes.push({
      "@type": "ItemList",
      "@id": listId,
      numberOfItems: list.length,
      itemListElement: list.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: abs(promptPath(p)),
        name: p.title,
      })),
    });
  }

  if (prompt) {
    // The byline the page shows: "@handle" for an X account, the name as written otherwise.
    // A model name is not a Person or Organization, so AI-authored prompts carry no author.
    const { label, handle, ai } = prompt.author ? parseAuthor(prompt.author) : { label: "" };
    const author = handle
      ? { "@type": "Person", name: label, url: `https://x.com/${handle}` }
      : label && !ai
        ? { "@type": "Person", name: label }
        : undefined;
    nodes.push({
      "@type": "TechArticle",
      "@id": articleId,
      headline: prompt.title,
      description: prompt.description,
      url,
      mainEntityOfPage: { "@id": pageId },
      isPartOf: { "@id": websiteId },
      inLanguage: "en",
      image: abs(image),
      articleSection: purposeTitle(prompt.purpose),
      ...(prompt.tags.length > 0 && { keywords: prompt.tags.join(", ") }),
      ...(prompt.updated && { dateModified: prompt.updated }),
      ...(author && { author }),
    });
  }

  return { "@context": "https://schema.org", "@graph": nodes };
}

/** A JSON-LD object as the text of a <script>: "<" is escaped so content can never close the tag. */
export const jsonLdText = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

/** Every public-index URL with the date its content last changed. Mirrors the routes in pages/prompts/[...slug].astro. */
export function publicUrls(): { path: string; lastmod?: string }[] {
  const prompts = getPrompts();
  const phases = [...new Set(prompts.map((p) => p.phase))].sort();
  const purposes = [...new Set(prompts.map((p) => `${p.phase}/${p.purpose}`))].sort();
  return [
    { path: "/", lastmod: latest(prompts) },
    { path: "/prompts", lastmod: latest(prompts) },
    ...phases.map((phase) => ({
      path: browsePath(phase),
      lastmod: latest(prompts.filter((p) => p.phase === phase)),
    })),
    ...purposes.map((key) => {
      const [phase, purpose] = key.split("/");
      return {
        path: browsePath(phase, purpose),
        lastmod: latest(prompts.filter((p) => p.phase === phase && p.purpose === purpose)),
      };
    }),
    ...prompts.map((p) => ({ path: promptPath(p), lastmod: p.updated })),
  ];
}
