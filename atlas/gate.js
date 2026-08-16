"use strict";
/* ============================================================
 * gate.ts — the final lock: break the four-colour code.
 * Fittingly, the way past the Mastermind is a game of Mastermind.
 * Solve it and the Atlas opens. Run out of tries and a fresh code
 * is drawn — no one is ever locked out, only slowed down.
 * ============================================================ */
var Gate;
(function (Gate) {
    const PALETTE = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
    const SLOTS = 4;
    const MAX_TRIES = 10;
    let secret = [];
    let guess = [];
    let rowIndex = 0;
    let solved = false;
    function newSecret() {
        const s = [];
        for (let i = 0; i < SLOTS; i++)
            s.push(Math.floor(Math.random() * PALETTE.length));
        return s;
    }
    function q(sel) {
        return document.querySelector(sel);
    }
    function score(g) {
        const s = secret.slice();
        const gg = g.slice();
        let exact = 0;
        for (let i = 0; i < SLOTS; i++) {
            if (gg[i] === s[i]) {
                exact++;
                s[i] = -1;
                gg[i] = -2;
            }
        }
        let near = 0;
        for (let i = 0; i < SLOTS; i++) {
            if (gg[i] < 0)
                continue;
            const j = s.indexOf(gg[i]);
            if (j !== -1) {
                near++;
                s[j] = -1;
            }
        }
        return { exact, near };
    }
    function buildRows() {
        const rows = q('#rows');
        rows.innerHTML = '';
        for (let r = 0; r < MAX_TRIES; r++) {
            const row = document.createElement('div');
            row.className = 'grow' + (r === rowIndex ? ' active' : '');
            row.id = 'row-' + r;
            let pegs = '<div class="pegs">';
            for (let s = 0; s < SLOTS; s++)
                pegs += '<div class="peg" data-slot="' + s + '"></div>';
            pegs += '</div>';
            row.innerHTML = pegs + '<div class="fb"><i></i><i></i><i></i><i></i></div>';
            rows.appendChild(row);
        }
        bindActiveRow();
    }
    function bindActiveRow() {
        const row = document.getElementById('row-' + rowIndex);
        if (!row)
            return;
        const pegs = row.querySelectorAll('.peg');
        pegs.forEach((p, i) => {
            p.style.cursor = 'pointer';
            p.onclick = () => {
                if (guess[i] !== null) {
                    guess[i] = null;
                    paintGuess();
                }
            };
        });
    }
    function paintGuess() {
        const row = document.getElementById('row-' + rowIndex);
        if (!row)
            return;
        const pegs = row.querySelectorAll('.peg');
        pegs.forEach((p, i) => {
            const c = guess[i];
            p.style.background = c === null || c === undefined ? '' : PALETTE[c];
            p.style.borderColor = c === null || c === undefined ? '' : 'rgba(255,255,255,.25)';
        });
        q('#checkBtn').disabled = guess.indexOf(null) !== -1;
    }
    function place(colorIndex) {
        const empty = guess.indexOf(null);
        if (empty === -1)
            return;
        guess[empty] = colorIndex;
        paintGuess();
    }
    function submit() {
        if (guess.indexOf(null) !== -1)
            return;
        const g = guess;
        const res = score(g);
        const row = document.getElementById('row-' + rowIndex);
        const fbs = row.querySelectorAll('.fb i');
        let k = 0;
        for (let i = 0; i < res.exact; i++)
            fbs[k++].className = 'exact';
        for (let i = 0; i < res.near; i++)
            fbs[k++].className = 'near';
        if (res.exact === SLOTS) {
            win();
            return;
        }
        rowIndex++;
        guess = new Array(SLOTS).fill(null);
        if (rowIndex >= MAX_TRIES) {
            note('Code not broken. A new code has been set — try again.');
            secret = newSecret();
            rowIndex = 0;
            setTimeout(buildRows, 700);
            return;
        }
        refreshActive();
        note(res.exact + ' exact · ' + res.near + ' misplaced');
    }
    function refreshActive() {
        document.querySelectorAll('.grow').forEach((el) => el.classList.remove('active'));
        const row = document.getElementById('row-' + rowIndex);
        if (row)
            row.classList.add('active');
        bindActiveRow();
        paintGuess();
    }
    function note(msg) {
        const n = q('#note');
        if (n)
            n.textContent = msg;
    }
    function win() {
        if (solved)
            return;
        solved = true;
        try {
            localStorage.setItem('mm_solved', '1');
        }
        catch (e) { /* ignore */ }
        note('Unlocked.');
        setTimeout(() => {
            if (window.__atlasReveal)
                window.__atlasReveal();
        }, 450);
    }
    function init() {
        // Already opened before? Skip straight through.
        let done = false;
        try {
            done = localStorage.getItem('mm_solved') === '1';
        }
        catch (e) { /* ignore */ }
        if (done) {
            const g = document.getElementById('gate');
            if (g)
                g.setAttribute('hidden', '');
            if (window.__atlasReveal)
                window.__atlasReveal();
            return;
        }
        secret = newSecret();
        guess = new Array(SLOTS).fill(null);
        rowIndex = 0;
        buildRows();
        const pal = q('#palette');
        PALETTE.forEach((c, i) => {
            const b = document.createElement('button');
            b.className = 'sw';
            b.style.background = c;
            b.setAttribute('aria-label', 'colour ' + (i + 1));
            b.onclick = () => place(i);
            pal.appendChild(b);
        });
        q('#checkBtn').onclick = submit;
        q('#clearBtn').onclick = () => { guess = new Array(SLOTS).fill(null); paintGuess(); };
        paintGuess();
    }
    Gate.init = init;
})(Gate || (Gate = {}));
document.addEventListener('DOMContentLoaded', Gate.init);
