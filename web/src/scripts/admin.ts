/* Admin page: works, home page, reviews, price list. Talks to Supabase directly;
   the database's access rules allow changes only for the emails in the admins table. */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { zipSync, strToU8 } from 'fflate';

type Sub = { category: string; slug: string; name: string; sort: number; visible: boolean };
type Cat = { slug: string; name: string; blurb: string; cover: string | null; sort: number; visible: boolean };
type Item = { id: number; category: string; subcategory: string | null; title: string; caption: string; alt: string; image: string; sort: number; visible: boolean };
type Review = { id: number; text: string; tag: string; sort: number; visible: boolean };
type Section = { id: number; title: string; sort: number };
type Row = { id: number; section_id: number; name: string; price: string; unit: string; sort: number };
type HeroLink = { cat: string; title: string; image: string };

const URL_ = import.meta.env.PUBLIC_SUPABASE_URL as string;
const KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;
const IMG = `${URL_}/storage/v1/object/public/images/`;
const img = (stem: string, small = true) => IMG + stem + (small ? '-sm' : '') + '.webp';

let db: SupabaseClient;
const S = {
  cats: [] as Cat[], subs: [] as Sub[], items: [] as Item[], reviews: [] as Review[],
  sections: [] as Section[], rows: [] as Row[], settings: {} as Record<string, any>,
  tab: 'items' as 'items' | 'home' | 'reviews' | 'prices', filter: '',
};
const app = () => document.getElementById('app')!;
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/* ---------- messages ---------- */
let statusTimer = 0;
function say(text: string, bad = false) {
  const el = document.getElementById('status')!;
  el.innerHTML = `<div class="${bad ? 'bad' : ''}">${esc(text)}</div>`;
  clearTimeout(statusTimer);
  statusTimer = window.setTimeout(() => (el.innerHTML = ''), bad ? 7000 : 3000);
}
function fail(e: any, what = 'השמירה נכשלה') { console.error(e); say(`${what}: ${e?.message || e}`, true); }
function markPending(on = true) {
  try { on ? localStorage.setItem('sara-pending', '1') : localStorage.removeItem('sara-pending'); } catch {}
  document.getElementById('pending')!.hidden = !on;
}
const isPending = () => { try { return localStorage.getItem('sara-pending') === '1'; } catch { return false; } };
async function run<T>(q: PromiseLike<{ data: T; error: any }>, okText?: string): Promise<T | null> {
  const { data, error } = await q;
  if (error) { fail(error); return null; }
  markPending(); if (okText) say(okText);
  return (data ?? true) as T; // updates return no rows; null means it failed
}

/* ---------- start ---------- */
export async function initAdmin() {
  db = createClient(URL_, KEY);
  db.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') showNewPassword(); });
  $('#logoutBtn').addEventListener('click', async () => { await db.auth.signOut(); location.reload(); });
  $('#publishBtn').addEventListener('click', publish);
  $('#backupBtn').addEventListener('click', backup);
  const { data } = await db.auth.getSession();
  if (location.hash.includes('type=recovery')) return; // handled by PASSWORD_RECOVERY
  if (data.session) await enter(); else showLogin();
}

function showLogin(msg = '') {
  app().innerHTML = `
    <form class="a-card a-narrow" id="loginForm" novalidate>
      <h1>כניסה לניהול</h1>
      <label class="a-field"><span>אימייל</span><input type="email" id="email" autocomplete="username" required dir="ltr"></label>
      <label class="a-field"><span>סיסמה</span><input type="password" id="pass" autocomplete="current-password" required dir="ltr"></label>
      <p class="a-err" id="loginErr" role="alert">${esc(msg)}</p>
      <button class="a-btn a-primary" type="submit">כניסה</button>
      <button class="a-btn a-quiet" type="button" id="forgot">שכחתי סיסמה</button>
    </form>`;
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $<HTMLInputElement>('#email').value.trim(), password = $<HTMLInputElement>('#pass').value;
    if (!email || !password) { $('#loginErr').textContent = 'נא למלא אימייל וסיסמה.'; return; }
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) { $('#loginErr').textContent = 'האימייל או הסיסמה לא נכונים.'; return; }
    enter();
  });
  $('#forgot').addEventListener('click', async () => {
    const email = $<HTMLInputElement>('#email').value.trim();
    if (!email) { $('#loginErr').textContent = 'כתבו קודם את האימייל, ואז לחצו "שכחתי סיסמה".'; return; }
    await db.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/admin/' });
    $('#loginErr').textContent = 'אם האימייל רשום, נשלח אליו קישור לבחירת סיסמה חדשה.';
  });
  $<HTMLInputElement>('#email').focus();
}

function showNewPassword() {
  app().innerHTML = `
    <form class="a-card a-narrow" id="pwForm" novalidate>
      <h1>בחירת סיסמה חדשה</h1>
      <label class="a-field"><span>סיסמה חדשה (8 תווים לפחות)</span><input type="password" id="newPass" autocomplete="new-password" dir="ltr"></label>
      <p class="a-err" id="pwErr" role="alert"></p>
      <button class="a-btn a-primary" type="submit">שמירה</button>
    </form>`;
  $('#pwForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = $<HTMLInputElement>('#newPass').value;
    if (password.length < 8) { $('#pwErr').textContent = 'הסיסמה קצרה מדי.'; return; }
    const { error } = await db.auth.updateUser({ password });
    if (error) { $('#pwErr').textContent = error.message; return; }
    history.replaceState(null, '', '/admin/');
    say('הסיסמה עודכנה'); enter();
  });
}

async function enter() {
  const { data: user } = await db.auth.getUser();
  const { data: rows } = await db.from('admins').select('email');
  if (!rows?.length) {
    await db.auth.signOut();
    return showLogin(`החשבון ${user.user?.email ?? ''} לא מורשה לנהל את האתר.`);
  }
  $('#headEnd').hidden = false;
  markPending(isPending());
  await loadAll();
  render();
}

async function loadAll() {
  const q = (t: string) => db.from(t).select('*').order('sort');
  const [c, s, i, r, ps, pr, st] = await Promise.all([q('categories'), q('subcategories'), q('items'), q('reviews'), q('price_sections'), q('price_rows'), db.from('settings').select('*')]);
  for (const x of [c, s, i, r, ps, pr, st]) if (x.error) { fail(x.error, 'הטעינה נכשלה'); break; }
  S.cats = c.data ?? []; S.subs = s.data ?? []; S.items = i.data ?? []; S.reviews = r.data ?? [];
  S.sections = ps.data ?? []; S.rows = pr.data ?? [];
  S.settings = Object.fromEntries((st.data ?? []).map((x: any) => [x.key, x.value]));
}

/* ---------- publish ---------- */
async function publish() {
  const b = $<HTMLButtonElement>('#publishBtn');
  b.disabled = true;
  const { data, error } = await db.rpc('publish_site');
  b.disabled = false;
  if (error) return fail(error, 'הפרסום נכשל');
  if (data === 'missing_hook') return say('חסר קישור הפרסום של Netlify (build hook). ראו README.', true);
  markPending(false);
  say('נשלח לפרסום. האתר יתעדכן בעוד דקה או שתיים.');
}

/* ---------- backup ----------
   One ZIP file with everything: data.json (works, categories, types, reviews, price list, settings)
   and every photo in both sizes under images/. Meant to be downloaded once a month and kept on the computer or in Drive. */
async function backup() {
  const b = $<HTMLButtonElement>('#backupBtn');
  b.disabled = true; b.textContent = 'מכין גיבוי…';
  try {
    await loadAll(); // the latest data, not what this tab loaded earlier
    const data = {
      exported_at: new Date().toISOString(),
      categories: S.cats, subcategories: S.subs, items: S.items, reviews: S.reviews,
      price_sections: S.sections, price_rows: S.rows, settings: S.settings,
    };
    const files: Record<string, Uint8Array | [Uint8Array, { level: 0 }]> = { 'data.json': strToU8(JSON.stringify(data, null, 2)) };
    const stems = new Set<string>([
      ...S.items.map((i) => i.image),
      ...S.cats.map((c) => c.cover).filter((x): x is string => !!x),
      ...((S.settings.hero_links ?? []) as HeroLink[]).map((l) => l.image),
    ]);
    let missing = 0, n = 0;
    for (const stem of stems) {
      for (const small of [false, true]) {
        const res = await fetch(img(stem, small), { cache: 'no-store' }).catch(() => null);
        if (!res?.ok) { missing++; continue; }
        files[`images/${stem}${small ? '-sm' : ''}.webp`] = [new Uint8Array(await res.arrayBuffer()), { level: 0 }]; // photos are already compressed
      }
      b.textContent = `מכין גיבוי… ${++n}/${stems.size}`;
    }
    const zip = zipSync(files);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([zip], { type: 'application/zip' }));
    a.download = `sara-cakes-backup-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    say(missing ? `הגיבוי ירד, אבל ${missing} קבצי תמונה לא נמצאו.` : 'הגיבוי ירד. שמרו את הקובץ במחשב או בדרייב.', missing > 0);
  } catch (e) {
    fail(e, 'הגיבוי נכשל');
  } finally {
    b.disabled = false; b.textContent = 'הורדת גיבוי';
  }
}

/* ---------- layout ---------- */
const TABS = [['items', 'עבודות'], ['home', 'עמוד הבית וקטגוריות'], ['reviews', 'ביקורות'], ['prices', 'מחירון']] as const;
function render() {
  app().innerHTML = `
    <div class="a-tabs" role="tablist" aria-label="אזורי ניהול">
      ${TABS.map(([k, l]) => `<button class="a-tab" role="tab" id="tab-${k}" aria-selected="${S.tab === k}" aria-controls="panel" data-tab="${k}">${l}</button>`).join('')}
    </div>
    <section id="panel" role="tabpanel" aria-labelledby="tab-${S.tab}"></section>`;
  $$('.a-tab').forEach((t) => t.addEventListener('click', () => { S.tab = t.dataset.tab as any; render(); }));
  ({ items: renderItems, home: renderHome, reviews: renderReviews, prices: renderPrices })[S.tab]();
}
const panel = () => document.getElementById('panel')!;
const catName = (slug: string) => S.cats.find((c) => c.slug === slug)?.name ?? slug;
const subsOf = (cat: string) => S.subs.filter((s) => s.category === cat).sort((a, b) => a.sort - b.sort);
const subName = (cat: string, sub: string | null) => S.subs.find((s) => s.category === cat && s.slug === sub)?.name ?? '';
const catOptions = (sel: string) => S.cats.map((c) => `<option value="${c.slug}" ${c.slug === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
const subOptions = (cat: string, sel: string | null) => `<option value="">בלי סוג</option>` + subsOf(cat).map((s) => `<option value="${s.slug}" ${s.slug === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
/* A title to start from, so Sara only fixes what's different */
function suggestTitle(cat: string, sub: string | null) {
  const s = subName(cat, sub);
  if (cat === 'cakes') return s ? `עוגת ${s}` : 'עוגה מעוצבת';
  return s || catName(cat);
}

/* Suggested image description for screen readers, built from the category, the type and the title
   (as the spec asks), e.g. "עוגות מעוצבות, בר ובת מצווה: עוגת קומות ורודה". Sara can still change it. */
function autoAlt(cat: string, sub: string | null, title: string) {
  const where = catName(cat) + (sub ? ', ' + subName(cat, sub) : '');
  return title.trim() ? `${where}: ${title.trim()}` : where;
}

/* ---------- works ---------- */
type Q = { file: File; url: string; cat: string; sub: string | null; title: string; alt: string; altTouched: boolean; caption: string; state: 'ready' | 'busy' | 'done' | 'error'; err?: string };
let queue: Q[] = [];

function renderItems() {
  const list = S.items.filter((i) => !S.filter || i.category === S.filter).sort((a, b) => a.sort - b.sort);
  panel().innerHTML = `
    <div class="a-section">
      <div class="a-drop" id="drop">
        <h2>הוספת עבודות חדשות</h2>
        <p class="a-help">גוררים לכאן תמונות, או בוחרים מהמחשב. אפשר כמה בבת אחת. התמונות מוקטנות אוטומטית.</p>
        <label class="a-btn a-primary">בחירת תמונות<input type="file" id="files" accept="image/*" multiple class="sr"></label>
      </div>
      <div class="a-queue" id="queue"></div>
    </div>
    <div class="a-section">
      <div class="a-row a-spread">
        <h2>כל העבודות (${S.items.length})</h2>
        <label class="a-field" style="min-width:220px"><span>הצגה לפי קטגוריה</span>
          <select id="filter"><option value="">הכול</option>${S.cats.map((c) => `<option value="${c.slug}" ${S.filter === c.slug ? 'selected' : ''}>${esc(c.name)} (${S.items.filter((i) => i.category === c.slug).length})</option>`).join('')}</select>
        </label>
      </div>
      <p class="a-help">הסדר כאן הוא הסדר באתר. גוררים תמונה כדי להזיז אותה, או משתמשים בחצים. עבודה מוסתרת לא מופיעה באתר.</p>
      <div class="a-grid" id="items">
        ${list.map((i) => `
          <article class="a-item ${i.visible ? '' : 'hidden-item'}" draggable="true" data-id="${i.id}">
            <img src="${img(i.image)}" alt="" loading="lazy">
            <div class="a-item-body">
              <div><span class="a-num">#${i.id}</span> <span class="a-item-title">${esc(i.title)}</span></div>
              <div><span class="a-tag">${esc(catName(i.category))}${i.subcategory ? ' · ' + esc(subName(i.category, i.subcategory)) : ''}</span></div>
              <label class="a-switch"><input type="checkbox" data-act="vis" ${i.visible ? 'checked' : ''}> מוצגת באתר</label>
              <div class="a-tools">
                <button class="a-btn a-small" type="button" data-act="edit">עריכה</button>
                <button class="a-btn a-small a-quiet" type="button" data-act="up" aria-label="להזיז קדימה">→</button>
                <button class="a-btn a-small a-quiet" type="button" data-act="down" aria-label="להזיז אחורה">←</button>
              </div>
            </div>
          </article>`).join('')}
      </div>
    </div>`;
  renderQueue();
  $<HTMLSelectElement>('#filter').addEventListener('change', (e) => { S.filter = (e.target as HTMLSelectElement).value; renderItems(); });
  const drop = $('#drop'), files = $<HTMLInputElement>('#files');
  files.addEventListener('change', () => { addFiles(files.files); files.value = ''; });
  drop.addEventListener('dragover', (e) => { if (e.dataTransfer?.types.includes('Files')) { e.preventDefault(); drop.classList.add('over'); } });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); addFiles(e.dataTransfer?.files ?? null); });

  const grid = $('#items');
  grid.addEventListener('change', async (e) => {
    const t = e.target as HTMLInputElement; if (t.dataset.act !== 'vis') return;
    const it = byCard(t); it.visible = t.checked;
    t.closest('.a-item')!.classList.toggle('hidden-item', !it.visible);
    await run(db.from('items').update({ visible: it.visible }).eq('id', it.id), it.visible ? `#${it.id} מוצגת באתר` : `#${it.id} מוסתרת`);
  });
  grid.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button[data-act]'); if (!b) return;
    const it = byCard(b);
    if (b.dataset.act === 'edit') editItem(it);
    if (b.dataset.act === 'up' || b.dataset.act === 'down') moveItem(it, b.dataset.act === 'up' ? -1 : 1, list);
  });
  /* drag to reorder */
  let dragId = 0;
  grid.addEventListener('dragstart', (e) => {
    const card = (e.target as Element).closest<HTMLElement>('.a-item'); if (!card) return;
    dragId = Number(card.dataset.id); card.classList.add('dragging'); e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', String(dragId));
  });
  grid.addEventListener('dragend', () => { $$('.a-item', grid).forEach((c) => c.classList.remove('dragging', 'drop-before')); });
  grid.addEventListener('dragover', (e) => {
    if (!dragId) return; e.preventDefault();
    const card = (e.target as Element).closest<HTMLElement>('.a-item');
    $$('.a-item', grid).forEach((c) => c.classList.toggle('drop-before', c === card));
  });
  grid.addEventListener('drop', async (e) => {
    e.preventDefault();
    const card = (e.target as Element).closest<HTMLElement>('.a-item'); const from = dragId; dragId = 0;
    if (!card || Number(card.dataset.id) === from) return renderItems();
    const ids = list.map((i) => i.id).filter((id) => id !== from);
    ids.splice(ids.indexOf(Number(card.dataset.id)), 0, from);
    await saveOrder(ids.map((id) => S.items.find((i) => i.id === id)!), list);
  });
}
const byCard = (el: Element) => S.items.find((i) => i.id === Number(el.closest<HTMLElement>('.a-item')!.dataset.id))!;

/* Re-number the shown items into the slots they already held, so filtered views keep the overall order intact */
async function saveOrder(ordered: Item[], before: Item[]) {
  const slots = before.map((i) => i.sort).sort((a, b) => a - b);
  for (let n = 1; n < slots.length; n++) if (slots[n] <= slots[n - 1]) slots[n] = slots[n - 1] + 1; // equal values need distinct slots
  const changes = ordered.map((it, n) => ({ it, sort: slots[n] })).filter((x) => x.it.sort !== x.sort);
  changes.forEach((x) => (x.it.sort = x.sort));
  renderItems();
  const res = await Promise.all(changes.map((x) => db.from('items').update({ sort: x.sort }).eq('id', x.it.id)));
  const err = res.find((r) => r.error)?.error;
  if (err) return fail(err);
  markPending(); say('הסדר נשמר');
}
function moveItem(it: Item, dir: number, list: Item[]) {
  const i = list.indexOf(it), j = i + dir;
  if (j < 0 || j >= list.length) return;
  const ordered = list.slice(); [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
  saveOrder(ordered, list).then(() => $<HTMLButtonElement>(`.a-item[data-id="${it.id}"] [data-act="${dir < 0 ? 'up' : 'down'}"]`)?.focus());
}

function editItem(it: Item) {
  const dlg = $<HTMLDialogElement>('#dlg');
  dlg.innerHTML = `
    <form method="dialog" id="editForm">
      <h2 id="dlgTitle">עריכת עבודה #${it.id}</h2>
      <img class="a-thumb" src="${img(it.image)}" alt="">
      <label class="a-field"><span>כותרת</span><input id="eTitle" value="${esc(it.title)}"></label>
      <div class="a-row">
        <label class="a-field" style="flex:1"><span>קטגוריה</span><select id="eCat">${catOptions(it.category)}</select></label>
        <label class="a-field" style="flex:1"><span>סוג</span><select id="eSub">${subOptions(it.category, it.subcategory)}</select></label>
      </div>
      <label class="a-field"><span>תיאור קצר (לא חובה)</span><input id="eCap" value="${esc(it.caption)}"></label>
      <label class="a-field"><span>תיאור התמונה לקוראי מסך</span><input id="eAlt" value="${esc(it.alt || autoAlt(it.category, it.subcategory, it.title))}"><small>מה רואים בתמונה, במשפט אחד. בדרך כלל הקטגוריה והכותרת.</small></label>
      <div class="a-row a-spread">
        <div class="a-row"><button class="a-btn a-primary" value="save">שמירה</button><button class="a-btn" value="cancel" formnovalidate>ביטול</button></div>
        <button class="a-btn a-danger" type="button" id="eDel">מחיקה</button>
      </div>
      <div id="delConfirm" hidden class="a-card" style="background:#FFF4F2">
        <p>למחוק את עבודה #${it.id} לצמיתות? אפשר במקום זה רק להסתיר אותה.</p>
        <div class="a-row"><button class="a-btn a-danger a-primary" type="button" id="eDelYes">כן, למחוק</button><button class="a-btn" type="button" id="eDelNo">לא</button></div>
      </div>
    </form>`;
  $<HTMLSelectElement>('#eCat', dlg).addEventListener('change', (e) => { $<HTMLSelectElement>('#eSub', dlg).innerHTML = subOptions((e.target as HTMLSelectElement).value, null); });
  $('#eDel', dlg).addEventListener('click', () => { $('#delConfirm', dlg).hidden = false; $('#eDelNo', dlg).focus(); });
  $('#eDelNo', dlg).addEventListener('click', () => { $('#delConfirm', dlg).hidden = true; });
  $('#eDelYes', dlg).addEventListener('click', async () => { dlg.close(); await deleteItem(it); });
  dlg.onclose = async () => {
    if (dlg.returnValue !== 'save') return;
    const patch = {
      title: $<HTMLInputElement>('#eTitle', dlg).value.trim() || it.title,
      category: $<HTMLSelectElement>('#eCat', dlg).value,
      subcategory: $<HTMLSelectElement>('#eSub', dlg).value || null,
      caption: $<HTMLInputElement>('#eCap', dlg).value.trim(),
      alt: $<HTMLInputElement>('#eAlt', dlg).value.trim(),
    };
    if (await run(db.from('items').update(patch).eq('id', it.id), `#${it.id} נשמרה`) !== null) { Object.assign(it, patch); renderItems(); }
  };
  dlg.returnValue = '';
  dlg.showModal();
}

async function deleteItem(it: Item) {
  const { error } = await db.from('items').delete().eq('id', it.id);
  if (error) return fail(error, 'המחיקה נכשלה');
  // remove the photo files unless something else still uses them
  const used = S.items.some((i) => i.id !== it.id && i.image === it.image) || S.cats.some((c) => c.cover === it.image) ||
    (S.settings.hero_links ?? []).some((l: HeroLink) => l.image === it.image);
  if (!used) await db.storage.from('images').remove([it.image + '.webp', it.image + '-sm.webp']);
  S.items = S.items.filter((i) => i.id !== it.id);
  markPending(); say(`#${it.id} נמחקה`); renderItems();
}

/* upload queue */
function addFiles(list: FileList | null) {
  if (!list) return;
  const cat = S.filter || S.cats[0]?.slug || '';
  for (const file of Array.from(list)) {
    if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) continue;
    const t = suggestTitle(cat, null);
    queue.push({ file, url: URL.createObjectURL(file), cat, sub: null, title: t, alt: autoAlt(cat, null, t), altTouched: false, caption: '', state: 'ready' });
  }
  renderQueue();
}
function renderQueue() {
  const box = document.getElementById('queue'); if (!box) return;
  const ready = queue.filter((q) => q.state !== 'done');
  if (!ready.length) { box.innerHTML = ''; queue = []; return; }
  box.innerHTML = ready.map((q) => {
    const n = queue.indexOf(q);
    return `
    <div class="a-card a-q" data-n="${n}">
      <img src="${q.url}" alt="">
      <div class="a-section" style="gap:10px">
        <div class="a-q-fields">
          <label class="a-field"><span>קטגוריה</span><select data-f="cat">${catOptions(q.cat)}</select></label>
          <label class="a-field"><span>סוג</span><select data-f="sub">${subOptions(q.cat, q.sub)}</select></label>
          <label class="a-field"><span>כותרת</span><input data-f="title" value="${esc(q.title)}"></label>
          <label class="a-field"><span>תיאור התמונה לקוראי מסך</span><input data-f="alt" value="${esc(q.alt)}"></label>
          <label class="a-field"><span>תיאור קצר (לא חובה)</span><input data-f="caption" value="${esc(q.caption)}"></label>
        </div>
        <div class="a-row">
          ${q.state === 'busy' ? '<span>מעלה…</span>' : `<button class="a-btn a-small a-quiet" type="button" data-q="remove">הסרה מהרשימה</button>`}
          ${q.state === 'error' ? `<span class="a-err">${esc(q.err)}</span>` : ''}
        </div>
      </div>
    </div>`;
  }).join('') + `
    <div class="a-row">
      <button class="a-btn a-primary" type="button" id="uploadAll">העלאה ושמירה של ${ready.length} ${ready.length === 1 ? 'עבודה' : 'עבודות'}</button>
      <div class="a-progress" style="flex:1" aria-hidden="true"><i id="prog"></i></div>
    </div>`;
  box.oninput = box.onchange = (e) => {
    const el = e.target as HTMLInputElement, card = el.closest<HTMLElement>('.a-q'); if (!card || !el.dataset.f) return;
    const q = queue[Number(card.dataset.n)], f = el.dataset.f;
    if (f === 'cat') {
      q.cat = el.value; q.sub = null;
      $<HTMLSelectElement>('[data-f="sub"]', card).innerHTML = subOptions(q.cat, null);
      retitle(q, card);
    } else if (f === 'sub') { q.sub = el.value || null; retitle(q, card); }
    else if (f === 'alt') { q.alt = el.value; q.altTouched = true; }
    else if (f === 'title') { q.title = el.value; syncAlt(q, card); }
    else (q as any)[f] = el.value;
  };
  box.onclick = (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button'); if (!b) return;
    if (b.dataset.q === 'remove') { const q = queue[Number(b.closest<HTMLElement>('.a-q')!.dataset.n)]; q.state = 'done'; URL.revokeObjectURL(q.url); renderQueue(); }
    if (b.id === 'uploadAll') uploadAll();
  };
}
function retitle(q: Q, card: HTMLElement) {
  // only replace a title Sara hasn't written herself
  const auto = new Set(S.cats.flatMap((c) => [suggestTitle(c.slug, null), ...subsOf(c.slug).map((s) => suggestTitle(c.slug, s.slug))]));
  if (!q.title || auto.has(q.title)) {
    q.title = suggestTitle(q.cat, q.sub);
    $<HTMLInputElement>('[data-f="title"]', card).value = q.title;
  }
  syncAlt(q, card); // the category or type changed, so the suggested description changes too
}
/* Keep the suggested description up to date until Sara writes her own */
function syncAlt(q: Q, card: HTMLElement) {
  if (q.altTouched) return;
  q.alt = autoAlt(q.cat, q.sub, q.title);
  $<HTMLInputElement>('[data-f="alt"]', card).value = q.alt;
}

async function uploadAll() {
  const todo = queue.filter((q) => q.state === 'ready' || q.state === 'error');
  const btn = $<HTMLButtonElement>('#uploadAll'); btn.disabled = true;
  let done = 0, top = Math.min(0, ...S.items.map((i) => i.sort)) - todo.length;
  for (const q of todo) {
    q.state = 'busy';
    try {
      const stem = `w/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const [big, small] = await Promise.all([toWebp(q.file, 1400), toWebp(q.file, 640)]);
      for (const [blob, suffix] of [[big, ''], [small, '-sm']] as const) {
        const { error } = await db.storage.from('images').upload(stem + suffix + '.webp', blob, { contentType: blob.type, cacheControl: '31536000' });
        if (error) throw error;
      }
      const row = { category: q.cat, subcategory: q.sub, title: q.title.trim() || suggestTitle(q.cat, q.sub), alt: q.alt.trim(), caption: q.caption.trim(), image: stem, sort: top++, visible: true };
      const { data, error } = await db.from('items').insert(row).select().single();
      if (error) throw error;
      S.items.push(data as Item);
      q.state = 'done'; URL.revokeObjectURL(q.url);
    } catch (e: any) {
      q.state = 'error'; q.err = e?.message === 'decode' ? 'לא הצלחתי לקרוא את התמונה. שמרו אותה כ-JPG ונסו שוב.' : (e?.message || 'ההעלאה נכשלה');
    }
    done++;
    const p = document.getElementById('prog'); if (p) p.style.width = (done / todo.length) * 100 + '%';
  }
  markPending();
  const failed = todo.filter((q) => q.state === 'error').length;
  say(failed ? `${failed} תמונות לא הועלו. אפשר לנסות שוב.` : 'העבודות נשמרו. כשתסיימו, לחצו "פרסום השינויים לאתר".', !!failed);
  renderItems();
}

/* Resize in the browser: longest side ≤ max, WebP (or JPEG where the browser can't write WebP). */
async function toWebp(file: File, max: number): Promise<Blob> {
  let bmp: ImageBitmap;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as any); } catch { throw new Error('decode'); }
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.84));
  if (blob && blob.type === 'image/webp') return blob;
  return (await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.86)))!;
}

/* ---------- home page and categories ---------- */
function itemPicker(id: string, selected: number | undefined, label: string) {
  // visible works, plus the current choice even if it was hidden since (so saving never changes it silently)
  const vis = S.items.filter((i) => i.visible || i.id === selected).sort((a, b) => a.sort - b.sort);
  return `<label class="a-field"><span>${label}</span><select id="${id}">${vis.map((i) => `<option value="${i.id}" ${i.id === selected ? 'selected' : ''}>#${i.id} ${esc(i.title)}${i.visible ? '' : ' (מוסתרת)'}</option>`).join('')}</select></label>`;
}
const itemImg = (id: number) => S.items.find((i) => i.id === id)?.image;

function renderHome() {
  const hero: number[] = S.settings.hero ?? [];
  const links: HeroLink[] = S.settings.hero_links ?? [];
  panel().innerHTML = `
    <div class="a-section">
      <h2>שלוש התמונות בקשת</h2>
      <p class="a-help">הראשונה מוצגת כשנכנסים לאתר. השתיים האחרות במגש שמתחתיה.</p>
      <div class="a-picks">
        ${[0, 1, 2].map((n) => `<div class="a-pick"><img id="heroPrev${n}" src="${hero[n] && itemImg(hero[n]) ? img(itemImg(hero[n])!) : ''}" alt="">${itemPicker('hero' + n, hero[n], n === 0 ? 'התמונה הראשית' : `תמונה ${n + 1}`)}</div>`).join('')}
      </div>
      <div><button class="a-btn a-primary" type="button" id="saveHero">שמירת התמונות</button></div>
    </div>
    <div class="a-section">
      <h2>שלושת העיגולים ליד הקשת</h2>
      <p class="a-help">כל עיגול מוביל לקטגוריה. בוחרים קטגוריה ועבודה שהתמונה שלה תופיע בעיגול.</p>
      <div class="a-picks">
        ${[0, 1, 2].map((n) => {
          const l = links[n] ?? { cat: S.cats[n]?.slug, title: S.cats[n]?.name, image: '' };
          const imgId = S.items.find((i) => i.image === l.image)?.id;
          return `<div class="a-pick">
            <img id="linkPrev${n}" src="${l.image ? img(l.image) : ''}" alt="" style="border-radius:50%">
            <label class="a-field"><span>קטגוריה</span><select id="linkCat${n}">${catOptions(l.cat)}</select></label>
            ${itemPicker('linkImg' + n, imgId, 'התמונה')}
          </div>`;
        }).join('')}
      </div>
      <div><button class="a-btn a-primary" type="button" id="saveLinks">שמירת העיגולים</button></div>
    </div>
    <div class="a-section">
      <h2>קטגוריות</h2>
      <p class="a-help">אפשר לשנות שם ותיאור ולהסתיר. קטגוריה בלי עבודות מוצגות לא מופיעה באתר בכל מקרה.</p>
      <div class="a-list">
        ${S.cats.map((c) => `
          <div class="a-list-row" data-cat="${c.slug}">
            <div class="a-section" style="gap:10px">
              <div class="a-q-fields">
                <label class="a-field"><span>שם</span><input data-f="name" value="${esc(c.name)}"></label>
                <label class="a-field"><span>שורת תיאור</span><input data-f="blurb" value="${esc(c.blurb)}"></label>
                <label class="a-field"><span>תמונת העיגול בקטלוג</span><select data-f="cover"><option value="">הראשונה בקטגוריה</option>${S.items.filter((i) => i.category === c.slug).map((i) => `<option value="${esc(i.image)}" ${i.image === c.cover ? 'selected' : ''}>#${i.id} ${esc(i.title)}</option>`).join('')}</select></label>
              </div>
              ${subsOf(c.slug).length ? `<details><summary>סוגים (${subsOf(c.slug).length})</summary><div class="a-list" style="margin-top:10px">${subsOf(c.slug).map((s) => `
                <div class="a-row" data-sub="${s.slug}"><input data-sf="name" value="${esc(s.name)}" style="max-width:260px" aria-label="שם הסוג"><label class="a-switch"><input type="checkbox" data-sf="visible" ${s.visible ? 'checked' : ''}> מוצג</label><span class="a-help">${S.items.filter((i) => i.category === c.slug && i.subcategory === s.slug).length} עבודות</span></div>`).join('')}</div></details>` : ''}
            </div>
            <div class="a-tools" style="flex-direction:column">
              <label class="a-switch"><input type="checkbox" data-f="visible" ${c.visible ? 'checked' : ''}> מוצגת</label>
              <button class="a-btn a-small a-primary" type="button" data-act="saveCat">שמירה</button>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  [0, 1, 2].forEach((n) => {
    $<HTMLSelectElement>('#hero' + n).addEventListener('change', (e) => { $<HTMLImageElement>('#heroPrev' + n).src = img(itemImg(Number((e.target as HTMLSelectElement).value))!); });
    $<HTMLSelectElement>('#linkImg' + n).addEventListener('change', (e) => { $<HTMLImageElement>('#linkPrev' + n).src = img(itemImg(Number((e.target as HTMLSelectElement).value))!); });
  });
  $('#saveHero').addEventListener('click', async () => {
    const ids = [0, 1, 2].map((n) => Number($<HTMLSelectElement>('#hero' + n).value));
    if (await run(db.from('settings').upsert({ key: 'hero', value: ids }), 'התמונות נשמרו') !== null) S.settings.hero = ids;
  });
  $('#saveLinks').addEventListener('click', async () => {
    const v: HeroLink[] = [0, 1, 2].map((n) => {
      const cat = $<HTMLSelectElement>('#linkCat' + n).value;
      return { cat, title: catName(cat), image: itemImg(Number($<HTMLSelectElement>('#linkImg' + n).value))! };
    });
    if (await run(db.from('settings').upsert({ key: 'hero_links', value: v }), 'העיגולים נשמרו') !== null) S.settings.hero_links = v;
  });
  panel().onclick = async (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-act="saveCat"]'); if (!b) return;
    const row = b.closest<HTMLElement>('.a-list-row')!, c = S.cats.find((x) => x.slug === row.dataset.cat)!;
    const patch = {
      name: $<HTMLInputElement>('[data-f="name"]', row).value.trim() || c.name,
      blurb: $<HTMLInputElement>('[data-f="blurb"]', row).value.trim(),
      cover: $<HTMLSelectElement>('[data-f="cover"]', row).value || null,
      visible: $<HTMLInputElement>('[data-f="visible"]', row).checked,
    };
    // Each type keeps its old name if its field was left empty (like the category name above)
    const subPatches = $$<HTMLElement>('[data-sub]', row).map((r) => {
      const s = S.subs.find((x) => x.category === c.slug && x.slug === r.dataset.sub)!;
      const input = $<HTMLInputElement>('[data-sf="name"]', r);
      const name = input.value.trim() || s.name;
      input.value = name;
      return { s, name, visible: $<HTMLInputElement>('[data-sf="visible"]', r).checked };
    });
    const res = await Promise.all([
      db.from('categories').update(patch).eq('slug', c.slug),
      ...subPatches.map((p) => db.from('subcategories').update({ name: p.name, visible: p.visible }).eq('category', c.slug).eq('slug', p.s.slug)),
    ]);
    const err = res.find((r) => r.error)?.error;
    if (err) return fail(err);
    Object.assign(c, patch);
    subPatches.forEach((p) => { p.s.name = p.name; p.s.visible = p.visible; });
    markPending(); say(`${patch.name} נשמרה`);
  };
}

/* ---------- reviews ---------- */
function renderReviews() {
  const list = S.reviews.slice().sort((a, b) => a.sort - b.sort);
  panel().innerHTML = `
    <div class="a-section">
      <div class="a-row a-spread"><h2>ביקורות (${list.length})</h2><button class="a-btn a-primary" type="button" id="addRev">הוספת ביקורת</button></div>
      <p class="a-help">מעתיקים את הטקסט מהוואטסאפ, בלי שם הלקוחה. מוסיפים רק ביקורות שהלקוחה הסכימה שיופיעו באתר.</p>
      <div class="a-list" id="revs">
        ${list.map((r) => `
          <div class="a-list-row" data-id="${r.id}">
            <div class="a-section" style="gap:8px">
              <label class="a-field"><span>הטקסט</span><textarea data-f="text">${esc(r.text)}</textarea></label>
              <label class="a-field"><span>תגית קצרה (למשל: בת מצווה)</span><input data-f="tag" value="${esc(r.tag)}"></label>
            </div>
            <div class="a-tools" style="flex-direction:column">
              <label class="a-switch"><input type="checkbox" data-f="visible" ${r.visible ? 'checked' : ''}> מוצגת</label>
              <button class="a-btn a-small a-primary" type="button" data-act="save">שמירה</button>
              <button class="a-btn a-small a-quiet" type="button" data-act="up" aria-label="להזיז למעלה">↑</button>
              <button class="a-btn a-small a-quiet" type="button" data-act="down" aria-label="להזיז למטה">↓</button>
              <button class="a-btn a-small a-danger" type="button" data-act="del">מחיקה</button>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  $('#addRev').addEventListener('click', async () => {
    const sort = Math.max(0, ...S.reviews.map((r) => r.sort)) + 1;
    const data = await run(db.from('reviews').insert({ text: 'הטקסט של הביקורת', tag: '', sort, visible: false }).select().single(), 'נוספה ביקורת (מוסתרת עד שתסמנו "מוצגת")');
    if (data) { S.reviews.push(data as Review); renderReviews(); $<HTMLTextAreaElement>(`[data-id="${(data as Review).id}"] textarea`).select(); }
  });
  $('#revs').addEventListener('click', async (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button[data-act]'); if (!b) return;
    const row = b.closest<HTMLElement>('.a-list-row')!, r = S.reviews.find((x) => x.id === Number(row.dataset.id))!;
    if (b.dataset.act === 'save') {
      const patch = { text: $<HTMLTextAreaElement>('[data-f="text"]', row).value.trim(), tag: $<HTMLInputElement>('[data-f="tag"]', row).value.trim(), visible: $<HTMLInputElement>('[data-f="visible"]', row).checked };
      if (!patch.text) return say('הביקורת ריקה', true);
      if (await run(db.from('reviews').update(patch).eq('id', r.id), 'הביקורת נשמרה') !== null) Object.assign(r, patch);
    }
    if (b.dataset.act === 'del') {
      if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = 'בטוח? ללחוץ שוב'; return; }
      if (await run(db.from('reviews').delete().eq('id', r.id), 'הביקורת נמחקה') !== null) { S.reviews = S.reviews.filter((x) => x !== r); renderReviews(); }
    }
    if (b.dataset.act === 'up' || b.dataset.act === 'down') {
      list.forEach((x, n) => (x.sort = n));
      const i = list.indexOf(r), j = i + (b.dataset.act === 'up' ? -1 : 1);
      if (j < 0 || j >= list.length) return;
      [list[i].sort, list[j].sort] = [list[j].sort, list[i].sort];
      const res = await Promise.all(list.map((x) => db.from('reviews').update({ sort: x.sort }).eq('id', x.id)));
      if (res.some((x) => x.error)) return fail(res.find((x) => x.error)!.error);
      markPending(); renderReviews();
      $<HTMLButtonElement>(`[data-id="${r.id}"] [data-act="${b.dataset.act}"]`)?.focus();
    }
  });
}

/* ---------- price list ---------- */
function renderPrices() {
  const secs = S.sections.slice().sort((a, b) => a.sort - b.sort);
  panel().innerHTML = `
    <div class="a-section">
      <div class="a-row a-spread"><h2>מחירון</h2><button class="a-btn" type="button" id="addSec">הוספת קבוצה</button></div>
      <p class="a-help">המחירים בשקלים. בשדה "יחידה" אפשר לכתוב למשל "ליחידה". שומרים כל קבוצה בנפרד.</p>
      ${secs.map((s) => `
        <div class="a-price-sec" data-sec="${s.id}">
          <label class="a-field"><span>שם הקבוצה</span><input data-f="title" value="${esc(s.title)}"></label>
          ${S.rows.filter((r) => r.section_id === s.id).sort((a, b) => a.sort - b.sort).map((r) => `
            <div class="a-price-row" data-row="${r.id}">
              <input data-r="name" value="${esc(r.name)}" aria-label="שם הפריט">
              <input data-r="price" value="${esc(r.price)}" aria-label="מחיר" inputmode="numeric">
              <input data-r="unit" value="${esc(r.unit)}" aria-label="יחידה" placeholder="יחידה">
              <button class="a-btn a-small a-quiet" type="button" data-act="delRow" aria-label="מחיקת השורה">✕</button>
            </div>`).join('')}
          <div class="a-row a-spread">
            <div class="a-row"><button class="a-btn a-small a-primary" type="button" data-act="saveSec">שמירת הקבוצה</button><button class="a-btn a-small" type="button" data-act="addRow">הוספת שורה</button></div>
            <button class="a-btn a-small a-danger" type="button" data-act="delSec">מחיקת הקבוצה</button>
          </div>
        </div>`).join('')}
    </div>
    <div class="a-section">
      <label class="a-field"><span>המשפט מתחת למחירון</span><textarea id="note">${esc(S.settings.prices_note ?? '')}</textarea></label>
      <div><button class="a-btn a-primary" type="button" id="saveNote">שמירת המשפט</button></div>
    </div>`;
  $('#saveNote').addEventListener('click', async () => {
    const v = $<HTMLTextAreaElement>('#note').value.trim();
    if (await run(db.from('settings').upsert({ key: 'prices_note', value: v }), 'נשמר') !== null) S.settings.prices_note = v;
  });
  $('#addSec').addEventListener('click', async () => {
    const data = await run(db.from('price_sections').insert({ title: 'קבוצה חדשה', sort: Math.max(0, ...S.sections.map((s) => s.sort)) + 1 }).select().single(), 'נוספה קבוצה');
    if (data) { S.sections.push(data as Section); renderPrices(); }
  });
  panel().onclick = async (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('button[data-act]'); if (!b) return;
    const box = b.closest<HTMLElement>('.a-price-sec')!, sec = S.sections.find((s) => s.id === Number(box.dataset.sec))!;
    if (b.dataset.act === 'addRow') {
      const sort = Math.max(0, ...S.rows.filter((r) => r.section_id === sec.id).map((r) => r.sort)) + 1;
      const data = await run(db.from('price_rows').insert({ section_id: sec.id, name: 'פריט חדש', price: '0', unit: '', sort }).select().single());
      if (data) { S.rows.push(data as Row); renderPrices(); }
    }
    if (b.dataset.act === 'delRow') {
      const id = Number(b.closest<HTMLElement>('[data-row]')!.dataset.row);
      if (await run(db.from('price_rows').delete().eq('id', id), 'השורה נמחקה') !== null) { S.rows = S.rows.filter((r) => r.id !== id); renderPrices(); }
    }
    if (b.dataset.act === 'saveSec') {
      const title = $<HTMLInputElement>('[data-f="title"]', box).value.trim() || sec.title;
      const rows = $$<HTMLElement>('[data-row]', box).map((el, n) => ({ id: Number(el.dataset.row), name: $<HTMLInputElement>('[data-r="name"]', el).value.trim(), price: $<HTMLInputElement>('[data-r="price"]', el).value.trim(), unit: $<HTMLInputElement>('[data-r="unit"]', el).value.trim(), sort: n }));
      const res = await Promise.all([db.from('price_sections').update({ title }).eq('id', sec.id), ...rows.map(({ id, ...r }) => db.from('price_rows').update(r).eq('id', id))]);
      if (res.some((x) => x.error)) return fail(res.find((x) => x.error)!.error);
      sec.title = title; rows.forEach((r) => Object.assign(S.rows.find((x) => x.id === r.id)!, r));
      markPending(); say(`${title} נשמרה`);
    }
    if (b.dataset.act === 'delSec') {
      if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = 'בטוח? ללחוץ שוב'; return; }
      if (await run(db.from('price_sections').delete().eq('id', sec.id), 'הקבוצה נמחקה') !== null) { S.sections = S.sections.filter((s) => s !== sec); S.rows = S.rows.filter((r) => r.section_id !== sec.id); renderPrices(); }
    }
  };
}
