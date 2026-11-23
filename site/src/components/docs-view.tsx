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
import { TweetCards } from "@/components/tweet-card";
import { SidebarFolder, SidebarItem } from "@/components/sidebar-tree";
import { SiteProvider } from "@/components/site-provider";
import { baseOptions } from "@/lib/layout.shared";
import { contributingUrl, getSourceUrl } from "@/lib/shared";
import { docs } from "@/lib/source";

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
            component: <PromptActions markdownUrl={markdownUrl} githubUrl={getSourceUrl(path)} />,
          }}
          tableOfContentPopover={{ enabled: false }}
        >
          <DocsTitle>{page.title}</DocsTitle>
          <PromptTags
            phase={page.phase}
            purpose={page.purpose}
            tags={page.tags}
            author={page.author}
            source={page.source}
          />
          <DocsDescription>{page.description}</DocsDescription>
          <div
            className={
              tweets.length > 0
                ? "items-start gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]"
                : undefined
            }
          >
            <DocsBody>
              <MDX components={getMDXComponents()} />
            </DocsBody>
            <TweetCards tweets={tweets} />
          </div>
        </DocsPage>
      </DocsLayout>
      <DrawerTemplate />
    </SiteProvider>
  );
}
