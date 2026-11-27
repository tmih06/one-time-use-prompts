## Context

This is an existing web application. It may look fast on a development laptop while customers on slower devices experience a hero image that takes too long to load or buttons that feel unresponsive. A beautiful website is useless if people leave before it becomes usable.

Act as a Senior Web Performance Engineer specialising in Core Web Vitals, browser rendering and full-stack application performance. Audit the application's actual source code, page loading behaviour, rendering strategy, asset delivery and network requests before more features are added.

The rules in the Guardrails section are binding throughout the audit.

## Goal

Identify the biggest performance bottlenecks and recommend measurable improvements without changing the intended design or functionality.

## Inputs

This prompt is self-contained: discover the application structure, important pages, rendering strategy, assets, data-fetching paths and network behaviour from the repository and running application. There are no placeholders to replace.

## Instructions

### Step 1: Establish a performance baseline

- Identify the most important public and authenticated pages.
- Measure or propose measurements for Largest Contentful Paint (LCP), Interaction to Next Paint (INP) and Cumulative Layout Shift (CLS).
- Review initial loading, navigation and interaction performance separately.
- Distinguish development-mode behaviour from production builds.
- Identify which performance metrics are measured versus estimated.
- Record relevant device, network and cache conditions.

### Step 2: Audit frontend loading

- Identify unnecessarily large JavaScript bundles.
- Find client-rendered components that could avoid unnecessary hydration.
- Review images, fonts, icons and third-party scripts.
- Check lazy loading and code splitting.
- Identify layout shifts caused by missing image dimensions or dynamic content.
- Detect resources that block critical rendering.

### Step 3: Inspect data fetching and rendering

- Find duplicate or unnecessary API requests.
- Identify sequential requests that could safely run concurrently.
- Review server-side rendering, static generation and caching choices.
- Check whether frequently accessed queries are slow.
- Identify unnecessary component rerenders.
- Inspect pages that load excessive data before showing useful content.

### Step 4: Test important performance scenarios

Test or propose reproducible benchmarks for:

- First visit with an empty cache.
- Repeat visit with cached assets.
- Slow mobile network conditions.
- Large dashboard datasets.
- Pages containing many images.
- Navigation between frequently used routes.
- User interaction during heavy rendering.

### Step 5: Build a measurable optimization plan

- Rank bottlenecks by estimated real-user impact.
- Identify quick improvements versus architectural changes.
- Recommend exact code and configuration changes.
- Add performance budgets where appropriate.
- Define before-and-after measurement procedures.
- Flag optimizations that could introduce functional regressions.

## Output format

Write a markdown report file named `web-performance-audit.md` in the current working directory unless I say otherwise. Include:

1. **Page-by-page performance baseline** — important public and authenticated pages, with device, network and cache conditions.
2. **Core Web Vitals assessment** — LCP, INP and CLS, clearly marking measured versus estimated values.
3. **Largest loading and rendering bottlenecks** — ordered by estimated real-user impact.
4. **Network, asset and JavaScript findings** — duplicate requests, sequential requests, blocking resources, bundle size, hydration, lazy loading and code splitting.
5. **Recommended fixes with exact affected files** — exact code and configuration changes, separated into quick improvements and architectural changes.
6. **Expected benefits and validation methods** — before-and-after measurement procedures for every recommendation.
7. **Prioritized performance improvement plan** — ordered by impact, effort and regression risk.

For every recommendation, explain why the bottleneck exists and how to verify the fix actually worked.

## Guardrails

- Do not claim performance improvements without measurements.
- Do not remove important features purely to improve scores.
- Do not recommend memoization everywhere without evidence.
- Preserve visual appearance and business functionality.
- Do not modify repository files; produce the audit report and recommendations only.
- If critical information is missing, stop and ask instead of guessing.
