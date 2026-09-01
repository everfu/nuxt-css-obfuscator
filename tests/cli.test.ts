import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { runCliWithExitCode } from '../src/cli-program';

describe('CLI', () => {
  const temporaryDirectories: string[] = [];

  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
  });

  it('uses --config and resolves all configured paths from --dir', async () => {
    const root = mkdtempSync(join(tmpdir(), 'nuxt-css-obfuscator-cli-'));
    temporaryDirectories.push(root);
    mkdirSync(join(root, 'custom-output'));
    writeFileSync(join(root, 'custom-output', 'app.css'), '.card { color: red }');
    writeFileSync(join(root, 'custom-output', 'index.html'), '<div class="card"></div>');
    writeFileSync(join(root, 'custom.config.ts'), `export default {
      mode: 'simplify',
      buildFolderPath: 'custom-output',
      classConversionJsonFolderPath: 'custom-map',
      removeOriginalCss: true,
      allowExtensions: ['.html'],
      logLevel: 'silent'
    }`);

    const exitCode = await runCliWithExitCode(['node', 'nuxt-css-obfuscator', '--dir', root, '--config', 'custom.config.ts']);
    expect(exitCode).toBe(0);
    expect(readFileSync(join(root, 'custom-output', 'app.css'), 'utf-8')).toContain('.a{color:red}');
    expect(readFileSync(join(root, 'custom-output', 'index.html'), 'utf-8')).toContain('class="a"');
    expect(readFileSync(join(root, 'custom-map', 'conversion.json'), 'utf-8')).toContain('"card": "a"');
  });

  it('returns a failure status for missing and invalid configs', async () => {
    const root = mkdtempSync(join(tmpdir(), 'nuxt-css-obfuscator-cli-'));
    temporaryDirectories.push(root);
    writeFileSync(join(root, 'invalid.ts'), 'export default { enableMarkers: true, removeOriginalCss: true }');

    await expect(runCliWithExitCode(['node', 'cli', '--dir', root, '--config', 'missing.ts'])).resolves.toBe(1);
    await expect(runCliWithExitCode(['node', 'cli', '--dir', root, '--config', 'invalid.ts'])).resolves.toBe(1);
  });
});
