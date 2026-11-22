import { docsLlms } from "./source";

/** Shared GET handler for every route that serves llms.txt-style output. */
export const serveLlms = async ({ request }: { request: Request }): Promise<Response> =>
  (await docsLlms.serve(new URL(request.url).pathname)) ?? new Response(null, { status: 404 });
