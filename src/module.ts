import { addVitePlugin, defineNuxtModule } from '@nuxt/kit';
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
  async setup(options, nuxt) {
    const config = mergeConfig(DEFAULT_OPTIONS, options);

    logger.setLevel(config.logLevel);

    if (!config.enable) {
      logger.info('CSS obfuscator is disabled');
      return;
    }

    if (nuxt.options.dev) {
      logger.info('CSS obfuscation is skipped in development mode');
      return;
    }

    const obfuscator = new Obfuscator(config, nuxt.options.rootDir, { executionMode: 'module' });
    obfuscator.prepare();

    if (config.enableMarkers) {
      addVitePlugin({
        name: 'nuxt-css-obfuscator-markers',
        enforce: 'pre',
        transform(code, id) {
          if (!id.split('?', 1)[0].endsWith('.vue')) return;
          const result = obfuscator.getFileProcessor().transformVueSourceWithMarkers(code, {
            selector: (name) => config.markers.includes(name) ? name : obfuscator.getParser().ensureSelector(name),
            ident: (name) => obfuscator.getParser().ensureIdent(name),
          });
          return result.changed ? { code: result.content, map: null } : undefined;
        },
      });
    }

    let ran = false;
    nuxt.hook('nitro:init', (nitro) => {
      nuxt.hook('nitro:build:public-assets', async () => {
        obfuscator.setBuildFolderPath(nitro.options.output.publicDir);
        logger.info('Running CSS obfuscation after Nitro copied public assets...');
        const result = await obfuscator.obfuscate();
        if (nitro.options.compressPublicAssets) obfuscator.refreshCompressedFiles(result.changedFiles);
      });
      nitro.hooks.hook('compiled', async () => {
        if (ran) return;
        ran = true;
        obfuscator.setBuildFolderPath(nitro.options.output.serverDir);
        logger.info('Running CSS obfuscation after Nitro compiled its server output...');
        await obfuscator.obfuscate();
      });
    });

    logger.info('Nuxt CSS Obfuscator module initialized');
  },
});
