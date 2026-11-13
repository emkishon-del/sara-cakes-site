/* Sara Cakes & Sweets — prototype behaviour.
   Views are routed on the URL hash: #home, #catalog, #catalog-<cat>, #catalog-<cat>-<sub>, #about, #contact, #accessibility. */
(function () {
  'use strict';
  var D = window.SARA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  document.documentElement.lang = 'he';
  document.documentElement.dir = 'rtl';

  var catByKey = {};
  D.categories.forEach(function (c) { catByKey[c.key] = c; });
  function subName(cat, sub) {
    var c = catByKey[cat]; if (!c || !c.subs) return '';
    var s = c.subs.filter(function (x) { return x.key === sub; })[0];
    return s ? s.name : '';
  }
  function itemsIn(cat, sub) {
    return D.items.filter(function (i) { return (!cat || i.cat === cat) && (!sub || i.sub === sub); });
  }
  function img(stem, small) { return 'img/' + stem + (small ? '-sm' : '') + '.webp'; }

  /* ---------- WhatsApp links ---------- */
  function wa(text) { return 'https://wa.me/' + D.waNumber + '?text=' + encodeURIComponent(text); }
  var GENERAL = 'שלום שרה, הגעתי מהאתר ואשמח להצעה לאירוע בתאריך ';
  $$('[data-wa="general"]').forEach(function (a) { a.href = wa(GENERAL); });
  $$('[data-wa="prices"]').forEach(function (a) { a.href = wa('שלום שרה, ראיתי את המחירון באתר ואשמח להצעת מחיר לאירוע בתאריך '); });
  /* price list */
  $('#priceGrid').innerHTML = (D.prices || []).map(function (sec) {
    return '<section class="price-card"><h2>' + sec.title + '</h2><ul>' + sec.rows.map(function (r) {
      return '<li><span class="pname">' + r.name + '</span><span class="lead" aria-hidden="true"></span><span class="pval"><b>' + r.price + '</b> ₪' + (r.unit ? ' ' + r.unit : '') + '</span></li>';
    }).join('') + '</ul></section>';
  }).join('');
  $('#igLink').href = D.instagram; $('#igFoot').href = D.instagram;

  /* ---------- skip link: focus main without touching the route ---------- */
  $('.skip').addEventListener('click', function (e) { e.preventDefault(); $('#main').focus(); });

  /* ---------- header ---------- */
  var menuBtn = $('#menuBtn'), nav = $('#nav');
  menuBtn.addEventListener('click', function () {
    var open = nav.getAttribute('data-open') !== 'true';
    nav.setAttribute('data-open', String(open));
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  function closeMenu() { nav.setAttribute('data-open', 'false'); menuBtn.setAttribute('aria-expanded', 'false'); }
  var head = $('#head');
  function onScroll() {
    head.classList.toggle('scrolled', window.scrollY > 8);
    /* on the home page the floating WhatsApp button waits until the hero's own button has scrolled away */
    var hero = $('.hero');
    document.body.classList.toggle('past-hero', !!hero && window.scrollY > hero.offsetHeight * 0.55);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  /* the header is fixed; expose its height so the page and the hero can make room for it */
  function setChrome() { document.documentElement.style.setProperty('--chrome', head.offsetHeight + 'px'); }
  window.addEventListener('resize', setChrome);
  if (window.ResizeObserver) new ResizeObserver(setChrome).observe(head);
  setChrome();

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- home: hero thumbnails in the glass tray ---------- */
  var heroImg = $('#heroImg'), thumbs = $('#thumbs');
  D.hero.forEach(function (id, n) {
    var it = D.items.filter(function (i) { return i.id === id; })[0]; if (!it) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-pressed', n === 0 ? 'true' : 'false');
    b.setAttribute('aria-label', 'הצגת ' + it.title);
    b.innerHTML = '<img src="' + img(it.img, true) + '" alt="">';
    b.addEventListener('click', function () {
      $$('button', thumbs).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      heroImg.classList.add('fading');
      var pre = new Image(), t0 = Date.now(), tok = (heroImg._tok = (heroImg._tok || 0) + 1);
      pre.onload = pre.onerror = function () {
        if (tok !== heroImg._tok) return;   // a newer click won
        setTimeout(function () { heroImg.src = pre.src; heroImg.alt = it.title; heroImg.classList.remove('fading'); }, Math.max(0, 200 - (Date.now() - t0)));
      };
      pre.src = img(it.img);
    });
    thumbs.appendChild(b);
  });
  var first = D.items.filter(function (i) { return i.id === D.hero[0]; })[0];
  if (first) { heroImg.src = img(first.img); heroImg.alt = first.title; }

  /* ---------- home: round links beside the arch ---------- */
  $('#heroLinks').innerHTML = (D.heroLinks || []).map(function (l) {
    return '<li><a href="#catalog-' + l.cat + '" aria-label="' + l.title + '"><span class="ring"><img src="' + img(l.img, true) + '" alt=""></span><span class="lbl" aria-hidden="true">' + l.title + '</span></a></li>';
  }).join('');

  /* ---------- home: "what I make" cards ---------- */
  var homeCats = ['cakes', 'desserts', 'tables', 'catering'];
  var cardImg = { cakes: 'cake-crown', desserts: 'tarts-meringue', tables: 'sweet-table-gold', catering: 'buffet' };
  $('#homeCards').innerHTML = homeCats.map(function (k) {
    var c = catByKey[k];
    return '<a class="card" href="#catalog-' + k + '"><img src="' + img(cardImg[k], true) + '" alt="" loading="lazy">' +
      '<div class="card-body"><h3>' + c.name + '</h3><span>' + c.blurb + '</span></div></a>';
  }).join('');

  /* ---------- home: reviews (the band stays hidden until there are real ones) ---------- */
  if (D.reviews && D.reviews.length) {
    $('#reviews').innerHTML = D.reviews.map(function (r) {
      return '<li><figure class="review"><svg class="q" viewBox="0 0 40 30" aria-hidden="true"><path d="M17 2C8 4 2 10 2 19c0 5 3 9 8 9s8-3 8-7-3-7-7-7c-1 0-2 0-2 .3C10 9 13 6 18 5zm21 0c-9 2-15 8-15 17 0 5 3 9 8 9s8-3 8-7-3-7-7-7c-1 0-2 0-2 .3C31 9 34 6 39 5z" fill="currentColor"/></svg>' +
        '<blockquote><p>' + r.text + '</p></blockquote>' +
        '<figcaption><span class="via" aria-hidden="true"></span>' + r.tag + '</figcaption></figure></li>';
    }).join('');
    $('#reviewsBand').hidden = false;
  }

  /* ---------- catalog ---------- */
  var state = { cat: '', sub: '' };
  var rail = $('#chips'), subtabs = $('#subchips'), ink = $('#subInk'), grid = $('#grid');
  var visibleCats = D.categories.filter(function (c) { return itemsIn(c.key).length > 0; }); // empty categories stay hidden
  function setHash(h) { if (location.hash !== '#' + h) { history.replaceState(null, '', '#' + h); } }
  function go(cat, sub) {
    state.cat = cat; state.sub = sub || '';
    setHash('catalog' + (cat ? '-' + cat : '') + (state.sub ? '-' + state.sub : ''));
    renderPicker(); renderGrid(true);
  }

  /* category medallions: built once, then only their pressed state changes so the ring can animate */
  rail.innerHTML = '';
  [{ key: '', name: 'הכול', logo: true }].concat(visibleCats).forEach(function (c) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'cat'; b.setAttribute('data-cat', c.key);
    var cover = c.logo ? '<img class="logo-img" src="logo/sara-icon.svg" alt="">' :
      '<img src="' + img(c.cover || itemsIn(c.key)[0].img, true) + '" alt="">';
    var n = itemsIn(c.key).length;
    b.innerHTML = '<span class="ring">' + cover + '</span><span class="name">' + c.name + '</span><span class="n">' + n + ' עבודות</span>';
    b.addEventListener('click', function () { if (state.cat !== c.key || state.sub) go(c.key, ''); });
    rail.appendChild(b);
  });

  function moveInk(animate) {
    var on = $('.subtab[aria-pressed="true"]', subtabs);
    if (!on) return;
    if (!animate) ink.style.transition = 'none';
    ink.style.left = on.offsetLeft + 'px';
    ink.style.width = on.offsetWidth + 'px';
    if (!animate) { ink.offsetWidth; ink.style.transition = ''; }
  }
  var lastSubCat = null;
  function renderPicker() {
    $$('.cat', rail).forEach(function (b) {
      var on = b.getAttribute('data-cat') === state.cat;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on && rail.scrollWidth > rail.clientWidth) {
        var target = b.offsetLeft - (rail.clientWidth - b.offsetWidth) / 2;
        rail.scrollTo({ left: target, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
    var c = catByKey[state.cat];
    var subs = c && c.subs ? c.subs.filter(function (s) { return itemsIn(c.key, s.key).length > 0; }) : [];
    subtabs.hidden = subs.length < 2;
    if (subtabs.hidden) { lastSubCat = null; return; }
    var rebuilt = lastSubCat !== c.key;
    if (rebuilt) {
      $$('.subtab', subtabs).forEach(function (x) { x.remove(); });
      [{ key: '', name: 'הכול' }].concat(subs).forEach(function (s) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'subtab'; b.setAttribute('data-sub', s.key);
        b.textContent = s.name;
        b.addEventListener('click', function () { if (state.sub !== s.key) go(c.key, s.key); });
        subtabs.appendChild(b);
      });
      lastSubCat = c.key;
    }
    $$('.subtab', subtabs).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-sub') === state.sub ? 'true' : 'false'); });
    requestAnimationFrame(function () { moveInk(!rebuilt); });
  }
  window.addEventListener('resize', function () { moveInk(false); });

  var swapTimer = null;
  function renderGrid(animated) {
    var list = itemsIn(state.cat, state.sub);
    var paint = function () {
      current = list;
      grid.style.minHeight = '';
      grid.innerHTML = list.map(function (it, n) {
        return '<button class="tile' + (animated && !reduceMotion ? ' enter' : '') + '" style="--i:' + Math.min(n, 14) + '" type="button" data-n="' + n + '" aria-label="' + it.title + ', עבודה מספר ' + it.id + '">' +
          '<img src="' + img(it.img, true) + '" alt="" loading="lazy" width="640" height="640">' +
          '<span class="cap"><span>' + it.title + '</span><b>#' + it.id + '</b></span></button>';
      }).join('') || '<p class="empty">עוד אין כאן עבודות. בקרוב!</p>';
      grid.classList.remove('leaving');
      var c = catByKey[state.cat];
      $('#count').textContent = list.length + ' עבודות' + (c ? ' ב' + (state.sub ? subName(c.key, state.sub) : c.name) : '');
    };
    clearTimeout(swapTimer);
    if (!animated || reduceMotion) { paint(); return; }
    grid.style.minHeight = grid.offsetHeight + 'px';   // keep the page from jumping while the grid swaps
    grid.classList.add('leaving');
    swapTimer = setTimeout(paint, 180);
  }
  function renderCatalog() { renderPicker(); renderGrid(false); }
  grid.addEventListener('click', function (e) {
    var t = e.target.closest('.tile'); if (t) openLb(+t.getAttribute('data-n'), t);
  });

  /* ---------- lightbox ---------- */
  var lb = $('#lb'), current = [], idx = 0, opener = null;
  function fillLb() {
    var it = current[idx], im = $('#lbImg'), tok = (im._tok = (im._tok || 0) + 1);
    im.src = img(it.img, true); im.alt = it.title;       // small version is already cached from the grid
    var big = new Image();
    big.onload = function () { if (tok === im._tok) im.src = big.src; };
    big.src = img(it.img);
    $('#lbTitle').textContent = it.title;
    $('#lbNum').textContent = 'עבודה #' + it.id;
    $('#lbCat').textContent = catByKey[it.cat].name + (it.sub ? ' · ' + subName(it.cat, it.sub) : '');
    $('#lbWa').href = wa('שלום שרה, ראיתי באתר את "' + it.title + '" (עבודה #' + it.id + ') ואשמח להצעה לאירוע בתאריך ');
  }
  function openLb(n, from) {
    idx = n; opener = from; fillLb();
    if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
    $('#lbClose').focus();
  }
  function step(d) {
    idx = (idx + d + current.length) % current.length;
    var im = $('#lbImg');
    if (reduceMotion) { fillLb(); return; }
    im.classList.add('swap');
    setTimeout(function () { fillLb(); im.classList.remove('swap'); }, 140);
  }
  $('#lbClose').addEventListener('click', function () { lb.close(); });
  $('#lbPrev').addEventListener('click', function () { step(-1); });
  $('#lbNext').addEventListener('click', function () { step(1); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') step(1);      // RTL: left = next
    if (e.key === 'ArrowRight') step(-1);
  });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('close', function () { if (opener) opener.focus(); });

  /* ---------- contact form ---------- */
  var typeSel = $('#type');
  typeSel.innerHTML = '<option value="">בחרו (לא חובה)</option>' + D.categories.map(function (c) { return '<option>' + c.name + '</option>'; }).join('');
  var form = $('#orderForm');
  function setErr(id, bad) {
    var f = $('#f-' + id); f.setAttribute('data-invalid', bad ? 'true' : 'false');
    $('.err', f).hidden = !bad;
    var input = $('input', f); input.setAttribute('aria-invalid', bad ? 'true' : 'false');
    if (bad) input.setAttribute('aria-describedby', 'err-' + id); $('.err', f).id = 'err-' + id;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#name').value.trim(), phone = $('#phone').value.replace(/[^\d+]/g, '');
    var badName = !name, badPhone = phone.length < 9;
    setErr('name', badName); setErr('phone', badPhone);
    if (badName || badPhone) { $('#formStatus').textContent = 'יש שדות שצריך לתקן.'; (badName ? $('#name') : $('#phone')).focus(); return; }
    var d = $('#date').value, lines = ['שלום שרה, הגעתי מהאתר.', 'שם: ' + name, 'טלפון: ' + $('#phone').value.trim()];
    if (d) lines.push('תאריך האירוע: ' + d.split('-').reverse().join('/'));
    if (typeSel.value) lines.push('מעניין אותי: ' + typeSel.value);
    if ($('#details').value.trim()) lines.push('פרטים: ' + $('#details').value.trim());
    var a = document.createElement('a'); a.href = wa(lines.join('\n')); a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    $('#formStatus').textContent = 'פתחנו לכם את וואטסאפ עם ההודעה. אם הוא לא נפתח, אפשר לכתוב ישירות ל-052-447-7261.';
  });

  /* ---------- copy phone ---------- */
  $('#copyPhone').addEventListener('click', function () {
    var done = function () { toast('המספר הועתק'); };
    try { navigator.clipboard.writeText(D.phone).then(done, selectPhone); } catch (e) { selectPhone(); }
  });
  function selectPhone() { var r = document.createRange(); r.selectNodeContents($('#phoneText')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('המספר מסומן, אפשר להעתיק'); }
  function toast(t) { var el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = t; document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2200); }

  /* ---------- router ---------- */
  var VIEWS = ['home', 'catalog', 'prices', 'about', 'contact', 'accessibility'];
  var TITLES = { home: 'Sara Cakes & Sweets', catalog: 'קטלוג · Sara Cakes & Sweets', prices: 'מחירון · Sara Cakes & Sweets', about: 'אודות · Sara Cakes & Sweets', contact: 'צור קשר · Sara Cakes & Sweets', accessibility: 'הצהרת נגישות · Sara Cakes & Sweets' };
  function route(first, faded) {
    var h = (location.hash || '#home').slice(1);
    if (h === 'main') return;
    var parts = h.split('-'), view = parts[0];
    if (VIEWS.indexOf(view) < 0) view = 'home';
    var prev = document.body.getAttribute('data-view');
    if (!first && !faded && prev && prev !== view && !reduceMotion) {
      // fade the current page out, then show the new one (it fades up via .entering)
      var old = $('.view[data-view="' + prev + '"]'); if (old) old.classList.add('leaving');
      route.t = setTimeout(function () { if (old) old.classList.remove('leaving'); route(false, true); }, 160);
      return;
    }
    $$('.view').forEach(function (v) {
      var show = v.getAttribute('data-view') === view;
      v.classList.remove('leaving');
      if (show && v.hidden && !first && !reduceMotion) {
        v.classList.remove('entering'); void v.offsetWidth; v.classList.add('entering');
      }
      v.hidden = !show;
    });
    document.body.setAttribute('data-view', view);
    $$('[data-view-link]').forEach(function (a) {
      if (a.getAttribute('data-view-link') === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = TITLES[view];
    if (view === 'catalog') {
      state.cat = catByKey[parts[1]] ? parts[1] : '';
      state.sub = state.cat && parts[2] ? parts[2] : '';
      renderCatalog();
    }
    closeMenu();
    if (!first) { window.scrollTo(0, 0); $('#main').focus({ preventScroll: true }); }
  }
  window.addEventListener('hashchange', function () { clearTimeout(route.t); route(false); });
  route(true);
})();
