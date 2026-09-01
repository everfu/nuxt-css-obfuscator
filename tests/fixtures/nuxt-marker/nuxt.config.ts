import cssObfuscator from 'nuxt-css-obfuscator';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: [[cssObfuscator, {
    mode: 'simplify',
    enableMarkers: true,
    markers: ['obfuscate'],
    removeOriginalCss: false,
    refreshClassConversionJson: true,
    classConversionJsonFolderPath: '.test-conversion',
    logLevel: 'info',
  }]],
});
