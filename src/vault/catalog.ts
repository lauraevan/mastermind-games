/* ============================================================
 * catalog.ts — renders the Atlas once the code is broken.
 * Everything a visitor could read is run through the Cipher
 * Atlas face; the raw DOM strings are shifted first, so even a
 * peek at the source shows nothing but runes. Icons are the only
 * plain signal, and they say nothing on their own.
 * ============================================================ */
namespace Catalog {
  interface Row { title: string; url: string; icon: string; src: string; }

  const state = {
    rows: [] as Row[],
    filtered: [] as Row[],
    shown: 0,
    batch: 80,
    query: '',
    src: 'all',
    loaded: false,
    loading: false,
    revealed: false
  };

  function q<T extends HTMLElement>(sel: string): T { return document.querySelector(sel) as T; }
  function byId(id: string): HTMLElement | null { return document.getElementById(id); }

  // Shift letters/digits so the literal DOM string is never the real caption.
  // Rendered through Cipher Atlas it is runes either way — this just denies the
  // source-reader a plaintext copy.
  function shift(s: string): string {
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c >= 65 && c <= 90) out += String.fromCharCode(((c - 65 + 7) % 26) + 65);
      else if (c >= 97 && c <= 122) out += String.fromCharCode(((c - 97 + 7) % 26) + 97);
      else if (c >= 48 && c <= 57) out += String.fromCharCode(((c - 48 + 3) % 10) + 48);
      else out += s.charAt(i);
    }
    return out;
  }
  function esc(s: string): string { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function loadData(cb: () => void): void {
    if (window.__VAULT_DATA) { ingest(); cb(); return; }
    if (state.loading) return;
    state.loading = true;
    const sc = document.createElement('script');
    sc.src = 'data.js';
    sc.onload = () => { ingest(); cb(); };
    sc.onerror = () => { const l = byId('vLoading'); if (l) l.textContent = 'Could not reach the archive.'; };
    document.body.appendChild(sc);
  }

  function ingest(): void {
    const data = window.__VAULT_DATA || [];
    state.rows = data.map((e) => ({ title: e[0], url: e[1], icon: e[2], src: e[3] }));
    state.loaded = true;
    buildSources();
    applyFilter();
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
      b.innerHTML = '<span class="obf">' + esc(shift(label)) + '</span> <b>' + n + '</b>';
      b.onclick = () => { state.src = id; buildSources(); applyFilter(); };
      return b;
    };
    host.appendChild(mk('all', 'All Shelves', state.rows.length));
    srcs.forEach((s) => host.appendChild(mk(s, s, counts[s])));
  }

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
    updateCount();
  }

  function updateCount(): void {
    const c = byId('count');
    if (c) c.textContent = state.filtered.length.toLocaleString() + ' entries';
  }

  function card(r: Row): HTMLElement {
    const el = document.createElement('button');
    el.className = 'v-card';
    el.innerHTML =
      '<span class="v-ic"><img loading="lazy" decoding="async" alt="" ' +
      'onerror="this.parentNode.innerHTML=&quot;<span class=\\&quot;ph\\&quot;>◈</span>&quot;" ' +
      'src="' + encodeURI(r.icon) + '"></span>' +
      '<span class="v-cap obf">' + esc(shift(r.title)) + '</span>';
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
    if (more) more.style.display = state.shown < state.filtered.length ? 'inline-block' : 'none';
  }

  // ---------- overlay ----------
  function open(r: Row): void {
    const ov = q<HTMLElement>('#ov');
    const frame = q<HTMLIFrameElement>('#ovFrame');
    const title = q<HTMLElement>('#ovTitle');
    title.textContent = shift(r.title);
    frame.src = r.url;
    ov.classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function close(): void {
    const ov = q<HTMLElement>('#ov');
    const frame = q<HTMLIFrameElement>('#ovFrame');
    ov.classList.remove('on');
    frame.src = 'about:blank';
    document.body.style.overflow = '';
  }

  // ---------- reveal ----------
  function reveal(): void {
    if (state.revealed) return;
    state.revealed = true;
    const gate = byId('gate');
    if (gate) gate.setAttribute('hidden', '');
    const vault = byId('vault');
    if (vault) vault.removeAttribute('hidden');
    if (!state.loaded) {
      const l = byId('vLoading'); if (l) l.style.display = 'block';
      loadData(() => { const l2 = byId('vLoading'); if (l2) l2.style.display = 'none'; });
    }
  }

  export function init(): void {
    window.__atlasReveal = reveal;

    const search = byId('search') as HTMLInputElement | null;
    if (search) {
      let t: number | undefined;
      search.addEventListener('input', () => {
        window.clearTimeout(t);
        t = window.setTimeout(() => { state.query = search.value; applyFilter(); }, 140);
      });
    }
    const more = byId('more');
    if (more) more.addEventListener('click', renderMore);

    // infinite scroll
    window.addEventListener('scroll', () => {
      if (!state.loaded) return;
      if (state.shown >= state.filtered.length) return;
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 700) renderMore();
    });

    const ovClose = byId('ovClose');
    if (ovClose) ovClose.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    // If the code was already broken on a previous visit, open now.
    let done = false;
    try { done = localStorage.getItem('mm_solved') === '1'; } catch (e) { /* ignore */ }
    if (done) reveal();
  }
}

document.addEventListener('DOMContentLoaded', Catalog.init);
