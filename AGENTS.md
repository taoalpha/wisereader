# AGENTS.md — WiseReader

> **Scope**: Entire repository. No nested overrides.  
> **Project**: WiseReader — Ink/React CLI for Readwise Reader.  
> **Language**: TypeScript (ESM, NodeNext, strict mode).

---

## Quick Commands

| Action | Command |
|--------|---------|
| Install | `pnpm install` |
| Dev/Run | `pnpm dev` or `pnpm start` |
| Build binary | `pnpm build` (runs `./build.sh`) |
| Run binary | `./dist/wisereader` |
| Tests | None configured (`pnpm test` fails by design) |
| Lint/Format | None configured; follow manual style below |

---

## Project Structure

```
src/
├── index.tsx          # Main Ink app, input handling, view switching
├── api.ts             # Readwise v3 API wrapper (axios)
├── utils.ts           # Markdown conversion utilities
├── debug.ts           # Logging (appends to debug.log)
└── components/
    └── Markdown.tsx   # Rendering component with cursor support
```

---

## TypeScript & Module Config

- **tsconfig**: `module: NodeNext`, `target: ESNext`, `jsx: react-jsx`, `strict: true`
- **Import extensions**: Use `.js` suffix for local imports (ESM NodeNext requirement)
- **Type safety**: Never use `as any`, `@ts-ignore`, `@ts-expect-error`
- **Exports**: Prefer named exports; default only when idiomatic (e.g., axios)

---

## Code Style

### Formatting
- 2-space indentation, no semicolons
- Keep lines reasonably short for terminal readability

### Imports (order matters)
```typescript
// 1. External packages
import React, { useState, useEffect } from 'react'
import { render, Text, Box, useInput, useApp } from 'ink'
import axios from 'axios'

// 2. Local modules (with .js extension)
import { renderMarkdown } from './utils.js'
import { fetchDocuments, Document } from './api.js'
import { log } from './debug.js'
```

### Naming
- Components: `PascalCase` (Markdown, App, Config)
- Functions/variables: `camelCase` (fetchDocuments, selectedDoc)
- Types/Interfaces: `PascalCase` (Document, MarkdownProps)

---

## React/Ink Patterns

- Functional components only; use hooks for state and effects
- Views: `'list' | 'reader' | 'menu' | 'open-menu' | 'copy-menu'`
- Input handling centralized via `useInput` in `src/index.tsx`
- Preserve Vim-style keybindings (j/k, g/G, w/b, h/l)
- Use `useMemo` for expensive computations
- Clean up listeners in `useEffect` return

---

## API Layer (`src/api.ts`)

- Base URL: `https://readwise.io/api/v3`
- Auth: `Token` header from `READWISE_TOKEN` env or `conf` storage
- Functions: `saveToken`, `fetchDocuments`, `fetchDocumentContent`, `updateDocumentLocation`, `deleteDocument`, `createDocument`
- Handle axios errors with message propagation; never swallow errors

---

## Error Handling

- UI errors: Set `error` state, render red message, avoid crashing render
- CLI errors: Log to stderr, `process.exit(1)`
- Wrap async calls in try/catch; use `e.message` or fallback text
- **Never** use empty catch blocks; always handle or rethrow
- Exception pattern: `catch (e: any) { setError(e.message || 'Fallback') }`

---

## Logging (`src/debug.ts`)

- Use `log()` for debug traces; writes ISO timestamped lines to `debug.log`
- Do not spam logs in hot paths
- Avoid `console.log` in TUI render loops

---

## Build & Packaging

- `pnpm build` runs `./build.sh`:
  1. esbuild bundles to `dist/bundle.js`
  2. Mocks `react-devtools-core`
  3. Copies `yoga-layout` into staging
  4. Packages via caxa to `dist/wisereader`
- Do not commit `dist/` artifacts

---

## Environment

- Runtime: Node 20+
- Token: `READWISE_TOKEN` env or run `./wisereader config`
- Platform: CLI TUI; avoid browser-only APIs

---

## Dependencies

**Runtime**: axios, chalk, clipboardy, conf, ink (+select/input/spinner), marked, marked-terminal, open, react, slice-ansi, strip-ansi, turndown, wrap-ansi

**Dev**: esbuild, tsx, typescript, caxa, @types/*

- Use pnpm for all commands; avoid npm/yarn
- Do not add UI libraries beyond terminal constraints

---

## AI Agent Rules

1. **Use pnpm** for install/build; avoid npm/yarn
2. **Never suppress type errors** with `any`/`@ts-ignore`/`@ts-expect-error`
3. **Never add tests/lint/format tools** unless explicitly requested
4. **Never change styling/layout** without delegating to UI specialist
5. **Run `lsp_diagnostics`** on changed files before delivery
6. **Follow existing patterns**; avoid large refactors in bugfixes
7. **Keep PRs small and focused**
8. **Never commit tokens**; rely on env or `conf` storage
9. **Never introduce breaking keybinding changes** without approval

---

## Security

- Never commit tokens or log token values
- HTTPS enforced via BASE_URL; do not downgrade
- Validate CLI argument inputs if adding new commands

---

## Testing Guidance (if adding tests)

- Prefer Vitest for ESM + Ink compatibility
- Colocate tests in `src/__tests__/`
- Use Ink testing utilities cautiously; terminal rendering may be brittle
