#!/bin/bash
set -e

# 1. Bundle with esbuild (ESM)
echo "Bundling with esbuild..."
# We use a small alias to mock react-devtools-core
echo "export default {};" > dist/mock-devtools.js

pnpm exec esbuild src/index.tsx \
  --bundle \
  --platform=node \
  --format=esm \
  --outfile=dist/bundle.js \
  --external:yoga-layout \
  --alias:react-devtools-core=./dist/mock-devtools.js \
  --define:process.env.NODE_ENV='"production"' \
  --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);"

# 2. Prepare staging directory for caxa
echo "Preparing staging directory..."
STAGING="dist/staging"
rm -rf "$STAGING"
mkdir -p "$STAGING"
cp dist/bundle.js "$STAGING/"

# Copy native modules (follow symlinks)
mkdir -p "$STAGING/node_modules"
cp -LR node_modules/yoga-layout "$STAGING/node_modules/"

# 3. Package with caxa
echo "Packaging with caxa..."
pnpm exec caxa \
  --input "$STAGING" \
  --output dist/wisereader \
  --no-dedupe \
  -- "{{caxa}}/node_modules/.bin/node" "{{caxa}}/bundle.js"

echo "Build complete: dist/wisereader"
