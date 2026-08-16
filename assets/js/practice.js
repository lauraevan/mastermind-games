/* practice.js — interactive practice engine (scales to the mega catalog).
   Skills are grouped by category; a grade filter and search keep the huge
   catalog navigable. Progress is tracked with an IXL-style SmartScore. */
(function () {
  'use strict';
  if (!UI.requireAuth()) return;

  var subjectId = window.SUBJECT_ID;
  var subject = Problems.subject(subjectId);
  var user = Store.current();

  var state = {
    skill: null, problem: null, answered: false,
    session: { solved: 0, correct: 0, xp: 0, run: 0 },
    grade: user.grade, query: '', openCat: null
  };

  function el(id) { return document.getElementById(id); }
  function ic(n, o) { return window.Icons ? Icons.icon(n, o || {}) : ''; }
  function gradeLabel(g) { return g === 0 ? 'K' : String(g); }

  el('subName').textContent = subject.name;
  el('subBlurb').textContent = subject.blurb;
  el('subIcon').innerHTML = ic(subject.icon, { size: 26 });
  el('subIcon').style.color = subject.color;
  document.title = subject.name + ' — Mastermind Academy';

  // ---- sidebar controls: grade filter + search (injected) ----
  var panel = el('skillList').parentNode;
  var controls = document.createElement('div');
  controls.className = 'skill-controls';
  var gradeOpts = '<option value="all">All grades</option>' +
    ['K','1','2','3','4','5','6','7','8','9','10','11','12'].map(function (g) { return '<option value="' + g + '"' + (g === user.grade ? ' selected' : '') + '>Grade ' + g + '</option>'; }).join('');
  controls.innerHTML =
    '<select id="gradeFilter" class="input" style="margin-bottom:8px">' + gradeOpts + '</select>' +
    '<div class="skill-search">' + ic('search', 15) + '<input id="skillSearch" placeholder="Search skills" spellcheck="false" autocomplete="off"></div>';
  panel.insertBefore(controls, el('skillList'));
  el('subGradeTag').textContent = 'Grade ' + user.grade;

  el('gradeFilter').addEventListener('change', function () { state.grade = this.value; state.openCat = null; renderSkillList(); });
  var st;
  el('skillSearch').addEventListener('input', function () { var v = this.value; clearTimeout(st); st = setTimeout(function () { state.query = v; renderSkillList(); }, 130); });

  function gradeSkills() {
    if (state.grade === 'all') return subject.skills;
    return Problems.skillsForGrade(subjectId, state.grade);
  }

  function skillBtn(k) {
    var p = Store.progress();
    var m = (p.skills[k.id] || {}).mastery || 0;
    var b = document.createElement('button');
    b.className = 'skill-item' + (state.skill && state.skill.id === k.id ? ' on' : '');
    b.innerHTML = '<div class="skill-row"><span class="skill-name">' + k.name + '</span>' +
      (m > 0 ? '<span class="ss ' + (m >= 100 ? 'done' : '') + '">' + m + '</span>' : '') + '</div>' +
      '<div class="bar" style="margin-top:7px;height:6px"><i style="width:' + Math.max(2, m) + '%;background:' + subject.color + '"></i></div>';
    b.onclick = function () { startSkill(k); };
    return b;
  }

  var listWrap = el('skillList');
  function renderSkillList() {
    var skills = gradeSkills();
    var q = state.query.trim().toLowerCase();
    listWrap.innerHTML = '';

    if (q) {
      var hits = skills.filter(function (k) { return k.name.toLowerCase().indexOf(q) !== -1; }).slice(0, 200);
      var h = document.createElement('div'); h.className = 'cat-hint'; h.textContent = hits.length + ' skill' + (hits.length === 1 ? '' : 's') + ' matching';
      listWrap.appendChild(h);
      hits.forEach(function (k) { listWrap.appendChild(skillBtn(k)); });
      return;
    }

    // group by strand (category)
    var groups = {}, order = [];
    skills.forEach(function (k) { var s = k.strand || 'Skills'; if (!groups[s]) { groups[s] = []; order.push(s); } groups[s].push(k); });
    var count = document.createElement('div'); count.className = 'cat-hint';
    count.textContent = order.length + ' categories · ' + skills.length.toLocaleString() + ' skills';
    listWrap.appendChild(count);

    order.forEach(function (strand) {
      var wrap = document.createElement('div'); wrap.className = 'cat-group';
      var head = document.createElement('button'); head.className = 'cat-head' + (state.openCat === strand ? ' open' : '');
      head.innerHTML = '<span>' + strand + '</span><span class="cat-n">' + groups[strand].length + ' ' + ic('chevron-down', 15) + '</span>';
      head.onclick = function () { state.openCat = state.openCat === strand ? null : strand; renderSkillList(); };
      wrap.appendChild(head);
      if (state.openCat === strand) {
        var body = document.createElement('div'); body.className = 'cat-skills';
        groups[strand].slice(0, 120).forEach(function (k) { body.appendChild(skillBtn(k)); });
        wrap.appendChild(body);
      }
      listWrap.appendChild(wrap);
    });
    if (window.Icons) Icons.hydrate(listWrap);
  }

  function startSkill(k) {
    state.skill = k; state.session.run = 0;
    el('practiceEmpty').style.display = 'none';
    el('practiceCard').style.display = 'block';
    el('skillTitle').textContent = k.name;
    el('skillTag').textContent = k.strand || subject.name;
    renderSkillList();
    nextProblem();
    el('practiceCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function nextProblem() {
    state.answered = false;
    var gLabel = state.skill.grade != null ? gradeLabel(state.skill.grade) : (state.grade === 'all' ? user.grade : state.grade);
    var prob = Problems.generate(state.skill.id, gLabel);
    state.problem = prob;
    el('feedback').style.display = 'none';
    el('nextBtn').style.display = 'none';
    el('questionText').textContent = prob.q;

    var ansWrap = el('answerArea'); ansWrap.innerHTML = '';
    if (prob.type === 'mc') {
      var grid = document.createElement('div'); grid.className = 'choices';
      prob.choices.forEach(function (c) { var b = document.createElement('button'); b.className = 'choice'; b.textContent = c; b.onclick = function () { check(c, b); }; grid.appendChild(b); });
      ansWrap.appendChild(grid);
    } else {
      var form = document.createElement('form'); form.className = 'input-answer';
      form.innerHTML = '<input class="input" id="typedAnswer" autocomplete="off" spellcheck="false" placeholder="Enter your answer">' +
        '<button class="btn" type="submit">' + ic('check', { size: 16 }) + 'Submit</button>';
      form.onsubmit = function (e) { e.preventDefault(); check(el('typedAnswer').value.trim(), null); };
      ansWrap.appendChild(form);
      setTimeout(function () { var t = el('typedAnswer'); if (t) t.focus(); }, 30);
    }
    updateSmart();
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

    var fb = el('feedback'); fb.style.display = 'flex'; fb.className = 'feedback ' + (correct ? 'good' : 'bad');
    fb.innerHTML = (correct ? ic('check', { size: 18 }) : ic('x', { size: 18 })) +
      '<div><b>' + (correct ? 'Correct.' : 'Incorrect.') + '</b>' +
      (correct ? '' : ' The answer is <b>' + UI.esc(state.problem.answer) + '</b>.') +
      (state.problem.explain ? '<div class="muted small" style="margin-top:3px">' + UI.esc(state.problem.explain) + '</div>' : '') + '</div>';

    el('nextBtn').style.display = 'inline-flex'; el('nextBtn').focus();
    el('sesSolved').textContent = state.session.solved;
    el('sesAcc').textContent = Math.round(state.session.correct / state.session.solved * 100) + '%';
    el('sesXP').textContent = state.session.xp;
    el('sesRun').textContent = state.session.run;

    if (res.events.leveledUp) UI.toast('Level ' + res.progress.level + ' reached', 'ok', 'trending-up');
    res.events.achievements.forEach(function (a) { UI.toast('Achievement: ' + a.name, 'ok', a.icon); });

    updateSmart();
    renderSkillList();
  }

  function updateSmart() {
    var p = Store.progress();
    var m = (p.skills[state.skill.id] || {}).mastery || 0;
    el('masteryBar').style.width = Math.max(3, m) + '%';
    el('masteryBar').style.background = m >= 100 ? 'var(--ok)' : subject.color;
    el('masteryText').textContent = m >= 100 ? 'Mastered' : 'SmartScore ' + m;
    var tag = el('adaptTag');
    if (tag) tag.innerHTML = ic('gauge', { size: 14 }) + '<span>SmartScore ' + m + ' / 100</span>';
  }

  el('nextBtn').onclick = nextProblem;

  renderSkillList();
  var params = new URLSearchParams(location.search);
  var wanted = params.get('skill');
  if (wanted) { var k = Problems.skill(wanted); if (k && k.subject === subjectId) { state.grade = 'all'; el('gradeFilter').value = 'all'; startSkill(k); } }
})();
