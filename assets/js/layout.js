/* layout.js — green IXL-style top bar + subject icon row + footer. */
(function (global) {
  'use strict';
  var rel = UI.relBase();

  function logoSVG() {
    return '<svg class="logo" width="24" height="24" viewBox="0 0 32 32" aria-hidden="true">' +
      '<rect x="2" y="2" width="28" height="28" rx="8" fill="#5a4bd6"/>' +
      '<path d="M8 23V10l8 8 8-8v13" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }
  function ic(name, size) { return global.Icons ? Icons.icon(name, { size: size || 20 }) : ''; }

  function currentTheme() { try { return document.documentElement.getAttribute('data-theme') || localStorage.getItem('mm_theme') || 'light'; } catch (e) { return 'light'; } }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('mm_theme', t); } catch (e) {}
    var b = document.getElementById('themeBtn'); if (b) { b.innerHTML = ic(t === 'dark' ? 'sun' : 'moon', 18); b.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false'); }
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t === 'dark' ? '#161a2b' : '#4a3cc0';
  }

  // subject/section row — [key, href, label, icon, matchFiles]
  var SUB = [
    ['math', 'subjects/math.html', 'Math', 'calculator', ['math', 'algebra', 'geometry', 'calculus']],
    ['reading', 'subjects/reading.html', 'Language arts', 'book-open', ['reading']],
    ['science', 'subjects/science.html', 'Science', 'flask-conical', ['science']],
    ['social', 'subjects/history.html', 'Social studies', 'library', ['history', 'geography']],
    ['spanish', 'subjects/spanish.html', 'Spanish', 'globe', ['spanish']],
    ['library', 'library.html', 'Reading Room', 'book', ['library']],
    ['mathlab', 'mathlab.html', 'Math Lab', 'spline', ['mathlab']],
    ['speed', 'speed.html', 'Speed', 'timer', ['speed']],
    ['tests', 'tests.html', 'Assessments', 'clipboard-list', ['tests']],
    ['blog', 'blog.html', 'Journal', 'newspaper', ['blog']],
    ['awards', 'dashboard.html', 'Awards', 'award', []]
  ];

  function currentFile() {
    var p = location.pathname; var f = p.substring(p.lastIndexOf('/') + 1);
    return f.replace('.html', '') || 'index';
  }

  var Layout = {
    mount: function (opts) { opts = opts || {}; this.head(); this.nav(opts.active); this.footer(); if (global.Icons) Icons.hydrate(); },

    // Inject a favicon + browser theme color once, so every page gets them
    // without editing each <head>. Self-contained (data URI) — no server needed.
    head: function () {
      var head = document.head || document.getElementsByTagName('head')[0];
      if (!head) return;
      if (!document.querySelector('link[rel="icon"]')) {
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
          '<rect x="2" y="2" width="28" height="28" rx="8" fill="#5a4bd6"/>' +
          '<path d="M8 23V10l8 8 8-8v13" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
        var link = document.createElement('link');
        link.rel = 'icon'; link.type = 'image/svg+xml';
        link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
        head.appendChild(link);
      }
      if (!document.querySelector('meta[name="theme-color"]')) {
        var m = document.createElement('meta'); m.name = 'theme-color'; m.content = '#4a3cc0'; head.appendChild(m);
      }
      // ---- installable app (Add to Home Screen) ----
      function meta(name, content) { if (document.querySelector('meta[name="' + name + '"]')) return; var el = document.createElement('meta'); el.name = name; el.content = content; head.appendChild(el); }
      if (!document.querySelector('link[rel="manifest"]')) {
        var mf = document.createElement('link'); mf.rel = 'manifest'; mf.href = rel + 'manifest.webmanifest'; head.appendChild(mf);
      }
      if (!document.querySelector('link[rel="apple-touch-icon"]')) {
        var at = document.createElement('link'); at.rel = 'apple-touch-icon'; at.href = rel + 'assets/icons/apple-touch-icon.png'; head.appendChild(at);
      }
      meta('mobile-web-app-capable', 'yes');
      meta('apple-mobile-web-app-capable', 'yes');
      meta('apple-mobile-web-app-status-bar-style', 'black-translucent');
      meta('apple-mobile-web-app-title', 'Mastermind');
      if ('serviceWorker' in navigator && location.protocol === 'https:') {
        window.addEventListener('load', function () { navigator.serviceWorker.register(rel + 'sw.js').catch(function () {}); });
      }
    },

    nav: function (active) {
      var host = document.getElementById('nav'); if (!host) return;
      var user = Store.current();
      var cur = currentFile();
      var subj = global.SUBJECT_ID || null;

      var subHTML = SUB.map(function (s) {
        var on = (subj && s[4].indexOf(subj) !== -1) || s[4].indexOf(cur) !== -1 || (s[0] === active);
        return '<a href="' + rel + s[1] + '" class="' + (on ? 'on' : '') + '">' + ic(s[3], 20) + s[2] + '</a>';
      }).join('');

      var right;
      if (user) {
        right = '<a class="pilluser" href="' + rel + 'dashboard.html" style="text-decoration:none"><span class="av">' + UI.esc(user.avatar) + '</span>' + UI.esc(user.name.split(' ')[0]) + '</a>' +
          '<button class="btn ghost sm" id="logoutBtn">Sign out</button>';
      } else {
        right = '<a class="btn blue sm" href="' + rel + 'login.html">Sign in</a>';
      }

      host.className = 'nav';
      host.innerHTML =
        '<div class="nav-top"><div class="wrap nav-in">' +
          '<a class="brand" href="' + rel + 'index.html">' + logoSVG() + 'Master<b>mind</b></a>' +
          '<form class="navsearch" id="navSearch"><span class="mag">' + ic('search', 16) + '</span>' +
          '<input id="navQ" placeholder="Search topics, skills, and more" spellcheck="false" autocomplete="off">' +
          '<button class="go" type="submit" aria-label="Search">' + ic('arrow-right', 16) + '</button></form>' +
          '<button class="nav-toggle" id="navToggle" aria-label="Menu">' + ic('menu', 18) + '</button>' +
          '<div class="nav-right"><button class="theme-toggle" id="themeBtn" aria-label="Toggle dark mode" title="Toggle dark mode"></button>' + right + '</div>' +
        '</div></div>' +
        '<div class="subnav"><div class="wrap subnav-in" id="subnav">' + subHTML + '</div></div>';

      applyTheme(currentTheme());
      var tb = document.getElementById('themeBtn');
      if (tb) tb.addEventListener('click', function () { applyTheme(currentTheme() === 'dark' ? 'light' : 'dark'); });

      var lo = document.getElementById('logoutBtn');
      if (lo) lo.addEventListener('click', function () { Store.logout(); location.href = rel + 'index.html'; });
      var tg = document.getElementById('navToggle');
      if (tg) tg.addEventListener('click', function () { var sn = document.getElementById('subnav'); sn.style.flexWrap = sn.style.flexWrap === 'wrap' ? 'nowrap' : 'wrap'; });

      var form = document.getElementById('navSearch');
      if (form) form.addEventListener('submit', function (e) { e.preventDefault(); doSearch(document.getElementById('navQ').value); });

      if (global.Icons) Icons.hydrate(host);
    },

    footer: function () {
      var host = document.getElementById('footer'); if (!host) return;
      var year = new Date().getFullYear();
      host.className = 'footer';
      host.innerHTML = '<div class="wrap"><div class="foot-grid">' +
        '<div><div class="brand" style="box-shadow:none;padding:0;background:none;color:var(--brand-dark)">' + logoSVG() + 'Mastermind Academy</div>' +
        '<p class="muted small" style="max-width:38ch;margin-top:8px">A standards-aligned K-12 practice platform. Master skills at your own pace with interactive questions, helpful explanations, and motivating awards.</p></div>' +
        '<div><h5>Learn</h5><ul>' +
        '<li><a href="' + rel + 'subjects/math.html">Math</a></li>' +
        '<li><a href="' + rel + 'subjects/reading.html">Language arts</a></li>' +
        '<li><a href="' + rel + 'subjects/science.html">Science</a></li>' +
        '<li><a href="' + rel + 'mathlab.html">Math Lab</a></li></ul></div>' +
        '<div><h5>Practice</h5><ul>' +
        '<li><a href="' + rel + 'speed.html">Speed Drills</a></li>' +
        '<li><a href="' + rel + 'tests.html">Assessments</a></li>' +
        '<li><a href="' + rel + 'dashboard.html">Dashboard</a></li>' +
        '<li><a href="' + rel + 'blog.html">Student Journal</a></li></ul></div>' +
        '<div><h5>Academy</h5><ul>' +
        '<li><a href="' + rel + 'about.html">About</a></li>' +
        '<li><a href="' + rel + 'about.html#faq">Help &amp; FAQ</a></li>' +
        '<li><a href="' + rel + 'index.html">Privacy</a></li>' +
        '<li><a href="' + rel + 'index.html">Terms</a></li></ul></div>' +
        '</div><div class="foot-bottom">' +
        '<span>&copy; ' + year + ' Mastermind Academy. Practice makes progress.</span>' +
        '<span>' + ((Store.serverMode && Store.serverMode()) ? 'Signed-in progress syncs to your account.' : 'Progress is saved in this browser.') + '</span>' +
        '</div></div>';
      if (global.Icons) Icons.hydrate(host);
    }
  };

  function doSearch(q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return;
    if (global.Problems) {
      // match a skill first, then a subject
      var hitSkill = null, hitSub = null;
      Problems.SUBJECTS.forEach(function (s) {
        if (!hitSub && s.name.toLowerCase().indexOf(q) !== -1) hitSub = s;
        s.skills.forEach(function (k) { if (!hitSkill && k.name.toLowerCase().indexOf(q) !== -1) hitSkill = { s: s, k: k }; });
      });
      if (hitSkill) { location.href = rel + 'subjects/' + hitSkill.s.id + '.html?skill=' + hitSkill.k.id; return; }
      if (hitSub) { location.href = rel + 'subjects/' + hitSub.id + '.html'; return; }
    }
    location.href = rel + 'index.html#subjects';
  }

  global.Layout = Layout;
})(window);
