#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const binDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(binDir, '..');
const cliPath = resolve(projectRoot, 'src/cli.ts');

const child = spawn(
  process.execPath,
  ['--experimental-strip-types', cliPath, ...process.argv.slice(2)],
  {
    cwd: projectRoot,
    stdio: 'inherit',
  },
);

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(`Failed to start gym: ${error.message}`);
  process.exit(1);
});
