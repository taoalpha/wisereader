import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const entry = path.join(root, 'src', 'index.tsx');

const target = process.env.BUN_TARGET;
const outfileEnv = process.env.BUN_OUTFILE;
const defaultTarget = (() => {
  if (process.platform === 'darwin' && process.arch === 'arm64') {
    return 'bun-darwin-arm64';
  }
  if (process.platform === 'darwin' && process.arch === 'x64') {
    return 'bun-darwin-x64';
  }
  if (process.platform === 'linux' && process.arch === 'arm64') {
    return 'bun-linux-arm64';
  }
  if (process.platform === 'linux' && process.arch === 'x64') {
    return 'bun-linux-x64';
  }
  if (process.platform === 'win32' && process.arch === 'x64') {
    return 'bun-windows-x64';
  }
  if (process.platform === 'win32' && process.arch === 'arm64') {
    return 'bun-windows-arm64';
  }
  return 'bun';
})();
const resolvedTarget = target ?? defaultTarget;
const isWindows = resolvedTarget.includes('windows') || process.platform === 'win32';
const outfile = outfileEnv ?? path.join(distDir, `wisereader${isWindows ? '.exe' : ''}`);

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

const args = [
  'build',
  entry,
  '--compile',
  '--outfile',
  outfile,
  '--target',
  resolvedTarget,
  '--sourcemap=linked',
  '--minify',
  '--define:process.env.NODE_ENV="production"',
];

const processResult = Bun.spawn({
  cmd: ['bun', ...args],
  stdout: 'inherit',
  stderr: 'inherit',
});

const exitCode = await processResult.exited;
if (exitCode !== 0) {
  process.exit(exitCode);
}

console.log(`Built ${outfile}`);
