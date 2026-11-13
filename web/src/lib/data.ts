/* Site data, read once at build time.
   With PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY set, everything comes from Supabase
   (only rows marked visible; the public key can't read anything else).
   Without them, the site builds from src/data/seed.json, the prototype's content. */
import { createClient } from '@supabase/supabase-js';
import seed from '../data/seed.json';

export type Sub = { slug: string; name: string; sort: number; visible: boolean };
export type Category = { slug: string; name: string; blurb: string; cover: string | null; sort: number; visible: boolean; subs: Sub[] };
export type Item = { id: number; cat: string; sub: string | null; title: string; caption: string; alt: string; image: string; visible: boolean; sort: number };
export type Review = { id: number; text: string; tag: string; visible: boolean; sort: number };
export type PriceRow = { name: string; price: string; unit: string; sort: number };
export type PriceSection = { id: number; title: string; sort: number; rows: PriceRow[] };
export type HeroLink = { cat: string; title: string; image: string };
export type Settings = { phone: string; waNumber: string; instagram: string; facebook: string; hero: number[]; heroLinks: HeroLink[] };
export type SiteData = {
  settings: Settings; categories: Category[]; items: Item[]; reviews: Review[];
  prices: { note: string; sections: PriceSection[] };
};

const URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;
export const usingSupabase = !!(URL && KEY);

/* Images are stored as a "stem": large = <stem>.webp (1400px), small = <stem>-sm.webp (640px). */
const IMG_BASE = usingSupabase ? `${URL}/storage/v1/object/public/images/` : '/img/';
export const imgUrl = (stem: string, small = false) => IMG_BASE + stem + (small ? '-sm' : '') + '.webp';

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort;

async function fromSupabase(): Promise<SiteData> {
  const db = createClient(URL!, KEY!, { auth: { persistSession: false } });
  const must = async <T,>(q: PromiseLike<{ data: T | null; error: any }>) => {
    const { data, error } = await q;
    if (error) throw new Error('Supabase: ' + error.message);
    return data as T;
  };
  const [cats, subs, items, reviews, sections, rows, settings] = await Promise.all([
    must<any[]>(db.from('categories').select('*').order('sort')),
    must<any[]>(db.from('subcategories').select('*').order('sort')),
    must<any[]>(db.from('items').select('*').order('sort')),
    must<any[]>(db.from('reviews').select('*').order('sort')),
    must<any[]>(db.from('price_sections').select('*').order('sort')),
    must<any[]>(db.from('price_rows').select('*').order('sort')),
    must<any[]>(db.from('settings').select('*')),
  ]);
  const s = Object.fromEntries(settings.map((r) => [r.key, r.value]));
  return {
    settings: {
      phone: s.phone ?? seed.settings.phone,
      waNumber: s.wa_number ?? seed.settings.waNumber,
      instagram: s.instagram ?? seed.settings.instagram,
      facebook: s.facebook ?? '',
      hero: s.hero ?? seed.settings.hero,
      heroLinks: s.hero_links ?? seed.settings.heroLinks,
    },
    categories: cats.map((c) => ({
      slug: c.slug, name: c.name, blurb: c.blurb ?? '', cover: c.cover ?? null, sort: c.sort, visible: c.visible,
      subs: subs.filter((x) => x.category === c.slug).map((x) => ({ slug: x.slug, name: x.name, sort: x.sort, visible: x.visible })),
    })),
    items: items.map((i) => ({ id: i.id, cat: i.category, sub: i.subcategory, title: i.title, caption: i.caption ?? '', alt: i.alt || i.title, image: i.image, visible: i.visible, sort: i.sort })),
    reviews: reviews.map((r) => ({ id: r.id, text: r.text, tag: r.tag ?? '', visible: r.visible, sort: r.sort })),
    prices: {
      note: s.prices_note ?? seed.prices.note,
      sections: sections.map((p) => ({
        id: p.id, title: p.title, sort: p.sort,
        rows: rows.filter((r) => r.section_id === p.id).map((r) => ({ name: r.name, price: r.price, unit: r.unit ?? '', sort: r.sort })),
      })),
    },
  };
}

let cache: Promise<SiteData> | null = null;
export function getData(): Promise<SiteData> {
  if (!cache) {
    cache = (usingSupabase ? fromSupabase() : Promise.resolve(seed as SiteData)).then((d) => {
      // Only what's meant to be public goes on the site.
      const items = d.items.filter((i) => i.visible).sort(bySort);
      const categories = d.categories
        .filter((c) => c.visible)
        .sort(bySort)
        .map((c) => ({ ...c, subs: c.subs.filter((s) => s.visible).sort(bySort) }));
      return {
        ...d,
        items,
        categories,
        reviews: d.reviews.filter((r) => r.visible).sort(bySort),
        prices: { ...d.prices, sections: d.prices.sections.sort(bySort).map((s) => ({ ...s, rows: s.rows.sort(bySort) })) },
      };
    });
  }
  return cache;
}

/* Helpers shared by pages */
export function itemsIn(d: SiteData, cat?: string, sub?: string) {
  return d.items.filter((i) => (!cat || i.cat === cat) && (!sub || i.sub === sub));
}
/* A category (or sub-category) is shown as soon as it has one visible item. */
export function shownCategories(d: SiteData) {
  return d.categories
    .filter((c) => itemsIn(d, c.slug).length > 0)
    .map((c) => ({ ...c, subs: c.subs.filter((s) => itemsIn(d, c.slug, s.slug).length > 0) }));
}
export function catName(d: SiteData, cat: string, sub?: string | null) {
  const c = d.categories.find((x) => x.slug === cat);
  if (!c) return '';
  const s = sub ? c.subs.find((x) => x.slug === sub) : null;
  return c.name + (s ? ' · ' + s.name : '');
}
export function coverOf(d: SiteData, c: Category) {
  if (c.cover) return c.cover;
  return itemsIn(d, c.slug)[0]?.image ?? '';
}
