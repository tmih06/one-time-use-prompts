## Context

This is a greenfield project — no application code exists yet beyond a bare
skeleton. You are scaffolding a new client-rendered React app whose defining
requirement is speed: it is built, measured, and gated against explicit byte
and interaction budgets from the first commit.

Use TanStack Redact 0.3.1 as the default browser renderer.

## Goal

Scaffold and configure a fast client-rendered React app on the pinned stack
below, wired for intent-based loading, hard byte budgets in CI, and a measured
Redact-vs-React-DOM release decision.

## Inputs

This prompt is self-contained: the stack, budgets, and targets are specified
below. Provide a preview URL via `PREVIEW_URL` when running interaction
profiles.

## Instructions

Work through sections 1–5 in order.

### 1. Stack

- Vite 8.3.8 with Rolldown, React and React DOM 19.3.1, React Compiler 1.0.0,
  strict TypeScript 7.0.2.
- TanStack Router 1.170.46 with router-plugin 1.169.0 for file-based routes.
  TanStack Query 5.108.2 for server data. StyleX 0.19.2 for extracted CSS.
- Bun Canary 1.4.5-canary for development and CI.

### 2. Build with Redact

Register TanStack Router with autoCodeSplitting first, followed by StyleX with
runtimeInjection disabled, react(), Babel with reactCompilerPreset(), and
redact() from @tanstack/redact/vite. Keep standard React imports. Keep a build
switch for React DOM.

### 3. Load on intent

- On entry, start critical queries in the route loader while its component
  downloads. Share one QueryClient and one queryOptions definition per
  resource. Await queryClient.query(options) for required fresh data and read
  it with useSuspenseQuery. Give secondary panels their own Suspense
  boundaries.
- For navigation, set defaultPreload to 'intent', defaultPreloadDelay to 50
  ms, and defaultPreloadStaleTime to 0. Warm likely destinations on hover,
  keyboard focus, or touchstart. Disable preloading on low-value links.
- For editors and charts, warm the same import() used by React.lazy on
  deliberate hover, focus, or press. Open the feature on activation. Load
  rarely used tools on demand. Test direct links and cold taps.

### 4. Keep the first view small

Fail CI above 150 kB total cold-entry JS, 50 kB route-specific startup JS, or
20 kB first-view CSS, all Brotli. Count each asset once across the shell,
matched layouts, route chunks, and preloads. Verify with the Vite manifest and
a cold browser trace. Count the CSS StyleX actually emits. Make the LCP image
discoverable early and reserve its dimensions.

### 5. Ship on measured results

- Run `bun ci`, `bun lint`, `bun fmt --check`, `bun check`, `bun test`, and
  `bun run build`. Run React Doctor on new PR findings. Use Playwright to
  replay cold entry, warm navigation, and typing during filtering with
  realistic data.
- Profile one slow interaction at a time with the pinned React Doctor CLI:

  ```bash
  bun run react-doctor scan "$PREVIEW_URL" --trace-out interaction.json.gz
  ```

- Redact renders synchronously. Before release, compare both renderers on the
  same commit. Measure time to usable content and input latency while
  filtering the largest realistic list. Exercise forms, portals, and Suspense
  navigation. Ship Redact when cold entry improves and those interactions hold
  their baseline. Ship React DOM if Redact misses either condition or breaks a
  required flow.
- Report before/after timings and bytes. Sample web-vitals/attribution by
  route template and release to find slow interactions in the field. Target
  p75 LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, and fully cached navigation to
  visible content ≤ 200 ms.

## Output format

The artifact is the app itself: a working scaffold on the stack above with the
budget checks wired into CI. Commit the code, then write a short performance
report (e.g. `PERFORMANCE.md`) covering:

1. **Budget results** — cold-entry JS, route startup JS, and first-view CSS
   against the limits, all Brotli.
2. **Renderer comparison** — Redact vs React DOM on the same commit: time to
   usable content and input latency while filtering the largest realistic
   list, and which renderer shipped and why.
3. **Field targets** — instrumentation for p75 LCP ≤ 2.5 s, INP ≤ 200 ms, CLS
   ≤ 0.1, and fully cached navigation to visible content ≤ 200 ms.

## Guardrails

- Use the pinned versions above; do not substitute newer or different tools.
- Keep standard React imports and keep the React DOM build switch working —
  Redact is opt-out, not a commitment.
- Do not preload low-value links, and do not eagerly load rarely used tools.
- Ship React DOM if Redact misses a shipping condition or breaks a required
  flow; do not force the new renderer.
- If critical information is missing, stop and ask instead of guessing.
