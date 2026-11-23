import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href: string;
}

/** Trail above a page title; the last crumb is the current page. Hidden when there's only one. */
export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      hidden={crumbs.length < 2}
      className="mb-5 flex flex-wrap items-center gap-1.5 text-sm"
    >
      {crumbs.map((c, i) => (
        <span key={c.href} className="inline-flex min-w-0 items-center gap-1.5">
          {i === crumbs.length - 1 ? (
            <span aria-current="page" className="truncate font-medium">
              {c.label}
            </span>
          ) : (
            <a href={c.href} className="text-muted-foreground hover:text-foreground">
              {c.label}
            </a>
          )}
          {i < crumbs.length - 1 && (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
          )}
        </span>
      ))}
    </nav>
  );
}
