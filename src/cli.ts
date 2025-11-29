#!/usr/bin/env node

import { Command } from 'commander';
import { resolve } from 'path';
import { Obfuscator } from './core/obfuscator';
import { loadConfig } from './utils/config';
import { logger } from './utils/logger';

const program = new Command();

program
  .name('nuxt-css-obfuscator')
  .description('Obfuscate CSS class names in Nuxt.js build output')
  .version('1.0.0')
  .option('-c, --config <path>', 'Path to config file')
  .option('-d, --dir <path>', 'Project directory', process.cwd())
  .option('--build-dir <path>', 'Build directory (overrides config)')
  .option('--log-level <level>', 'Log level (silent|error|warn|info|debug)')
  .action(async (options) => {
    try {
      const rootDir = resolve(options.dir);
      const config = loadConfig(rootDir);

      // Override config with CLI options
      if (options.buildDir) {
        config.buildFolderPath = options.buildDir;
      }
      if (options.logLevel) {
        config.logLevel = options.logLevel;
      }

      logger.setLevel(config.logLevel);

      logger.info('Nuxt CSS Obfuscator');
      logger.info(`Project directory: ${rootDir}`);
      logger.info(`Build directory: ${config.buildFolderPath}`);
      logger.info(`Mode: ${config.mode}`);

      const obfuscator = new Obfuscator(config);
      await obfuscator.obfuscate();

      process.exit(0);
    } catch (error) {
      logger.error('Obfuscation failed:', error);
      process.exit(1);
    }
  });

program.parse();
