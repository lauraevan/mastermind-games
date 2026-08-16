/* layout.js — shared nav + footer, injected on every page. Auth-aware. */
(function (global) {
  'use strict';
  var rel = UI.relBase();

  function logoSVG() {
    return '<svg class="logo" width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">' +
      '<rect x="1.5" y="1.5" width="29" height="29" rx="3" fill="none" stroke="#2b3d5c" stroke-width="1.5"/>' +
      '<path d="M7 22V10l5 7 5-7v12" fill="none" stroke="#2b3d5c" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<line x1="21" y1="10" x2="21" y2="22" stroke="#2b3d5c" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="21" y1="16" x2="25.5" y2="16" stroke="#8b9099" stroke-width="2" stroke-linecap="round"/></svg>';
  }
  function ic(name) { return (global.Icons ? Icons.icon(name, { size: 15 }) : ''); }

  var NAV = [
    ['subjects', 'index.html#subjects', 'Subjects', 'book-open'],
    ['mathlab', 'mathlab.html', 'Math Lab', 'calculator'],
    ['speed', 'speed.html', 'Speed Drills', 'timer'],
    ['tests', 'tests.html', 'Assessments', 'clipboard-list'],
    ['blog', 'blog.html', 'Journal', 'newspaper']
  ];

  var Layout = {
    mount: function (opts) { opts = opts || {}; this.nav(opts.active); this.footer(); if (global.Icons) Icons.hydrate(); },

    nav: function (active) {
      var host = document.getElementById('nav'); if (!host) return;
      var user = Store.current();
      var links = NAV.map(function (l) {
        return '<a href="' + rel + l[1] + '" class="' + (active === l[0] ? 'on' : '') + '">' + ic(l[3]) + l[2] + '</a>';
      });
      if (user) links.unshift('<a href="' + rel + 'dashboard.html" class="' + (active === 'dashboard' ? 'on' : '') + '">' + ic('layout-dashboard') + 'Dashboard</a>');
      var linkHTML = links.join('');

      var right;
      if (user) {
        right = '<a class="btn subtle sm" href="' + rel + 'dashboard.html">' + ic('user') + UI.esc(user.name.split(' ')[0]) + '</a>' +
          '<button class="btn ghost sm" id="logoutBtn">' + ic('log-out') + 'Sign out</button>';
      } else {
        right = '<a class="btn ghost sm" href="' + rel + 'login.html">Log in</a>' +
          '<a class="btn sm" href="' + rel + 'login.html#signup">Create account</a>';
      }

      host.className = 'nav';
      host.innerHTML = '<div class="wrap nav-in">' +
        '<a class="brand" href="' + rel + 'index.html">' + logoSVG() + 'Mastermind<span style="color:var(--muted);font-weight:400">&nbsp;Academy</span></a>' +
        '<button class="nav-toggle" id="navToggle" aria-label="Menu">' + ic('menu') + '</button>' +
        '<nav class="nav-links" id="navLinks">' + linkHTML + '</nav>' +
        '<div class="nav-spacer"></div>' +
        '<div class="nav-right">' + right + '</div>' +
        '</div>';

      var lo = document.getElementById('logoutBtn');
      if (lo) lo.addEventListener('click', function () { Store.logout(); location.href = rel + 'index.html'; });
      var tg = document.getElementById('navToggle');
      if (tg) tg.addEventListener('click', function () { document.getElementById('navLinks').classList.toggle('open'); });
      if (global.Icons) Icons.hydrate(host);
    },

    footer: function () {
      var host = document.getElementById('footer'); if (!host) return;
      var year = new Date().getFullYear();
      host.className = 'footer';
      host.innerHTML = '<div class="wrap"><div class="foot-grid">' +
        '<div><div class="brand" style="font-size:1.05rem;margin-bottom:10px">' + logoSVG() + 'Mastermind Academy</div>' +
        '<p class="muted small" style="max-width:38ch">A standards-aligned practice platform for students in kindergarten through grade 12. Diagnostic practice, timed drills, and assessments across core subjects.</p></div>' +
        '<div><h5>Practice</h5><ul>' +
        '<li><a href="' + rel + 'index.html#subjects">Subjects</a></li>' +
        '<li><a href="' + rel + 'mathlab.html">Math Lab</a></li>' +
        '<li><a href="' + rel + 'speed.html">Speed Drills</a></li>' +
        '<li><a href="' + rel + 'tests.html">Assessments</a></li></ul></div>' +
        '<div><h5>Academy</h5><ul>' +
        '<li><a href="' + rel + 'blog.html">Student Journal</a></li>' +
        '<li><a href="' + rel + 'about.html">About</a></li>' +
        '<li><a href="' + rel + 'index.html#grades">Grade levels</a></li>' +
        '<li><a href="' + rel + 'dashboard.html">Dashboard</a></li></ul></div>' +
        '<div><h5>Support</h5><ul>' +
        '<li><a href="' + rel + 'about.html#faq">Help &amp; FAQ</a></li>' +
        '<li><a href="' + rel + 'index.html">Accessibility</a></li>' +
        '<li><a href="' + rel + 'index.html">Privacy policy</a></li>' +
        '<li><a href="' + rel + 'index.html">Terms of use</a></li></ul></div>' +
        '</div><div class="foot-bottom">' +
        '<span>&copy; ' + year + ' Mastermind Academy. All rights reserved.</span>' +
        '<span>Student progress is stored locally on this device.</span>' +
        '</div></div>';
      if (global.Icons) Icons.hydrate(host);
    }
  };

  global.Layout = Layout;
})(window);
