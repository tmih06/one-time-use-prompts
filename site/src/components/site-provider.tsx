import { RootProvider } from "fumadocs-ui/provider/astro";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared";

// Search triggers stay rendered; the real dialog is loaded by scripts/site.ts on demand.
const NoSearchDialog = () => null;

/** Fumadocs context for build-time rendering. None of this React reaches the browser. */
export function SiteProvider({ pathname, children }: { pathname: string; children: ReactNode }) {
  return (
    <RootProvider
      pathname={pathname}
      theme={{ enabled: false }}
      search={{ SearchDialog: NoSearchDialog }}
    >
      {children}
    </RootProvider>
  );
}

/** Home layout plus the mobile menu panel, which scripts/site.ts mounts when opened. */
export function HomeShell({ pathname, children }: { pathname: string; children: ReactNode }) {
  return (
    <SiteProvider pathname={pathname}>
      <HomeLayout {...baseOptions()}>{children}</HomeLayout>
      <template id="nd-home-menu">
        <div data-open="" className="overflow-hidden mx-auto max-w-(--fd-layout-width) lg:hidden">
          <div className="flex flex-col pt-2 p-4 sm:flex-row sm:items-center sm:justify-end">
            <div data-menu-row="" className="-ms-1.5 flex flex-row items-center gap-2 max-sm:mt-2">
              <div role="separator" className="flex-1" />
            </div>
          </div>
        </div>
      </template>
    </SiteProvider>
  );
}
