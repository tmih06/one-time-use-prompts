import { createFileRoute } from "@tanstack/react-router";
import { serveLlms } from "@/lib/serve-llms";

export const Route = createFileRoute("/llms.txt")({
  server: { handlers: { GET: serveLlms } },
});
