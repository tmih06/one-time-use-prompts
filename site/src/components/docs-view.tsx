import type { Root } from "fumadocs-core/page-tree";
import type { TOCItemType } from "fumadocs-core/toc";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { PanelLeft } from "lucide-react";
import type { Tweet } from "react-tweet/api";
import { ContributeLabel } from "@/components/contribute-link";
import { getMDXComponents } from "@/components/mdx";
import { PromptActions } from "@/components/prompt-actions";
import { PromptTags } from "@/components/prompt-tags";
import { TweetSourceCard } from "@/components/tweet-card";
import { SidebarFolder, SidebarItem } from "@/components/sidebar-tree";
import { SiteProvider } from "@/components/site-provider";
import { baseOptions } from "@/lib/layout.shared";
import { contributingUrl, getSourceUrl } from "@/lib/shared";
import { docs } from "@/lib/source";
import { tweetIdFromUrl } from "@/lib/tweet";

interface DocsViewProps {
  path: string;
  pathname: string;
  markdownUrl: string;
  toc: TOCItemType[];
  tree: Root;
  tweets?: Tweet[];
}

const iconButton =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors duration-100 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-fd-ring hover:bg-fd-accent hover:text-fd-accent-foreground [&_svg]:size-4.5 p-2";

/** Mobile sidebar shell. scripts/site.ts mounts it and copies the tree and links into it. */
function DrawerTemplate() {
  return (
    <template id="nd-drawer">
      <div
        data-drawer-overlay=""
        data-state="open"
        className="fixed z-40 inset-0 backdrop-blur-xs data-[state=open]:animate-fd-fade-in data-[state=closed]:animate-fd-fade-out"
      />
      <aside
        id="nd-sidebar-mobile"
        data-state="open"
        className="fixed text-[0.9375rem] flex flex-col shadow-lg border-s inset-e-0 inset-y-0 w-[85%] max-w-[380px] z-40 bg-fd-background data-[state=open]:animate-fd-sidebar-in data-[state=closed]:animate-fd-sidebar-out"
      >
        <div className="flex flex-col gap-3 p-4 pb-2">
          <div className="flex text-fd-muted-foreground items-center gap-1.5">
            <div data-drawer-links="" className="flex flex-1" />
            <button
              type="button"
              aria-label="Close Sidebar"
              aria-expanded="true"
              aria-controls="nd-sidebar-mobile"
              className={iconButton}
            >
              <PanelLeft />
            </button>
          </div>
        </div>
      </aside>
    </template>
  );
}

export function DocsView({ path, pathname, markdownUrl, toc, tree, tweets = [] }: DocsViewProps) {
  const page = docs.getPage(path);
  if (!page) throw new Error(`unknown page: ${path}`);
  const MDX = page.body;

  // Sources that rendered as a source card don't need a link chip too — the
  // card itself links out. Only the first tweet gets a card. Chips stay for everything else, and for tweets
  // that failed to fetch.
  const renderedTweetIds = new Set(tweets.slice(0, 1).map((t) => t.id_str));
  const sourceChips = (page.source ?? []).filter((url) => {
    const id = tweetIdFromUrl(url);
    return !id || !renderedTweetIds.has(id);
  });

  return (
    <SiteProvider pathname={pathname}>
      <DocsLayout
        {...baseOptions()}
        tree={tree}
        sidebar={{ components: { Folder: SidebarFolder, Item: SidebarItem } }}
        links={[
          {
            type: "icon",
            label: "Contribute yours!",
            icon: <ContributeLabel />,
            text: "Contribute yours!",
            url: contributingUrl,
            external: true,
          },
        ]}
      >
        <DocsPage
          toc={toc}
          full
          tableOfContent={{
            enabled: true,
            component: (
              <PromptActions
                markdownUrl={markdownUrl}
                githubUrl={getSourceUrl(path)}
                tweets={tweets}
              />
            ),
          }}
          tableOfContentPopover={{ enabled: false }}
        >
          <DocsTitle>{page.title}</DocsTitle>
          <PromptTags
            phase={page.phase}
            purpose={page.purpose}
            tags={page.tags}
            author={page.author}
            source={sourceChips}
          />
          <DocsDescription>{page.description}</DocsDescription>
          <DocsBody>
            <MDX components={getMDXComponents()} />
          </DocsBody>
          {/* The rail is hidden below xl, so the source card follows the prompt there. */}
          {tweets[0] && <TweetSourceCard tweet={tweets[0]} className="mt-6 max-w-md xl:hidden" />}
        </DocsPage>
      </DocsLayout>
      <DrawerTemplate />
    </SiteProvider>
  );
}
