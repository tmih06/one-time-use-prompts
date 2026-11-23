import { AstroProvider } from "fumadocs-core/framework/astro";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import SearchDialog from "@/components/search";

type Setter = (update: boolean | ((open: boolean) => boolean)) => void;

function App({ register, initial }: { register: (set: Setter) => void; initial: boolean }) {
  const [open, setOpen] = useState(initial);
  const { dialogHandle } = useSearchContext();
  useEffect(() => register(setOpen), [register]);
  return <SearchDialog open={open} onOpenChange={setOpen} dialogHandle={dialogHandle} />;
}

/** Mounts the Fumadocs search dialog; the only React that ever runs in the browser. */
export function mountSearch(initial: boolean): Promise<Setter> {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.append(host);
    createRoot(host).render(
      <AstroProvider pathname={location.pathname}>
        <App register={resolve} initial={initial} />
      </AstroProvider>,
    );
  });
}
