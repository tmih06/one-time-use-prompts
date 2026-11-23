import type { Folder, Item } from "fumadocs-core/page-tree";
import { usePathname } from "fumadocs-core/framework";
import { ChevronDown } from "lucide-react";
import { createContext, use, type ReactNode } from "react";

// Fumadocs omits closed folders from static HTML. These replacements always render
// the panel (hidden when closed) so scripts/site.ts can open it without React.
const DepthContext = createContext(0);

const base =
  "relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground wrap-anywhere [&_svg]:size-4 [&_svg]:shrink-0 transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 hover:transition-none";
const link =
  "data-[active=true]:bg-fd-primary/10 data-[active=true]:text-fd-primary data-[active=true]:hover:transition-colors";
const highlight =
  "data-[active=true]:before:content-[''] data-[active=true]:before:bg-fd-primary data-[active=true]:before:absolute data-[active=true]:before:w-px data-[active=true]:before:inset-y-2.5 data-[active=true]:before:inset-s-2.5";
const panel = "overflow-hidden [&[hidden]]:hidden relative flex flex-col gap-0.5 pt-0.5";
const rail =
  "before:content-[''] before:absolute before:w-px before:inset-y-1 before:bg-fd-border before:inset-s-2.5";

const offset = (depth: number) => `calc(${2 + 3 * depth} * var(--spacing))`;
const clean = (url: string) => url.replace(/\/$/, "") || "/";

function containsPage(folder: Folder, pathname: string): boolean {
  if (folder.index && clean(folder.index.url) === pathname) return true;
  return folder.children.some((node) =>
    node.type === "folder"
      ? containsPage(node, pathname)
      : node.type === "page" && clean(node.url) === pathname,
  );
}

export function SidebarItem({ item }: { item: Item }) {
  const depth = use(DepthContext);
  const active = clean(item.url) === clean(usePathname());
  return (
    <a
      href={item.url}
      data-active={active}
      aria-current={active ? "page" : undefined}
      {...(item.external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      className={`${base} ${link} ${depth >= 1 ? highlight : ""}`}
      style={{ paddingInlineStart: offset(depth) }}
    >
      {item.icon}
      <span className="fd-page-tree-item-name">{item.name}</span>
    </a>
  );
}

export function SidebarFolder({ item, children }: { item: Folder; children: ReactNode }) {
  const depth = use(DepthContext);
  const pathname = clean(usePathname());
  const open = item.defaultOpen === true || containsPage(item, pathname);
  return (
    <div data-folder="" {...(open ? { "data-open": "" } : { "data-closed": "" })}>
      <button
        type="button"
        aria-expanded={open}
        className={`${base} w-full`}
        style={{ paddingInlineStart: offset(depth) }}
      >
        {item.icon}
        <span className="fd-page-tree-item-name">{item.name}</span>
        <ChevronDown
          data-icon="true"
          className={`ms-auto transition-transform ${open ? "" : "-rotate-90 rtl:rotate-90"}`}
        />
      </button>
      <div hidden={!open} className={`${panel} ${depth === 0 ? rail : ""}`}>
        <DepthContext value={depth + 1}>
          {item.index && <SidebarItem item={item.index} />}
          {children}
        </DepthContext>
      </div>
    </div>
  );
}
