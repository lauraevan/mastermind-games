/* ============================================================
   secret.js — the layered back-room protocol.
   Four gates stand between a normal visitor and the Atlas:
     1. A classic key sequence  (↑ ↑ ↓ ↓ ← → ← → b a)
     2. Reveal & press the hidden seal in the footer (×3)
     3. Enter the passphrase into the seal's field
     4. (on the Atlas page) break the four-colour code
   Nothing here names what waits at the end.
   ============================================================ */
(function (global) {
  'use strict';

  var LS = global.localStorage;
  var rel = (typeof UI !== 'undefined' && UI.relBase) ? UI.relBase() : '';
  var atlas = rel + 'atlas/index.html';

  // FNV-1a hash so the passphrase isn't sitting in plain sight.
  function h(str) {
    var x = 2166136261;
    for (var i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = (x * 16777619) >>> 0; }
    return x.toString(16);
  }
  var PASS_HASH = h('mastermind');   // the key that opens gate 3

  // ---- Gate 1: the sequence ----
  var SEQ = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
  var pos = 0;
  document.addEventListener('keydown', function (e) {
    pos = (e.keyCode === SEQ[pos]) ? pos + 1 : (e.keyCode === SEQ[0] ? 1 : 0);
    if (pos === SEQ.length) { pos = 0; unlock1(); }
  });

  function unlock1() {
    LS.setItem('mm_k1', '1');
    revealSeal();
    flashSeal();
  }

  // ---- Gate 2: the footer seal ----
  var clickCount = 0, clickTimer = null;
  function revealSeal() {
    var seal = document.getElementById('mm-seal');
    if (!seal || seal.dataset.on === '1') return;
    seal.dataset.on = '1';
    seal.textContent = ' ◈';
    seal.style.cursor = 'default';
    seal.style.opacity = '.35';
    seal.style.transition = 'opacity .4s, color .3s';
    seal.style.marginLeft = '2px';
    seal.setAttribute('title', '');
    seal.addEventListener('click', onSealClick);
  }
  function flashSeal() {
    var seal = document.getElementById('mm-seal');
    if (!seal) return;
    seal.style.color = 'var(--brand)';
    seal.style.opacity = '1';
    setTimeout(function () { seal.style.opacity = '.35'; seal.style.color = 'inherit'; }, 900);
  }
  function onSealClick() {
    clickCount++;
    clearTimeout(clickTimer);
    clickTimer = setTimeout(function () { clickCount = 0; }, 900);
    if (clickCount >= 3) { clickCount = 0; LS.setItem('mm_k2', '1'); showField(); }
  }

  // ---- Gate 3: the passphrase field ----
  function showField() {
    var seal = document.getElementById('mm-seal');
    if (!seal || document.getElementById('mm-field')) return;
    var box = document.createElement('span');
    box.id = 'mm-field';
    box.style.marginLeft = '8px';
    box.innerHTML = '<input aria-label="cipher" spellcheck="false" autocomplete="off" ' +
      'style="font-family:monospace;font-size:.8rem;width:120px;padding:2px 8px;border-radius:8px;' +
      'border:1px solid var(--line);background:#fff;color:var(--ink);letter-spacing:2px" placeholder="· · · · · · ·">';
    seal.parentNode.appendChild(box);
    var input = box.querySelector('input');
    input.focus();
    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      if (h(input.value.trim().toLowerCase()) === PASS_HASH) {
        LS.setItem('mm_pass', '1');
        input.style.borderColor = 'var(--brand)';
        input.value = '';
        input.placeholder = '◈ ◈ ◈';
        setTimeout(function () { location.href = atlas; }, 350);
      } else {
        input.style.borderColor = '#e5484d';
        input.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 180 });
      }
    });
  }

  // On load: if gate 1 already passed in a previous visit, keep the seal visible.
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (LS.getItem('mm_k1') === '1') revealSeal();
      if (LS.getItem('mm_k2') === '1') showField();
    }, 60);
  });

  // A faint breadcrumb for the truly curious (console only).
  try {
    console.log('%cMastermind Academy', 'color:#1e9e6a;font-weight:900;font-size:16px');
    console.log('%c"Every academy keeps a back room. The old keys still work, and the seal remembers three."',
      'color:#8a95a8;font-style:italic');
  } catch (e) {}

  // expose the hash helper for the Atlas gate to reuse
  global.__mmHash = h;
})(window);
