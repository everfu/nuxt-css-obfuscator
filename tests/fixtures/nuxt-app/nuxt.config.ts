import cssObfuscator from '../../../src/module';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: [[cssObfuscator, {
    mode: 'simplify',
    removeOriginalCss: true,
    refreshClassConversionJson: true,
    classConversionJsonFolderPath: '.test-conversion',
    logLevel: 'info',
  }]],
});
