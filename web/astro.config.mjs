// Static site. Pages are generated at build time from Supabase (or from src/data/seed.json
// when no Supabase keys are set), so every page, category and cake has its own real URL.
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // The site's own address, used in links for sharing (WhatsApp previews), the sitemap and Google.
  // On Netlify, URL is the site's main address: the temporary xxx.netlify.app now, saracakes.co.il once the domain is connected.
  site: process.env.SITE_URL || process.env.URL || 'https://saracakes.co.il',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({ filter: (page) => !page.includes('/admin') }),
  ],
});
