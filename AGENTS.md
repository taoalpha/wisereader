# AGENTS.md — WiseReader

> **Scope**: Entire repository. No nested overrides.  
> **Project**: WiseReader — Ink/React CLI for Readwise Reader.  
> **Language**: TypeScript (ESM, NodeNext, strict mode).

---

## Quick Commands

| Action | Command |
|--------|---------|
| Install | `bun install` |
| Dev/Run | `bun run dev` or `bun run start` |
| Build binary | `bun run build` |
| Run binary | `./dist/wisereader` |
| Type check | `bun run typecheck` |
| Tests | None configured |
| Lint/Format | None configured; follow style below |

---

## Project Structure

```
src/
├── index.tsx          # Main Ink app, CLI handling, input/view logic
├── api.ts             # Readwise v3 API wrapper (axios + conf)
├── utils.ts           # HTML→Markdown conversion (turndown + marked)
├── debug.ts           # Logging (appends to debug.log)
└── components/
    └── Markdown.tsx   # Terminal markdown renderer with cursor
```

---

## TypeScript & ESM

- **Module**: `NodeNext` with `verbatimModuleSyntax: false`
- **Target**: `ESNext`, `jsx: react-jsx`, `strict: true`
- **Import extensions**: Always use `.js` for local imports (ESM requirement)
- **Type safety**: Avoid `as any`, `@ts-ignore`, `@ts-expect-error`
  - One legacy exception exists in `index.tsx` line 511; do not add more
- **Exports**: Prefer named exports; default only when idiomatic

---

## Code Style

### Formatting
- 4-space indentation in JSX/TSX components
- 2-space indentation in pure TypeScript (api.ts, utils.ts)
- Semicolons required
- Single quotes for strings

### Imports (order matters)
```typescript
// 1. React
import React, { useState, useEffect } from 'react';

// 2. External packages
import { render, Text, Box, useInput, useApp } from 'ink';
import axios from 'axios';

// 3. Local modules (with .js extension!)
import { Markdown } from './components/Markdown.js';
import { fetchDocuments, Document } from './api.js';
import { log } from './debug.js';
```

### Naming
- Components: `PascalCase` (Markdown, App, Config)
- Functions/variables: `camelCase` (fetchDocuments, selectedDoc)
- Types/Interfaces: `PascalCase` (Document, MarkdownProps)
- Constants: `UPPER_SNAKE_CASE` (BASE_URL, TOKEN)

---

## React/Ink Patterns

- Functional components only with hooks
- Views: `'list' | 'reader' | 'menu' | 'open-menu' | 'copy-menu'`
- Centralized input handling via `useInput` in `src/index.tsx`
- Vim-style keybindings: j/k (vertical), h/l (horizontal), g/G (jump), w/b (word)
- Use `useMemo` for expensive computations (markdown rendering)
- Clean up listeners in `useEffect` return callbacks
- Terminal dimensions via `useStdout()` with resize listener

---

## API Layer (`src/api.ts`)

- Base URL: `https://readwise.io/api/v3`
- Auth: `Token` header from `READWISE_TOKEN` env or `conf` storage
- Functions: `saveToken`, `fetchDocuments`, `fetchDocumentContent`, `updateDocumentLocation`, `deleteDocument`, `createDocument`
- Error handling: Let axios errors propagate with message

---

## Error Handling

```typescript
// UI errors: Set state, render red message
catch (e: any) {
  setError(e.message || 'Failed to fetch documents');
}

// CLI errors: Log to stderr, exit
catch (e: any) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}
```

- **Never** use empty catch blocks
- Always provide fallback error message

---

## Logging (`src/debug.ts`)

- Use `log()` for debug traces → writes to `debug.log`
- Avoid in hot paths (render loops)
- Never use `console.log` in TUI components

---

## Build & Packaging

`bun run build` uses `scripts/build.mjs`:
1. Bundles and compiles via `bun build --compile`
2. Emits a standalone binary to `dist/wisereader`

Do not commit `dist/` artifacts.

---

## CLI Flags

| Flag | Usage |
|------|-------|
| (none) | Start interactive TUI |
| `config` | Configure token |
| `-r [id]` | Read article, mark seen |
| `-m <action> <id>` | Move: later, archive, delete |
| `-d <id>` | Quick delete |
| `-a <url>` | Add document |
| `-h, --help` | Show help |

---

## Environment

- Runtime: Node 20+
- Token: `READWISE_TOKEN` env or `./wisereader config`
- Platform: CLI TUI only; no browser APIs

---

## AI Agent Rules

1. **Use bun** for all commands; never npm/pnpm/yarn
2. **Run `bun run typecheck`** to verify types before delivery
3. **Run `lsp_diagnostics`** on changed files
4. **Never add new `@ts-ignore`** — fix the type issue instead
5. **Never add tests/lint/format tools** unless requested
6. **Never change keybindings** without explicit approval
7. **Follow existing patterns** in similar files
8. **Keep PRs small** — avoid refactoring in bugfixes
9. **Never commit tokens** or log token values

---

## Security

- Never commit `.env` or tokens
- Never log token values
- HTTPS enforced via BASE_URL constant
- Validate CLI argument inputs

---

## Dependencies (do not add without approval)

**Runtime**: axios, chalk, clipboardy, conf, ink (+select/input/spinner), marked, marked-terminal, open, react, slice-ansi, strip-ansi, turndown, wrap-ansi

**Dev**: typescript, @types/*
