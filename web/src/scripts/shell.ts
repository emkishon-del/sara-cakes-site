/* Behaviour shared by every page: phone menu, header state on scroll, floating WhatsApp timing. */
export function initShell() {
  const head = document.getElementById('head')!;
  const nav = document.getElementById('nav')!;
  const menuBtn = document.getElementById('menuBtn')!;

  menuBtn.addEventListener('click', () => {
    const open = nav.getAttribute('data-open') !== 'true';
    nav.setAttribute('data-open', String(open));
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.getAttribute('data-open') === 'true') {
      nav.setAttribute('data-open', 'false'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus();
    }
  });

  /* skip link: move focus to the content */
  document.querySelector<HTMLAnchorElement>('.skip')?.addEventListener('click', (e) => {
    e.preventDefault(); document.getElementById('main')?.focus();
  });

  const hero = document.querySelector<HTMLElement>('.hero');
  const onScroll = () => {
    head.classList.toggle('scrolled', window.scrollY > 8);
    // on the home page the floating WhatsApp button waits until the hero's own button has scrolled away
    document.body.classList.toggle('past-hero', !!hero && window.scrollY > hero.offsetHeight * 0.55);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* the header is fixed; expose its height so the page and the hero can make room for it */
  const setChrome = () => document.documentElement.style.setProperty('--chrome', head.offsetHeight + 'px');
  window.addEventListener('resize', setChrome);
  if ('ResizeObserver' in window) new ResizeObserver(setChrome).observe(head);
  setChrome();
}

export const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function toast(text: string) {
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}
