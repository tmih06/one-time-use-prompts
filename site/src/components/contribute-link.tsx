/**
 * Body of the "Contribute yours!" sidebar link. It is registered as an
 * `icon` link item so Fumadocs renders it inside the footer box next to the
 * GitHub icon; app.css stretches that anchor to fill the free space.
 */
export function ContributeLabel() {
  return (
    <span className="w-full min-w-0 truncate text-xs font-medium text-fd-foreground">
      Contribute yours!
    </span>
  );
}
