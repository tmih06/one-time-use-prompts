import { createFileRoute, Link } from "@tanstack/react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/lib/layout.shared";
import { appName } from "@/lib/shared";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <HomeLayout {...baseOptions()}>
      <div className="flex flex-col items-center justify-center text-center flex-1 px-4">
        <h1 className="font-semibold text-3xl mb-3">{appName}</h1>
        <p className="text-fd-muted-foreground max-w-md mb-6">
          Focused instructions run exactly once — at project creation or on an existing codebase.
          Search the library to find the right play.
        </p>
        <Link
          to="/docs/$"
          params={{
            _splat: "",
          }}
          className="px-4 py-2 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium text-sm mx-auto"
        >
          Browse the Library
        </Link>
      </div>
    </HomeLayout>
  );
}
