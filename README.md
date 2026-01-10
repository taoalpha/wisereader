# WiseReader

A minimalist, Vim-inspired CLI client for Readwise Reader.

## Features

- **Interactive Inbox**: Browse your Readwise Inbox directly from the terminal.
- **Vim-style Navigation**:
  - **List View**:
    - `j` / `k`: Move down/up.
    - `g` / `G`: Jump to top/bottom.
    - `Enter`: Open item.
    - `r`: Refresh inbox.
  - **Reader View**:
    - `j` / `k`: Move down/up (centered scrolling).
    - `h` / `l`: Move left/right.
    - `w` / `b`: Jump forward/backward by word.
    - `g` / `G`: Jump to top/bottom.
    - `M`: Move article (Archive, Later, Delete).
      - `a`: Archive
      - `l`: Later
      - `d`: Delete
    - `O`: Open link (prompts if multiple links at cursor).
    - `Esc`: Back to list.
- **Action Menu**: Press `M` to move items to Later, Archive, or Delete them.
- **Auto-Cleanup**: Opening an item automatically marks it as seen (moves it to your Feed).
- **Standalone Binary**: Zero dependencies, single executable.

## Installation

Download the latest binary for macOS (arm64):

```bash
curl -L https://github.com/taoalpha/wisereader/releases/download/v0.0.1/wisereader -o wisereader && chmod +x wisereader
./wisereader config
```

## Configuration

Set your Readwise access token:

```bash
./wisereader config
```

You can find your token at [readwise.io/access_token](https://readwise.io/access_token).

## Usage

Simply run the binary to start browsing your inbox:

```bash
./wisereader
```

### CLI Commands

WiseReader also supports direct command-line interactions:

- **Read next article**:
  ```bash
  ./wisereader -r
  ```
  Prints the content of the first available article, marks it as seen, and outputs its URL and ID.

- **Delete by ID (shortcut)**:
  ```bash
  ./wisereader -d <id>
  ```
  Quickly delete an article by its ID.

- **Move/Delete by ID**:
  ```bash
  ./wisereader -m <later|archive|delete> <id>
  ```
  Moves or deletes the article with the given ID.

## Build from Source

Requirements: [pnpm](https://pnpm.io/) and Node.js.

```bash
pnpm install
pnpm build
```

The executable will be generated in `dist/wisereader`.
