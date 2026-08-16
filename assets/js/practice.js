/* practice.js — interactive practice engine with adaptive difficulty */
(function () {
  'use strict';
  if (!UI.requireAuth()) return;

  var subjectId = window.SUBJECT_ID;
  var subject = Problems.subject(subjectId);
  var user = Store.current();
  var baseGrade = Problems.gradeNum(user.grade);

  var state = {
    skill: null, problem: null, answered: false,
    session: { solved: 0, correct: 0, xp: 0, run: 0 },
    diff: baseGrade,          // adaptive effective grade
    recent: []                // last few results for this skill
  };

  function el(id) { return document.getElementById(id); }
  function ic(n, o) { return window.Icons ? Icons.icon(n, o || {}) : ''; }
  function clampGrade(g) { return Math.max(0, Math.min(12, g)); }
  function gradeLabel(g) { return g === 0 ? 'K' : String(g); }

  el('subName').textContent = subject.name;
  el('subBlurb').textContent = subject.blurb;
  el('subIcon').innerHTML = ic(subject.icon, { size: 26 });
  el('subIcon').style.color = subject.color;
  document.title = subject.name + ' — Mastermind Academy';
  el('subGradeTag').textContent = 'Grade ' + user.grade;

  var listWrap = el('skillList');
  function renderSkillList() {
    var p = Store.progress();
    listWrap.innerHTML = '';
    subject.skills.forEach(function (k) {
      var inGrade = baseGrade >= k.grades[0] && baseGrade <= k.grades[1];
      var m = (p.skills[k.id] || {}).mastery || 0;
      var b = document.createElement('button');
      b.className = 'skill-item' + (state.skill && state.skill.id === k.id ? ' on' : '');
      b.innerHTML =
        '<div class="skill-row"><span class="skill-name">' + k.name + '</span>' +
        (inGrade ? '<span class="tag ok">On level</span>' : '<span class="skill-grade">Gr ' + gradeLabel(k.grades[0]) + '–' + k.grades[1] + '</span>') +
        '</div><div class="bar" style="margin-top:8px"><i style="width:' + Math.max(3, m) + '%;background:' + subject.color + '"></i></div>';
      b.onclick = function () { startSkill(k); };
      listWrap.appendChild(b);
    });
  }

  function startSkill(k) {
    state.skill = k;
    state.session.run = 0;
    state.diff = baseGrade;
    state.recent = [];
    renderSkillList();
    el('practiceEmpty').style.display = 'none';
    el('practiceCard').style.display = 'block';
    el('skillTitle').textContent = k.name;
    el('skillTag').textContent = subject.name;
    updateAdaptTag();
    nextProblem();
    el('practiceCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function updateAdaptTag() {
    var t = el('adaptTag');
    if (!t) return;
    var delta = state.diff - baseGrade;
    var label = 'Adaptive · Grade ' + gradeLabel(state.diff);
    if (delta > 0) label += ' (harder)';
    else if (delta < 0) label += ' (support)';
    t.innerHTML = ic('gauge', { size: 14 }) + '<span>' + label + '</span>';
  }

  function adapt() {
    // adjust effective difficulty from recent performance
    state.recent = state.recent.slice(-4);
    var r = state.recent;
    if (r.length >= 3) {
      var last3 = r.slice(-3);
      var correctCt = last3.filter(Boolean).length;
      if (last3.every(Boolean) && state.diff < 12) { state.diff = clampGrade(state.diff + 1); state.recent = []; UI.toast('Stepping up the difficulty', 'ok', 'trending-up'); }
      else if (correctCt <= 1 && state.diff > 0) { state.diff = clampGrade(state.diff - 1); state.recent = []; UI.toast('Easing off — let\'s rebuild', '', 'gauge'); }
    }
    updateAdaptTag();
  }

  function nextProblem() {
    state.answered = false;
    var prob = Problems.generate(state.skill.id, gradeLabel(state.diff));
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
      form.innerHTML = '<input class="input" id="typedAnswer" autocomplete="off" spellcheck="false" placeholder="Enter your answer">' +
        '<button class="btn" type="submit">' + ic('check', { size: 16 }) + 'Submit</button>';
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

    var res = Store.record(subjectId, state.problem.skillId, correct);
    state.session.solved++;
    if (correct) { state.session.correct++; state.session.run++; state.session.xp += 10; }
    else { state.session.run = 0; state.session.xp += 2; }
    state.recent.push(correct);

    var fb = el('feedback');
    fb.style.display = 'flex';
    fb.className = 'feedback ' + (correct ? 'good' : 'bad');
    fb.innerHTML = (correct ? ic('check', { size: 18 }) : ic('x', { size: 18 })) +
      '<div><b>' + (correct ? 'Correct.' : 'Incorrect.') + '</b>' +
      (correct ? '' : ' The answer is <b>' + UI.esc(state.problem.answer) + '</b>.') +
      (state.problem.explain ? '<div class="muted small" style="margin-top:3px">' + UI.esc(state.problem.explain) + '</div>' : '') + '</div>';

    el('nextBtn').style.display = 'inline-flex';
    el('nextBtn').focus();

    el('sesSolved').textContent = state.session.solved;
    el('sesAcc').textContent = Math.round(state.session.correct / state.session.solved * 100) + '%';
    el('sesXP').textContent = state.session.xp;
    el('sesRun').textContent = state.session.run;

    if (res.events.leveledUp) UI.toast('Level ' + res.progress.level + ' reached', 'ok', 'trending-up');
    res.events.achievements.forEach(function (a) { UI.toast('Achievement: ' + a.name, 'ok', a.icon); });

    adapt();
    updateMasteryBar();
    renderSkillList();
  }

  function updateMasteryBar() {
    var p = Store.progress();
    var m = (p.skills[state.skill.id] || {}).mastery || 0;
    el('masteryBar').style.width = Math.max(3, m) + '%';
    el('masteryBar').style.background = subject.color;
    el('masteryText').textContent = m >= 100 ? 'Mastered' : m + '% mastery';
  }

  el('nextBtn').onclick = nextProblem;

  renderSkillList();
  var params = new URLSearchParams(location.search);
  var wanted = params.get('skill');
  if (wanted) { var k = subject.skills.filter(function (x) { return x.id === wanted; })[0]; if (k) startSkill(k); }
})();
