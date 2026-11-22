import { createFileRoute } from "@tanstack/react-router";
import { serveLlms } from "@/lib/serve-llms";

export const Route = createFileRoute("/{$}.md")({
  server: { handlers: { GET: serveLlms } },
});
