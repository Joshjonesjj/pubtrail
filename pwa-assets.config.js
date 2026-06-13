import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Generates PWA + iOS icons from the master logo.
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/pubtrail-logo.svg'],
});
