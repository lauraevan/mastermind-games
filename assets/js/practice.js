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
    grade: user.grade, query: '', openCat: null,
    bump: 0, missStreak: 0   // adaptive difficulty within the current skill
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
    state.skill = k; state.session.run = 0; state.bump = 0; state.missStreak = 0;
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
    var prob = Problems.generate(state.skill.id, gLabel, state.bump);
    state.problem = prob;
    el('feedback').style.display = 'none';
    el('nextBtn').style.display = 'none';
    el('questionText').textContent = prob.q;

    var ansWrap = el('answerArea'); ansWrap.innerHTML = '';
    if (prob.type === 'mc') {
      var grid = document.createElement('div'); grid.className = 'choices';
      prob.choices.forEach(function (c, i) {
        var b = document.createElement('button'); b.className = 'choice'; b.type = 'button';
        b.innerHTML = '<span class="kbd">' + (i + 1) + '</span>' + UI.esc(c);
        b.setAttribute('data-val', c); b.setAttribute('aria-label', c);
        b.onclick = function () { check(c, b); };
        grid.appendChild(b);
      });
      ansWrap.appendChild(grid);
    } else if (prob.type === 'multi') {
      var mg = document.createElement('div'); mg.className = 'choices';
      prob.choices.forEach(function (c) {
        var b = document.createElement('button'); b.className = 'choice multi'; b.type = 'button'; b.textContent = c;
        b.setAttribute('aria-pressed', 'false');
        b.onclick = function () { if (state.answered) return; var on = b.classList.toggle('sel'); b.setAttribute('aria-pressed', on ? 'true' : 'false'); };
        mg.appendChild(b);
      });
      ansWrap.appendChild(mg);
      var mb = document.createElement('button'); mb.className = 'btn'; mb.type = 'button'; mb.style.marginTop = '12px';
      mb.innerHTML = ic('check', { size: 16 }) + 'Check answer';
      mb.onclick = function () { var sel = [].map.call(ansWrap.querySelectorAll('.choice.sel'), function (x) { return x.textContent; }); checkMulti(sel); };
      ansWrap.appendChild(mb);
    } else if (prob.type === 'nl') {
      buildNumberLine(ansWrap, prob);
    } else {
      var form = document.createElement('form'); form.className = 'input-answer';
      form.innerHTML = '<input class="input" id="typedAnswer" autocomplete="off" spellcheck="false" inputmode="text" placeholder="Enter your answer" aria-label="Your answer">' +
        '<button class="btn" type="submit">' + ic('check', { size: 16 }) + 'Submit</button>';
      form.onsubmit = function (e) { e.preventDefault(); check(el('typedAnswer').value.trim(), null); };
      ansWrap.appendChild(form);
      setTimeout(function () { var t = el('typedAnswer'); if (t) t.focus(); }, 30);
    }
    updateSmart();
  }

  // Clickable number-line widget for type:'nl'.
  function buildNumberLine(host, prob) {
    var min = prob.min || 0, max = prob.max || 10, step = prob.step || 1;
    var chosen = null;
    var wrap = document.createElement('div'); wrap.className = 'numline';
    var track = document.createElement('div'); track.className = 'nl-track'; track.setAttribute('role', 'slider');
    track.setAttribute('aria-valuemin', min); track.setAttribute('aria-valuemax', max); track.setAttribute('tabindex', '0');
    var fill = document.createElement('div'); fill.className = 'nl-fill';
    var knob = document.createElement('div'); knob.className = 'nl-knob'; knob.style.display = 'none';
    track.appendChild(fill); track.appendChild(knob);
    // ticks
    var ticks = document.createElement('div'); ticks.className = 'nl-ticks';
    var labelEvery = (max - min) / step > 12 ? Math.ceil(((max - min) / step) / 10) * step : step;
    for (var v = min; v <= max; v += step) {
      var t = document.createElement('span'); t.className = 'nl-tick';
      t.style.left = ((v - min) / (max - min) * 100) + '%';
      if ((v - min) % labelEvery === 0) t.setAttribute('data-l', v);
      ticks.appendChild(t);
    }
    function setVal(v) {
      v = Math.max(min, Math.min(max, Math.round(v / step) * step));
      chosen = v; var pct = (v - min) / (max - min) * 100;
      knob.style.left = pct + '%'; knob.style.display = 'block'; fill.style.width = pct + '%';
      track.setAttribute('aria-valuenow', v); out.textContent = 'You chose: ' + v;
    }
    function fromEvent(e) {
      var r = track.getBoundingClientRect(); var x = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width;
      setVal(min + x * (max - min));
    }
    track.addEventListener('click', fromEvent);
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { setVal((chosen == null ? min : chosen) - step); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { setVal((chosen == null ? min : chosen) + step); e.preventDefault(); }
    });
    wrap.appendChild(track); wrap.appendChild(ticks);
    var out = document.createElement('div'); out.className = 'nl-out muted small'; out.textContent = 'Tap the line to place your mark.';
    wrap.appendChild(out);
    var btn = document.createElement('button'); btn.className = 'btn'; btn.type = 'button'; btn.style.marginTop = '12px';
    btn.innerHTML = ic('check', { size: 16 }) + 'Check answer';
    btn.onclick = function () { if (chosen == null) { out.textContent = 'Tap the line first.'; return; } checkNL(chosen); };
    wrap.appendChild(btn);
    host.appendChild(wrap);
  }

  function normalize(s) { return String(s).trim().toLowerCase().replace(/\s+/g, ' '); }

  // Parse a numeric answer that may be a fraction, decimal, mixed, or carry
  // commas / units / "x =" so equivalent forms compare equal.
  function parseNum(s) {
    s = String(s).trim().toLowerCase().replace(/^[a-z]\s*=\s*/, '').replace(/[,$\s]/g, '').replace(/(cm|mm|m|km|kg|g|in|ft|units?|°|%)$/,'');
    var mm = s.match(/^(-?\d+)\+?(\d+)\/(\d+)$/); // mixed like 1 1/2 -> 1+1/2
    if (mm) return parseFloat(mm[1]) + (mm[1] < 0 ? -1 : 1) * parseFloat(mm[2]) / parseFloat(mm[3]);
    var fr = s.match(/^(-?\d+)\/(\d+)$/);
    if (fr) return parseFloat(fr[1]) / parseFloat(fr[2]);
    if (/^-?\d*\.?\d+$/.test(s)) return parseFloat(s);
    return NaN;
  }
  // Accept a student's answer if it matches exactly OR is numerically equivalent.
  function answersMatch(given, answer) {
    var a = normalize(given), b = normalize(answer);
    if (a === b) return true;
    if (a.replace(/^[a-z]\s*=\s*/, '') === b.replace(/^[a-z]\s*=\s*/, '')) return true;
    var na = parseNum(given), nb = parseNum(answer);
    if (!isNaN(na) && !isNaN(nb)) return Math.abs(na - nb) < 1e-9 || Math.abs(na - nb) <= Math.abs(nb) * 1e-9;
    return false;
  }

  function check(given, btn) {
    if (state.answered) return;
    var correct = answersMatch(given, state.problem.answer);
    [].forEach.call(el('answerArea').querySelectorAll('.choice'), function (b) {
      b.disabled = true;
      if (answersMatch(b.getAttribute('data-val') || b.textContent, state.problem.answer)) b.classList.add('right');
      else if (b === btn) b.classList.add('wrong');
    });
    var inp = el('typedAnswer'); if (inp) { inp.disabled = true; inp.classList.add(correct ? 'ok' : 'no'); }
    var sb = el('answerArea').querySelector('form button'); if (sb) sb.disabled = true;
    finalize(correct);
  }

  // select-all-that-apply
  function checkMulti(selected) {
    if (state.answered) return;
    var want = (state.problem.answers || []).map(normalize).sort();
    var got = selected.map(normalize).sort();
    var correct = want.length === got.length && want.every(function (v, i) { return v === got[i]; });
    [].forEach.call(el('answerArea').querySelectorAll('.choice'), function (b) {
      b.disabled = true;
      var isAns = (state.problem.answers || []).some(function (a) { return normalize(a) === normalize(b.textContent); });
      if (isAns) b.classList.add('right'); else if (b.classList.contains('sel')) b.classList.add('wrong');
    });
    finalize(correct);
  }

  // number line
  function checkNL(value) {
    if (state.answered) return;
    [].forEach.call(el('answerArea').querySelectorAll('.nl-track, .btn'), function (b) { if (b.classList.contains('nl-track')) return; b.disabled = true; });
    finalize(answersMatch(String(value), state.problem.answer));
  }

  // Little celebratory burst on a correct answer (visual + a gentle haptic).
  function burst() {
    var card = el('practiceCard'); if (!card) return;
    card.classList.remove('pulse'); void card.offsetWidth; card.classList.add('pulse');
    try { if (navigator.vibrate) navigator.vibrate(18); } catch (e) {}
    var host = document.createElement('div'); host.className = 'confetti';
    var colors = ['#5a4bd6', '#3a9d4f', '#f0a52b', '#3ea0e0', '#ef6fa3'];
    for (var i = 0; i < 14; i++) {
      var s = document.createElement('i');
      s.style.left = (10 + Math.random() * 80) + '%';
      s.style.background = colors[i % colors.length];
      s.style.animationDelay = (Math.random() * 0.12) + 's';
      s.style.transform = 'rotate(' + Math.floor(Math.random() * 360) + 'deg)';
      host.appendChild(s);
    }
    card.appendChild(host);
    setTimeout(function () { host.remove(); }, 1100);
  }

  function finalize(correct) {
    state.answered = true;
    var res = Store.record(subjectId, state.problem.skillId, correct);
    state.session.solved++;
    if (correct) {
      state.session.correct++; state.session.run++; state.session.xp += 10; state.missStreak = 0;
      burst();
      if (state.session.run % 2 === 0 && state.bump < 6 && Problems.levelSibling(state.skill.id, state.bump + 1)) {
        state.bump++; UI.toast('Nice streak — harder questions ahead', 'ok', 'trending-up');
      }
    } else {
      state.session.run = 0; state.session.xp += 2; state.missStreak++;
      if (state.bump > 0 && state.missStreak >= 2) { state.bump--; state.missStreak = 0; UI.toast('Let’s build back up', '', 'gauge'); }
    }

    var fb = el('feedback'); fb.style.display = 'flex'; fb.className = 'feedback ' + (correct ? 'good' : 'bad');
    fb.setAttribute('role', 'status'); fb.setAttribute('aria-live', 'polite');
    fb.innerHTML = (correct ? ic('check', { size: 18 }) : ic('x', { size: 18 })) +
      '<div style="flex:1"><b>' + (correct ? 'Correct!' : 'Not quite.') + '</b>' +
      (correct ? '' : ' The answer is <b>' + UI.esc(state.problem.answer) + '</b>.') +
      (state.problem.explain ? '<div class="worked"><span class="worked-lab">How to solve it</span>' + UI.esc(state.problem.explain) + '</div>' : '') + '</div>';

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
    if (tag) {
      var pips = ''; for (var i = 0; i < state.bump; i++) pips += '▲';
      tag.innerHTML = ic('gauge', { size: 14 }) + '<span>SmartScore ' + m + ' / 100' + (state.bump ? ' · difficulty ' + pips : ' · adaptive') + '</span>';
    }
  }

  el('nextBtn').onclick = nextProblem;

  // Keyboard: press 1–9 to pick a choice; Enter goes to the next question.
  document.addEventListener('keydown', function (e) {
    var ae = document.activeElement; if (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)) return;
    if (!state.problem || el('practiceCard').style.display === 'none') return;
    if (state.answered) { if (e.key === 'Enter' && el('nextBtn').style.display !== 'none') { nextProblem(); e.preventDefault(); } return; }
    var t = state.problem.type;
    if ((t === 'mc' || t === 'multi') && /^[1-9]$/.test(e.key)) {
      var btns = el('answerArea').querySelectorAll('.choice'); var b = btns[parseInt(e.key, 10) - 1];
      if (b) { b.click(); e.preventDefault(); }
    }
  });

  renderSkillList();
  var params = new URLSearchParams(location.search);
  var wanted = params.get('skill');
  if (wanted) { var k = Problems.skill(wanted); if (k && k.subject === subjectId) { state.grade = 'all'; el('gradeFilter').value = 'all'; startSkill(k); } }
})();
