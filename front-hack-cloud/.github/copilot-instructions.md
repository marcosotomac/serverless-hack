## Purpose

This file gives concise, actionable guidance for AI coding agents (Copilot/assistant) working on the front-hack-cloud Next.js app.

## Quick start (what to run)

- Prefer pnpm when available (this repo includes a pnpm lockfile). Common commands (any package manager works):
  - Development: `pnpm dev` (or `npm run dev`)
  - Build: `pnpm build`
  - Start (production): `pnpm start`
  - Lint: `pnpm lint` (runs `eslint` as defined in `package.json`)

## Big-picture architecture

- This is a Next.js (App Router) project using the `app/` directory (see `app/layout.tsx` and `app/page.tsx`). Expect server and client components patterns from Next 13+/App Router.
- TypeScript is enabled (see `tsconfig.json`, `strict: true`).
- Styling: Tailwind CSS + `globals.css` (imported in `app/layout.tsx`). `tailwind-merge` and `clsx` are used for class composition.
- Utilities: `lib/utils.ts` exports `cn(...)` which calls `clsx` + `twMerge` — use this helper to merge tailwind classnames consistently.
- Fonts: `next/font/google` is used to load Geist fonts in `app/layout.tsx` (see the `Geist` and `Geist_Mono` usage).
- Public assets live in `public/` and are referenced with `next/image` in pages (e.g. `app/page.tsx`).

## Key files to consult

- `package.json` — scripts and major dependencies (Next 16, React 19, Tailwind v4, shadcn, class-variance-authority)
- `app/layout.tsx` — root layout, global fonts, and global CSS import
- `app/page.tsx` — example landing page; good reference for UI patterns and `next/image` usage
- `lib/utils.ts` — `cn` helper for class merging
- `tsconfig.json` — path alias: `@/*` -> `./*` (useful when resolving imports)
- `next.config.ts` — project-wide Next configuration placeholder

## Project-specific conventions and patterns

- Always use the `cn(...)` helper from `lib/utils.ts` when composing className strings to ensure consistent merging and deduplication (it wraps `clsx` + `twMerge`).
- Prefer `next/image` for images stored in `public/` (example in `app/page.tsx`).
- Font loading is centralized in `app/layout.tsx` using `next/font/google` variables — keep that pattern for global fonts rather than injecting raw <link> tags.
- Path alias `@/*` exists — but most files use relative imports; if adding new modules consider the alias for cross-root imports.
- This repo includes `shadcn` as a devDependency. If you add UI components, follow shadcn conventions (atomic component files, tailwind utility classes).

## Runs, builds, and tests

- No test framework (Jest/Playwright/RTL) is present in the repo. Do not add references to test commands unless you add the corresponding config and deps.
- Lint command exists (`eslint`) but no explicit CLI arguments in `package.json`. Use `pnpm lint` or `npx eslint .` for full project linting.

## External integrations & upgrade notes

- Major dependencies to be aware of: `next@16.0.3`, `react@19.2.0`, `tailwindcss@4`, `shadcn`, `class-variance-authority`, `lucide-react`.
- When modifying server/client behavior, remember the App Router's server-component defaults (components under `app/` may be server components unless marked "use client").

## Examples (copyable patterns)

- Import and use the class helper:

  import { cn } from "lib/utils"

  // inside a component:
  <div className={cn("p-4 rounded", isActive && "bg-blue-500")}>...</div>

- Global layout / font usage (follow `app/layout.tsx` approach): load fonts with `next/font/google` and add variables to the body class list.

## When in doubt

- Check `app/layout.tsx` for global patterns and `lib/utils.ts` for utility helpers. Use `app/page.tsx` as a minimal, canonical example of UI rules, class usage, and asset referencing.

---
If anything in this file is unclear or you'd like the agent to follow stricter rules (naming conventions, component boundaries, or testing expectations), tell me which areas to expand and I'll iterate.
