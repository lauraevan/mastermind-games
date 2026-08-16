/* practice.js — the interactive practice engine (all subjects) */
(function () {
  'use strict';
  if (!UI.requireAuth()) return;

  var subjectId = window.SUBJECT_ID;
  var subject = Problems.subject(subjectId);
  var user = Store.current();
  var grade = user.grade;

  var state = { skill: null, problem: null, answered: false, session: { solved: 0, correct: 0, xp: 0, run: 0 } };

  function el(id) { return document.getElementById(id); }
  function gradeNum(g) { return Problems.gradeNum(g); }

  // ---- header ----
  el('subIcon').textContent = subject.icon;
  el('subIcon').style.background = subject.color;
  el('subName').textContent = subject.name;
  el('subBlurb').textContent = subject.blurb;
  document.title = subject.name + ' Practice · Mastermind Academy';
  el('subGradeTag').textContent = 'Your grade: ' + grade;

  // ---- skill list ----
  var listWrap = el('skillList');
  function renderSkillList() {
    var p = Store.progress();
    listWrap.innerHTML = '';
    subject.skills.forEach(function (k) {
      var inGrade = gradeNum(grade) >= k.grades[0] && gradeNum(grade) <= k.grades[1];
      var m = (p.skills[k.id] || {}).mastery || 0;
      var b = document.createElement('button');
      b.className = 'skill-item' + (state.skill && state.skill.id === k.id ? ' on' : '');
      b.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">' +
          '<span style="font-weight:800">' + k.name + '</span>' +
          (inGrade ? '<span class="chip grey" style="font-size:.68rem">Grade level</span>' : '<span class="soft" style="font-size:.72rem;font-weight:800">G' + (k.grades[0] === 0 ? 'K' : k.grades[0]) + '–' + k.grades[1] + '</span>') +
        '</div>' +
        '<div class="bar" style="margin-top:8px;height:7px"><i style="width:' + Math.max(3, m) + '%;background:' + subject.color + '"></i></div>';
      b.onclick = function () { startSkill(k); };
      listWrap.appendChild(b);
    });
  }

  // ---- practice flow ----
  function startSkill(k) {
    state.skill = k;
    state.session.run = 0;
    renderSkillList();
    el('practiceEmpty').style.display = 'none';
    el('practiceCard').style.display = 'block';
    el('skillTitle').textContent = k.name;
    el('skillTag').textContent = subject.name;
    nextProblem();
    el('practiceCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function nextProblem() {
    state.answered = false;
    var prob = Problems.generate(state.skill.id, grade);
    state.problem = prob;
    el('feedback').style.display = 'none';
    el('nextBtn').style.display = 'none';
    el('questionText').textContent = prob.q;

    var ansWrap = el('answerArea');
    ansWrap.innerHTML = '';
    if (prob.type === 'mc') {
      var grid = document.createElement('div');
      grid.className = 'choices';
      prob.choices.forEach(function (c) {
        var b = document.createElement('button');
        b.className = 'choice';
        b.textContent = c;
        b.onclick = function () { check(c, b); };
        grid.appendChild(b);
      });
      ansWrap.appendChild(grid);
    } else {
      var form = document.createElement('form');
      form.className = 'input-answer';
      form.innerHTML = '<input class="input" id="typedAnswer" autocomplete="off" spellcheck="false" placeholder="Type your answer" style="max-width:260px">' +
        '<button class="btn" type="submit">Check</button>';
      form.onsubmit = function (e) { e.preventDefault(); check(el('typedAnswer').value.trim(), null); };
      ansWrap.appendChild(form);
      setTimeout(function () { var t = el('typedAnswer'); if (t) t.focus(); }, 30);
    }
    updateMasteryBar();
  }

  function normalize(s) { return String(s).trim().toLowerCase().replace(/\s+/g, ' '); }

  function check(given, btn) {
    if (state.answered) return;
    state.answered = true;
    var correct = normalize(given) === normalize(state.problem.answer);

    // lock inputs
    if (state.problem.type === 'mc') {
      [].forEach.call(el('answerArea').querySelectorAll('.choice'), function (b) {
        b.disabled = true;
        if (normalize(b.textContent) === normalize(state.problem.answer)) b.classList.add('right');
        else if (b === btn) b.classList.add('wrong');
      });
    } else {
      var inp = el('typedAnswer'); if (inp) { inp.disabled = true; inp.classList.add(correct ? 'ok' : 'no'); }
      var sb = el('answerArea').querySelector('button'); if (sb) sb.disabled = true;
    }

    // record
    var res = Store.record(subjectId, state.problem.skillId, correct);
    state.session.solved++;
    if (correct) { state.session.correct++; state.session.run++; state.session.xp += 10; }
    else { state.session.run = 0; state.session.xp += 2; }

    // feedback
    var fb = el('feedback');
    fb.style.display = 'block';
    fb.className = 'feedback ' + (correct ? 'good' : 'bad');
    fb.innerHTML = '<b>' + (correct ? '✅ Correct!' : '❌ Not quite.') + '</b>' +
      (correct ? '' : ' The answer is <b>' + UI.esc(state.problem.answer) + '</b>.') +
      (state.problem.explain ? '<div class="soft" style="margin-top:6px;font-weight:600">' + UI.esc(state.problem.explain) + '</div>' : '');

    el('nextBtn').style.display = 'inline-flex';
    el('nextBtn').focus();

    // session UI
    el('sesSolved').textContent = state.session.solved;
    el('sesAcc').textContent = Math.round(state.session.correct / state.session.solved * 100) + '%';
    el('sesXP').textContent = state.session.xp;
    el('sesRun').textContent = state.session.run;
    if (state.session.run > 0 && state.session.run % 5 === 0) UI.toast('🔥 ' + state.session.run + ' in a row!', 'good');

    // events
    if (res.events.leveledUp) UI.toast('⭐ Level up! You reached level ' + res.progress.level, 'good');
    if (res.events.streakUp && Store.liveStreak() > 1) UI.toast('🔥 ' + Store.liveStreak() + '-day streak!', 'good');
    res.events.achievements.forEach(function (a) { UI.toast(a.icon + ' Achievement: ' + a.name, 'good'); });

    updateMasteryBar();
    renderSkillList();
  }

  function updateMasteryBar() {
    var p = Store.progress();
    var m = (p.skills[state.skill.id] || {}).mastery || 0;
    el('masteryBar').style.width = Math.max(3, m) + '%';
    el('masteryBar').style.background = subject.color;
    el('masteryText').textContent = m >= 100 ? 'Mastered! 🏅' : m + '% mastery';
  }

  el('nextBtn').onclick = nextProblem;

  // ---- init ----
  renderSkillList();
  // deep link ?skill=
  var params = new URLSearchParams(location.search);
  var wanted = params.get('skill');
  if (wanted) {
    var k = subject.skills.filter(function (x) { return x.id === wanted; })[0];
    if (k) startSkill(k);
  }
})();
