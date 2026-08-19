/* ============================================================
   store.js — accounts, progress & streaks.
   When an API is available (the site is served by the Node
   server, or window.MM_API is set) real accounts are used:
   passwords are hashed server-side with scrypt, sessions are
   JWTs, and progress syncs across devices. On a plain static
   host (e.g. githack) it falls back to a local-only demo mode.
   ============================================================ */
(function (global) {
  'use strict';

  // Apply the saved theme as early as possible to avoid a flash of the wrong mode.
  try { var _th = global.localStorage.getItem('mm_theme'); if (_th === 'dark' || _th === 'light') document.documentElement.setAttribute('data-theme', _th); } catch (e) {}

  var LS = global.localStorage;
  var USERS_KEY = 'mm_users';
  var SESSION_KEY = 'mm_session';
  var TOKEN_KEY = 'mm_token';
  var USER_KEY = 'mm_user';

  // Where the API lives. Same-origin /api when served by our server;
  // empty (local-only) on file:// and known static hosts.
  var API = (function () {
    if (typeof global.MM_API === 'string') return global.MM_API;
    if (location.protocol === 'file:') return '';
    var h = location.host || '';
    if (/githack|github\.io|githubusercontent/i.test(h)) return '';
    return location.origin + '/api';
  })();
  function serverMode() { return !!API; }
  function apiReq(method, p, body) {
    var headers = { 'Content-Type': 'application/json' };
    var tk = LS.getItem(TOKEN_KEY); if (tk) headers['Authorization'] = 'Bearer ' + tk;
    return fetch(API + p, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { status: res.status, body: j }; }); });
  }
  // Debounced push of progress to the server.
  var pushTimer = null, pushPayload = null;
  function schedulePush(p) {
    if (!serverMode()) return;
    pushPayload = p; clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { apiReq('PUT', '/progress', { progress: pushPayload }).catch(function () {}); }, 1200);
  }

  function read(key, fallback) {
    try { var v = LS.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function write(key, val) { LS.setItem(key, JSON.stringify(val)); }

  // Tiny non-secure hash (demo only).
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return ('00000000' + h.toString(16)).slice(-8);
  }

  // IXL-style SmartScore update.
  function smartScore(cur, correct) {
    cur = cur || 0;
    if (correct) {
      var inc = cur < 40 ? 12 : cur < 70 ? 8 : cur < 85 ? 5 : cur < 95 ? 3 : cur < 99 ? 2 : 1;
      return Math.min(100, cur + inc);
    }
    var dec = cur < 40 ? 5 : cur < 70 ? 10 : cur < 90 ? 15 : 20;
    return Math.max(0, cur - dec);
  }

  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function daysBetween(a, b) {
    var ms = 24 * 3600 * 1000;
    var da = new Date(a), db = new Date(b);
    da.setHours(0, 0, 0, 0); db.setHours(0, 0, 0, 0);
    return Math.round((db - da) / ms);
  }

  function blankProgress() {
    return {
      xp: 0, coins: 25, level: 1,
      solved: 0, correct: 0,
      streak: { count: 0, best: 0, last: null },
      bySubject: {},
      skills: {},
      achievements: [],
      history: [],          // [{date, solved, correct}]
      goalDaily: 20,
      createdAt: Date.now()
    };
  }

  var Store = {
    // ---- accounts ----
    serverMode: serverMode,
    users: function () { return read(USERS_KEY, {}); },

    // signup/login return a Promise resolving to { ok, user } or { ok:false, error }.
    signup: function (name, username, grade, password) {
      var self = this;
      name = (name || '').trim(); username = (username || '').trim().toLowerCase();
      if (serverMode()) {
        return apiReq('POST', '/signup', { name: name, username: username, grade: grade || 'K', password: password })
          .then(function (r) {
            if (r.status === 200) return self._onAuth(r.body);
            if (r.status === 404 || r.status === 0) return self._localSignup(name, username, grade, password); // no API here → local
            return { ok: false, error: (r.body && r.body.error) || 'Sign up failed.' };
          })
          .catch(function () { return self._localSignup(name, username, grade, password); });
      }
      return Promise.resolve(self._localSignup(name, username, grade, password));
    },
    _localSignup: function (name, username, grade, password) {
      if (!name || !username || !password) return { ok: false, error: 'Please fill in every field.' };
      if (username.length < 3) return { ok: false, error: 'Username must be at least 3 characters.' };
      if ((password || '').length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
      var users = this.users();
      if (users[username]) return { ok: false, error: 'That username is already taken.' };
      users[username] = { name: name, username: username, grade: grade || 'K', pass: hash(password), avatar: pickAvatar(name), createdAt: Date.now() };
      write(USERS_KEY, users);
      write('mm_progress_' + username, blankProgress());
      write(USER_KEY, users[username]); LS.setItem(SESSION_KEY, username);
      return { ok: true, user: users[username] };
    },

    login: function (username, password) {
      var self = this;
      username = (username || '').trim().toLowerCase();
      if (serverMode()) {
        return apiReq('POST', '/login', { username: username, password: password })
          .then(function (r) {
            if (r.status === 200) return self._onAuth(r.body);
            if (r.status === 404 || r.status === 0) return self._localLogin(username, password); // no API here → local
            return { ok: false, error: (r.body && r.body.error) || 'Sign in failed.' };
          })
          .catch(function () { return self._localLogin(username, password); });
      }
      return Promise.resolve(self._localLogin(username, password));
    },
    _localLogin: function (username, password) {
      var users = this.users(); var u = users[username];
      if (!u) return { ok: false, error: 'No account with that username.' };
      if (u.pass !== hash(password)) return { ok: false, error: 'Incorrect password.' };
      write(USER_KEY, u); LS.setItem(SESSION_KEY, username);
      return { ok: true, user: u };
    },
    // Store token + user and pull server-side progress into the local cache.
    _onAuth: function (body) {
      LS.setItem(TOKEN_KEY, body.token);
      write(USER_KEY, body.user);
      LS.setItem(SESSION_KEY, body.user.username);
      var key = 'mm_progress_' + body.user.username;
      return apiReq('GET', '/progress').then(function (r) {
        if (r.status === 200 && r.body.progress) write(key, r.body.progress);
        else if (!read(key, null)) write(key, blankProgress());
        return { ok: true, user: body.user };
      }).catch(function () { if (!read(key, null)) write(key, blankProgress()); return { ok: true, user: body.user }; });
    },

    logout: function () { LS.removeItem(TOKEN_KEY); LS.removeItem(USER_KEY); LS.removeItem(SESSION_KEY); },

    current: function () { return read(USER_KEY, null); },

    setGrade: function (grade) {
      var u = this.current(); if (!u) return;
      u.grade = grade; write(USER_KEY, u);
      var users = this.users(); if (users[u.username]) { users[u.username].grade = grade; write(USERS_KEY, users); }
      if (serverMode()) apiReq('PUT', '/grade', { grade: grade }).catch(function () {});
    },

    // ---- progress ----
    progress: function () {
      var u = this.current(); if (!u) return blankProgress();
      var p = read('mm_progress_' + u.username, null);
      if (!p) { p = blankProgress(); write('mm_progress_' + u.username, p); }
      return p;
    },
    saveProgress: function (p) {
      var u = this.current(); if (!u) return;
      write('mm_progress_' + u.username, p);
      schedulePush(p);
    },

    // Record one answered question. Returns updated progress + events.
    record: function (subjectId, skillId, correct, xpGain) {
      var p = this.progress();
      var events = { leveledUp: false, streakUp: false, achievements: [] };
      xpGain = xpGain || (correct ? 10 : 2);

      p.solved += 1;
      if (correct) { p.correct += 1; p.coins += 2; }
      p.xp += xpGain;

      // per subject
      var s = p.bySubject[subjectId] || { solved: 0, correct: 0, xp: 0 };
      s.solved += 1; if (correct) s.correct += 1; s.xp += xpGain;
      p.bySubject[subjectId] = s;

      // per-skill SmartScore (IXL-style): rises with correct answers but the
      // gains shrink near 100 (true mastery needs a run of correct answers),
      // and a wrong answer costs more the closer you are to mastery.
      var sk = p.skills[skillId] || { solved: 0, correct: 0, mastery: 0 };
      sk.solved += 1; if (correct) sk.correct += 1;
      sk.mastery = smartScore(sk.mastery || 0, correct);
      p.skills[skillId] = sk;

      // level
      var newLevel = 1 + Math.floor(p.xp / 250);
      if (newLevel > p.level) { p.level = newLevel; events.leveledUp = true; p.coins += 20; }

      // streak (once per day when you practice)
      var tk = todayKey();
      if (p.streak.last !== tk) {
        var gap = p.streak.last ? daysBetween(p.streak.last, new Date()) : 1;
        if (p.streak.last && gap === 1) p.streak.count += 1;
        else p.streak.count = 1;
        p.streak.last = tk;
        p.streak.best = Math.max(p.streak.best, p.streak.count);
        events.streakUp = true;
      }

      // daily history
      var todayRow = p.history[p.history.length - 1];
      if (!todayRow || todayRow.date !== tk) {
        todayRow = { date: tk, solved: 0, correct: 0 };
        p.history.push(todayRow);
        if (p.history.length > 60) p.history.shift();
      }
      todayRow.solved += 1; if (correct) todayRow.correct += 1;

      // achievements
      var newAch = evalAchievements(p);
      newAch.forEach(function (a) {
        if (p.achievements.indexOf(a.id) === -1) { p.achievements.push(a.id); events.achievements.push(a); p.coins += 10; }
      });

      this.saveProgress(p);
      return { progress: p, events: events };
    },

    setGoal: function (n) { var p = this.progress(); p.goalDaily = n; this.saveProgress(p); },

    // Adjust streak's live view: if user skipped a day, reflect broken streak.
    liveStreak: function () {
      var p = this.progress();
      if (!p.streak.last) return 0;
      var gap = daysBetween(p.streak.last, new Date());
      if (gap > 1) return 0;          // streak lapsed
      return p.streak.count;
    },

    todaySolved: function () {
      var p = this.progress();
      var tk = todayKey();
      var row = p.history[p.history.length - 1];
      return (row && row.date === tk) ? row.solved : 0;
    }
  };

  // ---------- achievements ----------
  var ACHIEVEMENTS = [
    { id: 'first', icon: 'star', name: 'First Steps', desc: 'Answer your first question', test: function (p) { return p.solved >= 1; } },
    { id: 'ten', icon: 'zap', name: 'Warmed Up', desc: 'Answer 10 questions', test: function (p) { return p.solved >= 10; } },
    { id: 'fifty', icon: 'flame', name: 'On a Roll', desc: 'Answer 50 questions', test: function (p) { return p.solved >= 50; } },
    { id: 'hundred', icon: 'award', name: 'Century Club', desc: 'Answer 100 questions', test: function (p) { return p.solved >= 100; } },
    { id: 'sharp', icon: 'target', name: 'Sharpshooter', desc: 'Get 25 correct answers', test: function (p) { return p.correct >= 25; } },
    { id: 'streak3', icon: 'calendar', name: '3-Day Streak', desc: 'Practice 3 days in a row', test: function (p) { return p.streak.count >= 3; } },
    { id: 'streak7', icon: 'flame', name: 'Week Warrior', desc: 'Practice 7 days in a row', test: function (p) { return p.streak.count >= 7; } },
    { id: 'level5', icon: 'trending-up', name: 'Steady Climber', desc: 'Reach level 5', test: function (p) { return p.level >= 5; } },
    { id: 'explorer', icon: 'globe', name: 'Well Rounded', desc: 'Practice in 4 subjects', test: function (p) { return Object.keys(p.bySubject).length >= 4; } },
    { id: 'master', icon: 'trophy', name: 'Skill Mastery', desc: 'Fully master any skill', test: function (p) { return Object.keys(p.skills).some(function (k) { return p.skills[k].mastery >= 100; }); } }
  ];
  function evalAchievements(p) { return ACHIEVEMENTS.filter(function (a) { return a.test(p); }); }
  Store.ACHIEVEMENTS = ACHIEVEMENTS;

  function pickAvatar(name) {
    var parts = name.trim().split(/\s+/);
    var a = (parts[0] || '')[0] || '';
    var b = parts.length > 1 ? (parts[parts.length - 1][0] || '') : '';
    return (a + b).toUpperCase();
  }

  // ---------- shared UI helpers ----------
  var UI = {
    requireAuth: function () {
      if (!Store.current()) { location.href = relBase() + 'login.html'; return false; }
      return true;
    },
    toast: function (msg, kind, iconName) {
      var host = document.querySelector('.toast-host');
      if (!host) { host = document.createElement('div'); host.className = 'toast-host'; document.body.appendChild(host); }
      var t = document.createElement('div');
      t.className = 'toast ' + (kind || '');
      var ico = (iconName && global.Icons) ? Icons.icon(iconName, { size: 16 }) : '';
      t.innerHTML = ico + '<span></span>';
      t.querySelector('span').textContent = msg;
      host.appendChild(t);
      setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2400);
      setTimeout(function () { t.remove(); }, 2800);
    },
    esc: function (s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  };

  // figure out relative path prefix (root vs one-level subdirectory)
  function relBase() {
    var p = location.pathname;
    var subs = ['/subjects/', '/blog/', '/learnify/'];
    for (var i = 0; i < subs.length; i++) if (p.indexOf(subs[i]) !== -1) return '../';
    return '';
  }
  UI.relBase = relBase;

  global.Store = Store;
  global.UI = UI;
})(window);
