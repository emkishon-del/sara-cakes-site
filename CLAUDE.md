# CLAUDE.md – Sara Cakes & Sweets website

> Start with HANDOFF.md (Hebrew) for the full history, decisions and open items.

## What this is
Marketing site + catalog for Sara Cakes & Sweets, a home cake business in Jerusalem (custom cakes, desserts, sweet tables, catering buffets, workshops). The single conversion goal is a WhatsApp message to Sara. Full spec: `docs/` (Hebrew, version 7: `docs/spec-v7.md`). The spec is the source of truth; read it before changing scope.

## Current state
- `web/` is the production site (phase A, built 11.11): Astro 5 static output, real URLs, Supabase data layer with a seed fallback (`web/src/data/seed.json`), admin page at `/admin/`, schema + RLS in `web/supabase/schema.sql`, import script `web/scripts/seed.mjs`, Netlify config. Setup steps: `web/README.md` (Hebrew).
- `site/` is the approved prototype (hash-routed, `site/data/catalog.js`). Keep it as the visual reference; new work goes into `web/`.
- Page changes use CSS cross-document view transitions; catalog filters switch in place with `history.pushState` and keep their real URLs.
- URLs: `/catalog/<cat>/<sub>/`, `/cake/<id>/`. Slugs: cakes, sweet-tables, desserts, catering, gifts, workshops; cake subs include `bar-bat-mitzvah` and `halake` (shown as "חאלקה"). Work numbers never change or get reused.

## Production target (phase A)
- Separate real URLs per page, category and item (e.g. `/catalog/cakes/bat-mitzvah`, `/cake/42`) for SEO and shareable links. Suggested stack: Astro (static output) or plain static pages generated from data.
- Supabase: Postgres for items/categories/reviews, Storage for images, Auth for two fixed admins (Sara and Mani). No user management.
- Admin page (desktop only in phase A): multi-upload with automatic resize to WebP (1400px + 640px), category/sub-category, optional caption, auto alt text (editable), drag to reorder, show/hide toggle, delete, pick 3 hero images, add/hide reviews, edit the price list. Categories are a fixed list (rename/hide only).
- Hosting: Netlify, Vercel or Cloudflare Pages. All accounts owned by Sara; Mani is an additional admin.
- Analytics: cookieless (e.g. Umami); track WhatsApp clicks by page and by item.
- Domain: saracakes.co.il.

## Hard requirements
- Hebrew only, RTL. Brand name and logo lines are English (`lang="en"` on those spans).
- Accessibility: Israeli standard IS 5568 / WCAG 2.0 AA. Keyboard navigation, visible focus, skip link, alt text, heading order, 200% zoom, labelled form fields with text errors, `prefers-reduced-motion`, 44px touch targets, accessibility statement page with a contact phone. No overlay "accessibility widget" as a substitute.
- Contrast: gold `#B8893F` only for large text/decoration; small gold text uses `#8A6224`; body text `#5A4436` or darker; body 20px desktop / 18px+ phone.
- WhatsApp: `https://wa.me/972524477261?text=...`. Item messages must include the item number. The contact form builds the message from its fields; it cannot attach images (tell users to attach in the chat).
- Kashrut wording: "כל המוצרים בכשרות בד״ץ" – never imply the business holds a certificate. Allergen note: the kitchen is not allergen-free.
- Categories show as soon as they have one item (decided 11.11; Sara is adding photos). Empty categories stay hidden. No placeholder content or fake reviews may go live.
- Voice: first person, Sara speaking ("החלומות שלכם, היצירה שלי"). Look: boutique luxury; tone: warm and personal.

## Brand
Hero backdrop: warm cream studio wall (#EBD0C3 at the edges; a deep rose was tried and rejected) glowing near-white behind the arch, a lighter floor plane with a soft horizon, blurred petals for depth; the whole hero fits one desktop screen (sizes in vh). Price list is its own page (#prices, data in catalog.js). Cookies are a dessert sub-category. No WhatsApp button in the header; on phones a floating one appears after the hero. Catalog picker: round photo medallions + a pill sub-tab bar with a sliding indicator; grid swaps with a staggered fade-up.
Fonts: Bellefair (Hebrew display), Cormorant Garamond (Latin), Assistant (body, regular weight). Colors: blush `#F5DED7` → cream `#FDF8F3` gradient, ink `#3E2B20`, gold `#B8893F`, petal `#EBB9B0`. Logos in `brand/logo/` (stacked = primary, horizontal = header on inner pages, icon = favicon and home header). Hero: logo large, real photo inside an arch frame with a gold outline. Left column: large gold-gradient "10+", a thin gold rule, the label in the display face, then three gold-ringed photo circles in a soft arc (desserts, sweet tables, catering; name on hover on desktop, under the circle on phones). Colour bands fade into each other; no hard edges.
Mobile-first: most visitors come from phones, so every screen is designed and checked on a phone first, then desktop.
