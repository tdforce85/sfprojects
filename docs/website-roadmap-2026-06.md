# tonydegregorio.com — Strategic Review & Execution Roadmap

**Date:** 2026-06-11
**Author:** Strategic review session (Claude Fable)
**Status:** Proposed
**Audience for this doc:** Tony (strategy approval) + executor models (implementation). Executor models: read [Ground Rules](#ground-rules-for-executor-models) before touching anything.

---

## 1. Where the site stands

What exists today is small, clean, and honest: a homepage with three tool cards, a `/tools` index, a `/how-its-built` narrative page, and one genuinely good interactive tool (the Agentforce Flex Credit Calculator). Two external Salesforce Experience Cloud demos round it out. Code quality is solid — strict TS, sensible aria labels, no dead weight.

The strategic read: **the site has a differentiator (working tools + live Salesforce demos) but no engine around it.** Specifically:

1. **No credibility layer.** The hero is one line ("Architecting Salesforce platforms that scale" — generic). No bio, no certifications, no experience, no case studies. A hiring manager or prospective client lands, sees three cards, and has no reason to believe the person behind them.
2. **No discovery layer.** The calculator could realistically rank for "agentforce pricing calculator" / "agentforce flex credit calculator" — a query with commercial intent and thin competition — but the page is a fully client-rendered component that **cannot even export metadata** (it's `'use client'` top to bottom). No sitemap, no robots.txt, no OG images, no JSON-LD, no `metadataBase`. The favicon is still the create-next-app default.
3. **No conversion layer.** The site's whole joke is "The Over-Engineered Lead Form" — and the site itself never asks anyone to get in touch. Footer GitHub/LinkedIn links are the only path.
4. **Fragile demo dependency.** Both Experience Cloud demos live at `bluemotionconsultingllc-dev-ed.develop.my.site.com` — a Developer Edition org URL that (a) looks untrustworthy to a non-Salesforce visitor and (b) will be deactivated if the org goes unused (~180 days without login). If that org dies, two of three homepage cards become dead links and nothing on the site notices.
5. **No guardrails for AI-assisted development.** Tony's stated workflow is "Fable plans, cheaper models execute." There is currently no CI, no tests, and no typecheck script — meaning nothing catches a bad implementation before it merges. The tool cards are already duplicated between `page.tsx` and `tools/page.tsx` with drifted copy, which is exactly the failure mode that compounds.
6. **Housekeeping debt.** `eslint-config-next` is pinned to `16.2.4` while `next` is `^15.5.2` (major mismatch). Root `README.md` says "Storing". App `README.md` is the untouched create-next-app boilerplate. `metadataBase` unset means OG URLs would resolve relative.

## 2. Strategy

**Audiences, in priority order:**
1. Prospective consulting clients / hiring managers (Salesforce-adjacent, semi-technical) — they need credibility + a contact path.
2. Salesforce architects & devs arriving from search/community — they need tools that work and content worth sharing.
3. Peers checking the public source — already served; keep the bar high.

**Positioning:** "The Salesforce architect who shows his work." Every claim on the site is backed by something you can click, run, or read the source of. The humor (drone army, NaN% banner) is a feature — it's memorable and filters for people who'd be fun to work with. Keep it; just never let a joke sit where a buyer needs information.

**What "next level" means, concretely:**
- **Phase 0 — Guardrails & refactor.** CI, tests, shared components. Cheap, fast, and a precondition for safely delegating everything after it.
- **Phase 1 — Discovery.** Full SEO/metadata infrastructure + restructure the calculator page so it can rank. Highest ROI on existing assets.
- **Phase 2 — Credibility & conversion.** About content, hero upgrade, contact CTA, internal case-study pages for the demos (which also de-risks the dev-org dependency).
- **Phase 3 — Content engine.** `/notes` — architecture write-ups, zero new dependencies.
- **Phase 4 — Next tool.** One more calculator-class tool, reusing extracted primitives.
- **Ongoing — Monitoring.** Demo uptime check, pricing-data freshness.

Sequencing rationale: Phase 0 protects everything else. Phase 1 before Phase 2 because SEO compounds with time — every week the calculator page isn't indexable is lost compounding. Phases 2–3 need content only Tony can provide (see §5), so their code scaffolding can proceed in parallel while he drafts.

---

## 3. Work packages

Conventions for every WP: branch `feature/<wp-slug>` off `dev` (create `dev` from `main` if it doesn't exist), conventional commits, run `npm run lint && npm run typecheck && npm run test && npm run build` (once WP-0.1/0.2 land) before every commit. Sizes: S ≤ 1h, M ≤ half day, L = day+.

### Phase 0 — Guardrails & refactor

#### WP-0.1 · CI pipeline (S)
**Files:** `.github/workflows/ci.yml` (new)
**Spec:**
- Trigger: `pull_request` and `push` to `main` and `dev`.
- Single job, `ubuntu-latest`, Node 22, `defaults.run.working-directory: apps/portfolio`.
- Steps: checkout → `actions/setup-node@v4` with `cache: npm` and `cache-dependency-path: apps/portfolio/package-lock.json` → `npm ci` → `npm run lint` → `npm run typecheck` → `npm run test` (skip this step until WP-0.2 merges) → `npm run build`.
- Add to `apps/portfolio/package.json` scripts: `"typecheck": "tsc --noEmit"`.
**Acceptance:** workflow green on a no-op PR; a deliberate type error fails it.

#### WP-0.2 · Unit tests for pricing engine (S)
**Files:** `apps/portfolio/src/lib/pricing.test.ts` (new), `apps/portfolio/package.json`
**Spec:**
- Add `vitest` as a devDependency. No jsdom, no React testing — `pricing.ts` is pure functions. Script: `"test": "vitest run"`.
- Test `compute()`: (a) single standard action, 1 000 records, 1 interaction/mo, 15% overhead, $500/pack → assert every field of `CalcResult` against hand-computed values (cpi 20, monthly 20 000, annualProd 240 000, overhead 36 000, total 276 000, packs 2.76, packsRounded 3, totalBought 300 000, cost 1 500); (b) zero records → all zeros, packsRounded 0; (c) mixed standard+voice actions sum cpi correctly; (d) total exactly divisible by pack size does not round up.
- Test `buildSummary()`: output contains the action labels, the formatted annual cost, and the discount line.
- Do **not** test `downloadSummary` (DOM-dependent; out of scope).
**Acceptance:** `npm run test` green; tests fail if someone changes `ACTION_TYPE_CREDITS.standard`.

#### WP-0.3 · Dependency alignment (S)
**Files:** `apps/portfolio/package.json`, `package-lock.json`
**Spec:**
- Run `npm ls next` to confirm the installed major. Align `eslint-config-next` to the **same major.minor as the installed `next`** (today that means downgrading from `16.2.4`). Do not upgrade `next` itself in this WP — if an upgrade to 16 is desired, that is its own PR with its own review.
- Replace boilerplate `apps/portfolio/README.md` with a short real one: what the app is, `npm run dev`, deploy target (Cloudflare Pages, static export), link to root repo. Replace root `README.md` "Storing" with two sentences describing the monorepo.
**Acceptance:** `npm run lint` passes; no peer warnings on `npm ci`.

#### WP-0.4 · Extract ToolCard + single source of tool data (M)
**Files:** `apps/portfolio/src/lib/tools.ts` (new), `apps/portfolio/src/components/ToolCard.tsx` (new), `src/app/page.tsx`, `src/app/tools/page.tsx`
**Spec:**
- `src/lib/tools.ts`: export `interface Tool { slug: string; category: string; title: string; description: string; href: string; external: boolean; cta?: string; featured: boolean; }` and `export const TOOLS: Tool[]` containing the three current tools. **Resolve the copy drift by using the `/tools` page wording** (it's tighter). Internal calculator: `href: "/tools/agentforce-calculator"`, `external: false`, no cta. The two Experience Cloud demos: `external: true`, `cta: "Try It Live →"`.
- `src/components/ToolCard.tsx`: server component (no `'use client'`), named export. Renders `<Link>` for internal, `<a target="_blank" rel="noopener noreferrer">` for external. Preserve the exact current card classes (`group block bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500 hover:bg-slate-800/80 transition-all`, etc.) — this is a refactor, pixel-identical output is the requirement.
- Homepage maps `TOOLS.filter(t => t.featured)`; `/tools` maps all of `TOOLS`.
**Pitfall:** do not invent a new visual design; do not add `'use client'`.
**Acceptance:** `npm run build` output HTML for both pages is semantically identical to before (same links, same text, same classes); tool copy now identical on both pages.

### Phase 1 — Discovery (SEO)

> **Executor warning for all of Phase 1:** this site uses `output: 'export'` (static export). No server runtime exists. `app/sitemap.ts` and `app/robots.ts` ARE supported (rendered at build time). Dynamic OG image generation is NOT to be used — static PNGs only. Client components can never export `metadata`.

#### WP-1.1 · Metadata foundation (M)
**Files:** `src/app/layout.tsx`
**Spec:**
- In root layout metadata: add `metadataBase: new URL("https://tonydegregorio.com")`, `title: { default: "Tony DeGregorio | Salesforce Architect", template: "%s | Tony DeGregorio" }`, keep the existing description, add `openGraph: { type: "website", siteName: "Tony DeGregorio", locale: "en_US" }` and `twitter: { card: "summary_large_image" }`, plus `alternates: { canonical: "/" }` overridden per page.
- Update `tools/page.tsx` and `how-its-built/page.tsx` metadata to rely on the template (i.e. `title: "Tools"` not `"Tools | Tony DeGregorio"`), and add a unique `description` (≤ 155 chars) and `alternates.canonical` to each. Descriptions to use verbatim:
  - /tools: `"Free interactive tools for Salesforce architects — Agentforce credit sizing, live Experience Cloud demos, and more."`
  - /how-its-built: `"The architecture behind tonydegregorio.com: Next.js on Cloudflare Pages plus a live Salesforce Experience Cloud demo org."`
**Acceptance:** view-source of built pages shows correct `<title>`, canonical, and absolute `og:` URLs.

#### WP-1.2 · Brand assets: favicon + OG image (M)
**Files:** `src/app/favicon.ico` (replace), `src/app/icon.svg` (new), `public/og/default.png` (new), `src/app/layout.tsx`
**Spec:**
- `icon.svg`: simple monogram — "TD" set in the site font on a `#0f172a` (slate-900) rounded square with `#60a5fa` (blue-400) text. Generate the ico from the same mark. No gradients, no clip-art.
- `public/og/default.png`: 1200×630. Slate-900 background, "Tony DeGregorio" in white at ~72px, "Salesforce Architect" in blue-400 at ~36px beneath, small `tonydegregorio.com` bottom-left in slate-400. Generate with a one-off script (e.g. `satori`/`sharp` in `sandbox/`, not added to app deps) or any image tool; commit only the PNG.
- Wire `openGraph.images: [{ url: "/og/default.png", width: 1200, height: 630 }]` in root layout.
**Pitfall:** do NOT add `opengraph-image.tsx` / `ImageResponse` routes — static export; static file only.
**Acceptance:** sharing the URL in a link previewer shows the card; favicon no longer the Next.js default.

#### WP-1.3 · sitemap.ts + robots.ts (S)
**Files:** `src/app/sitemap.ts` (new), `src/app/robots.ts` (new)
**Spec:**
- `sitemap.ts`: default export returning `MetadataRoute.Sitemap` for `/`, `/tools`, `/tools/agentforce-calculator`, `/how-its-built` with absolute URLs. Derive tool URLs from `TOOLS` (internal only) so future tools auto-appear.
- `robots.ts`: allow all, `sitemap: "https://tonydegregorio.com/sitemap.xml"`.
**Acceptance:** `out/sitemap.xml` and `out/robots.txt` exist after `npm run build` with correct absolute URLs.

#### WP-1.4 · Calculator page restructure — the big SEO play (L)
**Files:** `src/app/tools/agentforce-calculator/page.tsx` (rewrite as server component), `src/app/tools/agentforce-calculator/_components/CalculatorClient.tsx` (new — receives the current page body)
**Spec:**
- Move the entire current `'use client'` component into `_components/CalculatorClient.tsx` unchanged (rename the function `CalculatorClient`, named export, keep `'use client'`).
- New `page.tsx` is a **server component**: exports `metadata` with `title: "Agentforce Flex Credit Calculator"`, description (verbatim): `"Free Agentforce pricing calculator. Estimate annual Salesforce flex credit costs by action mix, dataset size, and interaction volume — before you go to contract."`, canonical `/tools/agentforce-calculator`.
- Page renders `<CalculatorClient />` followed by a server-rendered SEO content section (so the words are in the static HTML, not behind hydration):
  - **"How Agentforce flex credit pricing works"** — 2–3 short paragraphs: credits are the consumption currency for agent actions; a standard action consumes 20 credits and a voice action 30 per the published rate card; credits are sold in packs of 100,000 at a $500 list price; annual cost = records × interactions × credits-per-interaction × 12, plus sandbox/dev overhead. Every number must match `src/lib/pricing.ts` constants — import them rather than hardcoding where practical.
  - **FAQ (4 items, `<h3>` + paragraph):** "What is an Agentforce flex credit?", "How many credits does an agent interaction use?", "Can you negotiate Agentforce pricing?" (answer: volume discounts exist; the calculator caps modeling at the configured max), "Is this calculator official?" (answer: no — independent estimate, verify against the Salesforce rate card, with the existing `rateCardUrl` link).
  - Add matching `FAQPage` JSON-LD via a `<script type="application/ld+json">` rendered with `JSON.stringify` — content must mirror the visible FAQ exactly.
  - End with a line: `Rates last verified: <date>` sourced from a new `ratesVerified: "2026-06-11"` field in `AGENTFORCE_PRICING`.
- Move the 🔨 NaN% joke banner **below the calculator**, restyled as a footnote-level aside — keep the joke, stop it reading as an error state above the fold.
**Pitfalls:** `metadata` export must be in the server `page.tsx` only. No `useSearchParams` in this WP. Don't restructure the calculator internals.
**Acceptance:** built HTML for the route contains the H1, the pricing explainer text, FAQ, and JSON-LD without JS; calculator still fully functional; Lighthouse SEO ≥ 95.

#### WP-1.5 · Shareable calculator state via URL (M) — *after WP-1.4*
**Files:** `_components/CalculatorClient.tsx`
**Spec:**
- On mount (single `useEffect`), parse `window.location.search` for `ds` (dataset), `ipm` (interactions), `oh` (overhead), `disc` (discount), `acts` (comma list of `s`/`v` for standard/voice) and seed state if present and valid (clamp to existing min/max; ignore garbage).
- On state change, debounce 300ms then `history.replaceState` with the encoded params. Add a "Copy link" button next to "Copy summary" using the same `expBtn` styles and the existing notice pattern (extend the notice union with `"linked"`).
**Pitfall:** do NOT use `useSearchParams` — with static export it forces a Suspense/CSR bailout. `window.location` in `useEffect` only; guard everything for SSR-undefined `window` (the effect already guarantees client, but no top-level access).
**Acceptance:** configure → copy link → open in new tab → identical state; bad params don't crash.

#### WP-1.6 · Analytics (S)
**Files:** `src/app/layout.tsx`
**Spec:** Cloudflare Web Analytics (free, cookieless). Tony creates the site in the Cloudflare dashboard and provides the token; executor adds the beacon `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "<TOKEN>"}'/>` before `</body>` via `next/script` with `strategy="afterInteractive"`. **Blocked on token from Tony.**
**Acceptance:** events visible in CF dashboard from production.

### Phase 2 — Credibility & conversion

#### WP-2.1 · Homepage hero upgrade + About section (M) — *content from Tony, see §5*
**Files:** `src/app/page.tsx`
**Spec:**
- Replace the hero subline `"Architecting Salesforce platforms that scale."` with (verbatim): `"I design and build Salesforce platforms — and instead of telling you about it, this site lets you use the things I build. Live demos, real code, public source."`
- Add two CTA buttons under it: primary `Explore the tools` → `/tools` (solid blue-500 bg, white text, rounded-lg, px-5 py-2.5, hover:bg-blue-400), secondary `Get in touch` → the contact section anchor (border border-slate-600, text-slate-200, hover:border-slate-400).
- Below Featured Tools, add an `About` section: ~80–120 words of bio, a plain list of certifications, and 3–4 highlight bullets (years, domains, notable scale). **Placeholder structure may be scaffolded, but do not invent biographical facts, employers, cert names, or numbers — render Tony's provided content verbatim.** Until provided, the section ships hidden behind a `const ABOUT_READY = false` flag (simple conditional render), not with lorem ipsum.
**Acceptance:** hero copy matches verbatim; About hidden until real content lands.

#### WP-2.2 · Contact section (S)
**Files:** `src/app/page.tsx`, `src/app/layout.tsx` (footer link)
**Spec:** Section at page bottom, id `contact`. Heading: `Get in touch`. Body (verbatim): `"The best way to reach me is through the most over-engineered contact form in the Salesforce ecosystem. Your message will traverse a Platform Event, a Queueable, and an approval process — and it will absolutely reach me."` Primary button `Use the Over-Engineered Lead Form →` (external, to the existing lead form URL from `TOOLS`). Secondary text link: `Or find me on LinkedIn` → existing LinkedIn URL. Footer gains a `Contact` link → `/#contact`.
**Acceptance:** anchor scroll works from hero CTA and footer.

#### WP-2.3 · Internal case-study pages for the demos (L) — *content from Tony, see §5*
**Files:** `src/app/work/over-engineered-lead-form/page.tsx`, `src/app/work/error-handling-dashboard/page.tsx` (new), `src/lib/tools.ts`, sitemap auto-picks up via TOOLS only if added there — also add `/work/*` routes to `sitemap.ts` explicitly
**Spec:**
- Each page: server component, own metadata, structure = H1, one-paragraph hook, "What it demonstrates" bullet list (the Salesforce features), "Architecture" section (ordered walk-through of the data flow; Tony to supply/approve the technical narrative), screenshots (Tony provides; stored under `public/work/<slug>/`, rendered with plain `<img>` + width/height attrs — **`next/image` optimization does not work with static export**, use `<img>` or `<Image unoptimized>`), and a prominent "Try it live →" external link.
- Repoint the two demo `ToolCard`s to the internal `/work/...` pages (cta becomes `Read the build + try it live →`); the external link moves inside the case-study page. **Strategic purpose:** the site keeps the SEO/credibility value and survives a dev-org outage; visitors get context before hitting a raw `*.develop.my.site.com` URL.
**Acceptance:** demo cards no longer deep-link off-site; case pages render screenshots and external links; both pages in sitemap.

### Phase 3 — Content engine

#### WP-3.1 · /notes scaffold, zero new dependencies (M)
**Files:** `src/lib/notes.ts`, `src/components/Article.tsx`, `src/app/notes/page.tsx`, `src/app/notes/<slug>/page.tsx` per post, nav link in `layout.tsx`, sitemap entries
**Spec:**
- Deliberately **no MDX, no CMS, no new deps**: each post is a TSX server-component page using a shared `<Article title date description>` layout (max-w-3xl, the `/how-its-built` typography). `src/lib/notes.ts` exports a `NOTES: NoteMeta[]` registry (`slug`, `title`, `date`, `description`) that drives the index page and sitemap. Posts are written by Tony with model assistance — TSX authoring is acceptable in this workflow; revisit MDX only if cadence makes TSX painful.
- Seed posts (titles fixed, content from Tony): `how-i-size-agentforce-credit-purchases` and `anatomy-of-the-over-engineered-lead-form` (the latter cross-links WP-2.3's case page).
- Each post page exports its own metadata + `article` OG type.
**Acceptance:** index lists posts newest-first from the registry; posts in sitemap; nav shows `Notes`.

### Phase 4 — Next tool

#### WP-4.1 · Extract calculator primitives (S)
**Files:** move `Stepper.tsx` and `FmtNumInput.tsx` from `tools/agentforce-calculator/_components/` to `src/components/inputs/`; update imports.
**Acceptance:** pure move, build green, calculator unchanged.

#### WP-4.2 · Second calculator (L) — *recommendation: Salesforce storage cost estimator*
Of the "What's Next" list, the Magic 8-Ball is low-value, the trigger playground is high-effort, and the configurator is under-specified. The highest-leverage next tool is **another calculator with real search demand**: data/file storage cost estimation ("how much will extra Salesforce storage cost / when do I archive") is a perennial architect question, reuses the exact pattern that already works (constants file + pure `compute()` + tests + client UI + SEO shell per WP-1.4), and extends the "pricing clarity" brand the Agentforce calculator started. **Spec to be written as its own design doc before implementation** — model the org storage allocations, per-block pricing, and record-count → storage heuristics in a `src/lib/storage-pricing.ts` mirror of `pricing.ts`, with the same test rigor. Do not start from this paragraph alone.

### Ongoing

#### WP-5.1 · Demo uptime monitor (S)
**Files:** `.github/workflows/demo-monitor.yml`
**Spec:** scheduled workflow (`cron: "0 13 * * 1"`, weekly Monday), two steps each `curl -sf -o /dev/null --max-time 30 <demo URL>` for the lead form and dashboard URLs; any failure fails the workflow (GitHub emails Tony). Note in a comment: this detects site-down, not org deactivation lead-time — **Tony: log into the dev org at least monthly to keep it active.**
**Acceptance:** manual `workflow_dispatch` run passes today.

#### WP-5.2 · Pricing freshness ritual (no code)
Quarterly: verify `AGENTFORCE_PRICING` against the rate card, bump `ratesVerified`. Add a calendar reminder; optionally a scheduled workflow that opens an issue every 90 days titled "Verify Agentforce rates".

---

## 4. Sequencing & dependency graph

```
WP-0.1 CI ─┬─► everything else (merge first)
WP-0.2 tests ┘
WP-0.3 deps      (independent, anytime)
WP-0.4 ToolCard ─► WP-1.3 sitemap ─► WP-2.3 case pages
WP-1.1 metadata ─► WP-1.2 OG ─► WP-1.4 calculator SEO ─► WP-1.5 share links
WP-1.6 analytics (blocked on Tony: CF token)
WP-2.1 hero/about (blocked on Tony: bio/certs)
WP-2.2 contact   (unblocked)
WP-3.1 notes     (scaffold unblocked; posts blocked on Tony)
WP-4.x next tool (after Phase 1 ships)
WP-5.1 monitor   (independent, do early — cheap insurance)
```

Suggested first batch (one session each for an executor model): **0.1 + 0.2 → 0.4 → 1.1 + 1.3 → 1.4 → 5.1**.

## 5. Only-Tony inputs (blocking content)

1. Cloudflare Web Analytics token (WP-1.6).
2. Bio (~100 words), certification list, 3–4 career highlight bullets, optional headshot (WP-2.1).
3. Screenshots of both demos + review of the architecture narratives (WP-2.3).
4. Drafts/dictation for the two seed notes (WP-3.1).
5. Monthly dev-org login habit (WP-5.1 caveat).

## 6. Ground rules for executor models

These exist because this codebase has sharp edges that don't look sharp:

1. **Static export.** `next.config.ts` sets `output: 'export'`. Therefore: no server actions, no route handlers with dynamic behavior, no `ImageResponse` OG routes, no `next/image` optimization (use `<img>` or `unoptimized`), no `useSearchParams` without accepting a CSR bailout (prefer `window.location` inside `useEffect`). `sitemap.ts`/`robots.ts` are fine (build-time).
2. **Read `apps/portfolio/AGENTS.md`** and the bundled Next.js docs in `node_modules/next/dist/docs/` before writing Next-specific code — the installed version's conventions override your training data.
3. **Tailwind v4** — CSS-based `@theme` in `globals.css`; there is no `tailwind.config.js` and you must not create one.
4. **Metadata only in server components.** If a page is `'use client'`, split it: server `page.tsx` (metadata + static shell) + client child in `_components/`.
5. **TypeScript strict, no `any`** (use `unknown` + narrowing), interfaces over types for object shapes, named exports for components, default exports for pages only.
6. **Copy is law.** Where this doc says "verbatim", paste it. Do not invent facts about Tony, Salesforce pricing, or certifications. Numbers shown to users must come from `src/lib/pricing.ts` constants, not be retyped.
7. **Refactors are pixel-identical.** WP-0.4 and WP-4.1 must not change rendered output.
8. **Verify before commit:** `npm run lint && npm run typecheck && npm run test && npm run build` from `apps/portfolio/`. A green build of `out/` is the minimum bar; for UI changes, also run `npm run dev` and check the affected route.
9. **Git:** feature branch off `dev`, conventional commits (`feat:`/`fix:`/`chore:`/`docs:`), never push to `main`.
10. **Scope discipline.** One WP per branch/PR. If a WP turns out to require touching something this doc didn't anticipate, stop and flag rather than improvising.
