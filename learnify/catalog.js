"use strict";
/* ============================================================
 * catalog.ts — the enrichment catalog.
 * Reached only after the quiet key is entered elsewhere; a guard
 * bounces anyone who arrives without it. Pitch-black wall of
 * tiles: icon only, with the label revealed on hover.
 * ============================================================ */
var Catalog;
(function (Catalog) {
    const state = {
        rows: [],
        filtered: [],
        shown: 0,
        batch: 120,
        query: '',
        src: 'all',
        loaded: false
    };
    function q(sel) { return document.querySelector(sel); }
    function byId(id) { return document.getElementById(id); }
    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function guard() {
        let ok = false;
        try {
            ok = localStorage.getItem('lf') === '1';
        }
        catch (e) {
            ok = false;
        }
        if (!ok) {
            location.replace('../index.html');
            return false;
        }
        return true;
    }
    function loadData(cb) {
        if (window.__VAULT_DATA) {
            ingest();
            cb();
            return;
        }
        const sc = document.createElement('script');
        sc.src = 'data.js';
        sc.onload = () => { ingest(); cb(); };
        sc.onerror = () => { const l = byId('loading'); if (l)
            l.textContent = 'Unable to load the collection.'; };
        document.body.appendChild(sc);
    }
    function ingest() {
        const data = window.__VAULT_DATA || [];
        state.rows = data.map((e) => ({ title: e[0], url: e[1], icon: e[2], src: e[3] }));
        state.loaded = true;
        buildSources();
        applyFilter();
    }
    function buildSources() {
        const counts = {};
        state.rows.forEach((r) => { counts[r.src] = (counts[r.src] || 0) + 1; });
        const srcs = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        const host = q('#sources');
        host.innerHTML = '';
        const mk = (id, label, n) => {
            const b = document.createElement('button');
            b.className = 'src-chip' + (state.src === id ? ' on' : '');
            b.innerHTML = esc(label) + ' <b>' + n + '</b>';
            b.onclick = () => { state.src = id; buildSources(); applyFilter(); };
            return b;
        };
        host.appendChild(mk('all', 'All', state.rows.length));
        srcs.forEach((s) => host.appendChild(mk(s, s, counts[s])));
    }
    function applyFilter() {
        const term = state.query.trim().toLowerCase();
        state.filtered = state.rows.filter((r) => {
            if (state.src !== 'all' && r.src !== state.src)
                return false;
            if (term && r.title.toLowerCase().indexOf(term) === -1)
                return false;
            return true;
        });
        state.shown = 0;
        q('#grid').innerHTML = '';
        renderMore();
        const c = byId('count');
        if (c)
            c.textContent = state.filtered.length.toLocaleString();
    }
    function card(r) {
        const el = document.createElement('button');
        el.className = 'tile';
        el.title = '';
        el.innerHTML =
            '<span class="ic"><img loading="lazy" decoding="async" alt="" ' +
                'onerror="this.parentNode.classList.add(&quot;none&quot;)" ' +
                'src="' + encodeURI(r.icon) + '"></span>' +
                '<span class="label">' + esc(r.title) + '</span>';
        el.addEventListener('click', () => open(r));
        return el;
    }
    function renderMore() {
        const end = Math.min(state.shown + state.batch, state.filtered.length);
        const frag = document.createDocumentFragment();
        for (let i = state.shown; i < end; i++)
            frag.appendChild(card(state.filtered[i]));
        q('#grid').appendChild(frag);
        state.shown = end;
        const more = byId('more');
        if (more)
            more.style.display = state.shown < state.filtered.length ? 'inline-flex' : 'none';
    }
    function open(r) {
        const ov = q('#ov');
        const frame = q('#ovFrame');
        q('#ovTitle').textContent = r.title;
        frame.src = r.url;
        ov.classList.add('on');
        document.body.style.overflow = 'hidden';
    }
    function close() {
        const ov = q('#ov');
        q('#ovFrame').src = 'about:blank';
        ov.classList.remove('on');
        document.body.style.overflow = '';
    }
    function init() {
        if (!guard())
            return;
        const search = byId('search');
        if (search) {
            let t = 0;
            search.addEventListener('input', () => {
                window.clearTimeout(t);
                t = window.setTimeout(() => { state.query = search.value; applyFilter(); }, 130);
            });
        }
        const more = byId('more');
        if (more)
            more.addEventListener('click', renderMore);
        window.addEventListener('scroll', () => {
            if (!state.loaded || state.shown >= state.filtered.length)
                return;
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800)
                renderMore();
        });
        const ovClose = byId('ovClose');
        if (ovClose)
            ovClose.addEventListener('click', close);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape')
            close(); });
        const l = byId('loading');
        if (l)
            l.style.display = 'block';
        loadData(() => { const l2 = byId('loading'); if (l2)
            l2.style.display = 'none'; });
    }
    Catalog.init = init;
})(Catalog || (Catalog = {}));
document.addEventListener('DOMContentLoaded', Catalog.init);
