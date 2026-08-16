/* ============================================================
   layout.js — shared nav + footer, injected into every page.
   Keeps the header/footer consistent and auth-aware.
   ============================================================ */
(function (global) {
  'use strict';
  var rel = UI.relBase();

  function logoSVG() {
    return '<svg class="logo" viewBox="0 0 48 48" aria-hidden="true">' +
      '<defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#1e9e6a"/><stop offset="1" stop-color="#37c98a"/></linearGradient></defs>' +
      '<rect x="3" y="3" width="42" height="42" rx="12" fill="url(#lg)"/>' +
      '<circle cx="16" cy="17" r="4" fill="#fff"/><circle cx="32" cy="17" r="4" fill="#bff3dc"/>' +
      '<circle cx="16" cy="31" r="4" fill="#bff3dc"/><circle cx="32" cy="31" r="4" fill="#fff"/></svg>';
  }

  var Layout = {
    mount: function (opts) {
      opts = opts || {};
      this.nav(opts.active);
      this.footer();
    },

    nav: function (active) {
      var host = document.getElementById('nav');
      if (!host) return;
      var user = Store.current();
      var links = [
        ['home', rel + 'index.html', 'Home'],
        ['subjects', rel + 'index.html#subjects', 'Subjects'],
        ['grades', rel + 'index.html#grades', 'Grade Levels'],
        ['about', rel + 'index.html#how', 'How It Works']
      ];
      var linkHTML = links.map(function (l) {
        return '<a href="' + l[1] + '"' + (active === l[0] ? ' style="color:var(--brand-dark);background:var(--brand-light)"' : '') + '>' + l[2] + '</a>';
      }).join('');

      var right;
      if (user) {
        right = '<a class="pill" href="' + rel + 'dashboard.html" style="text-decoration:none">' +
          '<span style="font-size:1.15rem">' + user.avatar + '</span> ' + UI.esc(user.name.split(' ')[0]) + '</a>' +
          '<button class="btn ghost" id="logoutBtn">Log out</button>';
      } else {
        right = '<a class="btn ghost" href="' + rel + 'login.html">Log in</a>' +
          '<a class="btn" href="' + rel + 'login.html#signup">Sign up free</a>';
      }

      host.className = 'nav';
      host.innerHTML = '<div class="wrap nav-in">' +
        '<a class="brand" href="' + rel + 'index.html" id="brandLink">' + logoSVG() + 'Master<b>mind</b></a>' +
        '<nav class="nav-links">' + linkHTML + '</nav>' +
        '<div class="nav-spacer"></div>' +
        '<div class="nav-right">' + right + '</div>' +
        '</div>';

      var lo = document.getElementById('logoutBtn');
      if (lo) lo.addEventListener('click', function () { Store.logout(); location.href = rel + 'index.html'; });
    },

    footer: function () {
      var host = document.getElementById('footer');
      if (!host) return;
      var year = new Date().getFullYear();
      host.className = 'footer';
      host.innerHTML = '<div class="wrap"><div class="foot-grid">' +
        '<div><div class="brand" style="font-size:1.15rem;margin-bottom:10px">' + logoSVG() + 'Master<b>mind</b></div>' +
        '<p class="soft" style="max-width:34ch">Personalized K-12 practice in math, reading, languages and science. Learn a little every day.</p></div>' +
        '<div><h5>Learn</h5><ul>' +
        '<li><a href="' + rel + 'index.html#subjects">Subjects</a></li>' +
        '<li><a href="' + rel + 'index.html#grades">Grade levels</a></li>' +
        '<li><a href="' + rel + 'dashboard.html">Dashboard</a></li></ul></div>' +
        '<div><h5>Company</h5><ul>' +
        '<li><a href="' + rel + 'index.html#how">How it works</a></li>' +
        '<li><a href="' + rel + 'index.html#families">For families</a></li>' +
        '<li><a href="' + rel + 'login.html">Sign in</a></li></ul></div>' +
        '<div><h5>Support</h5><ul>' +
        '<li><a href="' + rel + 'index.html#faq">Help center</a></li>' +
        '<li><a href="' + rel + 'index.html">Privacy</a></li>' +
        '<li><a href="' + rel + 'index.html">Terms</a></li></ul></div>' +
        '</div><div class="foot-bottom">' +
        '<span>© ' + year + ' Mastermind Academy. Practice makes progress.<span id="mm-seal" aria-hidden="true"></span></span>' +
        '<span>Made for curious learners everywhere.</span>' +
        '</div></div>';
    }
  };

  global.Layout = Layout;
})(window);
