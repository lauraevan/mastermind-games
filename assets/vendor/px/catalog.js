"use strict";
/* ============================================================
 * catalog.ts — the enrichment catalog, buried under assets/vendor
 * and reached only after the quiet path (1313 → review page →
 * invisible corner box → 9999). A guard bounces anyone who lands
 * here without the unlock flag. Dark violet aurora hero, status
 * chips, and an icon grid you can star. Ultimate Game Stash
 * entries sink to the very end.
 * ============================================================ */
var Catalog;
(function (Catalog) {
    const UGS = 'Ultimate Game Stash';
    const FAV_KEY = 'kfav';
    const state = {
        rows: [],
        filtered: [],
        shown: 0,
        batch: 120,
        query: '',
        src: 'all',
        loaded: false,
        favs: {}
    };
    function q(sel) { return document.querySelector(sel); }
    function byId(id) { return document.getElementById(id); }
    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function ic(name, size) { return window.Icons ? window.Icons.icon(name, { size: size }) : ''; }
    function guard() {
        let ok = false;
        try {
            ok = localStorage.getItem('lf') === '1';
        }
        catch (e) {
            ok = false;
        }
        if (!ok) {
            location.replace('../../../index.html');
            return false;
        }
        return true;
    }
    // ---------- favorites ----------
    function loadFavs() {
        try {
            state.favs = JSON.parse(localStorage.getItem(FAV_KEY) || '{}') || {};
        }
        catch (e) {
            state.favs = {};
        }
    }
    function saveFavs() { try {
        localStorage.setItem(FAV_KEY, JSON.stringify(state.favs));
    }
    catch (e) { } }
    function isFav(url) { return !!state.favs[url]; }
    function toggleFav(url) {
        if (state.favs[url]) {
            delete state.favs[url];
        }
        else {
            state.favs[url] = 1;
        }
        saveFavs();
        return isFav(url);
    }
    // ---------- top-bar chrome ----------
    function tickClock() {
        const el = byId('clock');
        if (!el)
            return;
        const b = el.querySelector('b');
        const t = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        if (b)
            b.textContent = t;
    }
    function setGreeting() {
        const el = byId('greet');
        if (!el)
            return;
        const h = new Date().getHours();
        let word = 'good evening!';
        if (h < 5)
            word = 'still up?';
        else if (h < 12)
            word = 'good morning!';
        else if (h < 18)
            word = 'good afternoon!';
        el.textContent = '🧠 ' + word;
        // weather chip icon follows day/night
        const w = byId('weather');
        if (w) {
            const day = h >= 6 && h < 19;
            w.innerHTML = ic(day ? 'sun' : 'moon', 13) + '<b>66°F</b>';
        }
    }
    function measurePing() {
        const el = byId('ping');
        if (!el)
            return;
        const b = el.querySelector('b');
        const show = (ms) => { if (b)
            b.textContent = Math.max(1, Math.round(ms)) + ' ms'; };
        const t0 = (window.performance && performance.now) ? performance.now() : Date.now();
        fetch('vault.css', { method: 'HEAD', cache: 'no-store' })
            .then(() => show(((window.performance && performance.now) ? performance.now() : Date.now()) - t0))
            .catch(() => {
            try {
                const nav = performance.getEntriesByType('navigation')[0];
                if (nav && nav.responseStart && nav.requestStart)
                    show(nav.responseStart - nav.requestStart);
                else
                    show(60 + Math.floor(Math.random() * 90));
            }
            catch (e) {
                show(60 + Math.floor(Math.random() * 90));
            }
        });
    }
    function toast(msg) {
        const host = byId('toastHost');
        if (!host)
            return;
        const t = document.createElement('div');
        t.className = 'ktoast';
        t.textContent = msg;
        host.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2200);
        setTimeout(() => { t.remove(); }, 2600);
    }
    // ---------- artwork (Mastermind mark) ----------
    function paintArt() {
        const mark = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
            '<defs><linearGradient id="mmg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b7bf5"/><stop offset="1" stop-color="#5a4bd6"/></linearGradient></defs>' +
            '<rect x="6" y="6" width="88" height="88" rx="24" fill="url(#mmg)"/>' +
            '<rect x="6" y="6" width="88" height="88" rx="24" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1.5"/>' +
            '<path d="M26 72 V34 l24 24 24-24 v38" fill="none" stroke="#fff" stroke-width="7.5" stroke-linejoin="round" stroke-linecap="round"/>' +
            '</svg>';
        const klogo = byId('klogo');
        if (klogo)
            klogo.innerHTML = mark;
        const kmark = byId('kmark');
        if (kmark)
            kmark.innerHTML = mark;
    }
    function paintStars() {
        const host = byId('stars');
        if (!host)
            return;
        let html = '';
        for (let i = 0; i < 60; i++) {
            const x = Math.random() * 100, y = Math.random() * 78;
            html += '<i style="left:' + x.toFixed(2) + '%;top:' + y.toFixed(2) + '%;opacity:' + (0.2 + Math.random() * 0.5).toFixed(2) + '"></i>';
        }
        host.innerHTML = html;
    }
    // ---------- data ----------
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
            l.textContent = 'unable to load the collection.'; };
        document.body.appendChild(sc);
    }
    function ingest() {
        const data = window.__VAULT_DATA || [];
        state.rows = data.map((e) => ({ title: e[0], url: e[1], icon: e[2], src: e[3] }));
        // Ultimate Game Stash always last; then entries with local artwork first; then alphabetical.
        state.rows.sort((a, b) => {
            const ua = a.src === UGS ? 1 : 0, ub = b.src === UGS ? 1 : 0;
            if (ua !== ub)
                return ua - ub;
            const la = a.icon.indexOf('lauraevan/greatestgreatest-revive') !== -1 ? 0 : 1;
            const lb = b.icon.indexOf('lauraevan/greatestgreatest-revive') !== -1 ? 0 : 1;
            if (la !== lb)
                return la - lb;
            return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
        });
        state.loaded = true;
        buildSources();
        applyFilter();
    }
    // ---------- sources popout ----------
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
            b.onclick = () => { state.src = id; closePanel(); buildSources(); applyFilter(); };
            return b;
        };
        host.appendChild(mk('all', 'all sources', state.rows.length));
        srcs.forEach((s) => host.appendChild(mk(s, s, counts[s])));
        const lbl = byId('srcLabel');
        if (lbl)
            lbl.textContent = state.src === 'all' ? 'all sources' : state.src;
    }
    function closePanel() { const p = byId('srcPanel'); if (p)
        p.setAttribute('hidden', ''); }
    function togglePanel() { const p = byId('srcPanel'); if (p) {
        if (p.hasAttribute('hidden'))
            p.removeAttribute('hidden');
        else
            p.setAttribute('hidden', '');
    } }
    // ---------- grid ----------
    function applyFilter() {
        const term = state.query.trim().toLowerCase();
        const rows = state.rows.filter((r) => {
            if (state.src !== 'all' && r.src !== state.src)
                return false;
            if (term && r.title.toLowerCase().indexOf(term) === -1)
                return false;
            return true;
        });
        // favorites float to the front, otherwise keep the ingest order
        rows.sort((a, b) => (isFav(b.url) ? 1 : 0) - (isFav(a.url) ? 1 : 0));
        state.filtered = rows;
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
        const icWrap = document.createElement('span');
        icWrap.className = 'ic';
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = '';
        img.onerror = () => {
            icWrap.classList.add('none');
            el.classList.add('noicon');
            const grid = el.parentNode;
            if (grid)
                grid.appendChild(el);
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
    function showLoad(title) {
        const load = byId('ovLoad');
        const lt = byId('ovLoadTitle');
        const tip = byId('ovTip');
        if (lt)
            lt.textContent = title || 'loading…';
        let i = 0;
        if (tip)
            tip.textContent = TIPS[0];
        window.clearInterval(tipTimer);
        tipTimer = window.setInterval(() => {
            i = (i + 1) % TIPS.length;
            if (tip) {
                tip.style.opacity = '0';
                window.setTimeout(() => { tip.textContent = TIPS[i]; tip.style.opacity = '1'; }, 180);
            }
        }, 2600);
        if (load)
            load.removeAttribute('hidden');
    }
    function hideLoad() {
        window.clearInterval(tipTimer);
        window.clearTimeout(loadTimer);
        const load = byId('ovLoad');
        if (load)
            load.setAttribute('hidden', '');
    }
    function open(r) {
        const ov = q('#ov');
        const frame = q('#ovFrame');
        q('#ovTitle').textContent = r.title;
        showLoad(r.title);
        frame.onload = () => { if (frame.src !== 'about:blank')
            hideLoad(); };
        window.clearTimeout(loadTimer);
        loadTimer = window.setTimeout(hideLoad, 20000);
        frame.src = r.url;
        ov.classList.add('on');
        document.body.style.overflow = 'hidden';
    }
    function close() {
        const ov = q('#ov');
        const frame = q('#ovFrame');
        frame.onload = null;
        frame.src = 'about:blank';
        hideLoad();
        ov.classList.remove('on');
        document.body.style.overflow = '';
    }
    function init() {
        if (!guard())
            return;
        loadFavs();
        paintArt();
        paintStars();
        setGreeting();
        tickClock();
        measurePing();
        window.setInterval(tickClock, 15000);
        window.setInterval(measurePing, 20000);
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
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 900)
                renderMore();
        });
        const srcBtn = byId('srcBtn');
        if (srcBtn)
            srcBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePanel(); });
        document.addEventListener('click', (e) => {
            const panel = byId('srcPanel');
            if (!panel || panel.hasAttribute('hidden'))
                return;
            const target = e.target;
            if (!panel.contains(target) && target !== srcBtn)
                closePanel();
        });
        const discord = byId('discord');
        if (discord)
            discord.addEventListener('click', (e) => { e.preventDefault(); toast('no server linked yet.'); });
        const ovClose = byId('ovClose');
        if (ovClose)
            ovClose.addEventListener('click', close);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') {
            close();
            closePanel();
        } });
        const l = byId('loading');
        if (l)
            l.style.display = 'block';
        loadData(() => { const l2 = byId('loading'); if (l2)
            l2.style.display = 'none'; });
    }
    Catalog.init = init;
})(Catalog || (Catalog = {}));
document.addEventListener('DOMContentLoaded', Catalog.init);
