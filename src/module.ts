import { defineNuxtModule, addBuildPlugin, createResolver } from '@nuxt/kit';
import type { Options } from './types';
import { Obfuscator } from './core/obfuscator';
import { mergeConfig, DEFAULT_OPTIONS } from './utils/config';
import { logger } from './utils/logger';

export default defineNuxtModule<Options>({
  meta: {
    name: 'nuxt-css-obfuscator',
    configKey: 'cssObfuscator',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: DEFAULT_OPTIONS,
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const config = mergeConfig(DEFAULT_OPTIONS, options);

    logger.setLevel(config.logLevel);

    if (!config.enable) {
      logger.info('CSS obfuscator is disabled');
      return;
    }

    // Hook into the build process
    nuxt.hook('build:done', async () => {
      logger.info('Running CSS obfuscation after build...');
      
      try {
        const obfuscator = new Obfuscator(config);
        await obfuscator.obfuscate();
      } catch (error) {
        logger.error('Failed to obfuscate CSS:', error);
      }
    });

    logger.info('Nuxt CSS Obfuscator module initialized');
  },
});
