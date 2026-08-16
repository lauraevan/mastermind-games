/* ============================================================
   store.js — client-side accounts, progress & streaks
   Everything lives in localStorage; this is a front-end demo,
   so "passwords" are lightly hashed, not secure. No server.
   ============================================================ */
(function (global) {
  'use strict';

  var LS = global.localStorage;
  var USERS_KEY = 'mm_users';
  var SESSION_KEY = 'mm_session';

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
    users: function () { return read(USERS_KEY, {}); },

    signup: function (name, username, grade, password) {
      username = (username || '').trim().toLowerCase();
      name = (name || '').trim();
      if (!name || !username || !password) return { ok: false, error: 'Please fill in every field.' };
      if (username.length < 3) return { ok: false, error: 'Username must be at least 3 characters.' };
      var users = this.users();
      if (users[username]) return { ok: false, error: 'That username is already taken.' };
      users[username] = {
        name: name, username: username, grade: grade || 'K',
        pass: hash(password), avatar: pickAvatar(name), createdAt: Date.now()
      };
      write(USERS_KEY, users);
      write('mm_progress_' + username, blankProgress());
      LS.setItem(SESSION_KEY, username);
      return { ok: true, user: users[username] };
    },

    login: function (username, password) {
      username = (username || '').trim().toLowerCase();
      var users = this.users();
      var u = users[username];
      if (!u) return { ok: false, error: 'No account with that username.' };
      if (u.pass !== hash(password)) return { ok: false, error: 'Incorrect password.' };
      LS.setItem(SESSION_KEY, username);
      return { ok: true, user: u };
    },

    logout: function () { LS.removeItem(SESSION_KEY); },

    current: function () {
      var username = LS.getItem(SESSION_KEY);
      if (!username) return null;
      var u = this.users()[username];
      return u || null;
    },

    setGrade: function (grade) {
      var u = this.current(); if (!u) return;
      var users = this.users(); users[u.username].grade = grade; write(USERS_KEY, users);
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

      // per skill mastery
      var sk = p.skills[skillId] || { solved: 0, correct: 0, mastery: 0 };
      sk.solved += 1; if (correct) sk.correct += 1;
      // mastery drifts up on correct, down slightly on wrong (0..100)
      sk.mastery = Math.max(0, Math.min(100, sk.mastery + (correct ? 12 : -6)));
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
    { id: 'first', icon: '🌱', name: 'First Steps', desc: 'Answer your first question', test: function (p) { return p.solved >= 1; } },
    { id: 'ten', icon: '⚡', name: 'Warmed Up', desc: 'Answer 10 questions', test: function (p) { return p.solved >= 10; } },
    { id: 'fifty', icon: '🔥', name: 'On a Roll', desc: 'Answer 50 questions', test: function (p) { return p.solved >= 50; } },
    { id: 'hundred', icon: '💯', name: 'Century Club', desc: 'Answer 100 questions', test: function (p) { return p.solved >= 100; } },
    { id: 'sharp', icon: '🎯', name: 'Sharpshooter', desc: 'Get 25 correct answers', test: function (p) { return p.correct >= 25; } },
    { id: 'streak3', icon: '📅', name: '3-Day Streak', desc: 'Practice 3 days in a row', test: function (p) { return p.streak.count >= 3; } },
    { id: 'streak7', icon: '🏅', name: 'Week Warrior', desc: 'Practice 7 days in a row', test: function (p) { return p.streak.count >= 7; } },
    { id: 'level5', icon: '⭐', name: 'Rising Star', desc: 'Reach level 5', test: function (p) { return p.level >= 5; } },
    { id: 'explorer', icon: '🧭', name: 'Explorer', desc: 'Practice in 4 subjects', test: function (p) { return Object.keys(p.bySubject).length >= 4; } },
    { id: 'master', icon: '👑', name: 'Skill Master', desc: 'Fully master any skill', test: function (p) { return Object.keys(p.skills).some(function (k) { return p.skills[k].mastery >= 100; }); } }
  ];
  function evalAchievements(p) { return ACHIEVEMENTS.filter(function (a) { return a.test(p); }); }
  Store.ACHIEVEMENTS = ACHIEVEMENTS;

  var AVATARS = ['🦊', '🐼', '🦉', '🐨', '🐧', '🦁', '🐬', '🦄', '🐢', '🦋', '🐝', '🐙'];
  function pickAvatar(name) {
    var s = 0; for (var i = 0; i < name.length; i++) s += name.charCodeAt(i);
    return AVATARS[s % AVATARS.length];
  }

  // ---------- shared UI helpers ----------
  var UI = {
    requireAuth: function () {
      if (!Store.current()) { location.href = relBase() + 'login.html'; return false; }
      return true;
    },
    toast: function (msg, kind) {
      var host = document.querySelector('.toast-host');
      if (!host) { host = document.createElement('div'); host.className = 'toast-host'; document.body.appendChild(host); }
      var t = document.createElement('div');
      t.className = 'toast ' + (kind || '');
      t.textContent = msg;
      host.appendChild(t);
      setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2200);
      setTimeout(function () { t.remove(); }, 2600);
    },
    esc: function (s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  };

  // figure out relative path prefix (root vs /subjects/)
  function relBase() {
    return location.pathname.indexOf('/subjects/') !== -1 ? '../' : '';
  }
  UI.relBase = relBase;

  global.Store = Store;
  global.UI = UI;
})(window);
