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
    mount: function (opts) { opts = opts || {}; this.nav(opts.active); this.footer(); if (global.Icons) Icons.hydrate(); },

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
          '<div class="nav-right">' + right + '</div>' +
        '</div></div>' +
        '<div class="subnav"><div class="wrap subnav-in" id="subnav">' + subHTML + '</div></div>';

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
        '<span>Progress is saved on this device.</span>' +
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
