// One-time import of the current content (src/data/seed.json + public/img) into Supabase.
// Run after supabase/schema.sql:
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... npm run seed
// The service-role key is secret: use it only here on your own computer, never in the site or in Git.
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.'); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });
const seed = JSON.parse(await readFile(new URL('../src/data/seed.json', import.meta.url)));

const ok = (label) => ({ error }) => { if (error) { console.error(label, error.message); process.exit(1); } console.log('✓', label); };

// 1. Images: every stem used by items, category covers and the home-page circles
const stems = new Set([...seed.items.map((i) => i.image), ...seed.categories.map((c) => c.cover).filter(Boolean), ...seed.settings.heroLinks.map((l) => l.image)]);
let n = 0;
for (const stem of stems) {
  for (const suffix of ['', '-sm']) {
    const file = new URL(`../public/img/${stem}${suffix}.webp`, import.meta.url);
    if (!existsSync(file)) { console.warn('missing', stem + suffix); continue; }
    const { error } = await db.storage.from('images').upload(`${stem}${suffix}.webp`, await readFile(file), { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
    if (error) { console.error('upload', stem, error.message); process.exit(1); }
  }
  n++;
}
console.log(`✓ ${n} images`);

// 2. Content
await db.from('categories').upsert(seed.categories.map(({ subs, ...c }) => c)).then(ok('categories'));
await db.from('subcategories').upsert(seed.categories.flatMap((c) => c.subs.map((s) => ({ category: c.slug, ...s })))).then(ok('subcategories'));
await db.from('items').upsert(seed.items.map((i) => ({ id: i.id, category: i.cat, subcategory: i.sub, title: i.title, caption: i.caption, alt: i.alt, image: i.image, sort: i.sort, visible: i.visible }))).then(ok('items'));
await db.from('reviews').upsert(seed.reviews).then(ok('reviews'));
await db.from('price_sections').upsert(seed.prices.sections.map(({ rows, ...s }) => s)).then(ok('price sections'));
await db.from('price_rows').delete().gte('id', 0).then(ok('clear price rows'));
await db.from('price_rows').insert(seed.prices.sections.flatMap((s) => s.rows.map((r) => ({ section_id: s.id, ...r })))).then(ok('price rows'));
const S = seed.settings;
await db.from('settings').upsert([
  { key: 'phone', value: S.phone }, { key: 'wa_number', value: S.waNumber },
  { key: 'instagram', value: S.instagram }, { key: 'facebook', value: S.facebook },
  { key: 'hero', value: S.hero }, { key: 'hero_links', value: S.heroLinks },
  { key: 'prices_note', value: seed.prices.note },
]).then(ok('settings'));

// 3. New works continue after the highest imported number (identity columns don't move on their own)
const { error } = await db.rpc('sync_ids');
if (error) console.warn('Run this once in the SQL editor so new works continue the numbering:\n' +
  "select setval(pg_get_serial_sequence('public.items','id'), (select max(id) from public.items));\n" +
  "select setval(pg_get_serial_sequence('public.reviews','id'), (select max(id) from public.reviews));\n" +
  "select setval(pg_get_serial_sequence('public.price_sections','id'), (select max(id) from public.price_sections));");
else console.log('✓ numbering');
console.log('Done.');
