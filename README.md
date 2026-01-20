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
    - `C`: Copy menu (Copy URL, Copy ID).
      - `u`: Copy URL
      - `i`: Copy ID
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

Install via script (macOS/Linux):

```bash
curl -fsSL https://raw.githubusercontent.com/taoalpha/wisereader/master/scripts/install.sh | bash
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

- **Read next article (or specific ID)**:
  ```bash
  ./wisereader -r [id]
  ```
  Prints the content of the first available article (or the one with the given ID), marks it as seen, and outputs its URL and ID.

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

Requirements: [Bun](https://bun.sh/) and Node.js.

```bash
bun install
bun run build
```

The executable will be generated in `dist/wisereader`.
