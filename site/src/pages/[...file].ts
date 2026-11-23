import type { APIRoute, GetStaticPaths } from "astro";
import { docsLlms } from "@/lib/source";

/** llms.txt, llms-full.txt and the per-page .md/.txt files. */
export const getStaticPaths = (async () =>
  (await docsLlms.files()).map((file) => ({
    params: { file: file.replace(/^\//, "") },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) =>
  (await docsLlms.serve(`/${params.file}`)) ?? new Response(null, { status: 404 });
