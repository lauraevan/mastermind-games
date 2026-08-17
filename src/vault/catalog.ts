/* ============================================================
 * catalog.ts — kiwi. The enrichment catalog, buried under
 * assets/vendor and reached only after the quiet path
 * (1313 → review page → hidden box → 9999). A guard bounces
 * anyone who lands here without the unlock flag. Dark green
 * aurora hero, status chips, and an icon grid you can star.
 * Ultimate Game Stash entries sink to the very end.
 * ============================================================ */
namespace Catalog {
  interface Row { title: string; url: string; icon: string; src: string; }

  const UGS = 'Ultimate Game Stash';
  const FAV_KEY = 'kfav';
  const state = {
    rows: [] as Row[],
    filtered: [] as Row[],
    shown: 0,
    batch: 120,
    query: '',
    src: 'all',
    loaded: false,
    favs: {} as { [url: string]: 1 }
  };

  function q<T extends HTMLElement>(sel: string): T { return document.querySelector(sel) as T; }
  function byId(id: string): HTMLElement | null { return document.getElementById(id); }
  function esc(s: string): string { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function ic(name: string, size: number): string { return (window as any).Icons ? (window as any).Icons.icon(name, { size: size }) : ''; }

  function guard(): boolean {
    let ok = false;
    try { ok = localStorage.getItem('lf') === '1'; } catch (e) { ok = false; }
    if (!ok) { location.replace('../../../index.html'); return false; }
    return true;
  }

  // ---------- favorites ----------
  function loadFavs(): void {
    try { state.favs = JSON.parse(localStorage.getItem(FAV_KEY) || '{}') || {}; } catch (e) { state.favs = {}; }
  }
  function saveFavs(): void { try { localStorage.setItem(FAV_KEY, JSON.stringify(state.favs)); } catch (e) {} }
  function isFav(url: string): boolean { return !!state.favs[url]; }
  function toggleFav(url: string): boolean {
    if (state.favs[url]) { delete state.favs[url]; } else { state.favs[url] = 1; }
    saveFavs();
    return isFav(url);
  }

  // ---------- top-bar chrome ----------
  function tickClock(): void {
    const el = byId('clock'); if (!el) return;
    const b = el.querySelector('b');
    const t = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (b) b.textContent = t;
  }
  function setGreeting(): void {
    const el = byId('greet'); if (!el) return;
    const h = new Date().getHours();
    let word = 'good evening!';
    if (h < 5) word = 'still up?';
    else if (h < 12) word = 'good morning!';
    else if (h < 18) word = 'good afternoon!';
    el.textContent = '🥝 ' + word;
    // weather chip icon follows day/night
    const w = byId('weather');
    if (w) { const day = h >= 6 && h < 19; w.innerHTML = ic(day ? 'sun' : 'moon', 13) + '<b>66°F</b>'; }
  }
  function measurePing(): void {
    const el = byId('ping'); if (!el) return;
    const b = el.querySelector('b');
    const show = (ms: number) => { if (b) b.textContent = Math.max(1, Math.round(ms)) + ' ms'; };
    const t0 = (window.performance && performance.now) ? performance.now() : Date.now();
    fetch('vault.css', { method: 'HEAD', cache: 'no-store' })
      .then(() => show(((window.performance && performance.now) ? performance.now() : Date.now()) - t0))
      .catch(() => {
        try {
          const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
          if (nav && nav.responseStart && nav.requestStart) show(nav.responseStart - nav.requestStart);
          else show(60 + Math.floor(Math.random() * 90));
        } catch (e) { show(60 + Math.floor(Math.random() * 90)); }
      });
  }

  function toast(msg: string): void {
    const host = byId('toastHost'); if (!host) return;
    const t = document.createElement('div');
    t.className = 'ktoast'; t.textContent = msg;
    host.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2200);
    setTimeout(() => { t.remove(); }, 2600);
  }

  // ---------- artwork (kiwi + duck) ----------
  function paintArt(): void {
    const kiwi =
      '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="50" cy="50" r="46" fill="#4a2f1e"/>' +
      '<circle cx="50" cy="50" r="40" fill="#e9f6c8"/>' +
      '<circle cx="50" cy="50" r="34" fill="#8ed64b"/>' +
      '<circle cx="50" cy="50" r="10" fill="#f4fbe4"/>' +
      seeds() + '</svg>';
    function seeds(): string {
      let s = '';
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        const r = 15 + (i % 2) * 8;
        const x = 50 + Math.cos(a) * r, y = 50 + Math.sin(a) * r;
        s += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="1.5" ry="2.4" fill="#243218" transform="rotate(' + ((a * 180) / Math.PI).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>';
      }
      return s;
    }
    const klogo = byId('klogo'); if (klogo) klogo.innerHTML = kiwi;
    const kmark = byId('kmark'); if (kmark) kmark.innerHTML = kiwi;

    const duck =
      '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">' +
      '<ellipse cx="60" cy="104" rx="34" ry="7" fill="#000" opacity=".18"/>' +
      '<path d="M18 30 l6 -8 4 9 z" fill="#ffd23f"/><path d="M40 22 l3 -9 5 8 z" fill="#ffd23f"/>' +
      '<circle cx="60" cy="66" r="40" fill="#ffcf33"/>' +
      '<circle cx="60" cy="52" r="27" fill="#ffd94d"/>' +
      '<path d="M58 96 q-22 6 -34 -4 q16 -2 30 -10 z" fill="#ffc21f"/>' +
      '<circle cx="52" cy="48" r="5.5" fill="#2a2a2a"/><circle cx="70" cy="48" r="5.5" fill="#2a2a2a"/>' +
      '<circle cx="53.6" cy="46" r="1.8" fill="#fff"/><circle cx="71.6" cy="46" r="1.8" fill="#fff"/>' +
      '<path d="M74 56 h18 q6 4 0 8 h-18 z" fill="#ff9e2c"/>' +
      '<path d="M18 34 l3 -3 3 4 z" fill="#fff" opacity=".9"/><path d="M30 26 l2.5 -2.5 2.5 3.5 z" fill="#fff" opacity=".9"/><path d="M92 40 l2.5 -3 2.5 3.5 z" fill="#fff" opacity=".9"/>' +
      '</svg>';
    const d = byId('duck'); if (d) d.innerHTML = duck;
  }

  function paintStars(): void {
    const host = byId('stars'); if (!host) return;
    let html = '';
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 100, y = Math.random() * 78;
      html += '<i style="left:' + x.toFixed(2) + '%;top:' + y.toFixed(2) + '%;opacity:' + (0.2 + Math.random() * 0.5).toFixed(2) + '"></i>';
    }
    host.innerHTML = html;
  }

  // ---------- data ----------
  function loadData(cb: () => void): void {
    if (window.__VAULT_DATA) { ingest(); cb(); return; }
    const sc = document.createElement('script');
    sc.src = 'data.js';
    sc.onload = () => { ingest(); cb(); };
    sc.onerror = () => { const l = byId('loading'); if (l) l.textContent = 'unable to load the collection.'; };
    document.body.appendChild(sc);
  }

  function ingest(): void {
    const data = window.__VAULT_DATA || [];
    state.rows = data.map((e) => ({ title: e[0], url: e[1], icon: e[2], src: e[3] }));
    // Ultimate Game Stash always last; then entries with local artwork first; then alphabetical.
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
    applyFilter();
  }

  // ---------- sources popout ----------
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
    host.appendChild(mk('all', 'all sources', state.rows.length));
    srcs.forEach((s) => host.appendChild(mk(s, s, counts[s])));
    const lbl = byId('srcLabel');
    if (lbl) lbl.textContent = state.src === 'all' ? 'all sources' : state.src;
  }
  function closePanel(): void { const p = byId('srcPanel'); if (p) p.setAttribute('hidden', ''); }
  function togglePanel(): void { const p = byId('srcPanel'); if (p) { if (p.hasAttribute('hidden')) p.removeAttribute('hidden'); else p.setAttribute('hidden', ''); } }

  // ---------- grid ----------
  function applyFilter(): void {
    const term = state.query.trim().toLowerCase();
    const rows = state.rows.filter((r) => {
      if (state.src !== 'all' && r.src !== state.src) return false;
      if (term && r.title.toLowerCase().indexOf(term) === -1) return false;
      return true;
    });
    // favorites float to the front, otherwise keep the ingest order
    rows.sort((a, b) => (isFav(b.url) ? 1 : 0) - (isFav(a.url) ? 1 : 0));
    state.filtered = rows;
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

    const star = document.createElement('span');
    star.className = 'star' + (isFav(r.url) ? ' on' : '');
    star.innerHTML = ic('star', 15);
    star.setAttribute('role', 'button');
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      const on = toggleFav(r.url);
      star.classList.toggle('on', on);
    });

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = r.title;

    el.appendChild(icWrap);
    el.appendChild(star);
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

  // ---------- play overlay + loader ----------
  const TIPS = [
    'warming things up…',
    'this one’s a big one — hang tight.',
    'loading assets. larger titles can take a moment.',
    'reticulating splines…',
    'almost there…',
    'good things load to those who wait.',
    'buffering the fun…',
    'still going — thanks for your patience.'
  ];
  let tipTimer = 0;
  let loadTimer = 0;

  function showLoad(title: string): void {
    const load = byId('ovLoad');
    const lt = byId('ovLoadTitle');
    const tip = byId('ovTip');
    if (lt) lt.textContent = title || 'loading…';
    let i = 0;
    if (tip) tip.textContent = TIPS[0];
    window.clearInterval(tipTimer);
    tipTimer = window.setInterval(() => {
      i = (i + 1) % TIPS.length;
      if (tip) { tip.style.opacity = '0'; window.setTimeout(() => { tip.textContent = TIPS[i]; tip.style.opacity = '1'; }, 180); }
    }, 2600);
    if (load) load.removeAttribute('hidden');
  }
  function hideLoad(): void {
    window.clearInterval(tipTimer);
    window.clearTimeout(loadTimer);
    const load = byId('ovLoad');
    if (load) load.setAttribute('hidden', '');
  }

  function open(r: Row): void {
    const ov = q<HTMLElement>('#ov');
    const frame = q<HTMLIFrameElement>('#ovFrame');
    q<HTMLElement>('#ovTitle').textContent = r.title;
    showLoad(r.title);
    frame.onload = () => { if (frame.src !== 'about:blank') hideLoad(); };
    window.clearTimeout(loadTimer);
    loadTimer = window.setTimeout(hideLoad, 20000);
    frame.src = r.url;
    ov.classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function close(): void {
    const ov = q<HTMLElement>('#ov');
    const frame = q<HTMLIFrameElement>('#ovFrame');
    frame.onload = null;
    frame.src = 'about:blank';
    hideLoad();
    ov.classList.remove('on');
    document.body.style.overflow = '';
  }

  export function init(): void {
    if (!guard()) return;
    loadFavs();
    paintArt();
    paintStars();
    setGreeting();
    tickClock();
    measurePing();
    window.setInterval(tickClock, 15000);
    window.setInterval(measurePing, 20000);

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
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 900) renderMore();
    });

    const srcBtn = byId('srcBtn');
    if (srcBtn) srcBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePanel(); });
    document.addEventListener('click', (e) => {
      const panel = byId('srcPanel');
      if (!panel || panel.hasAttribute('hidden')) return;
      const target = e.target as Node;
      if (!panel.contains(target) && target !== srcBtn) closePanel();
    });

    // remove-ads card + discord are cosmetic here
    const redeem = byId('adredeem');
    const codeEl = byId('adcode') as HTMLInputElement | null;
    function doRedeem(): void {
      const v = codeEl ? codeEl.value.trim() : '';
      if (!v) { toast('enter a code first.'); return; }
      toast('“' + v + '” isn’t a valid code.');
      if (codeEl) codeEl.value = '';
    }
    if (redeem) redeem.addEventListener('click', doRedeem);
    if (codeEl) codeEl.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') doRedeem(); });
    const here = byId('adhere');
    if (here) here.addEventListener('click', (e) => { e.preventDefault(); toast('the shop isn’t open yet.'); });
    const discord = byId('discord');
    if (discord) discord.addEventListener('click', (e) => { e.preventDefault(); toast('no server linked yet.'); });

    const ovClose = byId('ovClose');
    if (ovClose) ovClose.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); closePanel(); } });

    const l = byId('loading');
    if (l) l.style.display = 'block';
    loadData(() => { const l2 = byId('loading'); if (l2) l2.style.display = 'none'; });
  }
}

document.addEventListener('DOMContentLoaded', Catalog.init);
