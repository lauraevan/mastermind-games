/* ============================================================
   problems.js — Skill registry + problem generators
   6 subjects, 80+ skills, K-12. Generators produce fresh,
   grade-scaled problems on every call, so the practice pool is
   effectively unlimited (well over 500 distinct problems).
   ============================================================ */
(function (global) {
  'use strict';

  // ---------- RNG helpers ----------
  function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(a) { return a[rnd(0, a.length - 1)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function gradeNum(g) { return g === 'K' ? 0 : parseInt(g, 10); }
  function uniqPush(arr, v) { if (arr.indexOf(v) === -1) arr.push(v); }

  // Build a multiple-choice problem from a numeric answer.
  function mcNum(q, answer, opts) {
    opts = opts || {};
    var spread = opts.spread || Math.max(2, Math.round(Math.abs(answer) * 0.3) + 2);
    var choices = [answer];
    var guard = 0;
    while (choices.length < 4 && guard++ < 50) {
      var d = answer + (rnd(0, 1) ? 1 : -1) * rnd(1, spread);
      if (opts.nonneg && d < 0) continue;
      uniqPush(choices, d);
    }
    while (choices.length < 4) uniqPush(choices, answer + choices.length);
    return { type: 'mc', q: q, choices: shuffle(choices).map(String), answer: String(answer), explain: opts.explain || '' };
  }
  // Build a MC from string answer + string distractors.
  function mcStr(q, answer, distractors, explain) {
    var choices = [answer];
    for (var i = 0; i < distractors.length && choices.length < 4; i++) uniqPush(choices, distractors[i]);
    return { type: 'mc', q: q, choices: shuffle(choices), answer: answer, explain: explain || '' };
  }
  function inp(q, answer, explain) { return { type: 'input', q: q, answer: String(answer), explain: explain || '' }; }

  var STAR = '⭐', APPLE = '🍎', BALL = '⚽', HEART = '💜', FISH = '🐟';

  // scale helper: returns a magnitude that grows with grade
  function scale(grade, base, per) { return base + gradeNum(grade) * (per == null ? 1 : per); }

  // ---------- generators ----------
  var G = {};

  // ===== MATH =====
  G.count = function (g) {
    var icon = pick([STAR, APPLE, BALL, HEART, FISH]);
    var n = rnd(1, Math.min(20, 3 + gradeNum(g) * 4));
    var row = new Array(n + 1).join(icon);
    return mcNum('How many do you count?  ' + row, n, { nonneg: true, spread: 3, explain: 'Count them one by one — there are ' + n + '.' });
  };
  G.add1 = function () { var a = rnd(0, 9), b = rnd(0, 9); return mcNum(a + ' + ' + b + ' = ?', a + b, { nonneg: true, explain: a + ' + ' + b + ' = ' + (a + b) }); };
  G.sub1 = function () { var a = rnd(2, 9), b = rnd(0, a); return mcNum(a + ' − ' + b + ' = ?', a - b, { nonneg: true, explain: a + ' − ' + b + ' = ' + (a - b) }); };
  G.add2 = function (g) { var hi = gradeNum(g) >= 3 ? 999 : 99; var a = rnd(10, hi), b = rnd(10, hi); return inp(a + ' + ' + b + ' = ?', a + b, 'Line up the place values and add.'); };
  G.sub2 = function (g) { var hi = gradeNum(g) >= 3 ? 999 : 99; var a = rnd(20, hi), b = rnd(10, a); return inp(a + ' − ' + b + ' = ?', a - b, 'Borrow across place values as needed.'); };
  G.mult = function (g) { var hi = gradeNum(g) >= 4 ? 12 : 9; var a = rnd(2, hi), b = rnd(2, hi); return inp(a + ' × ' + b + ' = ?', a * b, a + ' groups of ' + b + '.'); };
  G.div = function (g) { var b = rnd(2, gradeNum(g) >= 5 ? 12 : 9), c = rnd(2, 12); var a = b * c; return inp(a + ' ÷ ' + b + ' = ?', c, a + ' ÷ ' + b + ' = ' + c + ' because ' + b + ' × ' + c + ' = ' + a); };
  G.place = function () {
    var digits = rnd(3, 4); var n = rnd(Math.pow(10, digits - 1), Math.pow(10, digits) - 1);
    var s = String(n); var i = rnd(0, s.length - 1); var d = s[i];
    var placeVal = Math.pow(10, s.length - 1 - i);
    var names = { 1: 'ones', 10: 'tens', 100: 'hundreds', 1000: 'thousands' };
    return mcStr('In the number ' + n + ', what is the place value of the digit ' + d + '?',
      names[placeVal], ['ones', 'tens', 'hundreds', 'thousands'].filter(function (x) { return x !== names[placeVal]; }),
      'The ' + d + ' sits in the ' + names[placeVal] + ' place.');
  };
  G.round = function (g) { var to = pick(gradeNum(g) >= 4 ? [10, 100, 1000] : [10, 100]); var n = rnd(to, to * 40 + rnd(1, 9)); var r = Math.round(n / to) * to; return mcNum('Round ' + n + ' to the nearest ' + to + '.', r, { spread: to, explain: n + ' rounds to ' + r + '.' }); };
  G.fracCmp = function () {
    var d = pick([2, 3, 4, 5, 6, 8]); var a = rnd(1, d - 1), b = rnd(1, d - 1);
    var ans = a > b ? '>' : (a < b ? '<' : '=');
    return mcStr('Compare:  ' + a + '/' + d + '  ?  ' + b + '/' + d, ans, ['>', '<', '='].filter(function (x) { return x !== ans; }), 'Same denominator, so compare the numerators.');
  };
  G.fracAdd = function () { var d = pick([3, 4, 5, 6, 8, 10]); var a = rnd(1, d - 1), b = rnd(1, d - a > 0 ? d - a : 1); if (a + b >= d) b = d - a; return inp(a + '/' + d + ' + ' + b + '/' + d + ' = ?  (write as n/' + d + ')', (a + b) + '/' + d, 'Add numerators, keep the denominator.'); };
  G.decAdd = function () { var a = (rnd(1, 99) / 10), b = (rnd(1, 99) / 10); var s = Math.round((a + b) * 10) / 10; return inp(a.toFixed(1) + ' + ' + b.toFixed(1) + ' = ?', s.toFixed(1), 'Line up the decimal points.'); };
  G.percent = function () { var p = pick([10, 20, 25, 50, 5, 75]); var whole = pick([20, 40, 60, 80, 100, 200, 24, 48]); var ans = p / 100 * whole; return mcNum('What is ' + p + '% of ' + whole + '?', ans, { nonneg: true, spread: 8, explain: p + '% = ' + (p / 100) + ', and ' + (p / 100) + ' × ' + whole + ' = ' + ans }); };
  G.ratio = function () { var k = rnd(2, 6); var a = k * rnd(1, 5), b = k * rnd(1, 5); function gcd(x, y) { return y ? gcd(y, x % y) : x; } var g = gcd(a, b); return mcStr('Simplify the ratio ' + a + ':' + b, (a / g) + ':' + (b / g), [a + ':' + b, (a / 2) + ':' + (b / 2), (b / g) + ':' + (a / g)], 'Divide both sides by the GCF (' + g + ').'); };
  G.oop = function () { var a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9); var ans = a + b * c; return mcNum(a + ' + ' + b + ' × ' + c + ' = ?', ans, { explain: 'Multiply before adding: ' + b + '×' + c + '=' + b * c + ', then +' + a + '.' }); };
  G.intAdd = function (g) { var hi = 9 + gradeNum(g); var a = rnd(-hi, hi), b = rnd(-hi, hi); var qa = (a < 0 ? '(' + a + ')' : a), qb = (b < 0 ? '(' + b + ')' : b); return mcNum(qa + ' + ' + qb + ' = ?', a + b, { explain: 'Combine signed numbers: ' + (a + b) + '.' }); };
  G.exp = function () { var base = rnd(2, 6), e = rnd(2, 3); return inp(base + '^' + e + ' = ?', Math.pow(base, e), base + ' multiplied by itself ' + e + ' times.'); };
  G.area = function () { var l = rnd(3, 15), w = rnd(2, 12); return inp('A rectangle is ' + l + ' by ' + w + '. What is its area (square units)?', l * w, 'Area = length × width.'); };
  G.perim = function () { var l = rnd(3, 15), w = rnd(2, 12); return inp('A rectangle is ' + l + ' by ' + w + '. What is its perimeter (units)?', 2 * (l + w), 'Perimeter = 2 × (length + width).'); };
  G.money = function () { var start = rnd(5, 20), cost = rnd(1, start); var names = ['Maria', 'Jamal', 'Ava', 'Leo', 'Zoe', 'Ken']; return mcNum(pick(names) + ' has $' + start + ' and spends $' + cost + '. How much is left?', start - cost, { nonneg: true, spread: 4, explain: '$' + start + ' − $' + cost + ' = $' + (start - cost) }); };
  G.mean = function () { var n = rnd(3, 4); var arr = []; var sum = 0; for (var i = 0; i < n; i++) { var v = rnd(2, 20); arr.push(v); sum += v; } var m = sum / n; if (m % 1 !== 0) { arr[0] += n - (sum % n === 0 ? 0 : sum % n); sum = arr.reduce(function (a, b) { return a + b; }, 0); m = sum / n; } return mcNum('Find the mean (average) of: ' + arr.join(', '), Math.round(sum / n), { spread: 4, explain: 'Sum = ' + sum + ', divide by ' + n + '.' }); };
  G.prime = function () { function isPrime(n) { if (n < 2) return false; for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; } var n = rnd(2, 40); var ans = isPrime(n) ? 'Prime' : 'Composite'; return mcStr('Is ' + n + ' prime or composite?', ans, [ans === 'Prime' ? 'Composite' : 'Prime'], ans === 'Prime' ? n + ' has exactly two factors.' : n + ' has more than two factors.'); };
  G.gcf = function () { function gcd(a, b) { return b ? gcd(b, a % b) : a; } var a = rnd(6, 40), b = rnd(6, 40); return inp('What is the GCF of ' + a + ' and ' + b + '?', gcd(a, b), 'Largest number dividing both.'); };
  G.unitRate = function () { var n = rnd(2, 8); var per = rnd(2, 9); var total = n * per; return mcNum(n + ' notebooks cost $' + total + '. What is the price per notebook?', per, { nonneg: true, spread: 3, explain: '$' + total + ' ÷ ' + n + ' = $' + per }); };
  G.proportion = function () { var b = rnd(2, 6), a = rnd(1, 5); var k = rnd(2, 5); var d = b * k; var x = a * k; return inp('Solve for x:  ' + a + '/' + b + ' = x/' + d, x, 'Multiply ' + a + ' by ' + (d / b) + '.'); };

  // ===== ALGEBRA =====
  G.evalExpr = function () { var c = rnd(2, 6), k = rnd(1, 5), x = rnd(2, 9); return mcNum('If x = ' + x + ', evaluate ' + c + 'x + ' + k, c * x + k, { explain: c + '(' + x + ') + ' + k + ' = ' + (c * x + k) }); };
  G.solve1 = function () { var a = rnd(1, 15), x = rnd(1, 12); return inp('Solve for x:  x + ' + a + ' = ' + (x + a), x, 'Subtract ' + a + ' from both sides.'); };
  G.solve2 = function () { var a = rnd(2, 6), x = rnd(1, 9), b = rnd(1, 10); return inp('Solve for x:  ' + a + 'x + ' + b + ' = ' + (a * x + b), x, 'Subtract ' + b + ', then divide by ' + a + '.'); };
  G.likeTerms = function () { var a = rnd(2, 7), b = rnd(2, 7), c = rnd(1, 8); return mcStr('Simplify:  ' + a + 'x + ' + c + ' + ' + b + 'x', (a + b) + 'x + ' + c, [(a + b) + 'x', (a * b) + 'x + ' + c, (a + b + c) + 'x'], 'Combine the x-terms: ' + a + '+' + b + '=' + (a + b) + '.'); };
  G.distribute = function () { var a = rnd(2, 6), b = rnd(1, 7); return mcStr('Expand:  ' + a + '(x + ' + b + ')', a + 'x + ' + (a * b), [a + 'x + ' + b, (a + 1) + 'x + ' + (a * b), a + 'x + ' + (a + b)], 'Multiply ' + a + ' by each term.'); };
  G.slope = function () { var x1 = rnd(-4, 4), y1 = rnd(-4, 4), dx = rnd(1, 4), m = rnd(-4, 4); var x2 = x1 + dx, y2 = y1 + m * dx; return mcNum('Find the slope through (' + x1 + ', ' + y1 + ') and (' + x2 + ', ' + y2 + ').', m, { spread: 4, explain: 'slope = (y₂−y₁)/(x₂−x₁) = ' + (y2 - y1) + '/' + (x2 - x1) + ' = ' + m + '.' }); };
  G.lineY = function () { var m = rnd(1, 5), b = rnd(-5, 5), x = rnd(1, 5); return mcNum('For y = ' + m + 'x + ' + (b < 0 ? '(' + b + ')' : b) + ', find y when x = ' + x + '.', m * x + b, { explain: m + '·' + x + ' + ' + b + ' = ' + (m * x + b) }); };
  G.inequality = function () { var a = rnd(1, 9), b = rnd(a + 1, a + 12); return mcStr('Solve:  x + ' + a + ' > ' + b, 'x > ' + (b - a), ['x > ' + (b + a), 'x < ' + (b - a), 'x > ' + b], 'Subtract ' + a + ' from both sides.'); };
  G.system = function () { var x = rnd(1, 6), y = rnd(1, 6); var s = x + y, d = x - y; return inp('If x + y = ' + s + ' and x − y = ' + d + ', what is x?', x, 'Add the equations: 2x = ' + (s + d) + '.'); };
  G.factor = function () { var p = rnd(1, 6), q = rnd(1, 6); var b = p + q, c = p * q; var fac = '(x + ' + p + ')(x + ' + q + ')'; return mcStr('Factor:  x² + ' + b + 'x + ' + c, fac, ['(x + ' + b + ')(x + ' + c + ')', '(x + ' + (p + 1) + ')(x + ' + q + ')', '(x − ' + p + ')(x − ' + q + ')'], 'Find two numbers that add to ' + b + ' and multiply to ' + c + '.'); };
  G.quadratic = function () { var p = rnd(1, 6), q = rnd(1, 6); var b = p + q, c = p * q; var small = Math.min(p, q); return mcNum('One solution of  x² − ' + b + 'x + ' + c + ' = 0 is x = ?  (give the smaller root)', -Math.min(-p, -q) === 0 ? small : small, { nonneg: true, spread: 3, explain: 'Roots are ' + p + ' and ' + q + '.' }); };
  G.expLaw = function () { var a = rnd(2, 7), b = rnd(2, 7); return mcStr('Simplify:  x^' + a + ' · x^' + b, 'x^' + (a + b), ['x^' + (a * b), 'x^' + Math.abs(a - b), '2x^' + (a + b)], 'Add exponents when multiplying like bases.'); };
  G.funcEval = function () { var a = rnd(2, 5), b = rnd(1, 6), k = rnd(2, 6); return mcNum('If f(x) = ' + a + 'x − ' + b + ', find f(' + k + ').', a * k - b, { explain: a + '·' + k + ' − ' + b + ' = ' + (a * k - b) }); };
  G.arithSeq = function () { var a = rnd(1, 8), d = rnd(2, 6), n = rnd(4, 9); var term = a + (n - 1) * d; return inp('An arithmetic sequence starts at ' + a + ' with common difference ' + d + '. What is the ' + n + 'th term?', term, 'aₙ = a + (n−1)d = ' + a + ' + ' + (n - 1) + '·' + d + '.'); };
  G.radical = function () { var a = rnd(2, 6), b = pick([2, 3, 5, 6, 7]); var k = a * a * b; return mcStr('Simplify  √' + k, a + '√' + b, [k + '√1', (a * b) + '√' + a, a + '√' + (b * b)], '√' + k + ' = √(' + (a * a) + '·' + b + ') = ' + a + '√' + b + '.'); };

  // ===== CALCULUS =====
  G.limitPoly = function () { var a = rnd(1, 4), c = rnd(1, 5), x = rnd(1, 4); var val = a * x * x + c; return mcNum('lim(x→' + x + ') of ' + a + 'x² + ' + c, val, { explain: 'Substitute x = ' + x + ': ' + a + '·' + (x * x) + ' + ' + c + '.' }); };
  G.derivPower = function () { var n = rnd(2, 6); return mcStr('d/dx of x^' + n, n + 'x^' + (n - 1), ['x^' + (n - 1), (n - 1) + 'x^' + n, n + 'x^' + n], 'Power rule: bring down ' + n + ', reduce the exponent.'); };
  G.derivPoly = function () { var a = rnd(2, 5), b = rnd(2, 6); return mcStr('d/dx of ' + a + 'x² + ' + b + 'x', (2 * a) + 'x + ' + b, [a + 'x + ' + b, (2 * a) + 'x + ' + (2 * b), (2 * a) + 'x'], 'Differentiate term by term.'); };
  G.derivChain = function () { var a = rnd(2, 4), n = rnd(2, 4); return mcStr('d/dx of (' + a + 'x + 1)^' + n, (n * a) + '(' + a + 'x + 1)^' + (n - 1), [(n) + '(' + a + 'x + 1)^' + (n - 1), (n * a) + '(' + a + 'x + 1)^' + n, a + '(' + a + 'x + 1)^' + (n - 1)], 'Chain rule: outer power × derivative of inside (' + a + ').'); };
  G.integralPower = function () { var n = rnd(1, 5); return mcStr('∫ x^' + n + ' dx', 'x^' + (n + 1) + '/' + (n + 1) + ' + C', ['x^' + (n - 1) + ' + C', (n + 1) + 'x^' + n + ' + C', 'x^' + (n + 1) + ' + C'], 'Add one to the exponent, divide by it.'); };
  G.defIntegral = function () { var c = rnd(2, 6), b = rnd(2, 6); return mcNum('∫₀^' + b + ' ' + c + ' dx', c * b, { explain: 'Integral of a constant c over [0,b] is c·b = ' + c + '·' + b + '.' }); };
  G.tangent = function () { var a = rnd(1, 4), x = rnd(1, 4); return mcNum('For f(x) = ' + a + 'x², the slope of the tangent at x = ' + x + ' is?', 2 * a * x, { explain: "f'(x) = " + (2 * a) + 'x, so at x=' + x + ' it is ' + (2 * a * x) + '.' }); };
  G.derivTrig = function () { var f = pick([['sin(x)', 'cos(x)'], ['cos(x)', '−sin(x)'], ['tan(x)', 'sec²(x)']]); return mcStr('d/dx of ' + f[0], f[1], ['sin(x)', 'cos(x)', '−cos(x)', 'sec²(x)'].filter(function (x) { return x !== f[1]; }).slice(0, 3), 'Standard trig derivative.'); };
  G.limitRational = function () { var a = rnd(2, 6); return mcNum('lim(x→' + a + ') of (x² − ' + (a * a) + ')/(x − ' + a + ')', 2 * a, { explain: 'Factor: (x−' + a + ')(x+' + a + ')/(x−' + a + ') → x+' + a + ' → ' + (2 * a) + '.' }); };

  // ---------- static banks (reading / spanish / science) ----------
  function bankMC(item, bank) {
    var others = bank.filter(function (b) { return b.a !== item.a; }).map(function (b) { return b.a; });
    var distractors = shuffle(others).slice(0, 3);
    return mcStr(item.q, item.a, distractors, item.e || '');
  }

  var BANKS = {
    synonyms: [
      { q: 'Choose the synonym for "happy".', a: 'joyful', e: '"Joyful" means full of joy.' },
      { q: 'Choose the synonym for "big".', a: 'enormous' },
      { q: 'Choose the synonym for "fast".', a: 'rapid' },
      { q: 'Choose the synonym for "smart".', a: 'clever' },
      { q: 'Choose the synonym for "cold".', a: 'chilly' },
      { q: 'Choose the synonym for "angry".', a: 'furious' },
      { q: 'Choose the synonym for "tired".', a: 'weary' },
      { q: 'Choose the synonym for "quiet".', a: 'silent' },
      { q: 'Choose the synonym for "brave".', a: 'courageous' },
      { q: 'Choose the synonym for "tiny".', a: 'miniature' }
    ],
    antonyms: [
      { q: 'Choose the antonym for "hot".', a: 'cold' },
      { q: 'Choose the antonym for "up".', a: 'down' },
      { q: 'Choose the antonym for "happy".', a: 'sad' },
      { q: 'Choose the antonym for "empty".', a: 'full' },
      { q: 'Choose the antonym for "ancient".', a: 'modern' },
      { q: 'Choose the antonym for "generous".', a: 'stingy' },
      { q: 'Choose the antonym for "expand".', a: 'shrink' },
      { q: 'Choose the antonym for "victory".', a: 'defeat' },
      { q: 'Choose the antonym for "arrive".', a: 'depart' },
      { q: 'Choose the antonym for "bright".', a: 'dim' }
    ],
    grammar: [
      { q: 'Which is correct?', a: 'She and I went to the park.', e: 'Use the subject pronoun "I".' },
      { q: 'Pick the correct verb: "The dogs ___ barking."', a: 'are', e: 'Plural subject takes "are".' },
      { q: 'Pick the correct word: "Its / It\'s raining today."', a: "It's", e: '"It\'s" = it is.' },
      { q: 'Pick the correct word: "They\'re / Their house is blue."', a: 'Their', e: '"Their" shows possession.' },
      { q: 'Choose the correct plural of "child".', a: 'children' },
      { q: 'Choose the past tense of "run".', a: 'ran' },
      { q: 'Which sentence is complete?', a: 'The bird sang loudly.' },
      { q: 'Pick the adverb: "She ran quickly."', a: 'quickly' },
      { q: 'Pick the correct word: "Fewer / Less chairs are in the room."', a: 'Fewer' },
      { q: 'Choose the correct: "You\'re / Your going to love this."', a: "You're" }
    ],
    partsofspeech: [
      { q: 'What part of speech is "quickly"?', a: 'adverb' },
      { q: 'What part of speech is "beautiful"?', a: 'adjective' },
      { q: 'What part of speech is "run"?', a: 'verb' },
      { q: 'What part of speech is "elephant"?', a: 'noun' },
      { q: 'What part of speech is "and"?', a: 'conjunction' },
      { q: 'What part of speech is "under"?', a: 'preposition' },
      { q: 'What part of speech is "she"?', a: 'pronoun' },
      { q: 'What part of speech is "wow"?', a: 'interjection' }
    ],
    figurative: [
      { q: '"The stars danced in the sky." This is an example of...', a: 'personification', e: 'Giving human traits to non-human things.' },
      { q: '"As brave as a lion" is an example of...', a: 'simile', e: 'A comparison using "as".' },
      { q: '"Time is a thief" is an example of...', a: 'metaphor', e: 'A direct comparison.' },
      { q: '"Buzz" and "clang" are examples of...', a: 'onomatopoeia' },
      { q: '"I\'ve told you a million times" is an example of...', a: 'hyperbole', e: 'An obvious exaggeration.' },
      { q: '"The wind whispered" is an example of...', a: 'personification' }
    ],
    inference: [
      { q: 'Sam grabbed an umbrella before leaving. What can you infer?', a: 'It might rain.', e: 'Umbrellas suggest rain.' },
      { q: 'The floor was covered in wrapping paper and everyone cheered. What happened?', a: 'Someone opened gifts.', e: 'Wrapping paper + cheering.' },
      { q: 'Mia yawned and rubbed her eyes during class. Mia is probably...', a: 'sleepy', e: 'Yawning shows tiredness.' },
      { q: 'The streets were empty and shops were closed. It is probably...', a: 'a holiday or night', e: 'Closed shops suggest off-hours.' },
      { q: 'Leo\'s plants were drooping and the soil was dry. Leo forgot to...', a: 'water them', e: 'Dry soil = no water.' }
    ],
    mainidea: [
      { q: 'A passage describes how bees collect pollen, make honey, and pollinate flowers. The main idea is...', a: 'the work bees do', e: 'All details are about bees\' jobs.' },
      { q: 'A passage lists foods, sleep, and exercise for staying healthy. The main idea is...', a: 'how to stay healthy', e: 'Each detail supports health.' },
      { q: 'A passage explains the water cycle: evaporation, clouds, and rain. The main idea is...', a: 'the water cycle', e: 'The topic tying the details together.' },
      { q: 'A passage tells about a firefighter\'s tools, training, and duties. The main idea is...', a: 'a firefighter\'s job' }
    ],
    prefixes: [
      { q: 'What does the prefix "un-" mean in "unhappy"?', a: 'not', e: '"Un-" reverses meaning.' },
      { q: 'What does the prefix "re-" mean in "redo"?', a: 'again' },
      { q: 'What does the prefix "pre-" mean in "preview"?', a: 'before' },
      { q: 'What does the suffix "-less" mean in "fearless"?', a: 'without' },
      { q: 'What does the prefix "tri-" mean in "triangle"?', a: 'three' },
      { q: 'What does the prefix "bi-" mean in "bicycle"?', a: 'two' }
    ],
    // ===== Spanish =====
    esVocab: [
      { q: 'Translate to English: "perro"', a: 'dog' }, { q: 'Translate: "gato"', a: 'cat' },
      { q: 'Translate: "casa"', a: 'house' }, { q: 'Translate: "libro"', a: 'book' },
      { q: 'Translate: "agua"', a: 'water' }, { q: 'Translate: "escuela"', a: 'school' },
      { q: 'Translate: "amigo"', a: 'friend' }, { q: 'Translate: "sol"', a: 'sun' },
      { q: 'Translate: "manzana"', a: 'apple' }, { q: 'Translate: "árbol"', a: 'tree' }
    ],
    esNumbers: [
      { q: 'What is "cinco" in English?', a: '5' }, { q: 'What is "diez"?', a: '10' },
      { q: 'What is "tres"?', a: '3' }, { q: 'What is "ocho"?', a: '8' },
      { q: 'What is "veinte"?', a: '20' }, { q: 'What is "siete"?', a: '7' },
      { q: 'What is "quince"?', a: '15' }, { q: 'What is "doce"?', a: '12' }
    ],
    esColors: [
      { q: 'What color is "rojo"?', a: 'red' }, { q: 'What color is "azul"?', a: 'blue' },
      { q: 'What color is "verde"?', a: 'green' }, { q: 'What color is "amarillo"?', a: 'yellow' },
      { q: 'What color is "negro"?', a: 'black' }, { q: 'What color is "blanco"?', a: 'white' },
      { q: 'What color is "morado"?', a: 'purple' }, { q: 'What color is "rosa"?', a: 'pink' }
    ],
    esArticles: [
      { q: 'Choose the article: "___ casa" (house, feminine)', a: 'la' },
      { q: 'Choose the article: "___ libro" (book, masculine)', a: 'el' },
      { q: 'Choose the article: "___ perro"', a: 'el' },
      { q: 'Choose the article: "___ escuela"', a: 'la' },
      { q: 'Choose the plural article: "___ gatos"', a: 'los' },
      { q: 'Choose the plural article: "___ manzanas"', a: 'las' }
    ],
    esVerbs: [
      { q: 'Conjugate "hablar" for yo (I speak):', a: 'hablo', e: '-ar verb, yo form ends in -o.' },
      { q: 'Conjugate "comer" for yo (I eat):', a: 'como' },
      { q: 'Conjugate "vivir" for yo (I live):', a: 'vivo' },
      { q: 'Conjugate "hablar" for tú (you speak):', a: 'hablas' },
      { q: 'Conjugate "comer" for él (he eats):', a: 'come' },
      { q: 'Conjugate "hablar" for nosotros (we speak):', a: 'hablamos' }
    ],
    esGreetings: [
      { q: 'How do you say "Good morning"?', a: 'Buenos días' },
      { q: 'How do you say "Thank you"?', a: 'Gracias' },
      { q: 'How do you say "Goodbye"?', a: 'Adiós' },
      { q: 'How do you say "Please"?', a: 'Por favor' },
      { q: 'What does "¿Cómo estás?" mean?', a: 'How are you?' },
      { q: 'What does "Me llamo..." mean?', a: 'My name is...' }
    ],
    // ===== Science =====
    sciMatter: [
      { q: 'Which is a solid?', a: 'ice', e: 'Solids hold their shape.' },
      { q: 'Water turning to vapor is called...', a: 'evaporation' },
      { q: 'The three common states of matter are solid, liquid, and...', a: 'gas' },
      { q: 'Melting changes a solid into a...', a: 'liquid' },
      { q: 'Freezing changes a liquid into a...', a: 'solid' },
      { q: 'Gas turning into liquid is called...', a: 'condensation' }
    ],
    sciSpace: [
      { q: 'Which planet is closest to the Sun?', a: 'Mercury' },
      { q: 'What is at the center of our solar system?', a: 'the Sun' },
      { q: 'Which planet is known as the Red Planet?', a: 'Mars' },
      { q: 'Earth\'s natural satellite is the...', a: 'Moon' },
      { q: 'The largest planet is...', a: 'Jupiter' },
      { q: 'A shape of the path a planet takes around the Sun is an...', a: 'orbit' }
    ],
    sciLife: [
      { q: 'The basic unit of life is the...', a: 'cell' },
      { q: 'Plants make food using sunlight in a process called...', a: 'photosynthesis' },
      { q: 'What gas do plants release that we breathe?', a: 'oxygen' },
      { q: 'The part of a plant that absorbs water is the...', a: 'roots' },
      { q: 'A food chain usually starts with a...', a: 'producer (plant)' },
      { q: 'Animals that eat only plants are called...', a: 'herbivores' }
    ],
    sciBody: [
      { q: 'Which organ pumps blood?', a: 'heart' },
      { q: 'Which organ helps you breathe?', a: 'lungs' },
      { q: 'Which organ controls the body?', a: 'brain' },
      { q: 'Bones together form the...', a: 'skeleton' },
      { q: 'Which organ digests food with acid?', a: 'stomach' },
      { q: 'The largest organ of the body is the...', a: 'skin' }
    ],
    sciForces: [
      { q: 'The force that pulls objects toward Earth is...', a: 'gravity' },
      { q: 'A push or pull is called a...', a: 'force' },
      { q: 'Force that slows sliding objects is...', a: 'friction' },
      { q: 'Energy of motion is called ___ energy.', a: 'kinetic' },
      { q: 'Stored energy is called ___ energy.', a: 'potential' },
      { q: 'A tool that makes work easier is a...', a: 'simple machine' }
    ]
  };

  function bankGen(bankId) { return function () { var bank = BANKS[bankId]; return bankMC(pick(bank), bank); }; }

  // ---------- SUBJECT / SKILL REGISTRY ----------
  // grades: [min,max] as numbers (K=0)
  var SUBJECTS = [
    {
      id: 'math', name: 'Math', color: 'var(--sub-math)', icon: '➕',
      blurb: 'Numbers, operations, fractions, geometry and more.',
      skills: [
        { id: 'count', name: 'Counting objects', grades: [0, 1], gen: G.count },
        { id: 'add1', name: 'Add within 20', grades: [0, 2], gen: G.add1 },
        { id: 'sub1', name: 'Subtract within 20', grades: [0, 2], gen: G.sub1 },
        { id: 'add2', name: 'Multi-digit addition', grades: [2, 4], gen: G.add2 },
        { id: 'sub2', name: 'Multi-digit subtraction', grades: [2, 4], gen: G.sub2 },
        { id: 'mult', name: 'Multiplication facts', grades: [3, 5], gen: G.mult },
        { id: 'div', name: 'Division facts', grades: [3, 6], gen: G.div },
        { id: 'place', name: 'Place value', grades: [2, 4], gen: G.place },
        { id: 'round', name: 'Rounding numbers', grades: [3, 5], gen: G.round },
        { id: 'fracCmp', name: 'Compare fractions', grades: [4, 6], gen: G.fracCmp },
        { id: 'fracAdd', name: 'Add fractions', grades: [4, 6], gen: G.fracAdd },
        { id: 'decAdd', name: 'Add decimals', grades: [5, 7], gen: G.decAdd },
        { id: 'percent', name: 'Percent of a number', grades: [6, 8], gen: G.percent },
        { id: 'ratio', name: 'Simplify ratios', grades: [6, 8], gen: G.ratio },
        { id: 'oop', name: 'Order of operations', grades: [5, 7], gen: G.oop },
        { id: 'intAdd', name: 'Add integers', grades: [6, 8], gen: G.intAdd },
        { id: 'exp', name: 'Exponents', grades: [6, 8], gen: G.exp },
        { id: 'area', name: 'Area of rectangles', grades: [3, 6], gen: G.area },
        { id: 'perim', name: 'Perimeter', grades: [3, 5], gen: G.perim },
        { id: 'money', name: 'Money word problems', grades: [1, 5], gen: G.money },
        { id: 'mean', name: 'Mean / average', grades: [6, 8], gen: G.mean },
        { id: 'prime', name: 'Prime & composite', grades: [4, 6], gen: G.prime },
        { id: 'gcf', name: 'Greatest common factor', grades: [5, 7], gen: G.gcf },
        { id: 'unitRate', name: 'Unit rates', grades: [6, 8], gen: G.unitRate },
        { id: 'proportion', name: 'Solve proportions', grades: [6, 8], gen: G.proportion }
      ]
    },
    {
      id: 'algebra', name: 'Algebra', color: 'var(--sub-algebra)', icon: '𝑥',
      blurb: 'Expressions, equations, slopes, factoring and functions.',
      skills: [
        { id: 'evalExpr', name: 'Evaluate expressions', grades: [6, 9], gen: G.evalExpr },
        { id: 'solve1', name: 'One-step equations', grades: [6, 9], gen: G.solve1 },
        { id: 'solve2', name: 'Two-step equations', grades: [7, 10], gen: G.solve2 },
        { id: 'likeTerms', name: 'Combine like terms', grades: [7, 10], gen: G.likeTerms },
        { id: 'distribute', name: 'Distributive property', grades: [7, 10], gen: G.distribute },
        { id: 'slope', name: 'Slope from two points', grades: [8, 11], gen: G.slope },
        { id: 'lineY', name: 'Evaluate linear functions', grades: [8, 11], gen: G.lineY },
        { id: 'inequality', name: 'Solve inequalities', grades: [8, 11], gen: G.inequality },
        { id: 'system', name: 'Systems of equations', grades: [9, 12], gen: G.system },
        { id: 'factor', name: 'Factor quadratics', grades: [9, 12], gen: G.factor },
        { id: 'quadratic', name: 'Solve quadratics', grades: [9, 12], gen: G.quadratic },
        { id: 'expLaw', name: 'Laws of exponents', grades: [8, 11], gen: G.expLaw },
        { id: 'funcEval', name: 'Function notation', grades: [8, 11], gen: G.funcEval },
        { id: 'arithSeq', name: 'Arithmetic sequences', grades: [9, 12], gen: G.arithSeq },
        { id: 'radical', name: 'Simplify radicals', grades: [9, 12], gen: G.radical }
      ]
    },
    {
      id: 'calculus', name: 'Calculus', color: 'var(--sub-calculus)', icon: '∫',
      blurb: 'Limits, derivatives, and integrals for high school.',
      skills: [
        { id: 'limitPoly', name: 'Limits of polynomials', grades: [11, 12], gen: G.limitPoly },
        { id: 'limitRational', name: 'Limits (factor & cancel)', grades: [11, 12], gen: G.limitRational },
        { id: 'derivPower', name: 'Power rule', grades: [11, 12], gen: G.derivPower },
        { id: 'derivPoly', name: 'Derivatives of polynomials', grades: [11, 12], gen: G.derivPoly },
        { id: 'derivChain', name: 'Chain rule', grades: [12, 12], gen: G.derivChain },
        { id: 'derivTrig', name: 'Derivatives of trig', grades: [12, 12], gen: G.derivTrig },
        { id: 'integralPower', name: 'Power rule for integrals', grades: [12, 12], gen: G.integralPower },
        { id: 'defIntegral', name: 'Definite integrals', grades: [12, 12], gen: G.defIntegral },
        { id: 'tangent', name: 'Tangent line slope', grades: [11, 12], gen: G.tangent }
      ]
    },
    {
      id: 'reading', name: 'Reading', color: 'var(--sub-reading)', icon: '📖',
      blurb: 'Vocabulary, comprehension, grammar and language arts.',
      skills: [
        { id: 'synonyms', name: 'Synonyms', grades: [1, 6], gen: bankGen('synonyms') },
        { id: 'antonyms', name: 'Antonyms', grades: [1, 6], gen: bankGen('antonyms') },
        { id: 'grammar', name: 'Grammar & usage', grades: [3, 8], gen: bankGen('grammar') },
        { id: 'partsofspeech', name: 'Parts of speech', grades: [3, 8], gen: bankGen('partsofspeech') },
        { id: 'figurative', name: 'Figurative language', grades: [4, 9], gen: bankGen('figurative') },
        { id: 'inference', name: 'Making inferences', grades: [3, 8], gen: bankGen('inference') },
        { id: 'mainidea', name: 'Main idea', grades: [3, 8], gen: bankGen('mainidea') },
        { id: 'prefixes', name: 'Prefixes & suffixes', grades: [3, 7], gen: bankGen('prefixes') }
      ]
    },
    {
      id: 'spanish', name: 'Spanish', color: 'var(--sub-spanish)', icon: '🌎',
      blurb: 'Vocabulary, numbers, colors, articles and verbs.',
      skills: [
        { id: 'esVocab', name: 'Vocabulary', grades: [1, 12], gen: bankGen('esVocab') },
        { id: 'esNumbers', name: 'Numbers', grades: [1, 8], gen: bankGen('esNumbers') },
        { id: 'esColors', name: 'Colors', grades: [1, 8], gen: bankGen('esColors') },
        { id: 'esArticles', name: 'Articles (el/la)', grades: [3, 10], gen: bankGen('esArticles') },
        { id: 'esVerbs', name: 'Present-tense verbs', grades: [5, 12], gen: bankGen('esVerbs') },
        { id: 'esGreetings', name: 'Greetings & phrases', grades: [1, 10], gen: bankGen('esGreetings') }
      ]
    },
    {
      id: 'science', name: 'Science', color: 'var(--sub-science)', icon: '🔬',
      blurb: 'Matter, space, life science, the human body and forces.',
      skills: [
        { id: 'sciMatter', name: 'States of matter', grades: [2, 7], gen: bankGen('sciMatter') },
        { id: 'sciSpace', name: 'Solar system', grades: [2, 8], gen: bankGen('sciSpace') },
        { id: 'sciLife', name: 'Life science', grades: [3, 8], gen: bankGen('sciLife') },
        { id: 'sciBody', name: 'Human body', grades: [3, 8], gen: bankGen('sciBody') },
        { id: 'sciForces', name: 'Forces & energy', grades: [4, 9], gen: bankGen('sciForces') }
      ]
    }
  ];

  var SKILL_INDEX = {};
  SUBJECTS.forEach(function (s) { s.skills.forEach(function (k) { k.subject = s.id; SKILL_INDEX[k.id] = k; }); });

  var Problems = {
    SUBJECTS: SUBJECTS,
    subject: function (id) { return SUBJECTS.filter(function (s) { return s.id === id; })[0]; },
    skill: function (id) { return SKILL_INDEX[id]; },
    generate: function (skillId, grade) {
      var k = SKILL_INDEX[skillId]; if (!k) return null;
      var p = k.gen(grade || 'K');
      p.skillId = skillId; p.subjectId = k.subject; p.skillName = k.name;
      return p;
    },
    skillsForGrade: function (subjectId, grade) {
      var gn = gradeNum(grade); var s = this.subject(subjectId); if (!s) return [];
      return s.skills.filter(function (k) { return gn >= k.grades[0] && gn <= k.grades[1]; });
    },
    totalSkills: function () { var n = 0; SUBJECTS.forEach(function (s) { n += s.skills.length; }); return n; },
    // conservative estimate of the distinct-problem pool for marketing copy
    estimatedProblems: function () {
      var n = 0;
      SUBJECTS.forEach(function (s) { s.skills.forEach(function (k) { n += 8; }); });
      Object.keys(BANKS).forEach(function (b) { n += BANKS[b].length; });
      return n;
    },
    gradeNum: gradeNum
  };

  global.Problems = Problems;
})(window);
