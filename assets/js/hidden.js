/* hidden.js — quiet entry hook. Included on question pages.
   Typing the four digits 1-3-1-3 while working opens the enrichment area. */
(function () {
  'use strict';
  var rel = (window.UI && UI.relBase) ? UI.relBase() : '';
  var buf = '';
  document.addEventListener('keydown', function (e) {
    if (!e.key || e.key.length !== 1) return;
    buf = (buf + e.key).slice(-6);
    if (buf.indexOf('1313') !== -1) {
      buf = '';
      try { localStorage.setItem('lf', '1'); } catch (err) {}
      location.href = rel + 'assets/vendor/px/index.html';
    }
  });
})();
