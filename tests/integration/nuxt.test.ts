import { afterEach, describe, expect, it } from 'vitest';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { readFileSync, rmSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import fg from 'fast-glob';

const execute = promisify(execFile);
const currentDirectory = dirname(fileURLToPath(import.meta.url));
const fixture = resolve(currentDirectory, '../fixtures/nuxt-app');
const markerFixture = resolve(currentDirectory, '../fixtures/nuxt-marker');

describe('Nuxt integration', () => {
  afterEach(() => {
    rmSync(resolve(fixture, '.nuxt'), { recursive: true, force: true });
    rmSync(resolve(fixture, '.output'), { recursive: true, force: true });
    rmSync(resolve(fixture, '.test-conversion'), { recursive: true, force: true });
    rmSync(resolve(markerFixture, '.nuxt'), { recursive: true, force: true });
    rmSync(resolve(markerFixture, '.output'), { recursive: true, force: true });
    rmSync(resolve(markerFixture, '.test-conversion'), { recursive: true, force: true });
  });

  it('runs once after Nitro output exists and keeps CSS, client and SSR mappings synchronized', async () => {
    const nuxt = resolve(currentDirectory, '../../node_modules/nuxt/bin/nuxt.mjs');
    const { stdout, stderr } = await execute(process.execPath, [nuxt, 'build', fixture], {
      cwd: resolve(currentDirectory, '../..'),
      env: { ...process.env, NODE_ENV: 'production' },
      maxBuffer: 20 * 1024 * 1024,
      timeout: 120_000,
    });
    const output = `${stdout}\n${stderr}`;
    expect(output.match(/Running CSS obfuscation after Nitro copied public assets/g)).toHaveLength(1);
    expect(output.match(/Running CSS obfuscation after Nitro compiled its server output/g)).toHaveLength(1);

    const conversion = JSON.parse(readFileSync(resolve(fixture, '.test-conversion/conversion.json'), 'utf-8'));
    const cssFiles = await fg('**/*.css', { cwd: resolve(fixture, '.output'), absolute: true });
    const scriptFiles = await fg('**/*.{js,mjs}', { cwd: resolve(fixture, '.output'), absolute: true });
    const css = cssFiles.map((file) => readFileSync(file, 'utf-8')).join('\n');
    const scripts = scriptFiles.map((file) => readFileSync(file, 'utf-8')).join('\n');

    for (const original of ['shell', 'title', 'active', 'mounted']) {
      expect(conversion.selectors[original]).toBeTruthy();
      expect(css).toContain(`.${conversion.selectors[original]}`);
      expect(css).not.toMatch(new RegExp(`\\.${original}(?![\\w-])`));
    }
    expect(css).toContain(`@keyframes ${conversion.idents.pulse}`);
    expect(css).toContain(`animation:${conversion.idents.pulse} 1s`);
    expect(scripts).toContain(conversion.selectors.shell);
    expect(scripts).toContain(conversion.selectors.active);
    expect(scripts).toContain(conversion.idents.hero);
    expect(Object.keys(conversion.selectors)).not.toContain(conversion.selectors.shell);
  }, 120_000);

  it('pre-transforms only marked Vue subtrees and preserves original CSS for unmarked content', async () => {
    const nuxt = resolve(currentDirectory, '../../node_modules/nuxt/bin/nuxt.mjs');
    await execute(process.execPath, [nuxt, 'build', markerFixture], {
      cwd: resolve(currentDirectory, '../..'),
      env: { ...process.env, NODE_ENV: 'production' },
      maxBuffer: 20 * 1024 * 1024,
      timeout: 120_000,
    });
    const conversion = JSON.parse(readFileSync(resolve(markerFixture, '.test-conversion/conversion.json'), 'utf-8'));
    const cssFiles = await fg('**/*.css', { cwd: resolve(markerFixture, '.output'), absolute: true });
    const scriptFiles = await fg('**/*.{js,mjs}', { cwd: resolve(markerFixture, '.output'), absolute: true });
    const css = cssFiles.map((file) => readFileSync(file, 'utf-8')).join('\n');
    const scripts = scriptFiles.map((file) => readFileSync(file, 'utf-8')).join('\n');

    expect(conversion.selectors).toMatchObject({ shared: expect.any(String), active: expect.any(String), inner: expect.any(String) });
    expect(conversion.selectors).not.toHaveProperty('obfuscate');
    expect(css).toContain('.shared');
    expect(css).toContain(`.${conversion.selectors.shared}`);
    expect(scripts).toContain('shared');
    expect(scripts).toContain(conversion.selectors.shared);
    expect(scripts).not.toContain('obfuscate');
  }, 120_000);
});
