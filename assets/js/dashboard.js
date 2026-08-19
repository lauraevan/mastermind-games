/* dashboard.js — learner home (v2) */
(function () {
  'use strict';
  if (!UI.requireAuth()) return;

  var user = Store.current();
  var p = Store.progress();
  var streak = Store.liveStreak();
  var firstName = user.name.split(' ')[0];
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function el(id) { return document.getElementById(id); }
  function ic(n, o) { return window.Icons ? Icons.icon(n, o || {}) : ''; }

  var hour = new Date().getHours();
  el('greetTime').textContent = (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening') + ', ' + firstName;
  el('greetCheer').innerHTML = ic('flame', { size: 15 }) + '<span>Keep going, <b>' + UI.esc(firstName) + '</b>. ' +
    (streak > 0 ? 'You are on a ' + streak + '-day streak — don\'t break it.' : 'Start a streak today.') + '</span>';
  el('avatar').textContent = user.avatar;

  var level = p.level, xpInto = p.xp - (level - 1) * 250;
  el('levelNum').textContent = level;
  el('xpText').textContent = xpInto + ' / 250 XP to level ' + (level + 1);
  el('xpBar').style.width = pct(xpInto, 250) + '%';
  el('coins').textContent = p.coins + ' credits';

  el('statStreak').textContent = streak;
  el('statStreakBest').textContent = 'Best: ' + p.streak.best + ' days';
  el('statXP').textContent = p.xp;
  el('statAcc').textContent = pct(p.correct, p.solved) + '%';
  el('statAccSub').textContent = p.correct + ' / ' + p.solved + ' correct';
  el('statMastered').textContent = Object.keys(p.skills).filter(function (k) { return p.skills[k].mastery >= 100; }).length;

  var done = Store.todaySolved(), goal = p.goalDaily;
  var ringPct = Math.min(100, pct(done, goal));
  var ring = el('goalRing'), C = 2 * Math.PI * 48;
  ring.style.strokeDasharray = C;
  ring.style.strokeDashoffset = C * (1 - ringPct / 100);
  el('goalText').textContent = done + '/' + goal;
  el('goalCaption').textContent = done >= goal ? 'Daily goal met.' : (goal - done) + ' more to reach today\'s goal';

  // weekly chart
  var map = {};
  p.history.forEach(function (h) { map[h.date] = h; });
  var days = [];
  for (var i = 6; i >= 0; i--) { var d = new Date(); d.setDate(d.getDate() - i); var key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); days.push({ label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()], solved: (map[key] || {}).solved || 0 }); }
  var maxV = Math.max(5, Math.max.apply(null, days.map(function (d) { return d.solved; })));
  el('weekChart').innerHTML = days.map(function (d) {
    var h = Math.max(4, Math.round(d.solved / maxV * 100));
    return '<div style="flex:1;text-align:center"><div style="display:flex;align-items:flex-end;height:96px"><div title="' + d.solved + '" style="width:100%;height:' + h + '%;background:' + (d.solved ? 'var(--accent)' : 'var(--surface-3)') + ';border-radius:2px 2px 0 0"></div></div><div class="muted small" style="font-weight:600;margin-top:5px">' + d.label + '</div></div>';
  }).join('');

  // subject progress
  var subWrap = el('subjectProgress');
  Problems.SUBJECTS.forEach(function (s) {
    var st = p.bySubject[s.id] || { solved: 0, correct: 0 };
    var acc = pct(st.correct, st.solved);
    var row = document.createElement('a');
    row.href = 'subjects/' + s.id + '.html';
    row.className = 'sub-row';
    row.innerHTML = '<span class="si" style="color:' + s.color + '">' + ic(s.icon, { size: 18 }) + '</span>' +
      '<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:.92rem">' + s.name + '</b><span class="muted small" style="font-weight:600">' + st.solved + ' done · ' + acc + '%</span></div>' +
      '<div class="bar" style="margin-top:6px"><i style="width:' + Math.max(2, acc) + '%;background:' + s.color + '"></i></div></div>' +
      '<span class="faint">' + ic('chevron-right', { size: 16 }) + '</span>';
    subWrap.appendChild(row);
  });

  // recommendations
  var recWrap = el('recommended');
  var recs = [];
  Problems.SUBJECTS.forEach(function (s) { Problems.skillsForGrade(s.id, user.grade).forEach(function (k) { recs.push({ s: s, k: k }); }); });
  recs.sort(function (a, b) { return ((p.skills[a.k.id] || {}).mastery || 0) - ((p.skills[b.k.id] || {}).mastery || 0); });
  recs.slice(0, 6).forEach(function (r) {
    var m = (p.skills[r.k.id] || {}).mastery || 0;
    var a = document.createElement('a');
    a.href = 'subjects/' + r.s.id + '.html?skill=' + r.k.id;
    a.className = 'rec';
    a.innerHTML = '<div class="rt" style="color:' + r.s.color + '">' + ic(r.s.icon, { size: 15 }) + r.s.name + '</div>' +
      '<b style="display:block;margin-bottom:8px;font-size:.92rem">' + r.k.name + '</b>' +
      '<div class="bar"><i style="width:' + Math.max(2, m) + '%;background:' + r.s.color + '"></i></div>' +
      '<div class="muted small" style="margin-top:5px">' + (m >= 100 ? 'Mastered' : m > 0 ? 'SmartScore ' + m : 'Not started') + '</div>';
    recWrap.appendChild(a);
  });

  // achievements
  var achWrap = el('achievements');
  var gotN = 0;
  Store.ACHIEVEMENTS.forEach(function (a) {
    var got = p.achievements.indexOf(a.id) !== -1; if (got) gotN++;
    var d = document.createElement('div');
    d.className = 'ach' + (got ? ' got' : ' locked');
    d.title = a.name + ' — ' + a.desc;
    d.innerHTML = (got ? '<span class="chk">' + ic('check', { size: 11 }) + '</span>' : '') +
      ic(a.icon, { size: 22 }) + '<div class="an">' + a.name + '</div><div class="muted small" style="font-size:.68rem">' + (got ? 'Unlocked' : 'Locked') + '</div>';
    achWrap.appendChild(d);
  });
  var achCount = el('achCount');
  if (achCount) achCount.textContent = gotN + ' of ' + Store.ACHIEVEMENTS.length + ' unlocked';

  var goalSel = el('goalSelect');
  goalSel.value = String(goal);
  goalSel.addEventListener('change', function () { Store.setGoal(parseInt(goalSel.value, 10)); el('goalCaption').textContent = 'Target updated to ' + goalSel.value + ' a day.'; });

  var gradeSel = el('gradeSelect');
  gradeSel.value = user.grade;
  gradeSel.addEventListener('change', function () { Store.setGrade(gradeSel.value); UI.toast('Grade set to ' + gradeSel.value, 'ok', 'check'); setTimeout(function () { location.reload(); }, 650); });

  if (window.Icons) Icons.hydrate();
})();
