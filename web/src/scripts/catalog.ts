/* Catalog: in-place switching between categories (with real URLs), animated grid swap, enlarged view. */
import { reduceMotion } from './shell';
import { waLink, waItemText } from '../lib/wa';

type It = { id: number; cat: string; sub: string | null; title: string; alt: string; s: string; l: string; where: string };
type Cat = { slug: string; name: string; subs: { slug: string; name: string }[] };

export function initCatalog() {
  const data = JSON.parse(document.getElementById('catalogData')!.textContent!) as { wa: string; cats: Cat[]; items: It[] };
  const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
  const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
  const rail = $('#chips'), subtabs = $('#subchips'), ink = $('#subInk'), grid = $('#grid'), count = $('#count');
  const catBy = Object.fromEntries(data.cats.map((c) => [c.slug, c]));
  const RM = reduceMotion();

  const parse = (path: string) => {
    const p = path.replace(/^\/catalog\/?/, '').split('/').filter(Boolean);
    const cat = catBy[p[0]] ? p[0] : '';
    const sub = cat && catBy[cat].subs.some((s) => s.slug === p[1]) ? p[1] : '';
    return { cat, sub };
  };
  let state = parse(location.pathname);
  const urlFor = (c: string, s: string) => '/catalog/' + (c ? c + '/' : '') + (s ? s + '/' : '');
  const listFor = () => data.items.filter((i) => (!state.cat || i.cat === state.cat) && (!state.sub || i.sub === state.sub));
  let current: It[] = listFor();

  /* ---- picker ---- */
  function moveInk(animate: boolean) {
    const on = $('.subtab[aria-current]', subtabs) as HTMLElement | null;
    if (!on) return;
    if (!animate) ink.style.transition = 'none';
    ink.style.left = on.offsetLeft + 'px';
    ink.style.width = on.offsetWidth + 'px';
    if (!animate) { void ink.offsetWidth; ink.style.transition = ''; }
  }
  let subCat: string | null = state.cat && !subtabs.hidden ? state.cat : null;
  function renderPicker() {
    $$<HTMLAnchorElement>('.cat', rail).forEach((a) => {
      const on = a.dataset.cat === state.cat;
      if (on) a.setAttribute('aria-current', state.sub ? 'true' : 'page'); else a.removeAttribute('aria-current');
      if (on && rail.scrollWidth > rail.clientWidth) {
        rail.scrollTo({ left: a.offsetLeft - (rail.clientWidth - a.offsetWidth) / 2, behavior: RM ? 'auto' : 'smooth' });
      }
    });
    const c = catBy[state.cat];
    const subs = c ? c.subs : [];
    subtabs.hidden = subs.length < 2;
    if (subtabs.hidden) { subCat = null; return; }
    const rebuilt = subCat !== c.slug;
    if (rebuilt) {
      $$('.subtab', subtabs).forEach((x) => x.remove());
      [{ slug: '', name: 'הכול' }, ...subs].forEach((s) => {
        const a = document.createElement('a');
        a.className = 'subtab'; a.dataset.sub = s.slug; a.href = urlFor(c.slug, s.slug); a.textContent = s.name;
        subtabs.appendChild(a);
      });
      subCat = c.slug;
    }
    $$<HTMLAnchorElement>('.subtab', subtabs).forEach((a) => {
      if (a.dataset.sub === state.sub) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    requestAnimationFrame(() => moveInk(!rebuilt));
  }

  /* ---- grid ---- */
  let swapTimer = 0;
  function renderGrid(animated: boolean) {
    const list = listFor();
    const paint = () => {
      current = list;
      grid.style.minHeight = '';
      grid.innerHTML = list.map((it, n) =>
        `<a class="tile${animated && !RM ? ' enter' : ''}" style="--i:${Math.min(n, 14)}" href="/cake/${it.id}/" data-id="${it.id}" aria-label="${esc(it.title)}, עבודה מספר ${it.id}">` +
        `<img src="${it.s}" alt="" loading="${n < 6 ? 'eager' : 'lazy'}" width="640" height="640">` +
        `<span class="cap"><span>${esc(it.title)}</span><b>#${it.id}</b></span></a>`).join('') ||
        '<p class="empty">עוד אין כאן עבודות. בקרוב!</p>';
      grid.classList.remove('leaving');
      const c = catBy[state.cat];
      const where = c ? ' ב' + (state.sub ? c.subs.find((s) => s.slug === state.sub)!.name : c.name) : '';
      count.textContent = list.length + ' עבודות' + where;
      document.title = (c ? (state.sub ? c.subs.find((s) => s.slug === state.sub)!.name + ' · ' : c.name + ' · ') : '') + 'קטלוג · Sara Cakes & Sweets';
    };
    clearTimeout(swapTimer);
    if (!animated || RM) { paint(); return; }
    grid.style.minHeight = grid.offsetHeight + 'px'; // keep the page from jumping while the grid swaps
    grid.classList.add('leaving');
    swapTimer = window.setTimeout(paint, 180);
  }

  function go(cat: string, sub: string, push = true) {
    if (cat === state.cat && sub === state.sub) return;
    state = { cat, sub };
    if (push) history.pushState({ cat, sub }, '', urlFor(cat, sub));
    renderPicker(); renderGrid(true);
  }
  const plainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
  rail.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('.cat');
    if (!a || !plainClick(e)) return;
    e.preventDefault(); go(a.dataset.cat || '', '');
  });
  subtabs.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('.subtab');
    if (!a || !plainClick(e)) return;
    e.preventDefault(); go(state.cat, a.dataset.sub || '');
  });
  window.addEventListener('popstate', () => { const s = parse(location.pathname); go(s.cat, s.sub, false); });
  window.addEventListener('resize', () => moveInk(false));
  renderPicker();

  /* ---- enlarged view ---- */
  const lb = $<HTMLDialogElement>('#lb'), im = $<HTMLImageElement>('#lbImg');
  let idx = 0, opener: HTMLElement | null = null, tok = 0;
  function fill() {
    const it = current[idx], t = ++tok;
    im.src = it.s; im.alt = it.alt;              // the small photo is already cached from the grid
    const big = new Image();
    big.onload = () => { if (t === tok) im.src = big.src; };
    big.src = it.l;
    $('#lbTitle').textContent = it.title;
    $('#lbNum').textContent = 'עבודה #' + it.id;
    $('#lbCat').textContent = it.where;
    const wa = $<HTMLAnchorElement>('#lbWa');
    wa.href = waLink(data.wa, waItemText(it.title, it.id));
    wa.dataset.umamiEventItem = String(it.id);
    $<HTMLAnchorElement>('#lbPage').href = `/cake/${it.id}/`;
  }
  function step(dir: number) {
    idx = (idx + dir + current.length) % current.length;
    if (RM) { fill(); return; }
    im.classList.add('swap');
    setTimeout(() => { fill(); im.classList.remove('swap'); }, 140);
  }
  grid.addEventListener('click', (e) => {
    const t = (e.target as Element).closest<HTMLAnchorElement>('.tile');
    if (!t || !plainClick(e) || !lb.showModal) return;
    e.preventDefault();
    idx = current.findIndex((i) => i.id === Number(t.dataset.id)); opener = t;
    if (idx < 0) return;
    fill(); lb.showModal(); $('#lbClose').focus();
  });
  $('#lbClose').addEventListener('click', () => lb.close());
  $('#lbPrev').addEventListener('click', () => step(-1));
  $('#lbNext').addEventListener('click', () => step(1));
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') step(1);   // RTL: left = next
    if (e.key === 'ArrowRight') step(-1);
  });
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener('close', () => opener?.focus());

  /* swipe on phones */
  let x0: number | null = null;
  lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) step(dx > 0 ? 1 : -1); // RTL: swipe right = next
  });
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}
