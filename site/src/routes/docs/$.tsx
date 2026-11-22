import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { createServerFn } from "@tanstack/react-start";
import { docs, source } from "@/lib/source";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { baseOptions } from "@/lib/layout.shared";
import { contributingUrl, getPageImageUrl, gitConfig, repoUrl } from "@/lib/shared";
import { PromptActions } from "@/components/prompt-actions";
import { ContributeLabel } from "@/components/contribute-link";
import { PromptTags } from "@/components/prompt-tags";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";
import { useFumadocsLoader } from "fumadocs-core/source/client";
import { Suspense, use } from "react";
import { useMDXComponents } from "@/components/mdx";

export const Route = createFileRoute("/docs/$")({
  component: Page,
  loader: async ({ params }) => {
    const slugs = params._splat?.split("/") ?? [];
    const data = await loader({ data: slugs });
    await docs.getPage(data.path)?.preload();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ property: "og:image", content: loaderData.imageUrl }] : [],
  }),
});

const loader = createServerFn({
  method: "GET",
})
  .validator((slugs: string[]) => slugs)
  .middleware([staticFunctionMiddleware])
  .handler(async ({ data: slugs }) => {
    const page = source.getPage(slugs);
    if (!page) throw notFound();

    return {
      path: page.path,
      markdownUrl: `${page.url}.md`,
      imageUrl: getPageImageUrl(page).url,
      pageTree: await source.serializePageTree(source.getPageTree()),
    };
  });

function Content({ path, markdownUrl }: { path: string; markdownUrl: string }) {
  const page = docs.getPage(path);
  if (!page) throw new Error(`unknown page: ${path}`);

  const { toc } = use(page.load());
  const MDX = page.body;
  const mdxComponents = useMDXComponents();

  const githubUrl = `${repoUrl}/blob/${gitConfig.branch}/content/docs/${encodeURI(path)}`;

  return (
    <DocsPage
      toc={toc}
      full
      tableOfContent={{
        enabled: true,
        component: <PromptActions markdownUrl={markdownUrl} githubUrl={githubUrl} />,
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
      <DocsBody>
        <MDX components={mdxComponents} />
      </DocsBody>
    </DocsPage>
  );
}

function Page() {
  const { pageTree, path, markdownUrl } = useFumadocsLoader(Route.useLoaderData());

  return (
    <DocsLayout
      {...baseOptions()}
      tree={pageTree}
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
      <Suspense>
        <Content path={path} markdownUrl={markdownUrl} />
      </Suspense>
    </DocsLayout>
  );
}
