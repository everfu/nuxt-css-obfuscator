import { Command } from 'commander';
import { resolve } from 'path';
import { Obfuscator } from './core/obfuscator';
import { loadConfig, validateConfig } from './utils/config';
import { logger } from './utils/logger';

export function createCliProgram(): Command {
  return new Command()
    .name('nuxt-css-obfuscator')
    .description('Obfuscate CSS class names in Nuxt.js build output')
    .version('1.1.0')
    .option('-c, --config <path>', 'Path to config file')
    .option('-d, --dir <path>', 'Project directory', process.cwd())
    .option('--build-dir <path>', 'Build directory (overrides config)')
    .option('--log-level <level>', 'Log level (silent|error|warn|info|debug)')
    .action(async (options) => {
      const rootDir = resolve(options.dir);
      const config = await loadConfig(rootDir, options.config);
      if (options.buildDir) config.buildFolderPath = options.buildDir;
      if (options.logLevel) config.logLevel = options.logLevel;
      validateConfig(config);
      logger.setLevel(config.logLevel);
      logger.info('Nuxt CSS Obfuscator');
      logger.info(`Project directory: ${rootDir}`);
      logger.info(`Build directory: ${config.buildFolderPath}`);
      logger.info(`Mode: ${config.mode}`);
      await new Obfuscator(config, rootDir, { executionMode: 'cli' }).obfuscate();
    });
}

export async function runCli(argv = process.argv): Promise<void> {
  await createCliProgram().parseAsync(argv);
}

export async function runCliWithExitCode(argv = process.argv): Promise<number> {
  try {
    await runCli(argv);
    return 0;
  } catch (error) {
    logger.error('Obfuscation failed:', error);
    return 1;
  }
}
