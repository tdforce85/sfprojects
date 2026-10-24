# Pollyanna — Build Plan

Executable spec for a single implementing agent (Sonnet) followed by one reviewing agent (Opus).
Everything needed is in this file. Do not explore the repo beyond the files listed here.

## 1. Goal

A family Pollyanna (Secret Santa) draw for kids, hosted on tonydegregorio.com, with no backend.

- 5 families, about 9 kids. Kids only.
- A kid can never draw themselves or a sibling (anyone in the same family). No other exclusion rules.
- The organizer (Tony) runs the draw but must never see who drew whom.
- Each kid gets a private link that opens a festive "tap to unwrap" reveal page.
- Unlisted: not linked from the site, not indexed by search engines. Shared by URL only.
- Nothing is stored server-side. Kid names are never committed to the repo.

## 2. Repo facts (verified)

- App: `apps/portfolio` — Next.js **15.5.2** App Router, `output: "export"` (static), deployed on Cloudflare Pages.
- Tailwind CSS **v4** (CSS `@theme` in `src/app/globals.css`, no config file). TypeScript strict, `@/*` → `src/*`.
- Font: `Space_Grotesk` via `next/font/google` in `src/app/layout.tsx`.
- `src/app/layout.tsx` currently renders `<html>`, `<body>`, plus the portfolio header (nav) and footer.
- Existing pages: `src/app/page.tsx`, `src/app/tools/**`, `src/app/how-its-built/page.tsx`.
- `public/_headers` exists (Cloudflare headers file).
- Repo conventions (root `CLAUDE.md`): functional components, named exports for components, default exports for pages, no `any`, interfaces over types for object shapes, `'use client'` only where needed, conventional commits.
- `apps/portfolio/AGENTS.md`: read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code. Only read the guides for: route groups, layouts, metadata (`robots`, `openGraph`), and static exports. Nothing else.
- Branches: `main` = production, `dev` = working branch (Cloudflare auto-deploys both). Code on `dev` and `main` is identical as of 2026-10-24. See §9.

## 3. Out of scope — do not touch

- `eslint-config-next` is 16.2.4 while `next` is 15.5.2. Leave it. Do not upgrade or downgrade anything.
- No new runtime dependencies. The only allowed new dependency is `vitest` (devDependency).
- No changes to the Tools page, nav, home page content, pricing lib, or the Agentforce calculator.
- No analytics, no external scripts, no CDN assets, no images from the web.

## 4. Architecture

### 4.1 Layout restructure (so the Pollyanna pages are standalone)

Do NOT use multiple root layouts. Keep one root layout and move the portfolio chrome into a route group.

1. `src/app/layout.tsx` (root) keeps only: `<html lang="en">`, `<body>`, font class, `globals.css` import, and the existing site `metadata`. Remove the header, `<main>`, and footer from it. Body keeps `min-h-screen antialiased`; move `bg-slate-900 text-slate-100` and `flex flex-col` to the group layout wrapper.
2. New `src/app/(site)/layout.tsx`: renders the exact header, `<main className="flex-1">{children}</main>`, and footer that were removed from the root, inside a `<div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">`. Markup and classes otherwise identical.
3. Move with `git mv` (so history is kept): `src/app/page.tsx`, `src/app/tools/`, `src/app/how-its-built/` → into `src/app/(site)/`. URLs do not change (route groups don't affect paths).
4. `favicon.ico` and `globals.css` stay in `src/app/`.
5. Add `src/app/not-found.tsx`: simple dark-slate 404 with a link to `/`, so the 404 page doesn't lose all styling now that the root has no chrome.

Acceptance: `/`, `/tools`, `/tools/agentforce-calculator`, `/how-its-built` render identically to before.

### 4.2 Files to create

```
src/lib/pollyanna/
  types.ts          # interfaces
  draw.ts           # validation + draw (pure, no DOM)
  token.ts          # encode/decode reveal payload (pure)
  draw.test.ts      # vitest
  token.test.ts     # vitest
src/app/pollyanna/
  layout.tsx        # festive standalone layout + noindex metadata
  page.tsx          # organizer page (server shell → client component)
  _components/Organizer.tsx   # 'use client'
  reveal/
    page.tsx        # reveal page shell
    _components/Reveal.tsx    # 'use client'
```

## 5. Core logic (pure TypeScript, fully unit-tested)

### 5.1 `types.ts`

```ts
export interface Family { id: string; name: string; kids: string[] }
export interface Assignment { giver: string; receiver: string }
export interface RevealPayload { v: 1; g: string; r: string; b: string; d: string } // giver, receiver, budget, date
export interface ValidationResult { ok: boolean; errors: string[] }
```

### 5.2 `draw.ts`

`validateRoster(families: Family[]): ValidationResult`
- Trim all names. Ignore empty kid entries and families with zero kids.
- Errors (human-readable, shown in UI):
  - fewer than 2 families with kids → "Need at least two families."
  - fewer than 3 kids total → "Need at least three kids."
  - duplicate kid names across the whole roster, case-insensitive → "Two kids are named "X". Add an initial so links are unambiguous."
  - feasibility: let `n` = total kids, `m` = largest family size. If `m > n - m` → "The {Family} family has {m} of {n} kids. No family can have more than half, or a fair draw is impossible."

`drawAssignments(families: Family[], rng?: () => number): Assignment[]`
- Throws if `validateRoster` fails.
- Rules: receiver ≠ giver; receiver not in giver's family; every kid gives exactly once and receives exactly once.
- Algorithm (fair = uniform over all valid assignments):
  1. Rejection sampling: Fisher–Yates shuffle receivers, accept if all rules hold. Up to 200,000 attempts.
  2. Fallback (should never trigger when feasible): randomized backtracking, givers ordered by family size descending, shuffled candidate lists.
- Default `rng` uses `crypto.getRandomValues` (unbiased integer in range via rejection on Uint32). Accept injectable `rng` for tests.
- Never `console.log` assignments anywhere.

### 5.3 `token.ts`

Obfuscation, not encryption (intentional; organizer blindness is honor-system).

- `encodePayload(p: RevealPayload): string` → `JSON.stringify` → UTF-8 bytes (`TextEncoder`) → XOR with a fixed key derived from the constant string `"pollyanna-v1"` (repeat key bytes) → base64url (no padding).
- `decodePayload(token: string): RevealPayload | null` → reverse; return `null` on any failure (bad base64, bad JSON, `v !== 1`, missing/empty `g` or `r`, non-string fields). Never throw.
- Must round-trip names with apostrophes, accents, emoji, and spaces.
- Link format: `${origin}/pollyanna/reveal/#${token}`. The token is in the **fragment** so it is never sent to Cloudflare and never appears in server logs. Use `window.location.origin` at runtime; do not hard-code the domain.
  - Trailing slash on `reveal/` is deliberate: static export emits `reveal.html` or `reveal/index.html` depending on config. Check which `next build` produces and use the URL form that serves without a redirect on Cloudflare Pages (redirects can drop fragments in some clients). Document the choice in a code comment.

## 6. Pages

### 6.1 `pollyanna/layout.tsx`

- Standalone: no portfolio header/footer.
- Festive look: deep red / pine green / warm gold on a dark background, subtle CSS snow or star pattern (pure CSS, no images). Mobile-first; the reveal page will be opened on phones.
- One festive display font is allowed via `next/font/google` (e.g. `Mountains_of_Christmas` or `Fredoka`) for headings only; body stays the root font.
- `metadata`: `title: "Pollyanna 🎁"`, `robots: { index: false, follow: false }`, `openGraph: { title: "You've got a Pollyanna! 🎁", description: "Tap to unwrap who you're getting a gift for." }`. The preview text must never contain a name (texted links show previews).

### 6.2 Organizer — `/pollyanna`

Client component. State in memory; roster (families and kid names only, never assignments) mirrored to `localStorage` key `pollyanna:roster:v1`, wrapped in try/catch, so Tony can reload without retyping.

UI, top to bottom:
1. **Event details**: Budget text (default `What you're comfortable with`), Exchange date text (default `Christmas Eve`). Free text.
2. **Families**: add family (name), per family add/remove kids (name inputs), remove family. Live kid count per family and total.
3. **Validation panel**: shows `validateRoster` errors live. Draw button disabled while errors exist.
4. **Draw**: on click → `drawAssignments` → build one link per kid. Do not keep the assignment array in state after links are built; keep only `{ giver, family, url }[]`.
5. **Results** (blind):
   - One row per kid: `{giver} ({family})` + **Copy link** button. **Never render, title, aria-label, or tooltip the receiver.** Show the URL only inside the copy action, not as visible text (a visible URL can still be glanced but is scrambled; keep it hidden anyway).
   - **Copy all**: copies `"{giver}: {url}"` lines to clipboard, for Tony to paste into a private note.
   - **Download backup (.txt)**: same content as a file `pollyanna-links.txt`.
   - Warning text: "Save these links now. If you lose them you'll need to redraw, which changes everyone's match."
   - **Redraw** button with confirm dialog ("This replaces all links. Anyone who already got a link will have the wrong match.").
6. Accessibility: labeled inputs, buttons reachable by keyboard, visible focus, `aria-live` region for "Copied!" and validation messages.

### 6.3 Reveal — `/pollyanna/reveal`

Client component. Read `window.location.hash` in `useEffect` (static prerender has no hash; avoid hydration mismatch). Also listen to `hashchange`.

States:
- **Loading** (pre-effect): neutral festive placeholder.
- **Invalid/missing token**: friendly message "This link looks broken. Ask the grown-up who sent it for a new one." No error details.
- **Wrapped**: "Hi {giver}! 🎄" + a large wrapped-present illustration (CSS/inline SVG: box, ribbon, bow) + "Tap to unwrap". The whole present is a `<button>` with an accessible label.
- **Unwrapped** (after tap): lid lifts/ribbon falls animation, CSS confetti burst (no library), then card:
  - "You're getting a gift for"
  - **{receiver}** (large)
  - "Budget: {b}"
  - "Exchange: {d}"
  - Small line: "Shh… it's a secret! 🤫"
- `prefers-reduced-motion: reduce` → skip animations, show reveal instantly.
- No network calls. No storage. No analytics.

## 7. Headers

Append to `public/_headers`:

```
/pollyanna/*
  X-Robots-Tag: noindex, nofollow
  Referrer-Policy: no-referrer
```

Keep existing rules unchanged.

## 8. Tests and checks

Add `vitest` as a devDependency and a script `"test": "vitest run"` in `apps/portfolio/package.json`. Tests live next to the lib files.

`draw.test.ts` (use a seeded rng for determinism plus some runs with the default rng):
- 10,000 draws on a fixture of 5 families / 9 kids (sizes 3,2,2,1,1): every result has no self-match, no sibling match, is a permutation (each kid gives once and receives once).
- Fixture where one family has 5 of 9 kids → `validateRoster` returns the feasibility error and `drawAssignments` throws.
- Boundary: family with exactly half (4 of 8) is feasible and draws succeed.
- Duplicate name (case-insensitive) → error. Empty names ignored. Fewer than 2 families → error.
- Fairness smoke test: on the 9-kid fixture over 20,000 draws, every allowed giver→receiver pair occurs at least once. (Do not assert equal pair frequencies: a uniform draw over valid assignments legitimately gives some pairs higher odds than others.)

`token.test.ts`:
- Round-trip with `O'Brien`, `Zoë`, `Mary Kate`, `🎄`.
- Token contains no recognizable plaintext name (assert the encoded string does not include the giver or receiver substrings).
- `decodePayload` returns `null` for: empty string, random garbage, valid base64 of non-JSON, JSON with `v: 2`, missing `r`.

Run, all must pass with zero errors:
```
cd apps/portfolio
npm ci
npm run lint
npm test
npm run build
```
After build, confirm `out/` contains the Pollyanna organizer and reveal HTML files and that the existing pages still exist at the same paths. Record which reveal filename was emitted (see §5.3).

## 9. Git

- Branch `feature/pollyanna` from `dev` (per repo convention). PR targets `dev`, never `main`.
- Commits (conventional, small):
  1. `docs: add pollyanna build plan` (this file)
  2. `refactor: move portfolio chrome into (site) route group`
  3. `feat: pollyanna draw and token logic with tests`
  4. `feat: pollyanna organizer page`
  5. `feat: pollyanna reveal page with tap-to-unwrap`
  6. `chore: noindex headers for pollyanna`
- Never commit real kid names, `out/`, `.next/`, or `node_modules/`.

## 10. Acceptance criteria (the reviewer checks exactly these)

1. Existing pages unchanged in content and appearance; URLs unchanged.
2. `/pollyanna` and `/pollyanna/reveal` have no portfolio header/footer.
3. No self or sibling match is possible; infeasible rosters are blocked with a clear message.
4. Organizer UI never exposes any receiver (DOM text, attributes, title, aria, console).
5. Reveal works from a link pasted into a phone browser; token lives in the URL fragment.
6. Noindex via both metadata and `_headers`; OG preview contains no names.
7. No new runtime deps; only `vitest` added as a dev dep.
8. Lint, tests, and build all pass.
9. Strict TS, no `any`, repo naming and export conventions followed.
10. Reduced-motion respected; keyboard and screen-reader usable.

## 11. Agent workflow (cost-conscious)

1. **Build — one Sonnet agent.** Input: this file's path only. Works on `feature/pollyanna`, follows §4–§9 in order, commits per §9. Reads only the files named here plus the four Next.js guides in §2. Ends with a short report: commit list, test/lint/build output summary, emitted reveal filename, any deviations from the plan and why.
2. **Review — one Opus agent, read-only.** Input: this file + `git diff dev...feature/pollyanna` + the Sonnet report. Checks §10 item by item, then logic correctness of `draw.ts`/`token.ts`. Returns findings tagged **blocking** or **nit**, each with file:line and the fix. No rewrites, no broad exploration.
3. **Fix — same Sonnet agent continued** (not a new one, to reuse its context). Fix **blocking** items only; nits only if trivial. Re-run §8 checks.
4. **Ship.** Push branch, open PR into `dev`. Tony checks the Cloudflare dev deploy with fake names, then promotes `dev` → `main` himself.
