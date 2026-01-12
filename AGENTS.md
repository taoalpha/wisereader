# AGENTS GUIDE
1) Scope: Applies to entire repository unless overridden by nested AGENTS (none exist yet).
2) Purpose: Orient agentic contributors with commands, style, and expectations.
3) Project: WiseReader — Ink/React-based CLI for Readwise.
4) Language: TypeScript with ESM (NodeNext), strict mode on.
5) Package manager: pnpm (pnpm-lock.yaml present); prefer pnpm for install/run.
6) Import extensions: use `.js` suffix for local imports due to NodeNext ESM.
7) Entry point: `src/index.tsx` renders Ink UI and handles CLI commands.
8) API layer: `src/api.ts` wraps Readwise v3 endpoints via axios.
9) Markdown renderer: `src/components/Markdown.tsx` + `src/utils.ts`.
10) Logging: `src/debug.ts` appends to `debug.log`.

## Install & Environment
11) Install deps: `pnpm install`.
12) Runtime: Node 20+ recommended for ESM/tsx/ink.
13) Env token: `READWISE_TOKEN` required or stored via `pnpm start` -> config prompt saved by `conf`.
14) Platform: CLI TUI; avoid browser-only APIs.
15) No Docker config; local Node assumed.
16) Sea config: `sea-config.json` present for packaging; leave untouched unless shipping binary changes.
17) Dist artifacts live in `dist/`; git-ignored.
18) `node_modules` checked locally only; do not vendor.

## Build / Run / Package
19) Dev run (interactive TUI): `pnpm dev` (alias to `tsx src/index.tsx`).
20) Prod run (same command): `pnpm start` uses `tsx src/index.tsx`.
21) Build binary: `pnpm build` (runs `./build.sh`).
22) build.sh steps: esbuild bundle to `dist/bundle.js`, mock react-devtools-core alias, copy yoga-layout into staging, package via caxa to `dist/wisereader`.
23) Clean staging: build script recreates `dist/staging`; no clean command otherwise.
24) Run built binary: `./dist/wisereader` (after build).
25) Single-file bundle location: `dist/bundle.js` (ESM).
26) No watch build script; use `pnpm dev` for live coding.
27) Avoid running `npm build`; stick to pnpm for lockfile consistency.

## Testing / Linting / Formatting
28) Tests: none configured; `pnpm test` intentionally fails with placeholder.
29) Single-test guidance: not available (no framework); add Jest/Vitest only if requested.
30) Lint: no eslint config present.
31) Format: no formatter config present; follow existing 2-space indentation and semicolon-less style (except object literal statements that end lines naturally).
32) If adding tests/lint/format, confirm with maintainers before introducing dependencies.
33) Prefer manual review + TypeScript strictness for now.

## TypeScript & Modules
34) `tsconfig.json`: module `NodeNext`, resolution `NodeNext`, target `ESNext`.
35) `jsx`: `react-jsx` (automatic runtime).
36) `strict`: true; maintain type safety.
37) `esModuleInterop`: true; `skipLibCheck`: true; `forceConsistentCasingInFileNames`: true.
38) `verbatimModuleSyntax`: false; compiler allows default/named flexibility.
39) Include path: `src/**/*`; exclude `node_modules`.
40) Use interfaces/types over `any`; do not suppress errors with `as any`, `@ts-ignore`, `@ts-expect-error`.
41) When adding new files, keep `.ts`/`.tsx` in `src/` and export ESM with explicit `.js` suffix in relative imports.
42) Prefer named exports from modules unless default is idiomatic (e.g., axios default import).

## Imports & Style
43) External libs: default imports for axios, chalk, open, clipboardy, marked, TurndownService.
44) React/Ink: import `React` plus named hooks: `import React, { useState, useEffect } from 'react';` or `import { render, Text, Box, useInput, useApp, useStdout } from 'ink';`.
45) Local modules: use named exports with `.js` extension: `import { renderMarkdown } from './utils.js';`.
46) Order imports: external packages first, then local modules.
47) Avoid path aliases; repo uses relative paths only.
48) Maintain 2-space indentation; keep lines reasonably short for terminal readability.
49) Avoid unused imports; prune when touching files.
50) Keep functional components small; colocate helper functions near usage.

## React/Ink Patterns
51) Functional components only; hooks for state and effects.
52) UI states managed with `useState`; views are `'list' | 'reader' | 'menu' | 'open-menu' | 'copy-menu'`.
53) Input handling centralized via `useInput` in `src/index.tsx`; preserve Vim-style keybindings.
54) Use `useEffect` for data loading and terminal resize events; clean up listeners on unmount.
55) For Ink components, use `Box`/`Text`; keep layout minimal (CLI constraints).
56) Spinner from `ink-spinner` for loading states.
57) Select menus via `ink-select-input`; text entry via `ink-text-input` when needed.
58) Avoid styling changes without delegating to UI/UX specialist; focus on logic.
59) Maintain cursor/scroll logic in reader view; ensure calculations respect terminal size (rows/columns).
60) Keep state updates immutable and concise; avoid nested objects for simplicity.

## State & Navigation
61) Default view is list; reader view shows selected document content.
62) `selectedDoc` null check before reader actions.
63) `jumpBuffer` stores numeric prefixes for Vim moves; clear after action.
64) `scrollTop/scrollLeft` control viewport; clamp to bounds of parsed lines.
65) `cursorLine/cursorCol` track position; ensure clamping when lines shorten.
66) `termHeight/termWidth` come from `useStdout`; update on resize.
67) Keep navigation side effects predictable—prefer `setState` batching without timers unless necessary.

## API Layer
68) `src/api.ts` uses axios client with baseURL `https://readwise.io/api/v3` and `Token` auth header.
69) Token resolution: `process.env.READWISE_TOKEN` or persisted `conf` entry `token`.
70) Exposed functions: `saveToken`, `fetchDocuments`, `fetchDocumentContent`, `updateDocumentLocation`, `deleteDocument`.
71) Document type fields: `id`, `title`, `author`, `source_url`, `category`, `location`, `html_content?`, `summary?`, `updated_at`.
72) `fetchDocuments` accepts `location` (default `new`) and optional `pageSize`.
73) `fetchDocumentContent` requests `withHtmlContent` and returns first result; keep this contract.
74) Mutations: `updateDocumentLocation` uses PATCH `/update/{id}/`; `deleteDocument` uses DELETE `/delete/{id}/`.
75) Handle axios errors with message propagation; avoid swallowing errors.
76) Do not change API paths without aligning to Readwise v3 docs.

## Error Handling
77) UI-level errors: set `error` state and render red message; avoid crashing render.
78) CLI-level errors (non-TUI commands): log to stderr and `process.exit(1)` when needed.
79) Wrap async calls in try/catch; surface `.message` or fallback text.
80) Keep error messages concise; avoid leaking raw objects.
81) Do not use empty catch blocks; always handle or rethrow.
82) Prefer specific error states over boolean flags for clarity.

## Logging & Diagnostics
83) Use `log()` from `src/debug.ts` for debug traces; writes ISO timestamped lines to `debug.log`.
84) Do not spam logs in hot paths; keep concise.
85) Avoid console logging in TUI render loops; prefer state-driven UI.
86) Remove leftover `console.log` in production paths unless non-interactive mode requires output.

## Markdown Rendering
87) `renderMarkdown` converts HTML to markdown via Turndown then to ANSI via marked-terminal.
88) Links rendered blue `[text](href)` with custom renderer.
89) Wrapping: uses `wrapAnsi` when width provided; keep hard wrap for reader width.
90) `Markdown` component applies cursor highlighting with `chalk.inverse` and `slice-ansi` for column-accurate selection.
91) `scrollLeft` and `width` trim via `slice-ansi`; handle errors via `log` but return original line.
92) If modifying renderer, preserve non-interactive readability and link visibility.

## File Layout Expectations
93) `src/index.tsx`: main Ink app, input handling, view switching.
94) `src/components/Markdown.tsx`: rendering component; keep logic focused on display, not data fetch.
95) `src/api.ts`: API-only; avoid UI logic here.
96) `src/utils.ts`: markdown utilities; keep side-effect free.
97) `src/debug.ts`: logging utility; avoid heavy deps or async writes.
98) New helpers belong in `src/` with focused scope; avoid deep folder hierarchies.

## Dependencies & Packaging
99) Runtime deps: axios, chalk, clipboardy, conf, env-paths, ink (+ select/input/spinner), marked, marked-terminal, open, react/react-dom, slice-ansi, strip-ansi, turndown, wrap-ansi, yoga-layout (native).
100) Dev deps: esbuild, tsx, typescript, ts-node, caxa, pkg, postject, @types packages.
101) Do not add UI libraries; terminal constraints only.
102) Avoid switching bundler; esbuild is standard here.
103) `react-devtools-core` is mocked in build to keep bundle small; maintain alias.
104) Yoga native module copied into staging; ensure path correctness if updating deps.

## Release & Binaries
105) Build output binary at `dist/wisereader`; chmod +x if needed.
106) Sea/PKG configs exist but build.sh currently uses caxa; follow script unless explicitly changing packaging pipeline.
107) Do not commit `dist/` artifacts unless release process demands; default keep out of git.
108) For distributing, reference README download instructions; ensure token config still works.

## Testing Guidance
109) No tests exist; do not fabricate coverage claims.
110) If adding tests, prefer Vitest for ESM + Ink compatibility; colocate in `src/__tests__`.
111) Single test command should be `pnpm test <pattern>` once configured; document pattern if you add tests.
112) Use Ink testing utilities or snapshot output cautiously; terminal rendering changes may be brittle.
113) Avoid mocking axios globally unless scoped; prefer MSW/node fetch-mocking if introduced later.

## Error States & UX
114) Loading: `Spinner` used while fetching documents; keep user feedback clear.
115) Empty lists: handle gracefully without crashes; show message.
116) Navigation: Escape/left returns to list; ensure state resets (jumpBuffer, scroll, cursor) when leaving reader.
117) Movement keys: j/k, g/G, w/b, h/l; preserve Vim semantics when editing.
118) Actions: `M` opens move menu; `O` open link; `C` copy menu; keep mnemonic.
119) Reader view uses parsed lines for scrolling; ensure updates trigger re-render via state.

## Accessibility & Output
120) Keep ANSI output readable on dark/light backgrounds; avoid low-contrast colors.
121) Do not rely on mouse support; keyboard-only.
122) Avoid emitting control codes outside Ink; manage via Ink components.
123) Content should fit typical 80-120 column terminals; wrap accordingly.

## Performance
124) Avoid heavy synchronous loops in render; precompute with `useMemo` like Markdown component.
125) Avoid blocking I/O; use async/await for API and fs when feasible (log uses sync append intentionally for simplicity).
126) Keep bundle lean; unused deps should be removed rather than tree-shaken only.
127) Prefer incremental fetches over loading all pages unless requirement changes.

## Security & Tokens
128) Never commit tokens; rely on env or `conf` storage.
129) Avoid logging token values; redact if necessary.
130) HTTPS enforced via BASE_URL; do not downgrade.
131) Validate inputs for CLI arguments if new commands are added.

## Contribution Etiquette
132) Follow existing style; avoid large refactors in bugfixes.
133) Keep PRs small and focused; describe commands run.
134) Do not introduce breaking keybinding changes without explicit approval.
135) Avoid global state; prefer passing props or context if ever added.
136) Before altering build/release, confirm with maintainers.
137) Keep README usage instructions in sync with behavior when changed.

## AI/Assistant Notes
138) No Cursor/Copilot instruction files exist; this AGENTS.md governs agent behavior.
139) Agents must not add tests/lint/format tools unless requested.
140) Agents must not change styling/layout; delegate UI visuals to UI specialist.
141) Agents must not suppress type errors with `any`/`ts-ignore`.
142) Agents must use pnpm for install/build; avoid npm/yarn.
143) Agents should provide command evidence (logs/outputs) when asked.
144) Agents should run `lsp_diagnostics` on changed files before delivery when applicable.

## Quick Command Cheat Sheet
145) Install: `pnpm install`.
146) Dev/Run: `pnpm dev` or `pnpm start`.
147) Build binary: `pnpm build` (runs `./build.sh`).
148) Run built binary: `./dist/wisereader`.
149) Tests: none configured (`pnpm test` fails by design).
150) Lint/format: none configured; follow manual style above.
