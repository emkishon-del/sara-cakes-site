// Static site. Pages are generated at build time from Supabase (or from src/data/seed.json
// when no Supabase keys are set), so every page, category and cake has its own real URL.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL || 'https://saracakes.co.il',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({ filter: (page) => !page.includes('/admin') }),
  ],
});
