import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Ticket } from "lucide-react";
import { appName, repoUrl } from "./shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="font-logo flex items-center gap-2 text-[0.8125rem] font-bold uppercase">
          <Ticket className="size-5" />
          {appName}
        </span>
      ),
    },
    githubUrl: repoUrl,
  };
}
