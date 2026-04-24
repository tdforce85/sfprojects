# sfprojects — Salesforce Projects Monorepo

## Overview
Personal monorepo for Tony DeGregorio. Contains the portfolio site (tonydegregorio.com), shared tool packages, experiments, and documentation.

## Structure
```
sfprojects/
├── CLAUDE.md                    # You are here
├── apps/
│   └── portfolio/               # Next.js — tonydegregorio.com
│       ├── src/
│       │   ├── app/             # App Router pages
│       │   ├── components/      # UI components
│       │   └── lib/             # Utilities, types, constants
│       ├── public/
│       ├── package.json
│       ├── next.config.js
│       └── wrangler.toml        # Cloudflare Workers config
├── packages/                    # Shared libraries (future)
├── sandbox/                     # POCs, experiments, throwaway
├── docs/                        # Architecture notes, blog drafts
├── LICENSE
└── README.md
```

## Tech Stack (Portfolio)
- **Framework**: Next.js 14+ (App Router)
- **Deployment**: Cloudflare Workers via `@cloudflare/next-on-pages`
- **Styling**: Tailwind CSS
- **Language**: TypeScript (strict mode)
- **Package manager**: npm (with workspaces)

## Conventions

### Code Style
- Functional components only, no class components
- Named exports for components, default exports for pages
- `'use client'` directive only when client interactivity is required
- Prefer server components where possible

### Naming
- Components: PascalCase (`AgentforceCalculator.tsx`)
- Utilities/hooks: camelCase (`useCalculator.ts`)
- Pages: `page.tsx` (Next.js convention)

### TypeScript
- Strict mode enabled
- No `any` types — use `unknown` and narrow
- Interface over type for object shapes

### Git
- `main` = production
- `dev` = working branch
- Feature branches off `dev`: `feature/agentforce-calculator`
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`

## Design Direction
- Dark theme (slate-900 base)
- Professional but personal — not corporate
- Interactive tools are the differentiator
- Responsive: mobile-first
- Accessibility: semantic HTML, ARIA labels, keyboard nav