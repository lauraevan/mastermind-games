/* hidden.js — quiet entry hook. Included on question pages.
   Typing 1-3-1-3 while working opens a review page. The rest of the
   path (a hidden corner box, then a second code) continues from there. */
(function () {
  'use strict';
  var rel = (window.UI && UI.relBase) ? UI.relBase() : '';
  var buf = '';
  document.addEventListener('keydown', function (e) {
    if (!e.key || e.key.length !== 1) return;
    buf = (buf + e.key).slice(-6);
    if (buf.indexOf('1313') !== -1) {
      buf = '';
      try { sessionStorage.setItem('qx', '1'); } catch (err) {}   // stage-1 marker
      location.href = rel + 'assets/vendor/px/qw.html';
    }
  });
})();
