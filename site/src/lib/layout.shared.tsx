import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Box } from "lucide-react";
import { appName, gitConfig } from "./shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="font-logo flex items-center gap-2 text-[0.8125rem] font-bold uppercase">
          <Box className="size-5" />
          {appName}
        </span>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
