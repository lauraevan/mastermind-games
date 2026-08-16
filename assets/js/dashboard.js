/* dashboard.js — renders the learner's home base */
(function () {
  'use strict';
  if (!UI.requireAuth()) return;

  var user = Store.current();
  var p = Store.progress();
  var streak = Store.liveStreak();
  var firstName = user.name.split(' ')[0];

  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function el(id) { return document.getElementById(id); }

  // ---- greeting ----
  var hour = new Date().getHours();
  var timely = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  var cheers = ['Keep on going', 'You\'ve got this', 'Way to show up', 'Let\'s learn', 'Keep it up', 'Nice to see you'];
  var cheer = cheers[p.solved % cheers.length];
  el('greetTime').textContent = timely + ', ' + firstName + '!';
  el('greetCheer').innerHTML = cheer + ', <b>' + UI.esc(firstName) + '</b>! ' + (streak > 0 ? '🔥 You\'re on a ' + streak + '-day streak.' : 'Start a streak today.');
  el('avatar').textContent = user.avatar;
  el('gradeTag').textContent = 'Grade ' + user.grade;

  // ---- level / xp ----
  var level = p.level;
  var xpInto = p.xp - (level - 1) * 250;
  el('levelNum').textContent = level;
  el('xpText').textContent = xpInto + ' / 250 XP to level ' + (level + 1);
  el('xpBar').style.width = pct(xpInto, 250) + '%';
  el('coins').textContent = p.coins;

  // ---- top stat tiles ----
  el('statStreak').textContent = streak;
  el('statStreakBest').textContent = 'Best: ' + p.streak.best;
  el('statXP').textContent = p.xp;
  el('statAcc').textContent = pct(p.correct, p.solved) + '%';
  el('statAccSub').textContent = p.correct + ' / ' + p.solved + ' correct';
  var mastered = Object.keys(p.skills).filter(function (k) { return p.skills[k].mastery >= 100; }).length;
  el('statMastered').textContent = mastered;

  // ---- daily goal ring ----
  var done = Store.todaySolved();
  var goal = p.goalDaily;
  var ringPct = Math.min(100, pct(done, goal));
  var ring = el('goalRing');
  var C = 2 * Math.PI * 52;
  ring.style.strokeDasharray = C;
  ring.style.strokeDashoffset = C * (1 - ringPct / 100);
  el('goalText').textContent = done + '/' + goal;
  el('goalCaption').textContent = done >= goal ? 'Daily goal complete! 🎉' : (goal - done) + ' to reach today\'s goal';

  // ---- weekly activity chart ----
  var days = [];
  var map = {};
  p.history.forEach(function (h) { map[h.date] = h; });
  for (var i = 6; i >= 0; i--) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    days.push({ label: ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()], solved: (map[key] || {}).solved || 0 });
  }
  var maxV = Math.max(5, Math.max.apply(null, days.map(function (d) { return d.solved; })));
  var chart = el('weekChart');
  chart.innerHTML = days.map(function (d) {
    var hgt = Math.round(d.solved / maxV * 100);
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1">' +
      '<div style="width:100%;display:flex;align-items:flex-end;height:110px">' +
        '<div title="' + d.solved + ' problems" style="width:100%;border-radius:8px 8px 4px 4px;height:' + Math.max(6, hgt) + '%;background:' + (d.solved ? 'linear-gradient(180deg,#37c98a,#1e9e6a)' : '#eaeef5') + '"></div>' +
      '</div>' +
      '<div class="soft" style="font-weight:800;font-size:.78rem">' + d.label + '</div></div>';
  }).join('');

  // ---- subject progress ----
  var subWrap = el('subjectProgress');
  Problems.SUBJECTS.forEach(function (s) {
    var st = p.bySubject[s.id] || { solved: 0, correct: 0, xp: 0 };
    var acc = pct(st.correct, st.solved);
    var row = document.createElement('a');
    row.href = 'subjects/' + s.id + '.html';
    row.style.cssText = 'display:flex;align-items:center;gap:14px;padding:14px;border-radius:12px;text-decoration:none;color:inherit';
    row.onmouseover = function () { row.style.background = '#f6f8fc'; };
    row.onmouseout = function () { row.style.background = 'transparent'; };
    row.innerHTML =
      '<div style="width:44px;height:44px;border-radius:12px;flex:0 0 auto;display:grid;place-items:center;color:#fff;font-size:1.3rem;background:' + s.color + '">' + s.icon + '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="display:flex;justify-content:space-between;gap:8px"><b>' + s.name + '</b><span class="soft" style="font-weight:800;font-size:.85rem">' + st.solved + ' done · ' + acc + '%</span></div>' +
        '<div class="bar" style="margin-top:6px"><i style="width:' + Math.max(3, acc) + '%;background:' + s.color + '"></i></div>' +
      '</div><span class="soft" style="font-weight:900">→</span>';
    subWrap.appendChild(row);
  });

  // ---- recommended skills for the grade ----
  var recWrap = el('recommended');
  var recs = [];
  Problems.SUBJECTS.forEach(function (s) {
    Problems.skillsForGrade(s.id, user.grade).forEach(function (k) { recs.push({ s: s, k: k }); });
  });
  // prioritize skills not yet mastered
  recs.sort(function (a, b) {
    var ma = (p.skills[a.k.id] || {}).mastery || 0;
    var mb = (p.skills[b.k.id] || {}).mastery || 0;
    return ma - mb;
  });
  recs.slice(0, 6).forEach(function (r) {
    var m = (p.skills[r.k.id] || {}).mastery || 0;
    var a = document.createElement('a');
    a.href = 'subjects/' + r.s.id + '.html?skill=' + r.k.id;
    a.className = 'card';
    a.style.cssText = 'padding:16px;text-decoration:none;color:inherit;display:block';
    a.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">' +
      '<span style="width:34px;height:34px;border-radius:9px;display:grid;place-items:center;color:#fff;background:' + r.s.color + '">' + r.s.icon + '</span>' +
      '<span class="chip grey">' + r.s.name + '</span></div>' +
      '<b style="display:block;margin-bottom:8px">' + r.k.name + '</b>' +
      '<div class="bar"><i style="width:' + Math.max(3, m) + '%;background:' + r.s.color + '"></i></div>' +
      '<div class="soft" style="font-size:.8rem;font-weight:800;margin-top:6px">' + (m >= 100 ? 'Mastered ✓' : m > 0 ? m + '% mastery' : 'Not started') + '</div>';
    recWrap.appendChild(a);
  });

  // ---- achievements ----
  var achWrap = el('achievements');
  Store.ACHIEVEMENTS.forEach(function (a) {
    var got = p.achievements.indexOf(a.id) !== -1;
    var d = document.createElement('div');
    d.title = a.name + ' — ' + a.desc;
    d.style.cssText = 'text-align:center;padding:14px 8px;border-radius:12px;border:1px solid var(--line);background:' + (got ? '#fff' : '#f6f8fc') + ';opacity:' + (got ? '1' : '.5');
    d.innerHTML = '<div style="font-size:1.9rem;filter:' + (got ? 'none' : 'grayscale(1)') + '">' + a.icon + '</div>' +
      '<div style="font-weight:800;font-size:.82rem;margin-top:4px">' + a.name + '</div>' +
      '<div class="soft" style="font-size:.72rem">' + (got ? 'Unlocked' : 'Locked') + '</div>';
    achWrap.appendChild(d);
  });

  // ---- daily goal control ----
  var goalSel = el('goalSelect');
  if (goalSel) {
    goalSel.value = String(goal);
    goalSel.addEventListener('change', function () {
      Store.setGoal(parseInt(goalSel.value, 10));
      el('goalCaption').textContent = 'Goal updated to ' + goalSel.value + ' a day';
    });
  }

  // ---- grade switch ----
  var gradeSel = el('gradeSelect');
  if (gradeSel) {
    gradeSel.value = user.grade;
    gradeSel.addEventListener('change', function () {
      Store.setGrade(gradeSel.value);
      UI.toast('Grade set to ' + gradeSel.value, 'good');
      setTimeout(function () { location.reload(); }, 700);
    });
  }
})();
