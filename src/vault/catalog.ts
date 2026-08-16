/* ============================================================
 * catalog.ts — the enrichment catalog (buried under assets/vendor).
 * Reached only after the quiet key is entered elsewhere; a guard
 * bounces anyone who arrives without it. Pitch-black wall of tiles,
 * icon-only with the label revealed on hover. Sources live in a
 * small pop-out. Ultimate Game Stash entries sink to the very end.
 * ============================================================ */
namespace Catalog {
  interface Row { title: string; url: string; icon: string; src: string; }

  const UGS = 'Ultimate Game Stash';
  const state = {
    rows: [] as Row[],
    filtered: [] as Row[],
    shown: 0,
    batch: 150,
    query: '',
    src: 'all',
    loaded: false
  };

  function q<T extends HTMLElement>(sel: string): T { return document.querySelector(sel) as T; }
  function byId(id: string): HTMLElement | null { return document.getElementById(id); }
  function esc(s: string): string { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function guard(): boolean {
    let ok = false;
    try { ok = localStorage.getItem('lf') === '1'; } catch (e) { ok = false; }
    if (!ok) { location.replace('../../../index.html'); return false; }
    return true;
  }

  function loadData(cb: () => void): void {
    if (window.__VAULT_DATA) { ingest(); cb(); return; }
    const sc = document.createElement('script');
    sc.src = 'data.js';
    sc.onload = () => { ingest(); cb(); };
    sc.onerror = () => { const l = byId('loading'); if (l) l.textContent = 'Unable to load the collection.'; };
    document.body.appendChild(sc);
  }

  function ingest(): void {
    const data = window.__VAULT_DATA || [];
    state.rows = data.map((e) => ({ title: e[0], url: e[1], icon: e[2], src: e[3] }));
    // Order: Ultimate Game Stash always last; then entries with local artwork
    // first; then alphabetical. Keeps every leading tile showing an icon.
    state.rows.sort((a, b) => {
      const ua = a.src === UGS ? 1 : 0, ub = b.src === UGS ? 1 : 0;
      if (ua !== ub) return ua - ub;
      const la = a.icon.indexOf('lauraevan/greatestgreatest-revive') !== -1 ? 0 : 1;
      const lb = b.icon.indexOf('lauraevan/greatestgreatest-revive') !== -1 ? 0 : 1;
      if (la !== lb) return la - lb;
      return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
    });
    state.loaded = true;
    buildSources();
    buildHero();
    applyFilter();
  }

  function buildHero(): void {
    const iconGames = state.rows.filter((r) => r.icon.indexOf('lauraevan/greatestgreatest-revive') !== -1);
    const pool = iconGames.length ? iconGames : state.rows;
    if (!pool.length) return;
    const feat = pool[Math.floor(Math.random() * Math.min(120, pool.length))];
    const img = byId('gheroImg') as HTMLImageElement | null;
    const title = byId('gheroTitle');
    const get = byId('gheroGet');
    const hero = byId('ghero');
    if (!img || !hero) return;
    img.onerror = () => { img.style.display = 'none'; };
    img.src = encodeURI(feat.icon);
    if (title) title.textContent = feat.title;
    if (get) get.onclick = () => open(feat);
    hero.removeAttribute('hidden');
  }

  function currentSourceLabel(): string {
    if (state.src === 'all') return 'All';
    return state.src;
  }

  function buildSources(): void {
    const counts: { [k: string]: number } = {};
    state.rows.forEach((r) => { counts[r.src] = (counts[r.src] || 0) + 1; });
    const srcs = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    const host = q<HTMLElement>('#sources');
    host.innerHTML = '';
    const mk = (id: string, label: string, n: number) => {
      const b = document.createElement('button');
      b.className = 'src-chip' + (state.src === id ? ' on' : '');
      b.innerHTML = esc(label) + ' <b>' + n + '</b>';
      b.onclick = () => { state.src = id; closePanel(); buildSources(); applyFilter(); };
      return b;
    };
    host.appendChild(mk('all', 'All', state.rows.length));
    srcs.forEach((s) => host.appendChild(mk(s, s, counts[s])));
    const lbl = byId('srcLabel');
    if (lbl) lbl.textContent = currentSourceLabel();
  }

  function closePanel(): void { const p = byId('srcPanel'); if (p) p.setAttribute('hidden', ''); }
  function togglePanel(): void { const p = byId('srcPanel'); if (p) { if (p.hasAttribute('hidden')) p.removeAttribute('hidden'); else p.setAttribute('hidden', ''); } }

  function applyFilter(): void {
    const term = state.query.trim().toLowerCase();
    state.filtered = state.rows.filter((r) => {
      if (state.src !== 'all' && r.src !== state.src) return false;
      if (term && r.title.toLowerCase().indexOf(term) === -1) return false;
      return true;
    });
    state.shown = 0;
    q<HTMLElement>('#grid').innerHTML = '';
    renderMore();
    const c = byId('count');
    if (c) c.textContent = state.filtered.length.toLocaleString();
  }

  function card(r: Row): HTMLElement {
    const el = document.createElement('button');
    el.className = 'tile';
    const icWrap = document.createElement('span');
    icWrap.className = 'ic';
    const img = document.createElement('img');
    img.loading = 'lazy'; img.decoding = 'async'; img.alt = '';
    img.onerror = () => {
      icWrap.classList.add('none');
      el.classList.add('noicon');
      const grid = el.parentNode;
      if (grid) grid.appendChild(el);
    };
    img.src = encodeURI(r.icon);
    icWrap.appendChild(img);
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = r.title;
    el.appendChild(icWrap);
    el.appendChild(label);
    el.addEventListener('click', () => open(r));
    return el;
  }

  function renderMore(): void {
    const end = Math.min(state.shown + state.batch, state.filtered.length);
    const frag = document.createDocumentFragment();
    for (let i = state.shown; i < end; i++) frag.appendChild(card(state.filtered[i]));
    q<HTMLElement>('#grid').appendChild(frag);
    state.shown = end;
    const more = byId('more');
    if (more) more.style.display = state.shown < state.filtered.length ? 'inline-flex' : 'none';
  }

  function open(r: Row): void {
    const ov = q<HTMLElement>('#ov');
    const frame = q<HTMLIFrameElement>('#ovFrame');
    q<HTMLElement>('#ovTitle').textContent = r.title;
    frame.src = r.url;
    ov.classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function close(): void {
    const ov = q<HTMLElement>('#ov');
    q<HTMLIFrameElement>('#ovFrame').src = 'about:blank';
    ov.classList.remove('on');
    document.body.style.overflow = '';
  }

  export function init(): void {
    if (!guard()) return;

    const search = byId('search') as HTMLInputElement | null;
    if (search) {
      let t = 0;
      search.addEventListener('input', () => {
        window.clearTimeout(t);
        t = window.setTimeout(() => { state.query = search.value; applyFilter(); }, 130);
      });
    }
    const more = byId('more');
    if (more) more.addEventListener('click', renderMore);
    window.addEventListener('scroll', () => {
      if (!state.loaded || state.shown >= state.filtered.length) return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) renderMore();
    });

    const srcBtn = byId('srcBtn');
    if (srcBtn) srcBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePanel(); });
    document.addEventListener('click', (e) => {
      const panel = byId('srcPanel');
      if (!panel || panel.hasAttribute('hidden')) return;
      const target = e.target as Node;
      if (!panel.contains(target) && target !== srcBtn) closePanel();
    });

    const ovClose = byId('ovClose');
    if (ovClose) ovClose.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); closePanel(); } });

    const l = byId('loading');
    if (l) l.style.display = 'block';
    loadData(() => { const l2 = byId('loading'); if (l2) l2.style.display = 'none'; });
  }
}

document.addEventListener('DOMContentLoaded', Catalog.init);
