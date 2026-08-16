/* ============================================================
   problems.js (v2) — skill registry, generators, speed drills,
   assessments. 9 subjects, 100+ skills, K-12. Generators create
   fresh, grade-scaled problems on every call; combined with the
   static banks the distinct-problem pool is well over 2,000.
   ============================================================ */
(function (global) {
  'use strict';

  function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(a) { return a[rnd(0, a.length - 1)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(0, i); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function gradeNum(g) { return g === 'K' ? 0 : parseInt(g, 10); }
  function uniqPush(arr, v) { if (arr.indexOf(v) === -1) arr.push(v); }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); return b ? gcd(b, a % b) : a; }
  function isPrime(n) { if (n < 2) return false; for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }

  function mcNum(q, answer, opts) {
    opts = opts || {};
    var spread = opts.spread || Math.max(2, Math.round(Math.abs(answer) * 0.3) + 2);
    var choices = [answer], guard = 0;
    while (choices.length < 4 && guard++ < 60) {
      var d = answer + (rnd(0, 1) ? 1 : -1) * rnd(1, spread);
      if (opts.nonneg && d < 0) continue;
      uniqPush(choices, d);
    }
    while (choices.length < 4) uniqPush(choices, answer + choices.length);
    return { type: 'mc', q: q, choices: shuffle(choices).map(String), answer: String(answer), explain: opts.explain || '' };
  }
  function mcStr(q, answer, distractors, explain) {
    var choices = [answer];
    for (var i = 0; i < distractors.length && choices.length < 4; i++) uniqPush(choices, distractors[i]);
    return { type: 'mc', q: q, choices: shuffle(choices), answer: answer, explain: explain || '' };
  }
  function inp(q, answer, explain) { return { type: 'input', q: q, answer: String(answer), explain: explain || '' }; }

  var G = {};

  /* ---------------- MATH ---------------- */
  G.count = function (g) { var n = rnd(1, Math.min(20, 3 + gradeNum(g) * 4)); return mcNum('How many marks are shown?  ' + new Array(n + 1).join('| '), n, { nonneg: true, spread: 3, explain: 'Count each mark: ' + n + '.' }); };
  G.add1 = function () { var a = rnd(0, 9), b = rnd(0, 9); return mcNum(a + ' + ' + b + ' =', a + b, { nonneg: true, explain: a + ' + ' + b + ' = ' + (a + b) }); };
  G.sub1 = function () { var a = rnd(2, 9), b = rnd(0, a); return mcNum(a + ' − ' + b + ' =', a - b, { nonneg: true, explain: a + ' − ' + b + ' = ' + (a - b) }); };
  G.add2 = function (g) { var hi = gradeNum(g) >= 3 ? 999 : 99; var a = rnd(10, hi), b = rnd(10, hi); return inp(a + ' + ' + b + ' =', a + b, 'Align the place values and add.'); };
  G.sub2 = function (g) { var hi = gradeNum(g) >= 3 ? 999 : 99; var a = rnd(20, hi), b = rnd(10, a); return inp(a + ' − ' + b + ' =', a - b, 'Regroup across place values as needed.'); };
  G.mult = function (g) { var hi = gradeNum(g) >= 4 ? 12 : 9; var a = rnd(2, hi), b = rnd(2, hi); return inp(a + ' × ' + b + ' =', a * b, a + ' groups of ' + b + '.'); };
  G.multBig = function (g) { var a = rnd(11, 40 + gradeNum(g) * 5), b = rnd(2, 12); return inp(a + ' × ' + b + ' =', a * b, 'Multiply then combine partial products.'); };
  G.div = function (g) { var b = rnd(2, gradeNum(g) >= 5 ? 12 : 9), c = rnd(2, 12); var a = b * c; return inp(a + ' ÷ ' + b + ' =', c, b + ' × ' + c + ' = ' + a); };
  G.divRem = function () { var b = rnd(3, 9), c = rnd(3, 9), r = rnd(1, b - 1); var a = b * c + r; return inp(a + ' ÷ ' + b + ' =  ? remainder (give the remainder)', r, a + ' = ' + b + '×' + c + ' + ' + r + '.'); };
  G.place = function () { var d = rnd(3, 4); var n = rnd(Math.pow(10, d - 1), Math.pow(10, d) - 1); var s = String(n), i = rnd(0, s.length - 1); var pv = Math.pow(10, s.length - 1 - i); var names = { 1: 'ones', 10: 'tens', 100: 'hundreds', 1000: 'thousands' }; return mcStr('In ' + n + ', the digit ' + s[i] + ' is in the:', names[pv], ['ones', 'tens', 'hundreds', 'thousands'].filter(function (x) { return x !== names[pv]; }), 'The ' + s[i] + ' sits in the ' + names[pv] + ' place.'); };
  G.round = function (g) { var to = pick(gradeNum(g) >= 4 ? [10, 100, 1000] : [10, 100]); var n = rnd(to, to * 40 + rnd(1, 9)); var r = Math.round(n / to) * to; return mcNum('Round ' + n + ' to the nearest ' + to + '.', r, { spread: to, explain: n + ' rounds to ' + r + '.' }); };
  G.fracCmp = function () { var d = pick([2, 3, 4, 5, 6, 8]); var a = rnd(1, d - 1), b = rnd(1, d - 1); var ans = a > b ? '>' : (a < b ? '<' : '='); return mcStr('Compare:  ' + a + '/' + d + '  __  ' + b + '/' + d, ans, ['>', '<', '='].filter(function (x) { return x !== ans; }), 'Same denominator — compare numerators.'); };
  G.fracAdd = function () { var d = pick([3, 4, 5, 6, 8, 10]); var a = rnd(1, d - 1), b = rnd(1, d - 1); if (a + b >= d) b = Math.max(1, d - a); return inp(a + '/' + d + ' + ' + b + '/' + d + ' =  (write as n/' + d + ')', (a + b) + '/' + d, 'Add numerators, keep the denominator.'); };
  G.fracSimplify = function () { var f = rnd(2, 6); var n = rnd(1, 6) * f, dd = rnd(n / f + 1, 8) * f; return mcStr('Simplify  ' + n + '/' + dd, (n / gcd(n, dd)) + '/' + (dd / gcd(n, dd)), [n + '/' + dd, (n / 2) + '/' + (dd / 2), (dd / gcd(n, dd)) + '/' + (n / gcd(n, dd))], 'Divide top and bottom by ' + gcd(n, dd) + '.'); };
  G.decAdd = function () { var a = rnd(1, 99) / 10, b = rnd(1, 99) / 10; return inp(a.toFixed(1) + ' + ' + b.toFixed(1) + ' =', (Math.round((a + b) * 10) / 10).toFixed(1), 'Line up the decimal points.'); };
  G.decMul = function () { var a = rnd(2, 20) / 10, b = rnd(2, 9); return inp(a.toFixed(1) + ' × ' + b + ' =', (Math.round(a * b * 10) / 10).toFixed(1), 'Multiply, then place the decimal.'); };
  G.percent = function () { var p = pick([10, 20, 25, 50, 5, 75]); var w = pick([20, 40, 60, 80, 100, 200, 24, 48]); return mcNum('What is ' + p + '% of ' + w + '?', p / 100 * w, { nonneg: true, spread: 8, explain: p + '% × ' + w + ' = ' + (p / 100 * w) }); };
  G.percentChange = function () { var a = pick([20, 40, 50, 80, 100]); var pc = pick([10, 20, 25, 50]); var up = rnd(0, 1); var res = up ? a + a * pc / 100 : a - a * pc / 100; return mcNum('A price of $' + a + ' ' + (up ? 'increases' : 'decreases') + ' by ' + pc + '%. New price?', res, { nonneg: true, spread: 6, explain: (up ? 'Add ' : 'Subtract ') + pc + '% of ' + a + '.' }); };
  G.ratio = function () { var k = rnd(2, 6), a = k * rnd(1, 5), b = k * rnd(1, 5); var g2 = gcd(a, b); return mcStr('Simplify the ratio ' + a + ':' + b, (a / g2) + ':' + (b / g2), [a + ':' + b, (a / 2) + ':' + (b / 2), (b / g2) + ':' + (a / g2)], 'Divide both parts by ' + g2 + '.'); };
  G.oop = function () { var a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9); return mcNum(a + ' + ' + b + ' × ' + c + ' =', a + b * c, { explain: 'Multiply first: ' + b + '×' + c + ', then add ' + a + '.' }); };
  G.oop2 = function () { var a = rnd(2, 6), b = rnd(2, 6), c = rnd(2, 6); return mcNum('(' + a + ' + ' + b + ') × ' + c + ' =', (a + b) * c, { explain: 'Parentheses first.' }); };
  G.intAdd = function (g) { var hi = 9 + gradeNum(g); var a = rnd(-hi, hi), b = rnd(-hi, hi); return mcNum((a < 0 ? '(' + a + ')' : a) + ' + ' + (b < 0 ? '(' + b + ')' : b) + ' =', a + b, { explain: 'Combine signed numbers: ' + (a + b) + '.' }); };
  G.intMul = function () { var a = rnd(-9, 9), b = rnd(-9, 9); return mcNum('(' + a + ') × (' + b + ') =', a * b, { explain: 'Same signs → positive; different → negative.' }); };
  G.exp = function () { var base = rnd(2, 6), e = rnd(2, 3); return inp(base + '^' + e + ' =', Math.pow(base, e), base + ' multiplied by itself ' + e + ' times.'); };
  G.sqrt = function () { var r = rnd(2, 15); return inp('√' + (r * r) + ' =', r, r + '² = ' + (r * r) + '.'); };
  G.mean = function () { var n = rnd(3, 4), arr = [], sum = 0; for (var i = 0; i < n; i++) { var v = rnd(2, 20); arr.push(v); sum += v; } while (sum % n !== 0) { arr[0]++; sum++; } return mcNum('Find the mean of: ' + arr.join(', '), sum / n, { spread: 4, explain: 'Sum ' + sum + ' ÷ ' + n + '.' }); };
  G.median = function () { var arr = []; for (var i = 0; i < 5; i++) arr.push(rnd(1, 20)); var s = arr.slice().sort(function (a, b) { return a - b; }); return mcNum('Find the median of: ' + arr.join(', '), s[2], { spread: 4, explain: 'Order them; the middle value is ' + s[2] + '.' }); };
  G.mode = function () { var base = rnd(1, 9); var arr = [base, base, base, rnd(10, 19), rnd(20, 29)]; arr = shuffle(arr); return mcNum('Find the mode of: ' + arr.join(', '), base, { spread: 5, explain: base + ' appears most often.' }); };
  G.range = function () { var arr = []; for (var i = 0; i < 5; i++) arr.push(rnd(1, 40)); return mcNum('Find the range of: ' + arr.join(', '), Math.max.apply(null, arr) - Math.min.apply(null, arr), { spread: 6, explain: 'Max − min.' }); };
  G.prime = function () { var n = rnd(2, 40); var ans = isPrime(n) ? 'Prime' : 'Composite'; return mcStr('Is ' + n + ' prime or composite?', ans, [ans === 'Prime' ? 'Composite' : 'Prime'], ans === 'Prime' ? n + ' has exactly two factors.' : n + ' has more than two factors.'); };
  G.gcf = function () { var a = rnd(6, 40), b = rnd(6, 40); return inp('GCF of ' + a + ' and ' + b + ' =', gcd(a, b), 'Largest number dividing both.'); };
  G.lcm = function () { var a = rnd(2, 9), b = rnd(2, 9); return inp('LCM of ' + a + ' and ' + b + ' =', a * b / gcd(a, b), 'a×b ÷ gcd.'); };
  G.unitRate = function () { var n = rnd(2, 8), per = rnd(2, 9); return mcNum(n + ' notebooks cost $' + n * per + '. Price per notebook?', per, { nonneg: true, spread: 3, explain: '$' + n * per + ' ÷ ' + n + '.' }); };
  G.proportion = function () { var b = rnd(2, 6), a = rnd(1, 5), k = rnd(2, 5); return inp('Solve for x:  ' + a + '/' + b + ' = x/' + b * k, a * k, 'Multiply ' + a + ' by ' + k + '.'); };
  G.money = function () { var start = rnd(5, 20), cost = rnd(1, start); return mcNum(pick(['Maria', 'Jamal', 'Ava', 'Leo', 'Zoe', 'Ken']) + ' has $' + start + ' and spends $' + cost + '. How much remains?', start - cost, { nonneg: true, spread: 4, explain: '$' + start + ' − $' + cost + '.' }); };
  G.time = function () { var h = rnd(1, 6), m = pick([0, 15, 30, 45]); var add = rnd(1, 3) * 30; var tot = h * 60 + m + add; var eh = Math.floor(tot / 60), em = tot % 60; return mcStr('It is ' + h + ':' + (m < 10 ? '0' + m : m) + '. What time is it ' + add + ' minutes later?', eh + ':' + (em < 10 ? '0' + em : em), [(eh + 1) + ':' + (em < 10 ? '0' + em : em), eh + ':' + (m < 10 ? '0' + m : m), (eh - 1) + ':' + (em < 10 ? '0' + em : em)], 'Add ' + add + ' minutes.'); };

  /* ---------------- ALGEBRA ---------------- */
  G.evalExpr = function () { var c = rnd(2, 6), k = rnd(1, 5), x = rnd(2, 9); return mcNum('If x = ' + x + ', evaluate ' + c + 'x + ' + k, c * x + k, { explain: c + '(' + x + ') + ' + k + '.' }); };
  G.solve1 = function () { var a = rnd(1, 15), x = rnd(1, 12); return inp('Solve:  x + ' + a + ' = ' + (x + a), x, 'Subtract ' + a + ' from both sides.'); };
  G.solve2 = function () { var a = rnd(2, 6), x = rnd(1, 9), b = rnd(1, 10); return inp('Solve:  ' + a + 'x + ' + b + ' = ' + (a * x + b), x, 'Subtract ' + b + ', then divide by ' + a + '.'); };
  G.solveNeg = function () { var a = rnd(2, 5), x = rnd(1, 8), b = rnd(1, 10); return inp('Solve:  ' + a + 'x − ' + b + ' = ' + (a * x - b), x, 'Add ' + b + ', then divide by ' + a + '.'); };
  G.likeTerms = function () { var a = rnd(2, 7), b = rnd(2, 7), c = rnd(1, 8); return mcStr('Simplify:  ' + a + 'x + ' + c + ' + ' + b + 'x', (a + b) + 'x + ' + c, [(a + b) + 'x', (a * b) + 'x + ' + c, (a + b + c) + 'x'], 'Combine x-terms.'); };
  G.distribute = function () { var a = rnd(2, 6), b = rnd(1, 7); return mcStr('Expand:  ' + a + '(x + ' + b + ')', a + 'x + ' + a * b, [a + 'x + ' + b, (a + 1) + 'x + ' + a * b, a + 'x + ' + (a + b)], 'Multiply ' + a + ' by each term.'); };
  G.slope = function () { var x1 = rnd(-4, 4), y1 = rnd(-4, 4), dx = rnd(1, 4), m = rnd(-4, 4); return mcNum('Slope through (' + x1 + ', ' + y1 + ') and (' + (x1 + dx) + ', ' + (y1 + m * dx) + ')?', m, { spread: 4, explain: 'rise/run = ' + (m * dx) + '/' + dx + ' = ' + m + '.' }); };
  G.lineY = function () { var m = rnd(1, 5), b = rnd(-5, 5), x = rnd(1, 5); return mcNum('For y = ' + m + 'x + ' + (b < 0 ? '(' + b + ')' : b) + ', find y when x = ' + x + '.', m * x + b, { explain: m + '·' + x + ' + ' + b + '.' }); };
  G.inequality = function () { var a = rnd(1, 9), b = rnd(a + 1, a + 12); return mcStr('Solve:  x + ' + a + ' > ' + b, 'x > ' + (b - a), ['x > ' + (b + a), 'x < ' + (b - a), 'x > ' + b], 'Subtract ' + a + '.'); };
  G.absValue = function () { var a = rnd(-12, -1); return mcNum('|' + a + '| + ' + Math.abs(rnd(1, 6)) + ' =  (evaluate)', Math.abs(a) + Math.abs(rnd(1, 6)), { nonneg: true, explain: 'Absolute value is distance from 0.' }); };
  G.system = function () { var x = rnd(1, 6), y = rnd(1, 6); return inp('If x + y = ' + (x + y) + ' and x − y = ' + (x - y) + ', find x.', x, 'Add the equations: 2x = ' + (2 * x) + '.'); };
  G.factor = function () { var p = rnd(1, 6), q = rnd(1, 6); return mcStr('Factor:  x² + ' + (p + q) + 'x + ' + p * q, '(x + ' + p + ')(x + ' + q + ')', ['(x + ' + (p + q) + ')(x + ' + p * q + ')', '(x + ' + (p + 1) + ')(x + ' + q + ')', '(x − ' + p + ')(x − ' + q + ')'], 'Two numbers adding to ' + (p + q) + ', multiplying to ' + p * q + '.'); };
  G.quadratic = function () { var p = rnd(1, 6), q = rnd(1, 6); return mcNum('One root of  x² − ' + (p + q) + 'x + ' + p * q + ' = 0 is x =  (smaller root)', Math.min(p, q), { nonneg: true, spread: 3, explain: 'Roots are ' + p + ' and ' + q + '.' }); };
  G.expLaw = function () { var a = rnd(2, 7), b = rnd(2, 7); return mcStr('Simplify:  x^' + a + ' · x^' + b, 'x^' + (a + b), ['x^' + a * b, 'x^' + Math.abs(a - b), '2x^' + (a + b)], 'Add exponents.'); };
  G.expDiv = function () { var a = rnd(5, 9), b = rnd(2, 4); return mcStr('Simplify:  x^' + a + ' ÷ x^' + b, 'x^' + (a - b), ['x^' + (a + b), 'x^' + Math.round(a / b), '1'], 'Subtract exponents.'); };
  G.funcEval = function () { var a = rnd(2, 5), b = rnd(1, 6), k = rnd(2, 6); return mcNum('If f(x) = ' + a + 'x − ' + b + ', find f(' + k + ').', a * k - b, { explain: a + '·' + k + ' − ' + b + '.' }); };
  G.funcComp = function () { var a = rnd(1, 3), b = rnd(1, 4), k = rnd(1, 4); var inner = a * k + b; return mcNum('If f(x) = ' + a + 'x + ' + b + ', find f(f(' + k + ')).', a * inner + b, { explain: 'f(' + k + ')=' + inner + ', then f(' + inner + ').' }); };
  G.arithSeq = function () { var a = rnd(1, 8), d = rnd(2, 6), n = rnd(4, 9); return inp('Arithmetic sequence starts at ' + a + ', common difference ' + d + '. The ' + n + 'th term?', a + (n - 1) * d, 'a + (n−1)d.'); };
  G.geoSeq = function () { var a = rnd(1, 4), r = rnd(2, 3), n = rnd(3, 5); return inp('Geometric sequence starts at ' + a + ', ratio ' + r + '. The ' + n + 'th term?', a * Math.pow(r, n - 1), 'a·r^(n−1).'); };
  G.radical = function () { var a = rnd(2, 6), b = pick([2, 3, 5, 6, 7]); return mcStr('Simplify  √' + a * a * b, a + '√' + b, [(a * a * b) + '√1', (a * b) + '√' + a, a + '√' + b * b], '√(' + a * a + '·' + b + ') = ' + a + '√' + b + '.'); };

  /* ---------------- GEOMETRY ---------------- */
  G.areaRect = function () { var l = rnd(3, 15), w = rnd(2, 12); return inp('Rectangle ' + l + ' by ' + w + '. Area (sq units)?', l * w, 'A = l × w.'); };
  G.perimRect = function () { var l = rnd(3, 15), w = rnd(2, 12); return inp('Rectangle ' + l + ' by ' + w + '. Perimeter (units)?', 2 * (l + w), 'P = 2(l + w).'); };
  G.areaTri = function () { var b = rnd(2, 12) * 2, h = rnd(2, 10); return inp('Triangle with base ' + b + ' and height ' + h + '. Area?', b * h / 2, 'A = ½ b h.'); };
  G.areaCircle = function () { var r = rnd(1, 9); return mcStr('Area of a circle with radius ' + r + '? (use π)', r * r + 'π', [(2 * r) + 'π', (r * r * r) + 'π', r + 'π'], 'A = πr² = ' + r * r + 'π.'); };
  G.circumference = function () { var r = rnd(1, 9); return mcStr('Circumference with radius ' + r + '? (use π)', (2 * r) + 'π', [r * r + 'π', r + 'π', (4 * r) + 'π'], 'C = 2πr.'); };
  G.volumeBox = function () { var a = rnd(2, 8), b = rnd(2, 8), c = rnd(2, 8); return inp('Rectangular prism ' + a + '×' + b + '×' + c + '. Volume?', a * b * c, 'V = l w h.'); };
  G.pythag = function () { var t = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]]); return inp('Right triangle legs ' + t[0] + ' and ' + t[1] + '. Hypotenuse?', t[2], '√(' + t[0] + '² + ' + t[1] + '²).'); };
  G.angles = function () { var a = rnd(20, 70); return mcNum('Two angles are complementary. One is ' + a + '°. The other?', 90 - a, { nonneg: true, spread: 10, explain: 'Complementary angles sum to 90°.' }); };
  G.anglesSup = function () { var a = rnd(30, 150); return mcNum('Two angles are supplementary. One is ' + a + '°. The other?', 180 - a, { nonneg: true, spread: 12, explain: 'Supplementary angles sum to 180°.' }); };
  G.triAngle = function () { var a = rnd(30, 80), b = rnd(30, 80); return mcNum('A triangle has angles ' + a + '° and ' + b + '°. The third angle?', 180 - a - b, { nonneg: true, spread: 10, explain: 'Angles of a triangle sum to 180°.' }); };

  /* ---------------- CALCULUS / PRECALC ---------------- */
  G.limitPoly = function () { var a = rnd(1, 4), c = rnd(1, 5), x = rnd(1, 4); return mcNum('lim(x→' + x + ') of ' + a + 'x² + ' + c, a * x * x + c, { explain: 'Substitute x = ' + x + '.' }); };
  G.limitRational = function () { var a = rnd(2, 6); return mcNum('lim(x→' + a + ') of (x² − ' + a * a + ')/(x − ' + a + ')', 2 * a, { explain: 'Factor and cancel → x + ' + a + '.' }); };
  G.derivPower = function () { var n = rnd(2, 6); return mcStr('d/dx of x^' + n, n + 'x^' + (n - 1), ['x^' + (n - 1), (n - 1) + 'x^' + n, n + 'x^' + n], 'Power rule.'); };
  G.derivPoly = function () { var a = rnd(2, 5), b = rnd(2, 6); return mcStr('d/dx of ' + a + 'x² + ' + b + 'x', (2 * a) + 'x + ' + b, [a + 'x + ' + b, (2 * a) + 'x + ' + 2 * b, (2 * a) + 'x'], 'Differentiate term by term.'); };
  G.derivChain = function () { var a = rnd(2, 4), n = rnd(2, 4); return mcStr('d/dx of (' + a + 'x + 1)^' + n, (n * a) + '(' + a + 'x + 1)^' + (n - 1), [n + '(' + a + 'x + 1)^' + (n - 1), (n * a) + '(' + a + 'x + 1)^' + n, a + '(' + a + 'x + 1)^' + (n - 1)], 'Chain rule.'); };
  G.derivTrig = function () { var f = pick([['sin(x)', 'cos(x)'], ['cos(x)', '−sin(x)'], ['tan(x)', 'sec²(x)']]); return mcStr('d/dx of ' + f[0], f[1], ['sin(x)', 'cos(x)', '−cos(x)', 'sec²(x)'].filter(function (x) { return x !== f[1]; }).slice(0, 3), 'Standard trig derivative.'); };
  G.deriv2 = function () { var a = rnd(2, 5); return mcStr('Second derivative of ' + a + 'x³', (6 * a) + 'x', [(3 * a) + 'x²', (6 * a) + 'x²', (a) + 'x'], 'First derivative ' + (3 * a) + 'x², second derivative ' + (6 * a) + 'x.'); };
  G.integralPower = function () { var n = rnd(1, 5); return mcStr('∫ x^' + n + ' dx', 'x^' + (n + 1) + '/' + (n + 1) + ' + C', ['x^' + (n - 1) + ' + C', (n + 1) + 'x^' + n + ' + C', 'x^' + (n + 1) + ' + C'], 'Add one to the exponent, divide by it.'); };
  G.defIntegral = function () { var c = rnd(2, 6), b = rnd(2, 6); return mcNum('∫₀^' + b + ' ' + c + ' dx', c * b, { explain: 'Constant c over [0,b] = c·b.' }); };
  G.tangent = function () { var a = rnd(1, 4), x = rnd(1, 4); return mcNum('For f(x) = ' + a + 'x², slope of the tangent at x = ' + x + '?', 2 * a * x, { explain: "f'(x)=" + 2 * a + 'x.' }); };
  G.logEval = function () { var b = pick([2, 3, 5, 10]), e = rnd(1, 3); return mcNum('log base ' + b + ' of ' + Math.pow(b, e) + ' =', e, { nonneg: true, spread: 2, explain: b + '^' + e + ' = ' + Math.pow(b, e) + '.' }); };

  /* ---------------- WORD PROBLEMS (real-world) ---------------- */
  var NAMES = ['Maya', 'Leo', 'Aisha', 'Diego', 'Priya', 'Noah', 'Zoe', 'Marcus', 'Sofia', 'Devon'];
  var WP = [
    function () { var r = rnd(3, 9), c = rnd(3, 9); return inp('A classroom has ' + r + ' rows of ' + c + ' desks. How many desks are there in all?', r * c, r + ' rows × ' + c + ' desks = ' + (r * c) + '.'); },
    function () { var b = rnd(4, 9), boxes = rnd(3, 9), extra = rnd(0, b - 1), total = b * boxes + extra; return inp('A baker packs ' + total + ' muffins into trays that hold ' + b + '. How many full trays can she fill?', boxes, Math.floor(total / b) + ' full trays, with ' + extra + ' left over.'); },
    function () { var n = rnd(3, 8), total = n * rnd(2, 9); return inp(n + ' friends share ' + total + ' marbles equally. How many does each friend get?', total / n, total + ' ÷ ' + n + ' = ' + (total / n) + '.'); },
    function () { var p = rnd(2, 9), n = rnd(2, 6), bill = Math.ceil((p * n + 1) / 5) * 5; return mcNum('You buy ' + n + ' notebooks at $' + p + ' each and pay with a $' + bill + ' bill. How much change do you get?', bill - p * n, { nonneg: true, spread: 4, explain: 'Cost is $' + (p * n) + ', so change is $' + (bill - p * n) + '.' }); },
    function () { var a = rnd(20, 90), pOff = pick([10, 20, 25, 50]); return mcNum('A $' + a + ' jacket is ' + pOff + '% off. What is the sale price?', a - a * pOff / 100, { nonneg: true, spread: 6, explain: pOff + '% of $' + a + ' is $' + (a * pOff / 100) + ' off.' }); },
    function () { var speed = rnd(30, 70), h = rnd(2, 5); return inp('A train travels ' + (speed * h) + ' miles in ' + h + ' hours. What is its average speed, in miles per hour?', speed, 'Distance ÷ time = ' + (speed * h) + ' ÷ ' + h + '.'); },
    function () { var d = pick([4, 5, 6, 8]), eaten = rnd(1, d - 1); return mcStr('A pizza is cut into ' + d + ' equal slices. ' + eaten + ' slices are eaten. What fraction is LEFT?', (d - eaten) + '/' + d, [eaten + '/' + d, (d - eaten) + '/' + (d + 1), d + '/' + eaten], (d - eaten) + ' of the ' + d + ' slices remain.'); },
    function () { var arr = [], sum = 0, n = 4; for (var i = 0; i < n; i++) { var v = rnd(60, 100); arr.push(v); sum += v; } while (sum % n) { arr[0]++; sum++; } return mcNum(pick(NAMES) + '\'s test scores were ' + arr.join(', ') + '. What is the average score?', sum / n, { spread: 5, explain: 'Add them (' + sum + ') and divide by ' + n + '.' }); },
    function () { var start = rnd(2, 6), rate = rnd(2, 5), weeks = rnd(3, 6); return inp('A plant is ' + start + ' cm tall and grows ' + rate + ' cm each week. How tall will it be after ' + weeks + ' weeks?', start + rate * weeks, start + ' + ' + rate + ' × ' + weeks + ' = ' + (start + rate * weeks) + '.'); },
    function () { var total = rnd(30, 90), boys = rnd(10, total - 10); return mcNum('A school has ' + total + ' students, and ' + boys + ' of them are boys. How many are girls?', total - boys, { nonneg: true, spread: 6, explain: total + ' − ' + boys + ' = ' + (total - boys) + '.' }); },
    function () { var hrs = rnd(2, 8), wage = rnd(8, 16); return inp(pick(NAMES) + ' earns $' + wage + ' per hour and works ' + hrs + ' hours. How much does ' + (hrs > 4 ? 'she' : 'he') + ' earn?', wage * hrs, wage + ' × ' + hrs + ' = ' + (wage * hrs) + '.'); }
  ];
  G.word = function () { return WP[rnd(0, WP.length - 1)](); };

  // ---- longer, multi-step CHALLENGE problems (harder) ----
  var CHAL = [
    function () { var b = rnd(8, 14), n = rnd(18, 26), c = rnd(6, 10), m = rnd(20, 34), sold = rnd(150, 260); var total = b * n + c * m; return inp('A bookstore received ' + b + ' boxes of novels with ' + n + ' books in each box, and ' + c + ' boxes of comics with ' + m + ' in each box. During the first week they sold ' + sold + ' books. How many books remain in stock?', total - sold, 'Novels: ' + b + '×' + n + ' = ' + b * n + '. Comics: ' + c + '×' + m + ' = ' + c * m + '. Total ' + total + ', minus ' + sold + ' sold.'); },
    function () { var s = rnd(2, 4), d = rnd(2, 3), days = 5; var terms = [], sum = 0; for (var i = 0; i < days; i++) { var t = s + i * d; terms.push(t); sum += t; } return inp('An athlete runs ' + s + ' miles on Monday, and each day runs ' + d + ' more miles than the day before. How many total miles does she run from Monday through Friday?', sum, 'Miles each day: ' + terms.join(' + ') + ' = ' + sum + '.'); },
    function () { var L = rnd(12, 18), W = rnd(8, 12); var inner = (L - 2) * (W - 2); return inp('A rectangular garden is ' + L + ' m long and ' + W + ' m wide. A path 1 m wide is built inside along all four edges. What is the area of the remaining inner rectangle, in square meters?', inner, 'The inner rectangle is (' + (L - 2) + ') by (' + (W - 2) + '): ' + inner + ' m².'); },
    function () { var a = pick([40, 50, 60]), b = pick([40, 50, 60]), t = rnd(2, 5); var d = (a + b) * t; return inp('Two trains leave stations ' + d + ' miles apart and travel toward each other, one at ' + a + ' mph and the other at ' + b + ' mph. After how many hours do they meet?', t, 'Their closing speed is ' + (a + b) + ' mph, so ' + d + ' ÷ ' + (a + b) + ' = ' + t + ' hours.'); },
    function () { var base = rnd(30, 60), up = pick([20, 25, 50]), off = pick([10, 20, 25]); var marked = base * (1 + up / 100); var fin = marked * (1 - off / 100); return mcNum('A store marks up a $' + base + ' item by ' + up + '%, then takes ' + off + '% off the marked price. What is the final price?', Math.round(fin * 100) / 100, { spread: 6, explain: 'Marked: $' + marked + '. Then ' + off + '% off → $' + (Math.round(fin * 100) / 100) + '.' }); },
    function () { var n = rnd(2, 9), mult = rnd(2, 4), add = rnd(3, 12); return inp('A number is multiplied by ' + mult + ', then ' + add + ' is added, giving ' + (n * mult + add) + '. What is the original number?', n, 'Reverse it: (' + (n * mult + add) + ' − ' + add + ') ÷ ' + mult + ' = ' + n + '.'); },
    function () { var art = rnd(4, 8), neither = rnd(2, 6), math = 3 * art; var total = art + math + neither; return inp('A class of ' + total + ' students has three times as many who prefer math as prefer art, and ' + neither + ' who prefer neither. How many students prefer math?', math, 'If art = a, then math = 3a, and a + 3a + ' + neither + ' = ' + total + ', so a = ' + art + ' and math = ' + math + '.'); },
    function () { var g = rnd(4, 6), mi = rnd(28, 40) * g, tank = rnd(10, 14); return inp('A car uses ' + g + ' gallons of gas to travel ' + mi + ' miles. How many miles can it travel on a full ' + tank + '-gallon tank?', mi / g * tank, 'Miles per gallon: ' + mi + ' ÷ ' + g + ' = ' + (mi / g) + '. Then × ' + tank + '.'); },
    function () { var ppl = pick([2, 4, 5]), cups = rnd(2, 6), want = ppl * rnd(2, 4); var need = cups / ppl * want; return inp('A recipe for ' + ppl + ' people needs ' + cups + ' cups of flour. How many cups are needed to make it for ' + want + ' people?', need, cups + ' ÷ ' + ppl + ' × ' + want + ' = ' + need + ' cups.'); },
    function () { var pencil = 50, penC = 120, np = rnd(4, 8), pens = rnd(3, 7); var totalC = np * pencil + pens * penC; return inp('Pencils cost $0.50 and pens cost $1.20. A student buys ' + np + ' pencils and some pens for a total of $' + (totalC / 100).toFixed(2) + '. How many pens did they buy?', pens, 'Pencils cost $' + (np * pencil / 100).toFixed(2) + '. The rest, $' + (pens * penC / 100).toFixed(2) + ', ÷ $1.20 = ' + pens + ' pens.'); }
  ];
  G.challenge = function () { return CHAL[rnd(0, CHAL.length - 1)](); };
  G.wpConsec = function () { var n = rnd(3, 25); return inp('Two consecutive whole numbers add up to ' + (2 * n + 1) + '. What is the smaller number?', n, 'n + (n + 1) = ' + (2 * n + 1) + ', so 2n + 1 = ' + (2 * n + 1) + '.'); };
  G.wpAge = function () { var y = rnd(3, 12), now = rnd(15, 40); return inp('In ' + y + ' years, ' + pick(NAMES) + ' will be ' + (now + y) + ' years old. How old is she now?', now, 'Subtract ' + y + ' from ' + (now + y) + '.'); };

  /* ---------------- STATIC BANKS ---------------- */
  function bankMC(item, bank) { var others = bank.filter(function (b) { return b.a !== item.a; }).map(function (b) { return b.a; }); return mcStr(item.q, item.a, shuffle(others).slice(0, 3), item.e || ''); }
  function bankGen(id) { var f = function () { var b = BANKS[id]; return bankMC(pick(b), b); }; f.isBank = true; return f; }

  var BANKS = {
    synonyms: [
      { q: 'Synonym for "happy"', a: 'joyful' }, { q: 'Synonym for "big"', a: 'enormous' }, { q: 'Synonym for "fast"', a: 'rapid' },
      { q: 'Synonym for "smart"', a: 'clever' }, { q: 'Synonym for "cold"', a: 'chilly' }, { q: 'Synonym for "angry"', a: 'furious' },
      { q: 'Synonym for "tired"', a: 'weary' }, { q: 'Synonym for "quiet"', a: 'silent' }, { q: 'Synonym for "brave"', a: 'courageous' },
      { q: 'Synonym for "tiny"', a: 'miniature' }, { q: 'Synonym for "begin"', a: 'commence' }, { q: 'Synonym for "end"', a: 'conclude' },
      { q: 'Synonym for "strange"', a: 'peculiar' }, { q: 'Synonym for "wealthy"', a: 'affluent' }, { q: 'Synonym for "honest"', a: 'truthful' },
      { q: 'Synonym for "difficult"', a: 'arduous' }, { q: 'Synonym for "calm"', a: 'serene' }, { q: 'Synonym for "brief"', a: 'concise' }
    ],
    antonyms: [
      { q: 'Antonym for "hot"', a: 'cold' }, { q: 'Antonym for "up"', a: 'down' }, { q: 'Antonym for "happy"', a: 'sad' },
      { q: 'Antonym for "empty"', a: 'full' }, { q: 'Antonym for "ancient"', a: 'modern' }, { q: 'Antonym for "generous"', a: 'stingy' },
      { q: 'Antonym for "expand"', a: 'shrink' }, { q: 'Antonym for "victory"', a: 'defeat' }, { q: 'Antonym for "arrive"', a: 'depart' },
      { q: 'Antonym for "bright"', a: 'dim' }, { q: 'Antonym for "increase"', a: 'decrease' }, { q: 'Antonym for "accept"', a: 'reject' },
      { q: 'Antonym for "temporary"', a: 'permanent' }, { q: 'Antonym for "artificial"', a: 'natural' }, { q: 'Antonym for "praise"', a: 'criticize' }
    ],
    grammar: [
      { q: 'Which is correct?', a: 'She and I went to the park.', e: 'Use the subject pronoun "I".' },
      { q: '"The dogs ___ barking."', a: 'are', e: 'Plural subject.' }, { q: '"___ raining today."', a: "It's", e: 'It\'s = it is.' },
      { q: '"___ house is blue."', a: 'Their', e: 'Possessive.' }, { q: 'Plural of "child"', a: 'children' },
      { q: 'Past tense of "run"', a: 'ran' }, { q: 'Which is a complete sentence?', a: 'The bird sang loudly.' },
      { q: 'The adverb in "She ran quickly."', a: 'quickly' }, { q: '"___ chairs are in the room."', a: 'Fewer' },
      { q: '"___ going to love this."', a: "You're" }, { q: 'Past tense of "swim"', a: 'swam' }, { q: 'Plural of "mouse"', a: 'mice' },
      { q: 'Superlative of "good"', a: 'best' }, { q: 'Comparative of "far"', a: 'farther' }
    ],
    partsofspeech: [
      { q: 'Part of speech: "quickly"', a: 'adverb' }, { q: 'Part of speech: "beautiful"', a: 'adjective' }, { q: 'Part of speech: "run"', a: 'verb' },
      { q: 'Part of speech: "elephant"', a: 'noun' }, { q: 'Part of speech: "and"', a: 'conjunction' }, { q: 'Part of speech: "under"', a: 'preposition' },
      { q: 'Part of speech: "she"', a: 'pronoun' }, { q: 'Part of speech: "wow"', a: 'interjection' }, { q: 'Part of speech: "happiness"', a: 'noun' },
      { q: 'Part of speech: "swiftly"', a: 'adverb' }
    ],
    figurative: [
      { q: '"The stars danced in the sky."', a: 'personification' }, { q: '"As brave as a lion"', a: 'simile' }, { q: '"Time is a thief"', a: 'metaphor' },
      { q: '"Buzz" and "clang"', a: 'onomatopoeia' }, { q: '"I\'ve told you a million times"', a: 'hyperbole' }, { q: '"The wind whispered"', a: 'personification' },
      { q: '"Her smile was sunshine"', a: 'metaphor' }, { q: '"Quick as lightning"', a: 'simile' }, { q: '"Peter Piper picked peppers"', a: 'alliteration' }
    ],
    inference: [
      { q: 'Sam grabbed an umbrella before leaving. Infer:', a: 'It might rain.' },
      { q: 'Wrapping paper on the floor and everyone cheered. What happened?', a: 'Someone opened gifts.' },
      { q: 'Mia yawned and rubbed her eyes in class. Mia is probably:', a: 'sleepy' },
      { q: 'Empty streets and closed shops. It is probably:', a: 'a holiday or night' },
      { q: 'Drooping plants, dry soil. Leo forgot to:', a: 'water them' },
      { q: 'The dog hid under the bed during loud booms. The dog is:', a: 'scared' },
      { q: 'She packed sunscreen and a towel. She is going to:', a: 'the beach' }
    ],
    mainidea: [
      { q: 'A passage on how bees collect pollen, make honey, and pollinate. Main idea:', a: 'the work bees do' },
      { q: 'A passage listing foods, sleep, and exercise. Main idea:', a: 'how to stay healthy' },
      { q: 'A passage on evaporation, clouds, and rain. Main idea:', a: 'the water cycle' },
      { q: 'A passage on a firefighter\'s tools, training, and duties. Main idea:', a: "a firefighter's job" },
      { q: 'A passage on planting, watering, and harvesting. Main idea:', a: 'growing a garden' }
    ],
    prefixes: [
      { q: '"un-" in "unhappy" means:', a: 'not' }, { q: '"re-" in "redo" means:', a: 'again' }, { q: '"pre-" in "preview" means:', a: 'before' },
      { q: '"-less" in "fearless" means:', a: 'without' }, { q: '"tri-" in "triangle" means:', a: 'three' }, { q: '"bi-" in "bicycle" means:', a: 'two' },
      { q: '"sub-" in "submarine" means:', a: 'under' }, { q: '"mis-" in "misplace" means:', a: 'wrongly' }, { q: '"-ful" in "hopeful" means:', a: 'full of' }
    ],
    analogies: [
      { q: 'Hot is to cold as up is to:', a: 'down' }, { q: 'Puppy is to dog as kitten is to:', a: 'cat' },
      { q: 'Author is to book as painter is to:', a: 'painting' }, { q: 'Finger is to hand as toe is to:', a: 'foot' },
      { q: 'Petal is to flower as leaf is to:', a: 'tree' }, { q: 'Doctor is to patient as teacher is to:', a: 'student' },
      { q: 'Second is to minute as minute is to:', a: 'hour' }, { q: 'Library is to books as bakery is to:', a: 'bread' }
    ],
    esVocab: [
      { q: 'Translate: "perro"', a: 'dog' }, { q: 'Translate: "gato"', a: 'cat' }, { q: 'Translate: "casa"', a: 'house' },
      { q: 'Translate: "libro"', a: 'book' }, { q: 'Translate: "agua"', a: 'water' }, { q: 'Translate: "escuela"', a: 'school' },
      { q: 'Translate: "amigo"', a: 'friend' }, { q: 'Translate: "sol"', a: 'sun' }, { q: 'Translate: "manzana"', a: 'apple' },
      { q: 'Translate: "árbol"', a: 'tree' }, { q: 'Translate: "leche"', a: 'milk' }, { q: 'Translate: "ciudad"', a: 'city' },
      { q: 'Translate: "trabajo"', a: 'work' }, { q: 'Translate: "tiempo"', a: 'time' }, { q: 'Translate: "comida"', a: 'food' },
      { q: 'Translate: "noche"', a: 'night' }, { q: 'Translate: "puerta"', a: 'door' }, { q: 'Translate: "ventana"', a: 'window' }
    ],
    esNumbers: [
      { q: '"cinco" =', a: '5' }, { q: '"diez" =', a: '10' }, { q: '"tres" =', a: '3' }, { q: '"ocho" =', a: '8' },
      { q: '"veinte" =', a: '20' }, { q: '"siete" =', a: '7' }, { q: '"quince" =', a: '15' }, { q: '"doce" =', a: '12' },
      { q: '"treinta" =', a: '30' }, { q: '"cien" =', a: '100' }, { q: '"cuarenta" =', a: '40' }, { q: '"nueve" =', a: '9' }
    ],
    esColors: [
      { q: '"rojo" =', a: 'red' }, { q: '"azul" =', a: 'blue' }, { q: '"verde" =', a: 'green' }, { q: '"amarillo" =', a: 'yellow' },
      { q: '"negro" =', a: 'black' }, { q: '"blanco" =', a: 'white' }, { q: '"morado" =', a: 'purple' }, { q: '"rosa" =', a: 'pink' },
      { q: '"naranja" =', a: 'orange' }, { q: '"gris" =', a: 'gray' }, { q: '"marrón" =', a: 'brown' }
    ],
    esArticles: [
      { q: '"___ casa" (feminine)', a: 'la' }, { q: '"___ libro" (masculine)', a: 'el' }, { q: '"___ perro"', a: 'el' },
      { q: '"___ escuela"', a: 'la' }, { q: '"___ gatos" (plural)', a: 'los' }, { q: '"___ manzanas" (plural)', a: 'las' },
      { q: '"___ agua"', a: 'el' }, { q: '"___ ciudad"', a: 'la' }
    ],
    esVerbs: [
      { q: 'Conjugate "hablar" for yo', a: 'hablo' }, { q: 'Conjugate "comer" for yo', a: 'como' }, { q: 'Conjugate "vivir" for yo', a: 'vivo' },
      { q: 'Conjugate "hablar" for tú', a: 'hablas' }, { q: 'Conjugate "comer" for él', a: 'come' }, { q: 'Conjugate "hablar" for nosotros', a: 'hablamos' },
      { q: 'Conjugate "ser" for yo', a: 'soy' }, { q: 'Conjugate "tener" for yo', a: 'tengo' }, { q: 'Conjugate "ir" for yo', a: 'voy' }
    ],
    esGreetings: [
      { q: '"Good morning" =', a: 'Buenos días' }, { q: '"Thank you" =', a: 'Gracias' }, { q: '"Goodbye" =', a: 'Adiós' },
      { q: '"Please" =', a: 'Por favor' }, { q: '"¿Cómo estás?" means', a: 'How are you?' }, { q: '"Me llamo..." means', a: 'My name is...' },
      { q: '"Good night" =', a: 'Buenas noches' }, { q: '"See you later" =', a: 'Hasta luego' }
    ],
    sciMatter: [
      { q: 'Which is a solid?', a: 'ice' }, { q: 'Water turning to vapor is', a: 'evaporation' }, { q: 'The third common state (with solid, liquid) is', a: 'gas' },
      { q: 'Melting turns a solid into a', a: 'liquid' }, { q: 'Freezing turns a liquid into a', a: 'solid' }, { q: 'Gas to liquid is', a: 'condensation' },
      { q: 'The smallest unit of an element is an', a: 'atom' }, { q: 'A substance made of two+ elements is a', a: 'compound' }
    ],
    sciSpace: [
      { q: 'Closest planet to the Sun?', a: 'Mercury' }, { q: 'Center of our solar system?', a: 'the Sun' }, { q: 'The Red Planet is', a: 'Mars' },
      { q: 'Earth\'s natural satellite is the', a: 'Moon' }, { q: 'Largest planet?', a: 'Jupiter' }, { q: 'A planet\'s path around the Sun is an', a: 'orbit' },
      { q: 'The planet with prominent rings is', a: 'Saturn' }, { q: 'A star that exploded is a', a: 'supernova' }, { q: 'Our galaxy is the', a: 'Milky Way' }
    ],
    sciLife: [
      { q: 'The basic unit of life is the', a: 'cell' }, { q: 'Plants make food via', a: 'photosynthesis' }, { q: 'Plants release which gas we breathe?', a: 'oxygen' },
      { q: 'Roots absorb', a: 'water' }, { q: 'A food chain starts with a', a: 'producer' }, { q: 'Plant-only eaters are', a: 'herbivores' },
      { q: 'The powerhouse of the cell is the', a: 'mitochondria' }, { q: 'Genetic material is stored in', a: 'DNA' }, { q: 'Meat-only eaters are', a: 'carnivores' }
    ],
    sciBody: [
      { q: 'Which organ pumps blood?', a: 'heart' }, { q: 'Which organ helps you breathe?', a: 'lungs' }, { q: 'Which organ controls the body?', a: 'brain' },
      { q: 'Bones together form the', a: 'skeleton' }, { q: 'Which organ digests food with acid?', a: 'stomach' }, { q: 'The largest organ is the', a: 'skin' },
      { q: 'Blood is carried by', a: 'vessels' }, { q: 'Muscles attach to bones by', a: 'tendons' }
    ],
    sciForces: [
      { q: 'The force pulling objects toward Earth is', a: 'gravity' }, { q: 'A push or pull is a', a: 'force' }, { q: 'Force that slows sliding is', a: 'friction' },
      { q: 'Energy of motion is ___ energy', a: 'kinetic' }, { q: 'Stored energy is ___ energy', a: 'potential' }, { q: 'A tool that makes work easier is a', a: 'simple machine' },
      { q: 'The unit of force is the', a: 'newton' }, { q: 'Speed in a direction is', a: 'velocity' }
    ],
    sciChem: [
      { q: 'Symbol for oxygen', a: 'O' }, { q: 'Symbol for hydrogen', a: 'H' }, { q: 'Symbol for gold', a: 'Au' }, { q: 'Symbol for sodium', a: 'Na' },
      { q: 'Water\'s chemical formula', a: 'H2O' }, { q: 'pH below 7 is', a: 'acidic' }, { q: 'pH above 7 is', a: 'basic' },
      { q: 'Table salt is sodium', a: 'chloride' }, { q: 'The center of an atom is the', a: 'nucleus' }
    ],
    civics: [
      { q: 'How many branches does the U.S. federal government have?', a: 'three' },
      { q: 'Which branch of government makes the laws?', a: 'legislative' },
      { q: 'Which branch of government enforces the laws?', a: 'executive' },
      { q: 'Which branch of government interprets the laws?', a: 'judicial' },
      { q: 'The first ten amendments to the Constitution are called the', a: 'Bill of Rights' },
      { q: 'How many U.S. senators does each state elect?', a: 'two' },
      { q: 'The highest court in the United States is the', a: 'Supreme Court' },
      { q: 'A formal change to the Constitution is called an', a: 'amendment' },
      { q: 'Citizens choose their leaders by', a: 'voting' },
      { q: 'The leader of the executive branch is the', a: 'President' },
      { q: 'The two houses of Congress are the Senate and the House of', a: 'Representatives' },
      { q: 'The system that lets each branch limit the others is checks and', a: 'balances' }
    ],
    economics: [
      { q: 'When supply is low and demand is high, the price tends to', a: 'rise' },
      { q: 'Money earned from working is called', a: 'income' },
      { q: 'Setting money aside to use later is called', a: 'saving' },
      { q: 'Goods brought into a country from abroad are', a: 'imports' },
      { q: 'Goods sold to other countries are', a: 'exports' },
      { q: 'A steady rise in prices across an economy is', a: 'inflation' },
      { q: 'Trading goods directly without money is called', a: 'bartering' },
      { q: 'A person who starts and runs a business is an', a: 'entrepreneur' },
      { q: 'The value of the next best choice you give up is the ___ cost', a: 'opportunity' },
      { q: 'Things people buy that are physical objects are called', a: 'goods' },
      { q: 'Work performed for others, like a haircut, is a', a: 'service' },
      { q: 'Money that is owed to someone else is', a: 'debt' }
    ],
    usHistory: [
      { q: 'The United States declared independence from', a: 'Britain' },
      { q: 'The main author of the Declaration of Independence was', a: 'Thomas Jefferson' },
      { q: 'The 1803 land deal that doubled U.S. size was the', a: 'Louisiana Purchase' },
      { q: 'Martin Luther King Jr. led the movement for', a: 'civil rights' },
      { q: 'The U.S. entered World War II after the attack on', a: 'Pearl Harbor' },
      { q: 'The 19th Amendment gave women the right to', a: 'vote' },
      { q: 'The Civil War was fought partly to end', a: 'slavery' },
      { q: 'The document that begins "We the People" is the', a: 'Constitution' },
      { q: 'Abraham Lincoln issued the Emancipation', a: 'Proclamation' },
      { q: 'The 1849 rush to California was for', a: 'gold' }
    ],
    worldHistory: [
      { q: 'Democracy first developed in ancient', a: 'Greece' },
      { q: 'The Renaissance began in', a: 'Italy' },
      { q: 'The printing press in Europe was developed by', a: 'Gutenberg' },
      { q: 'Ancient Egyptians wrote using picture symbols called', a: 'hieroglyphics' },
      { q: 'The Roman state was governed in part by a', a: 'Senate' },
      { q: 'The deadly 14th-century pandemic was the Black', a: 'Death' },
      { q: 'The huge wall built to defend a northern border is in', a: 'China' },
      { q: 'The French Revolution began in the year', a: '1789' },
      { q: 'The exchange of goods along Asia was the Silk', a: 'Road' },
      { q: 'Mummies and pyramids come from ancient', a: 'Egypt' }
    ],
    usStates: [
      { q: 'How many states are in the United States?', a: '50' },
      { q: 'Capital of California?', a: 'Sacramento' },
      { q: 'Capital of Texas?', a: 'Austin' },
      { q: 'Capital of New York State?', a: 'Albany' },
      { q: 'Capital of Florida?', a: 'Tallahassee' },
      { q: 'Mount Rushmore is carved in South', a: 'Dakota' },
      { q: 'The Grand Canyon is in the state of', a: 'Arizona' },
      { q: 'The Statue of Liberty stands in the harbor of', a: 'New York' }
    ],
    worldCapitals: [
      { q: 'Capital of Canada?', a: 'Ottawa' }, { q: 'Capital of Australia?', a: 'Canberra' },
      { q: 'Capital of Brazil?', a: 'Brasília' }, { q: 'Capital of Egypt?', a: 'Cairo' },
      { q: 'Capital of Germany?', a: 'Berlin' }, { q: 'Capital of Russia?', a: 'Moscow' },
      { q: 'Capital of China?', a: 'Beijing' }, { q: 'Capital of India?', a: 'New Delhi' },
      { q: 'Capital of Mexico?', a: 'Mexico City' }, { q: 'Capital of Spain?', a: 'Madrid' },
      { q: 'Capital of Kenya?', a: 'Nairobi' }, { q: 'Capital of Argentina?', a: 'Buenos Aires' }
    ],
    history: [
      { q: 'Who was the first U.S. president?', a: 'George Washington' }, { q: 'The Declaration of Independence was signed in', a: '1776' },
      { q: 'Who wrote the Emancipation Proclamation?', a: 'Abraham Lincoln' }, { q: 'Ancient pyramids were built by the', a: 'Egyptians' },
      { q: 'The Great Wall is located in', a: 'China' }, { q: 'WWII ended in', a: '1945' }, { q: 'The Roman Empire\'s capital was', a: 'Rome' },
      { q: 'Who led the Indian independence movement nonviolently?', a: 'Gandhi' }, { q: 'The ship that sank in 1912 was the', a: 'Titanic' },
      { q: 'The U.S. Civil War ended in', a: '1865' }, { q: 'Who explored and reached the Americas in 1492?', a: 'Columbus' },
      { q: 'The document limiting the English king\'s power (1215) was the', a: 'Magna Carta' }
    ],
    idioms: [
      { q: '"Break the ice" means to', a: 'start a conversation' }, { q: '"A piece of cake" means something', a: 'very easy' },
      { q: '"Under the weather" means feeling', a: 'sick' }, { q: '"Hit the books" means to', a: 'study hard' },
      { q: '"Once in a blue moon" means', a: 'very rarely' }, { q: '"Bite the bullet" means to', a: 'face something hard' },
      { q: '"Spill the beans" means to', a: 'reveal a secret' }, { q: '"Cost an arm and a leg" means', a: 'very expensive' },
      { q: '"Hit the nail on the head" means to be', a: 'exactly right' }, { q: '"Let the cat out of the bag" means to', a: 'reveal a secret' }
    ],
    homophones: [
      { q: 'Choose: "I ate ___ apples."', a: 'two' }, { q: 'Choose: "___ going home now."', a: "They're" },
      { q: 'Choose: "The dog wagged ___ tail."', a: 'its' }, { q: 'Choose: "___ book is this?"', a: 'Whose' },
      { q: 'Choose: "Please come ___."', a: 'here' }, { q: 'Choose: "I need a ___ of shoes."', a: 'pair' },
      { q: 'Choose: "The wind ___ hard."', a: 'blew' }, { q: 'Choose: "She ___ the race."', a: 'won' }
    ],
    sciEco: [
      { q: 'A group of the same species living together is a', a: 'population' }, { q: 'All the living and nonliving things in an area make an', a: 'ecosystem' },
      { q: 'An animal that hunts others is a', a: 'predator' }, { q: 'The animal that is hunted is the', a: 'prey' },
      { q: 'Organisms that break down dead matter are', a: 'decomposers' }, { q: 'An animal that eats both plants and meat is an', a: 'omnivore' },
      { q: 'The role an organism plays in its habitat is its', a: 'niche' }, { q: 'A relationship where both species benefit is', a: 'mutualism' }
    ],
    weather: [
      { q: 'Frozen rain is called', a: 'sleet' }, { q: 'A scientist who studies weather is a', a: 'meteorologist' },
      { q: 'Tiny water droplets in the sky form', a: 'clouds' }, { q: 'A violent spinning windstorm is a', a: 'tornado' },
      { q: 'The amount of water vapor in the air is', a: 'humidity' }, { q: 'A long period with no rain is a', a: 'drought' },
      { q: 'A huge ocean storm with strong winds is a', a: 'hurricane' }, { q: 'The tool that measures temperature is a', a: 'thermometer' }
    ],
    geography: [
      { q: 'Largest ocean?', a: 'Pacific' }, { q: 'Longest river?', a: 'Nile' }, { q: 'Largest desert?', a: 'Sahara' },
      { q: 'Tallest mountain?', a: 'Everest' }, { q: 'Capital of France?', a: 'Paris' }, { q: 'Capital of Japan?', a: 'Tokyo' },
      { q: 'Continent with the most countries?', a: 'Africa' }, { q: 'The U.S. state that is an island chain?', a: 'Hawaii' },
      { q: 'Largest country by area?', a: 'Russia' }, { q: 'Capital of Italy?', a: 'Rome' }, { q: 'The line at 0° latitude is the', a: 'Equator' },
      { q: 'Country shaped like a boot?', a: 'Italy' }, { q: 'Smallest continent?', a: 'Australia' }, { q: 'Great Barrier Reef is near', a: 'Australia' }
    ]
  };

  /* ---------------- SUBJECT REGISTRY ---------------- */
  var SUBJECTS = [
    { id: 'math', name: 'Mathematics', color: 'var(--s-math)', icon: 'calculator', blurb: 'Number sense, operations, fractions, ratios and data.', skills: [
      { id: 'count', name: 'Counting', grades: [0, 1], gen: G.count },
      { id: 'add1', name: 'Addition within 20', grades: [0, 2], gen: G.add1 },
      { id: 'sub1', name: 'Subtraction within 20', grades: [0, 2], gen: G.sub1 },
      { id: 'add2', name: 'Multi-digit addition', grades: [2, 4], gen: G.add2 },
      { id: 'sub2', name: 'Multi-digit subtraction', grades: [2, 4], gen: G.sub2 },
      { id: 'mult', name: 'Multiplication facts', grades: [3, 5], gen: G.mult },
      { id: 'multBig', name: 'Multi-digit multiplication', grades: [4, 6], gen: G.multBig },
      { id: 'div', name: 'Division facts', grades: [3, 6], gen: G.div },
      { id: 'divRem', name: 'Division with remainders', grades: [4, 6], gen: G.divRem },
      { id: 'place', name: 'Place value', grades: [2, 4], gen: G.place },
      { id: 'round', name: 'Rounding', grades: [3, 5], gen: G.round },
      { id: 'fracCmp', name: 'Comparing fractions', grades: [4, 6], gen: G.fracCmp },
      { id: 'fracAdd', name: 'Adding fractions', grades: [4, 6], gen: G.fracAdd },
      { id: 'fracSimplify', name: 'Simplifying fractions', grades: [5, 7], gen: G.fracSimplify },
      { id: 'decAdd', name: 'Adding decimals', grades: [5, 7], gen: G.decAdd },
      { id: 'decMul', name: 'Multiplying decimals', grades: [5, 7], gen: G.decMul },
      { id: 'percent', name: 'Percent of a number', grades: [6, 8], gen: G.percent },
      { id: 'percentChange', name: 'Percent change', grades: [7, 9], gen: G.percentChange },
      { id: 'ratio', name: 'Ratios', grades: [6, 8], gen: G.ratio },
      { id: 'oop', name: 'Order of operations', grades: [5, 7], gen: G.oop },
      { id: 'oop2', name: 'Grouping symbols', grades: [5, 8], gen: G.oop2 },
      { id: 'intAdd', name: 'Adding integers', grades: [6, 8], gen: G.intAdd },
      { id: 'intMul', name: 'Multiplying integers', grades: [6, 8], gen: G.intMul },
      { id: 'exp', name: 'Exponents', grades: [6, 8], gen: G.exp },
      { id: 'sqrt', name: 'Square roots', grades: [6, 9], gen: G.sqrt },
      { id: 'mean', name: 'Mean', grades: [5, 8], gen: G.mean },
      { id: 'median', name: 'Median', grades: [6, 8], gen: G.median },
      { id: 'mode', name: 'Mode', grades: [6, 8], gen: G.mode },
      { id: 'range', name: 'Range', grades: [6, 8], gen: G.range },
      { id: 'prime', name: 'Prime & composite', grades: [4, 6], gen: G.prime },
      { id: 'gcf', name: 'Greatest common factor', grades: [5, 7], gen: G.gcf },
      { id: 'lcm', name: 'Least common multiple', grades: [5, 7], gen: G.lcm },
      { id: 'unitRate', name: 'Unit rates', grades: [6, 8], gen: G.unitRate },
      { id: 'proportion', name: 'Proportions', grades: [6, 8], gen: G.proportion },
      { id: 'money', name: 'Money problems', grades: [1, 5], gen: G.money },
      { id: 'time', name: 'Elapsed time', grades: [2, 5], gen: G.time },
      { id: 'word', name: 'Word problems', grades: [2, 8], gen: G.word },
      { id: 'challenge', name: 'Challenge word problems', grades: [5, 10], gen: G.challenge }
    ] },
    { id: 'algebra', name: 'Algebra', color: 'var(--s-algebra)', icon: 'variable', blurb: 'Expressions, equations, functions and inequalities.', skills: [
      { id: 'evalExpr', name: 'Evaluating expressions', grades: [6, 9], gen: G.evalExpr },
      { id: 'solve1', name: 'One-step equations', grades: [6, 9], gen: G.solve1 },
      { id: 'solve2', name: 'Two-step equations', grades: [7, 10], gen: G.solve2 },
      { id: 'solveNeg', name: 'Equations with subtraction', grades: [7, 10], gen: G.solveNeg },
      { id: 'likeTerms', name: 'Combining like terms', grades: [7, 10], gen: G.likeTerms },
      { id: 'distribute', name: 'Distributive property', grades: [7, 10], gen: G.distribute },
      { id: 'slope', name: 'Slope from two points', grades: [8, 11], gen: G.slope },
      { id: 'lineY', name: 'Evaluating linear functions', grades: [8, 11], gen: G.lineY },
      { id: 'inequality', name: 'Solving inequalities', grades: [8, 11], gen: G.inequality },
      { id: 'absValue', name: 'Absolute value', grades: [7, 10], gen: G.absValue },
      { id: 'system', name: 'Systems of equations', grades: [9, 12], gen: G.system },
      { id: 'factor', name: 'Factoring quadratics', grades: [9, 12], gen: G.factor },
      { id: 'quadratic', name: 'Solving quadratics', grades: [9, 12], gen: G.quadratic },
      { id: 'expLaw', name: 'Product of powers', grades: [8, 11], gen: G.expLaw },
      { id: 'expDiv', name: 'Quotient of powers', grades: [8, 11], gen: G.expDiv },
      { id: 'funcEval', name: 'Function notation', grades: [8, 11], gen: G.funcEval },
      { id: 'funcComp', name: 'Composite functions', grades: [10, 12], gen: G.funcComp },
      { id: 'arithSeq', name: 'Arithmetic sequences', grades: [9, 12], gen: G.arithSeq },
      { id: 'geoSeq', name: 'Geometric sequences', grades: [9, 12], gen: G.geoSeq },
      { id: 'radical', name: 'Simplifying radicals', grades: [9, 12], gen: G.radical },
      { id: 'wpConsec', name: 'Word problems: consecutive integers', grades: [7, 10], gen: G.wpConsec },
      { id: 'wpAge', name: 'Word problems: ages', grades: [6, 9], gen: G.wpAge }
    ] },
    { id: 'geometry', name: 'Geometry', color: 'var(--s-science)', icon: 'shapes', blurb: 'Area, perimeter, volume, angles and the Pythagorean theorem.', skills: [
      { id: 'perimRect', name: 'Perimeter of rectangles', grades: [3, 5], gen: G.perimRect },
      { id: 'areaRect', name: 'Area of rectangles', grades: [3, 6], gen: G.areaRect },
      { id: 'areaTri', name: 'Area of triangles', grades: [5, 8], gen: G.areaTri },
      { id: 'areaCircle', name: 'Area of circles', grades: [6, 9], gen: G.areaCircle },
      { id: 'circumference', name: 'Circumference', grades: [6, 9], gen: G.circumference },
      { id: 'volumeBox', name: 'Volume of prisms', grades: [5, 8], gen: G.volumeBox },
      { id: 'angles', name: 'Complementary angles', grades: [4, 8], gen: G.angles },
      { id: 'anglesSup', name: 'Supplementary angles', grades: [4, 8], gen: G.anglesSup },
      { id: 'triAngle', name: 'Triangle angle sum', grades: [5, 9], gen: G.triAngle },
      { id: 'pythag', name: 'Pythagorean theorem', grades: [8, 11], gen: G.pythag }
    ] },
    { id: 'calculus', name: 'Calculus', color: 'var(--s-calculus)', icon: 'sigma', blurb: 'Limits, derivatives, integrals and logarithms.', skills: [
      { id: 'limitPoly', name: 'Limits of polynomials', grades: [11, 12], gen: G.limitPoly },
      { id: 'limitRational', name: 'Limits (factor & cancel)', grades: [11, 12], gen: G.limitRational },
      { id: 'logEval', name: 'Evaluating logarithms', grades: [10, 12], gen: G.logEval },
      { id: 'derivPower', name: 'Power rule', grades: [11, 12], gen: G.derivPower },
      { id: 'derivPoly', name: 'Derivatives of polynomials', grades: [11, 12], gen: G.derivPoly },
      { id: 'derivChain', name: 'Chain rule', grades: [12, 12], gen: G.derivChain },
      { id: 'derivTrig', name: 'Derivatives of trig', grades: [12, 12], gen: G.derivTrig },
      { id: 'deriv2', name: 'Second derivatives', grades: [12, 12], gen: G.deriv2 },
      { id: 'integralPower', name: 'Power rule for integrals', grades: [12, 12], gen: G.integralPower },
      { id: 'defIntegral', name: 'Definite integrals', grades: [12, 12], gen: G.defIntegral },
      { id: 'tangent', name: 'Tangent line slope', grades: [11, 12], gen: G.tangent }
    ] },
    { id: 'reading', name: 'Reading & Language', color: 'var(--s-reading)', icon: 'book-open', blurb: 'Vocabulary, comprehension, grammar and language arts.', skills: [
      { id: 'synonyms', name: 'Synonyms', grades: [1, 8], gen: bankGen('synonyms') },
      { id: 'antonyms', name: 'Antonyms', grades: [1, 8], gen: bankGen('antonyms') },
      { id: 'grammar', name: 'Grammar & usage', grades: [3, 9], gen: bankGen('grammar') },
      { id: 'partsofspeech', name: 'Parts of speech', grades: [3, 8], gen: bankGen('partsofspeech') },
      { id: 'figurative', name: 'Figurative language', grades: [4, 10], gen: bankGen('figurative') },
      { id: 'inference', name: 'Making inferences', grades: [3, 9], gen: bankGen('inference') },
      { id: 'mainidea', name: 'Main idea', grades: [3, 9], gen: bankGen('mainidea') },
      { id: 'prefixes', name: 'Prefixes & suffixes', grades: [3, 8], gen: bankGen('prefixes') },
      { id: 'analogies', name: 'Analogies', grades: [4, 10], gen: bankGen('analogies') },
      { id: 'idioms', name: 'Idioms', grades: [4, 10], gen: bankGen('idioms') },
      { id: 'homophones', name: 'Homophones', grades: [3, 8], gen: bankGen('homophones') }
    ] },
    { id: 'spanish', name: 'Spanish', color: 'var(--s-spanish)', icon: 'globe', blurb: 'Vocabulary, numbers, articles and verb conjugation.', skills: [
      { id: 'esVocab', name: 'Vocabulary', grades: [1, 12], gen: bankGen('esVocab') },
      { id: 'esNumbers', name: 'Numbers', grades: [1, 8], gen: bankGen('esNumbers') },
      { id: 'esColors', name: 'Colors', grades: [1, 8], gen: bankGen('esColors') },
      { id: 'esArticles', name: 'Articles', grades: [3, 10], gen: bankGen('esArticles') },
      { id: 'esVerbs', name: 'Verb conjugation', grades: [5, 12], gen: bankGen('esVerbs') },
      { id: 'esGreetings', name: 'Greetings & phrases', grades: [1, 10], gen: bankGen('esGreetings') }
    ] },
    { id: 'science', name: 'Science', color: 'var(--s-science)', icon: 'flask-conical', blurb: 'Matter, space, life science, the body, forces and chemistry.', skills: [
      { id: 'sciMatter', name: 'States of matter', grades: [2, 8], gen: bankGen('sciMatter') },
      { id: 'sciSpace', name: 'Astronomy', grades: [2, 9], gen: bankGen('sciSpace') },
      { id: 'sciLife', name: 'Life science', grades: [3, 9], gen: bankGen('sciLife') },
      { id: 'sciBody', name: 'Human body', grades: [3, 9], gen: bankGen('sciBody') },
      { id: 'sciForces', name: 'Forces & energy', grades: [4, 10], gen: bankGen('sciForces') },
      { id: 'sciChem', name: 'Chemistry basics', grades: [6, 11], gen: bankGen('sciChem') },
      { id: 'sciEco', name: 'Ecosystems', grades: [4, 9], gen: bankGen('sciEco') },
      { id: 'weather', name: 'Weather', grades: [3, 8], gen: bankGen('weather') }
    ] },
    { id: 'history', name: 'History', color: 'var(--s-history)', icon: 'library', blurb: 'People, events and turning points that shaped the world.', skills: [
      { id: 'history', name: 'History overview', grades: [4, 12], gen: bankGen('history') },
      { id: 'usHistory', name: 'U.S. history', grades: [5, 12], gen: bankGen('usHistory') },
      { id: 'worldHistory', name: 'World history', grades: [6, 12], gen: bankGen('worldHistory') }
    ] },
    { id: 'geography', name: 'Geography', color: 'var(--s-geography)', icon: 'globe', blurb: 'Continents, capitals, landforms and the physical world.', skills: [
      { id: 'geography', name: 'World geography', grades: [3, 12], gen: bankGen('geography') },
      { id: 'worldCapitals', name: 'World capitals', grades: [4, 12], gen: bankGen('worldCapitals') },
      { id: 'usStates', name: 'U.S. states & capitals', grades: [4, 12], gen: bankGen('usStates') }
    ] },
    { id: 'civics', name: 'Civics', color: 'var(--s-algebra)', icon: 'file-text', blurb: 'Government, the Constitution, rights and citizenship.', skills: [
      { id: 'civics', name: 'U.S. government & civics', grades: [4, 12], gen: bankGen('civics') }
    ] },
    { id: 'economics', name: 'Economics', color: 'var(--s-science)', icon: 'chart-column', blurb: 'Money, trade, supply and demand, and everyday economics.', skills: [
      { id: 'economics', name: 'Economics basics', grades: [6, 12], gen: bankGen('economics') }
    ] }
  ];

  var SKILL_INDEX = {};
  var OWN_STRAND = ['reading', 'spanish', 'science', 'history', 'geography', 'civics', 'economics'];
  SUBJECTS.forEach(function (s) {
    s.skills.forEach(function (k) {
      k.subject = s.id;
      if (!k.strand) k.strand = OWN_STRAND.indexOf(s.id) !== -1 ? k.name : 'Essentials';
      SKILL_INDEX[k.id] = k;
    });
  });

  /* ============================================================
     MEGA CATALOG — procedural micro-skills (IXL-style).
     Thousands of grade- and level-specific skills, each backed by
     a generator that produces a brand-new problem on every call.
     ============================================================ */
  (function () {
    var subjById = {};
    SUBJECTS.forEach(function (s) { subjById[s.id] = s; s.strands = {}; });
    var seq = 0;
    var LX = 4; // level multiplier — scales per-skill difficulty tiers to reach an IXL-sized catalog
    function addFam(sub, strand, name, band, makeGen, levels) {
      var s = subjById[sub]; if (!s) return;
      levels = Math.max(1, Math.round((levels || 1) * LX));
      for (var g = band[0]; g <= band[1]; g++) {
        for (var lv = 1; lv <= levels; lv++) {
          var nm = levels > 1 ? name + ' · Level ' + lv : name;
          var id = 'k' + (seq++);
          var sk = { id: id, name: nm, subject: sub, strand: strand, grade: g, grades: [g, g], level: lv, gen: makeGen(g, lv) };
          s.skills.push(sk); SKILL_INDEX[id] = sk;
        }
        s.strands[strand] = true;
      }
    }

    // ----- number & operations -----
    [2,3,4,5,6,7,8,9,10,11,12].forEach(function (n) {
      addFam('math','Multiplication','Multiply by '+n,[3,8], function(g,lv){ return function(){ var b=rnd(2, 9+(lv-1)*20+Math.max(0,g-3)*4); return inp(n+' × '+b+' =', n*b, n+' groups of '+b+'.'); }; }, 3);
      addFam('math','Division','Divide by '+n,[3,8], function(g,lv){ return function(){ var q=rnd(2, 9+(lv-1)*10); return inp((n*q)+' ÷ '+n+' =', q, n+' × '+q+' = '+(n*q)+'.'); }; }, 3);
      addFam('math','Multiplication','Missing factor: '+n+' × ?',[3,7], function(g,lv){ return function(){ var q=rnd(2, 9+(lv-1)*6); return inp(n+' × ? = '+(n*q)+'   (find ?)', q); }; }, 2);
    });
    [10,20,50,100,500,1000,10000].forEach(function (m) {
      addFam('math','Addition','Add within '+m,[0,6], function(g,lv){ return function(){ var a=rnd(0,m), b=rnd(0,Math.max(0,m-a)); return inp(a+' + '+b+' =', a+b); }; }, 2);
      addFam('math','Subtraction','Subtract within '+m,[0,6], function(g,lv){ return function(){ var a=rnd(1,m), b=rnd(0,a); return inp(a+' − '+b+' =', a-b); }; }, 2);
    });
    [2,3,4,5,10,25,50,100].forEach(function (n) {
      addFam('math','Number sense','Skip-count by '+n,[0,4], function(g,lv){ return function(){ var st=rnd(0,6)*n; return inp('Skip-count by '+n+':  '+st+', '+(st+n)+', '+(st+2*n)+', ?', st+3*n); }; });
    });
    [10,100,1000,10000].forEach(function (p) {
      addFam('math','Rounding','Round to nearest '+p,[3,7], function(g,lv){ return function(){ var n=rnd(p, p*(40+lv*40)+rnd(1,p-1)); return mcNum('Round '+n+' to the nearest '+p, Math.round(n/p)*p, {spread:p}); }; }, 2);
    });
    [['tens',10],['hundreds',100],['thousands',1000],['ten thousands',10000]].forEach(function (pv) {
      addFam('math','Place value','Value of a digit ('+pv[0]+')',[2,6], function(g,lv){ return function(){ var d=rnd(4,6); var n=rnd(Math.pow(10,d-1), Math.pow(10,d)-1); var s=String(n); var idx=rnd(0,s.length-1); var val=Math.pow(10, s.length-1-idx); var names={1:'ones',10:'tens',100:'hundreds',1000:'thousands',10000:'ten thousands',100000:'hundred thousands'}; return mcStr('In '+n+', the digit '+s[idx]+' is in the ___ place.', names[val], ['ones','tens','hundreds','thousands','ten thousands'].filter(function(x){return x!==names[val];}).slice(0,3)); }; });
    });
    [2,3,4,5,6,7,8,9,10,11,12].forEach(function (d) {
      addFam('math','Fractions','Add fractions (denominator '+d+')',[4,9], function(g,lv){ return function(){ var a=rnd(1,d-1), b=rnd(1,d-1); if(a+b>=d) b=Math.max(1,d-a); return inp(a+'/'+d+' + '+b+'/'+d+' =   (write n/'+d+')', (a+b)+'/'+d); }; }, 2);
      addFam('math','Fractions','Subtract fractions (denominator '+d+')',[4,9], function(g,lv){ return function(){ var a=rnd(2,d-1), b=rnd(1,a-1); return inp(a+'/'+d+' − '+b+'/'+d+' =   (write n/'+d+')', (a-b)+'/'+d); }; }, 2);
      addFam('math','Fractions','Compare fractions (denominator '+d+')',[3,8], function(g,lv){ return function(){ var a=rnd(1,d-1), b=rnd(1,d-1); var ans=a>b?'>':(a<b?'<':'='); return mcStr(a+'/'+d+'  ?  '+b+'/'+d, ans, ['>','<','='].filter(function(x){return x!==ans;})); }; });
      addFam('math','Fractions','Equivalent fractions of 1/'+d,[4,8], function(g,lv){ return function(){ var k=rnd(2,6); return inp('1/'+d+' = ?/'+(d*k)+'   (numerator)', k); }; });
    });
    ['Add','Subtract','Multiply','Round','Compare'].forEach(function (op) {
      addFam('math','Decimals',op+' decimals',[5,9], function(g,lv){ return function(){ var a=rnd(1,99)/Math.pow(10,rnd(1,2)), b=rnd(1,99)/Math.pow(10,rnd(1,2));
        if(op==='Add') return inp(a+' + '+b+' =', Math.round((a+b)*100)/100);
        if(op==='Subtract'){ var x=Math.max(a,b),y=Math.min(a,b); return inp(x+' − '+y+' =', Math.round((x-y)*100)/100); }
        if(op==='Multiply'){ var c=rnd(2,9); return inp(a+' × '+c+' =', Math.round(a*c*100)/100); }
        if(op==='Round'){ var n=rnd(100,9999)/100; return mcNum('Round '+n+' to the nearest whole number', Math.round(n), {spread:2}); }
        var ans=a>b?'>':(a<b?'<':'='); return mcStr(a+'  ?  '+b, ans, ['>','<','='].filter(function(z){return z!==ans;})); }; }, 2);
    });
    [5,10,15,20,25,50,75].forEach(function (p) {
      addFam('math','Percents','Find '+p+'% of a number',[6,10], function(g,lv){ return function(){ var w=pick([20,40,60,80,100,120,160,200,240]); return mcNum(p+'% of '+w+' = ?', Math.round(p/100*w), {spread:8,nonneg:true}); }; }, 2);
    });
    ['Percent increase','Percent decrease','Discount price','Sales tax','Tip amount','Fraction to percent','Decimal to percent'].forEach(function (t) {
      addFam('math','Percents',t,[6,11], function(g,lv){ return function(){
        if(t==='Fraction to percent'){ var d=pick([2,4,5,10,20,25]); var nn=rnd(1,d-1); return inp(nn+'/'+d+' as a percent (e.g. 50) =', Math.round(nn/d*100)); }
        if(t==='Decimal to percent'){ var x=rnd(1,99)/100; return inp(x+' as a percent (e.g. 50) =', Math.round(x*100)); }
        var base=pick([20,40,50,80,100,200]), pc=pick([10,20,25,50]);
        if(t==='Percent increase') return mcNum(base+' increased by '+pc+'% = ?', base+base*pc/100,{spread:6});
        if(t==='Percent decrease') return mcNum(base+' decreased by '+pc+'% = ?', base-base*pc/100,{spread:6});
        if(t==='Discount price') return mcNum('A $'+base+' item is '+pc+'% off. Sale price = ?', base-base*pc/100,{spread:6,nonneg:true});
        if(t==='Sales tax') return mcNum('A $'+base+' item has '+pc+'% tax. Total = ?', base+base*pc/100,{spread:6});
        return mcNum('A '+pc+'% tip on a $'+base+' bill = ?', base*pc/100,{spread:5,nonneg:true}); }; }, 1);
    });
    [2,3,4,5,6,7,8,9,10].forEach(function (n) {
      addFam('math','Exponents','Powers of '+n,[6,10], function(g,lv){ return function(){ var e=rnd(2, 2+lv); return inp(n+'^'+e+' =', Math.pow(n,e)); }; }, 2);
    });
    addFam('math','Exponents','Square roots (perfect squares)',[6,10], function(g,lv){ return function(){ var r=rnd(2, 12+lv*6); return inp('√'+(r*r)+' =', r); }; }, 2);
    addFam('math','Exponents','Scientific notation',[7,11], function(g,lv){ return function(){ var a=rnd(1,9), e=rnd(2,6); return inp('Write '+a+' × 10^'+e+' as a whole number', a*Math.pow(10,e)); }; });
    ['Add','Subtract','Multiply','Divide','Compare'].forEach(function (op) {
      addFam('math','Integers',op+' integers',[6,9], function(g,lv){ return function(){ var a=rnd(-9-(lv-1)*10,9+(lv-1)*10), b=rnd(-9-(lv-1)*10,9+(lv-1)*10); var A=(a<0?'('+a+')':a), B=(b<0?'('+b+')':b);
        if(op==='Add') return mcNum(A+' + '+B+' =', a+b);
        if(op==='Subtract') return mcNum(A+' − '+B+' =', a-b);
        if(op==='Multiply') return mcNum(A+' × '+B+' =', a*b);
        if(op==='Divide'){ if(b===0)b=2; return mcNum((a*b)+' ÷ ('+b+') =', a); }
        var ans=a>b?'>':(a<b?'<':'='); return mcStr(A+'  ?  '+B, ans, ['>','<','='].filter(function(z){return z!==ans;})); }; }, 2);
    });
    addFam('math','Order of operations','Evaluate expressions',[5,9], function(g,lv){ return function(){ var a=rnd(2,9),b=rnd(2,9),c=rnd(2,9); if(lv>1) return mcNum('('+a+' + '+b+') × '+c+' =', (a+b)*c); return mcNum(a+' + '+b+' × '+c+' =', a+b*c); }; }, 2);
    [2,3,4,5,6,9,10].forEach(function (n) {
      addFam('math','Number theory','Divisibility by '+n,[4,8], function(g,lv){ return function(){ var x=rnd(10,200); var ans=(x%n===0)?'Yes':'No'; return mcStr('Is '+x+' divisible by '+n+'?', ans, [ans==='Yes'?'No':'Yes']); }; });
    });
    ['Prime or composite','Factor count','Multiples','Greatest common factor','Least common multiple','Even or odd'].forEach(function (t) {
      addFam('math','Number theory',t,[4,8], function(g,lv){ return function(){
        if(t==='Prime or composite'){ var n=rnd(2,60); var ans=isPrime(n)?'Prime':'Composite'; return mcStr('Is '+n+' prime or composite?', ans, [ans==='Prime'?'Composite':'Prime']); }
        if(t==='Even or odd'){ var n2=rnd(1,200); var a2=n2%2?'Odd':'Even'; return mcStr('Is '+n2+' even or odd?', a2, [a2==='Odd'?'Even':'Odd']); }
        if(t==='Greatest common factor'){ var a=rnd(6,48),b=rnd(6,48); return inp('GCF of '+a+' and '+b+' =', gcd(a,b)); }
        if(t==='Least common multiple'){ var a=rnd(2,12),b=rnd(2,12); return inp('LCM of '+a+' and '+b+' =', a*b/gcd(a,b)); }
        if(t==='Multiples'){ var n3=rnd(2,9),k=rnd(3,7); return inp('The '+k+'th multiple of '+n3+' =', n3*k); }
        var n4=rnd(12,60); var f=0; for(var i=1;i<=n4;i++) if(n4%i===0) f++; return mcNum('How many factors does '+n4+' have?', f, {nonneg:true,spread:3}); }; }, 1);
    });
    [['minutes','hours',60],['seconds','minutes',60],['days','weeks',7],['centimeters','meters',100],['millimeters','centimeters',10],['inches','feet',12],['feet','yards',3],['grams','kilograms',1000],['milliliters','liters',1000],['ounces','pounds',16],['hours','days',24]].forEach(function (u) {
      addFam('math','Measurement','Convert '+u[1]+' to '+u[0],[2,7], function(g,lv){ return function(){ var q=rnd(2, 9+lv*3); return inp(q+' '+u[1]+' = ? '+u[0], q*u[2]); }; }, 2);
    });
    ['Add money','Make change','Count coins'].forEach(function (t) {
      addFam('math','Money',t,[1,5], function(g,lv){ return function(){
        if(t==='Add money'){ var a=rnd(1,20),b=rnd(1,20); return inp('$'+a+' + $'+b+' = $?', a+b); }
        if(t==='Make change'){ var cost=rnd(1,19); return mcNum('You pay $20 for a $'+cost+' item. Change = ?', 20-cost,{nonneg:true,spread:4}); }
        var q=rnd(1,4),d=rnd(1,5),n=rnd(1,5); return inp(q+' quarters, '+d+' dimes, '+n+' nickels = ? cents', q*25+d*10+n*5); }; });
    });
    addFam('math','Time','Elapsed time',[1,5], function(g,lv){ return function(){ var h=rnd(1,6),m=pick([0,15,30,45]); var add=rnd(1,4)*15; var tot=h*60+m+add; var eh=Math.floor(tot/60)%12||12, em=tot%60; return mcStr('It is '+h+':'+(m<10?'0'+m:m)+'. Time '+add+' minutes later?', eh+':'+(em<10?'0'+em:em), [(eh+1)+':'+(em<10?'0'+em:em), h+':'+(m<10?'0'+m:m)]); }; });
    ['Addition','Subtraction','Multiplication','Division','Multi-step','Fraction','Percent','Rate'].forEach(function (ty) {
      addFam('math','Word problems',ty+' word problems',[2,9], function(g,lv){ return function(){ return G.word(); }; });
    });
    addFam('math','Word problems','Challenge word problems',[5,10], function(g,lv){ return function(){ return G.challenge(); }; });
    ['Mean','Median','Mode','Range','Probability'].forEach(function (t) {
      addFam('math','Data & statistics',t,[4,9], function(g,lv){ return function(){
        if(t==='Mean'){ var n=rnd(3,4),arr=[],s=0; for(var i=0;i<n;i++){var v=rnd(2,20);arr.push(v);s+=v;} while(s%n){arr[0]++;s++;} return mcNum('Mean of '+arr.join(', '), s/n,{spread:4}); }
        if(t==='Median'){ var a=[]; for(var j=0;j<5;j++)a.push(rnd(1,20)); var so=a.slice().sort(function(x,y){return x-y;}); return mcNum('Median of '+a.join(', '), so[2],{spread:4}); }
        if(t==='Mode'){ var bb=rnd(1,9); var a2=shuffle([bb,bb,bb,rnd(10,19),rnd(20,29)]); return mcNum('Mode of '+a2.join(', '), bb,{spread:5}); }
        if(t==='Range'){ var a3=[]; for(var k=0;k<5;k++)a3.push(rnd(1,40)); return mcNum('Range of '+a3.join(', '), Math.max.apply(null,a3)-Math.min.apply(null,a3),{spread:6}); }
        var tot=pick([4,5,6,8,10]),fav=rnd(1,tot-1); return inp('A bag has '+tot+' marbles, '+fav+' red. P(red) as n/'+tot+' =', fav+'/'+tot); }; }, 2);
    });

    // ----- geometry -----
    ['Rectangle','Square','Triangle','Parallelogram','Circle'].forEach(function (shape) {
      addFam('geometry','Area','Area of a '+shape.toLowerCase(),[3,9], function(g,lv){ return function(){ var a=rnd(3,12+lv*4), b=rnd(2,10+lv*4);
        if(shape==='Rectangle') return inp('Rectangle '+a+' × '+b+'. Area = ?', a*b);
        if(shape==='Square') return inp('Square with side '+a+'. Area = ?', a*a);
        if(shape==='Triangle'){ var base=a*2; return inp('Triangle base '+base+', height '+b+'. Area = ?', base*b/2); }
        if(shape==='Parallelogram') return inp('Parallelogram base '+a+', height '+b+'. Area = ?', a*b);
        return mcStr('Circle radius '+a+'. Area (use π) = ?', (a*a)+'π', [(2*a)+'π', a+'π', (a*a*a)+'π']); }; }, 2);
    });
    ['Rectangle','Square','Triangle'].forEach(function (shape) {
      addFam('geometry','Perimeter','Perimeter of a '+shape.toLowerCase(),[3,7], function(g,lv){ return function(){ var a=rnd(3,15),b=rnd(2,12); if(shape==='Rectangle') return inp('Rectangle '+a+' × '+b+'. Perimeter = ?', 2*(a+b)); if(shape==='Square') return inp('Square side '+a+'. Perimeter = ?', 4*a); var c=rnd(2,12); return inp('Triangle sides '+a+', '+b+', '+c+'. Perimeter = ?', a+b+c); }; });
    });
    ['Rectangular prism','Cube','Cylinder'].forEach(function (shape) {
      addFam('geometry','Volume','Volume of a '+shape.toLowerCase(),[5,10], function(g,lv){ return function(){ var a=rnd(2,9),b=rnd(2,9),c=rnd(2,9); if(shape==='Rectangular prism') return inp('Prism '+a+'×'+b+'×'+c+'. Volume = ?', a*b*c); if(shape==='Cube') return inp('Cube side '+a+'. Volume = ?', a*a*a); return mcStr('Cylinder r='+a+', h='+b+'. Volume (use π) = ?', (a*a*b)+'π', [(a*b)+'π',(2*a*b)+'π',(a*a*a)+'π']); }; });
    });
    ['Complementary angles','Supplementary angles','Triangle angle sum','Vertical angles'].forEach(function (t) {
      addFam('geometry','Angles',t,[4,9], function(g,lv){ return function(){
        if(t==='Complementary angles'){ var a=rnd(15,75); return mcNum('One of two complementary angles is '+a+'°. The other = ?', 90-a,{nonneg:true,spread:10}); }
        if(t==='Supplementary angles'){ var a=rnd(20,160); return mcNum('One of two supplementary angles is '+a+'°. The other = ?', 180-a,{nonneg:true,spread:12}); }
        if(t==='Triangle angle sum'){ var a=rnd(30,80),b=rnd(30,80); if(a+b>150){a=50;b=60;} return mcNum('A triangle has angles '+a+'° and '+b+'°. The third = ?', 180-a-b,{nonneg:true,spread:10}); }
        var a2=rnd(20,160); return mcNum('Two vertical angles: one is '+a2+'°. The other = ?', a2,{spread:10}); }; }, 1);
    });
    addFam('geometry','Pythagorean theorem','Find the hypotenuse',[8,11], function(g,lv){ return function(){ var t=pick([[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15]]); return inp('Right triangle legs '+t[0]+' and '+t[1]+'. Hypotenuse = ?', t[2]); }; });
    addFam('geometry','Coordinate geometry','Distance from the origin',[6,10], function(g,lv){ return function(){ var t=pick([[3,4,5],[6,8,10],[5,12,13]]); return inp('From (0,0) to ('+t[0]+','+t[1]+'). Distance = ?', t[2]); }; });

    // ----- algebra -----
    ['x + a = b','x − a = b','a · x = b','x ÷ a = b'].forEach(function (form) {
      addFam('algebra','One-step equations','Solve: '+form,[6,9], function(g,lv){ return function(){ var x=rnd(1,9+(lv-1)*10), a=rnd(2,9);
        if(form==='x + a = b') return inp('Solve:  x + '+a+' = '+(x+a), x);
        if(form==='x − a = b') return inp('Solve:  x − '+a+' = '+(x-a), x);
        if(form==='a · x = b') return inp('Solve:  '+a+'x = '+(a*x), x);
        return inp('Solve:  x ÷ '+a+' = '+x+'   (find x)', x*a); }; }, 2);
    });
    addFam('algebra','Two-step equations','Solve ax + b = c',[7,10], function(g,lv){ return function(){ var a=rnd(2,6),x=rnd(1,9),b=rnd(1,10); return inp('Solve:  '+a+'x + '+b+' = '+(a*x+b), x); }; }, 2);
    addFam('algebra','Expressions','Evaluate expressions',[6,9], function(g,lv){ return function(){ var c=rnd(2,6),k=rnd(1,7),x=rnd(2,9); return mcNum('If x = '+x+', evaluate '+c+'x + '+k, c*x+k); }; }, 2);
    addFam('algebra','Expressions','Combine like terms',[7,10], function(g,lv){ return function(){ var a=rnd(2,7),b=rnd(2,7),c=rnd(1,8); return mcStr('Simplify '+a+'x + '+c+' + '+b+'x', (a+b)+'x + '+c, [(a+b)+'x',(a*b)+'x + '+c]); }; });
    addFam('algebra','Expressions','Distributive property',[7,10], function(g,lv){ return function(){ var a=rnd(2,6),b=rnd(1,7); return mcStr('Expand '+a+'(x + '+b+')', a+'x + '+(a*b), [a+'x + '+b,(a+1)+'x + '+(a*b)]); }; });
    addFam('algebra','Linear functions','Slope from two points',[8,11], function(g,lv){ return function(){ var x1=rnd(-4,4),y1=rnd(-4,4),dx=rnd(1,4),m=rnd(-4,4); return mcNum('Slope through ('+x1+','+y1+') and ('+(x1+dx)+','+(y1+m*dx)+') = ?', m,{spread:4}); }; });
    addFam('algebra','Linear functions','Evaluate y = mx + b',[8,11], function(g,lv){ return function(){ var m=rnd(1,5),b=rnd(-5,5),x=rnd(1,5); return mcNum('y = '+m+'x + '+(b<0?'('+b+')':b)+'. Find y when x = '+x, m*x+b); }; });
    addFam('algebra','Inequalities','Solve one-step inequalities',[8,11], function(g,lv){ return function(){ var a=rnd(1,9),b=rnd(a+1,a+12); return mcStr('Solve  x + '+a+' > '+b, 'x > '+(b-a), ['x > '+(b+a),'x < '+(b-a)]); }; });
    addFam('algebra','Systems','Solve systems (elimination)',[9,12], function(g,lv){ return function(){ var x=rnd(1,6),y=rnd(1,6); return inp('If x + y = '+(x+y)+' and x − y = '+(x-y)+', find x.', x); }; });
    addFam('algebra','Quadratics','Factor x² + bx + c',[9,12], function(g,lv){ return function(){ var p=rnd(1,6),q=rnd(1,6); return mcStr('Factor x² + '+(p+q)+'x + '+p*q, '(x + '+p+')(x + '+q+')', ['(x + '+(p+q)+')(x + '+p*q+')','(x − '+p+')(x − '+q+')']); }; });
    addFam('algebra','Quadratics','Solve x² + bx + c = 0',[9,12], function(g,lv){ return function(){ var p=rnd(1,6),q=rnd(1,6); return mcNum('A root of x² − '+(p+q)+'x + '+p*q+' = 0 (smaller) = ?', Math.min(p,q),{nonneg:true,spread:3}); }; });
    ['Product of powers','Quotient of powers','Power of a power'].forEach(function (t) {
      addFam('algebra','Exponent laws',t,[8,11], function(g,lv){ return function(){ var a=rnd(2,7),b=rnd(2,7); if(t==='Product of powers') return mcStr('x^'+a+' · x^'+b, 'x^'+(a+b), ['x^'+(a*b),'x^'+Math.abs(a-b)]); if(t==='Quotient of powers') return mcStr('x^'+(a+b)+' ÷ x^'+b, 'x^'+a, ['x^'+b,'x^'+(a+b)]); return mcStr('(x^'+a+')^'+b, 'x^'+(a*b), ['x^'+(a+b),'x^'+a]); }; });
    });
    addFam('algebra','Functions','Function notation',[8,11], function(g,lv){ return function(){ var a=rnd(2,5),b=rnd(1,6),k=rnd(2,6); return mcNum('f(x) = '+a+'x − '+b+'. Find f('+k+').', a*k-b); }; });
    addFam('algebra','Sequences','Arithmetic sequences',[9,12], function(g,lv){ return function(){ var a=rnd(1,8),d=rnd(2,6),n=rnd(4,9); return inp('Starts at '+a+', common difference '+d+'. The '+n+'th term = ?', a+(n-1)*d); }; });
    addFam('algebra','Sequences','Geometric sequences',[9,12], function(g,lv){ return function(){ var a=rnd(1,4),r=rnd(2,3),n=rnd(3,5); return inp('Starts at '+a+', ratio '+r+'. The '+n+'th term = ?', a*Math.pow(r,n-1)); }; });
    addFam('algebra','Radicals','Simplify radicals',[9,12], function(g,lv){ return function(){ var a=rnd(2,6),b=pick([2,3,5,6,7]); return mcStr('Simplify √'+(a*a*b), a+'√'+b, [(a*b)+'√'+a, a+'√'+(b*b)]); }; });
    addFam('algebra','Absolute value','Evaluate absolute value',[7,10], function(g,lv){ return function(){ var a=rnd(-15,-1),b=rnd(1,8); return mcNum('|'+a+'| + '+b+' =', Math.abs(a)+b,{nonneg:true}); }; });

    // ----- calculus / precalc -----
    addFam('calculus','Limits','Limits of polynomials',[11,12], function(){ return function(){ return G.limitPoly(); }; });
    addFam('calculus','Limits','Limits by factoring',[11,12], function(){ return function(){ return G.limitRational(); }; });
    ['Power rule','Polynomials','Chain rule','Trig functions','Second derivative'].forEach(function (t) {
      addFam('calculus','Derivatives','Differentiate: '+t,[11,12], function(){ return function(){ if(t==='Power rule')return G.derivPower(); if(t==='Polynomials')return G.derivPoly(); if(t==='Chain rule')return G.derivChain(); if(t==='Trig functions')return G.derivTrig(); return G.deriv2(); }; });
    });
    ['Power rule','Definite integrals'].forEach(function (t) {
      addFam('calculus','Integrals','Integrate: '+t,[12,12], function(){ return function(){ if(t==='Definite integrals')return G.defIntegral(); return G.integralPower(); }; });
    });
    addFam('calculus','Applications','Tangent line slope',[11,12], function(){ return function(){ return G.tangent(); }; });
    [2,3,5,10].forEach(function (b) {
      addFam('calculus','Logarithms','Evaluate log base '+b,[10,12], function(g,lv){ return function(){ var e=rnd(1,3+lv); return inp('log base '+b+' of '+Math.pow(b,e)+' =', e); }; }, 2);
    });

    // ----- science formula generators -----
    [['Speed = distance ÷ time','speed'],['Density = mass ÷ volume','density'],['Force = mass × acceleration','force'],['Work = force × distance','work'],['Ohm’s law: V = I × R','ohm']].forEach(function (f) {
      addFam('science','Physics formulas',f[0],[6,11], function(){ return function(){
        if(f[1]==='speed'){ var d=rnd(20,80),t=rnd(2,5); return inp('An object travels '+d+' m in '+t+' s. Speed (m/s) = ?', Math.round(d/t*100)/100); }
        if(f[1]==='density'){ var m=rnd(10,90),v=rnd(2,9); return inp('Mass '+m+' g, volume '+v+' cm³. Density (g/cm³) = ?', Math.round(m/v*100)/100); }
        if(f[1]==='force'){ var mm=rnd(2,20),aa=rnd(2,9); return inp('Mass '+mm+' kg, acceleration '+aa+' m/s². Force (N) = ?', mm*aa); }
        if(f[1]==='work'){ var ff=rnd(5,30),dd=rnd(2,12); return inp('Force '+ff+' N over '+dd+' m. Work (J) = ?', ff*dd); }
        var I=rnd(1,9),R=rnd(2,12); return inp('Current '+I+' A, resistance '+R+' Ω. Voltage (V) = ?', I*R); }; });
    });
    [['Celsius to Fahrenheit','c2f'],['Kilometers to meters','km2m'],['Metric mass (kilo)','kilo']].forEach(function (f) {
      addFam('science','Measurement & units',f[0],[4,9], function(){ return function(){ if(f[1]==='c2f'){ var c=pick([0,10,20,25,30,37,100]); return inp(c+'°C in °F = ?', Math.round(c*9/5+32)); } if(f[1]==='km2m'){ var k=rnd(2,20); return inp(k+' km = ? m', k*1000); } var x=rnd(2,9); return inp(x+' kilograms = ? grams', x*1000); }; });
    });

    // ===== SECOND WAVE — more categories & variety =====
    // fraction operations per denominator
    [2,3,4,5,6,8,10,12].forEach(function (d) {
      addFam('math','Multiply fractions','Multiply a fraction by a whole (denominator '+d+')',[5,9], function(){ return function(){ var a=rnd(1,d-1),w=rnd(2,6); var num=a*w; return inp(w+' × '+a+'/'+d+' =   (write n/'+d+')', num+'/'+d); }; }, 2);
      addFam('math','Fraction of a number','Find a fraction of a number (1/'+d+')',[4,8], function(){ return function(){ var w=d*rnd(2,8); return inp('1/'+d+' of '+w+' = ?', w/d); }; }, 2);
      addFam('math','Mixed numbers','Add mixed numbers (denominator '+d+')',[5,9], function(){ return function(){ var w1=rnd(1,4),a=rnd(1,d-1),w2=rnd(1,4),b=rnd(1,d-1); if(a+b>=d) b=Math.max(1,d-a); return inp(w1+' '+a+'/'+d+' + '+w2+' '+b+'/'+d+' =   (write W n/'+d+')', (w1+w2)+' '+(a+b)+'/'+d); }; }, 1);
    });
    // multi-digit operations
    [2,3,4].forEach(function (dg) {
      var lo=Math.pow(10,dg-1), hi=Math.pow(10,dg)-1;
      addFam('math','Multi-digit addition',dg+'-digit addition',[2,7], function(){ return function(){ var a=rnd(lo,hi),b=rnd(lo,hi); return inp(a+' + '+b+' =', a+b); }; }, 2);
      addFam('math','Multi-digit subtraction',dg+'-digit subtraction',[2,7], function(){ return function(){ var a=rnd(lo,hi),b=rnd(lo,a); return inp(a+' − '+b+' =', a-b); }; }, 2);
    });
    [[2,1],[2,2],[3,1],[3,2],[4,1]].forEach(function (pr) {
      addFam('math','Multi-digit multiplication',pr[0]+'-digit by '+pr[1]+'-digit multiplication',[4,8], function(){ return function(){ var a=rnd(Math.pow(10,pr[0]-1),Math.pow(10,pr[0])-1), b=rnd(Math.pow(10,pr[1]-1),Math.pow(10,pr[1])-1); return inp(a+' × '+b+' =', a*b); }; }, 2);
    });
    [2,3,4].forEach(function (dg) {
      addFam('math','Long division',dg+'-digit ÷ 1-digit',[4,7], function(){ return function(){ var b=rnd(2,9),q=rnd(Math.pow(10,dg-2),Math.pow(10,dg-1)); return inp((b*q)+' ÷ '+b+' =', q); }; }, 2);
    });
    [10,100,1000].forEach(function (m) {
      addFam('math','Powers of ten','Multiply by '+m,[3,7], function(){ return function(){ var a=rnd(2,99); return inp(a+' × '+m+' =', a*m); }; }, 1);
      addFam('math','Powers of ten','Divide by '+m,[3,7], function(){ return function(){ var a=rnd(2,99); return inp((a*m)+' ÷ '+m+' =', a); }; }, 1);
    });
    addFam('math','Ratios','Simplify a ratio',[5,9], function(){ return function(){ var k=rnd(2,6),a=k*rnd(1,5),b=k*rnd(1,5),g=gcd(a,b); return mcStr('Simplify '+a+':'+b, (a/g)+':'+(b/g), [a+':'+b,(b/g)+':'+(a/g)]); }; }, 2);
    addFam('math','Ratios','Equivalent ratios',[5,9], function(){ return function(){ var a=rnd(1,6),b=rnd(1,6),k=rnd(2,5); return inp(a+':'+b+' = '+(a*k)+':?', b*k); }; }, 2);
    addFam('math','Rates','Unit rate',[6,9], function(){ return function(){ var n=rnd(2,8),per=rnd(2,9); return inp(n+' items cost $'+(n*per)+'. Price per item = $?', per); }; }, 2);
    addFam('math','Proportions','Solve a proportion',[6,9], function(){ return function(){ var a=rnd(1,5),b=rnd(2,6),k=rnd(2,5); return inp('Solve  '+a+'/'+b+' = x/'+(b*k), a*k); }; }, 2);
    addFam('math','Comparing numbers','Compare whole numbers',[1,6], function(){ return function(){ var a=rnd(1,9999),b=rnd(1,9999); var ans=a>b?'>':(a<b?'<':'='); return mcStr(a+'  ?  '+b, ans, ['>','<','='].filter(function(z){return z!==ans;})); }; }, 2);
    addFam('math','Ordering numbers','Order from least to greatest',[2,6], function(){ return function(){ var arr=[rnd(1,99),rnd(1,99),rnd(1,99)]; var so=arr.slice().sort(function(x,y){return x-y;}); return inp('Least of '+arr.join(', ')+' = ?', so[0]); }; }, 1);
    addFam('math','Estimation','Estimate sums by rounding',[3,7], function(){ return function(){ var a=rnd(11,99),b=rnd(11,99); var est=Math.round(a/10)*10+Math.round(b/10)*10; return mcNum('Estimate '+a+' + '+b+' (round to tens)', est,{spread:10}); }; }, 2);
    addFam('math','Prime factorization','Prime factorization',[5,8], function(){ return function(){ var n=pick([12,18,20,24,36,40,48,60]); var m=n,pf=[],d2=2; while(m>1){while(m%d2===0){pf.push(d2);m/=d2;}d2++;} return inp('Number of prime factors (with repeats) of '+n+' = ?', pf.length); }; }, 1);
    addFam('math','Squares & cubes','Square numbers',[5,9], function(){ return function(){ var n=rnd(2,15); return inp(n+'² =', n*n); }; }, 2);
    addFam('math','Squares & cubes','Cube numbers',[6,10], function(){ return function(){ var n=rnd(2,10); return inp(n+'³ =', n*n*n); }; }, 2);
    addFam('math','Coordinate plane','Identify the quadrant',[5,9], function(){ return function(){ var x=pick([-3,-2,-1,1,2,3]),y=pick([-3,-2,-1,1,2,3]); var q=(x>0&&y>0)?'I':(x<0&&y>0)?'II':(x<0&&y<0)?'III':'IV'; return mcStr('Which quadrant is ('+x+', '+y+') in?', q, ['I','II','III','IV'].filter(function(z){return z!==q;})); }; }, 1);
    addFam('math','Number forms','Expanded form',[2,5], function(){ return function(){ var n=rnd(111,9999); return inp('The value of the hundreds place in '+n+' = ?', Math.floor(n/100)%10*100); }; }, 1);

    // geometry second wave
    ['Rectangular prism','Cube','Cylinder'].forEach(function (shape) {
      addFam('geometry','Surface area','Surface area of a '+shape.toLowerCase(),[6,10], function(){ return function(){ var a=rnd(2,8),b=rnd(2,8),c=rnd(2,8); if(shape==='Rectangular prism') return inp('Prism '+a+'×'+b+'×'+c+'. Surface area = ?', 2*(a*b+b*c+a*c)); if(shape==='Cube') return inp('Cube side '+a+'. Surface area = ?', 6*a*a); return mcStr('Cylinder r='+a+', h='+b+'. Surface area (use π) = ?', (2*a*a+2*a*b)+'π', [(a*a*b)+'π',(2*a*b)+'π']); }; }, 2);
    });
    addFam('geometry','Circles','Circumference',[6,10], function(){ return function(){ var r=rnd(1,9); return mcStr('Circle radius '+r+'. Circumference (use π) = ?', (2*r)+'π', [r+'π',(r*r)+'π',(4*r)+'π']); }; }, 2);
    addFam('geometry','Area','Area of a trapezoid',[6,10], function(){ return function(){ var b1=rnd(3,10),b2=rnd(3,10),h=rnd(2,8)*2; return inp('Trapezoid bases '+b1+' and '+b2+', height '+h+'. Area = ?', (b1+b2)*h/2); }; }, 2);
    addFam('geometry','Polygons','Sum of interior angles',[6,10], function(){ return function(){ var n=rnd(3,10); return inp('Sum of interior angles of a '+n+'-sided polygon = ? degrees', (n-2)*180); }; }, 1);
    addFam('geometry','Transformations','Reflect a point over the x-axis',[5,9], function(){ return function(){ var x=rnd(-6,6),y=rnd(-6,6); return inp('Reflect ('+x+', '+y+') over the x-axis: the new y = ?', -y); }; }, 1);
    addFam('geometry','Coordinate geometry','Midpoint of a segment',[8,11], function(){ return function(){ var x1=rnd(-6,6)*2,y1=rnd(-6,6)*2,x2=rnd(-6,6)*2,y2=rnd(-6,6)*2; return inp('Midpoint x of ('+x1+','+y1+') and ('+x2+','+y2+') = ?', (x1+x2)/2); }; }, 1);
    addFam('geometry','Similar figures','Scale factor',[6,10], function(){ return function(){ var k=rnd(2,5),a=rnd(2,8); return inp('A figure is scaled by '+k+'. A side of length '+a+' becomes ?', a*k); }; }, 2);

    // algebra second wave
    addFam('algebra','Polynomials','Multiply binomials (FOIL)',[9,12], function(){ return function(){ var p=rnd(1,5),q=rnd(1,5); return mcStr('Expand (x + '+p+')(x + '+q+')', 'x² + '+(p+q)+'x + '+p*q, ['x² + '+p*q+'x + '+(p+q),'x² + '+(p+q)+'x + '+(p+q)]); }; }, 2);
    addFam('algebra','Polynomials','Add polynomials',[9,12], function(){ return function(){ var a=rnd(1,6),b=rnd(1,6),c=rnd(1,6),d=rnd(1,6); return mcStr('('+a+'x + '+b+') + ('+c+'x + '+d+')', (a+c)+'x + '+(b+d), [(a*c)+'x + '+(b+d),(a+c)+'x + '+(b*d)]); }; }, 2);
    addFam('algebra','Factoring','Factor out the GCF',[8,11], function(){ return function(){ var g=rnd(2,6),a=rnd(1,5),b=rnd(1,5); return mcStr('Factor '+(g*a)+'x + '+(g*b), g+'('+a+'x + '+b+')', [(g*a)+'(x + '+b+')',a+'('+g+'x + '+b+')']); }; }, 2);
    addFam('algebra','Factoring','Difference of squares',[9,12], function(){ return function(){ var a=rnd(1,9); return mcStr('Factor x² − '+(a*a), '(x + '+a+')(x − '+a+')', ['(x − '+a+')²','(x + '+a+')²']); }; }, 1);
    addFam('algebra','Graphing lines','Find the y-intercept',[8,11], function(){ return function(){ var m=rnd(1,5),b=rnd(-6,6); return inp('The y-intercept of y = '+m+'x + '+(b<0?'('+b+')':b)+' = ?', b); }; }, 1);
    addFam('algebra','Graphing lines','Parallel line slopes',[8,11], function(){ return function(){ var m=rnd(-5,5); if(m===0)m=2; return inp('A line parallel to y = '+m+'x + 3 has slope = ?', m); }; }, 1);
    addFam('algebra','Exponents','Negative exponents',[8,11], function(){ return function(){ var n=rnd(2,6),e=rnd(1,3); return mcStr(n+'^(−'+e+') as a fraction', '1/'+Math.pow(n,e), ['−'+Math.pow(n,e),Math.pow(n,e)+'']); }; }, 1);
    addFam('algebra','Exponents','Zero exponent',[8,11], function(){ return function(){ var n=rnd(2,20); return inp(n+'^0 =', 1); }; }, 1);
    addFam('algebra','Word problems','Consecutive integers',[7,10], function(){ return function(){ return G.wpConsec(); }; }, 1);
    addFam('algebra','Word problems','Age problems',[6,9], function(){ return function(){ return G.wpAge(); }; }, 1);

    // statistics / probability
    addFam('math','Probability','Probability with a die',[6,10], function(){ return function(){ var fav=rnd(1,5); return inp('Rolling one die, P(roll ≤ '+fav+') as n/6 = ?', fav+'/6'); }; }, 1);
    addFam('math','Probability','Simple probability',[5,9], function(){ return function(){ var tot=pick([6,8,10,12]),fav=rnd(1,tot-1); return inp('A spinner has '+tot+' equal parts, '+fav+' blue. P(blue) as n/'+tot+' = ?', fav+'/'+tot); }; }, 2);
    addFam('math','Counting','Permutations',[9,12], function(){ return function(){ var n=rnd(3,6); var f=1; for(var i=2;i<=n;i++)f*=i; return inp(n+'! (number of ways to order '+n+' items) = ?', f); }; }, 1);

    // trigonometry (calculus subject)
    addFam('calculus','Trigonometry','Degrees to radians',[10,12], function(){ return function(){ var d=pick([90,180,270,360,45,60,30]); var map={30:'π/6',45:'π/4',60:'π/3',90:'π/2',180:'π',270:'3π/2',360:'2π'}; return mcStr(d+'° in radians = ?', map[d], Object.keys(map).map(function(k){return map[k];}).filter(function(v){return v!==map[d];}).slice(0,3)); }; }, 1);
    addFam('calculus','Trigonometry','Sine of special angles',[10,12], function(){ return function(){ var a=pick([0,30,90]); var map={0:'0',30:'1/2',90:'1'}; return mcStr('sin('+a+'°) = ?', map[a], ['0','1/2','1'].filter(function(v){return v!==map[a];})); }; }, 1);

    // science second wave
    addFam('science','Chemistry calculations','Protons from atomic number',[7,11], function(){ return function(){ var z=rnd(1,20); return inp('An element with atomic number '+z+' has how many protons?', z); }; }, 1);
    addFam('science','Energy','Kinetic energy (½mv²)',[9,12], function(){ return function(){ var m=rnd(1,6)*2,v=rnd(1,5); return inp('Mass '+m+' kg at '+v+' m/s. KE = ½mv² = ? J', 0.5*m*v*v); }; }, 1);
    addFam('science','Waves','Wave speed = frequency × wavelength',[8,12], function(){ return function(){ var f=rnd(2,9),w=rnd(2,9); return inp('Frequency '+f+' Hz, wavelength '+w+' m. Speed = ? m/s', f*w); }; }, 1);
    addFam('science','Genetics','Punnett square ratios',[7,11], function(){ return function(){ return mcStr('Crossing Aa × Aa, what fraction of offspring are recessive (aa)?', '1/4', ['1/2','3/4','1/1']); }; }, 1);

    // ===== generated Reading & Language (now infinite) =====
    var NOUNS=['dog','city','freedom','teacher','river','courage','apple','mountain','idea','friend'];
    var VERBS=['run','jump','write','think','build','sing','read','create','explore','solve'];
    var ADJ=['bright','quick','ancient','gentle','fierce','curious','massive','silent','joyful','tiny'];
    var ADV=['quickly','silently','bravely','often','carefully','rarely','loudly','gently','soon','well'];
    addFam('reading','Parts of speech','Identify the noun',[1,6], function(){ return function(){ var n=pick(NOUNS); return mcStr('Which word is a noun?', n, [pick(VERBS),pick(ADJ),pick(ADV)]); }; }, 2);
    addFam('reading','Parts of speech','Identify the verb',[1,6], function(){ return function(){ var v=pick(VERBS); return mcStr('Which word is a verb?', v, [pick(NOUNS),pick(ADJ),pick(ADV)]); }; }, 2);
    addFam('reading','Parts of speech','Identify the adjective',[2,7], function(){ return function(){ var a=pick(ADJ); return mcStr('Which word is an adjective?', a, [pick(NOUNS),pick(VERBS),pick(ADV)]); }; }, 2);
    addFam('reading','Parts of speech','Identify the adverb',[3,8], function(){ return function(){ var a=pick(ADV); return mcStr('Which word is an adverb?', a, [pick(NOUNS),pick(VERBS),pick(ADJ)]); }; }, 2);
    var PLUR={'child':'children','mouse':'mice','foot':'feet','tooth':'teeth','goose':'geese','man':'men','woman':'women','person':'people','leaf':'leaves','knife':'knives'};
    addFam('reading','Grammar','Irregular plurals',[2,7], function(){ return function(){ var k=pick(Object.keys(PLUR)); return mcStr('What is the plural of "'+k+'"?', PLUR[k], [k+'s',k+'es'].concat([pick(Object.keys(PLUR).map(function(x){return PLUR[x];}))]).slice(0,3)); }; }, 2);
    var PAST={'run':'ran','go':'went','eat':'ate','swim':'swam','fly':'flew','see':'saw','take':'took','give':'gave','write':'wrote','begin':'began'};
    addFam('reading','Grammar','Past tense verbs',[2,7], function(){ return function(){ var k=pick(Object.keys(PAST)); return mcStr('What is the past tense of "'+k+'"?', PAST[k], [k+'ed',k+'d',pick(Object.keys(PAST).map(function(x){return PAST[x];}))].slice(0,3)); }; }, 2);
    var CONTR={"do not":"don't","cannot":"can't","I am":"I'm","they are":"they're","it is":"it's","we will":"we'll","you have":"you've","she is":"she's","did not":"didn't","would not":"wouldn't"};
    addFam('reading','Grammar','Contractions',[2,6], function(){ return function(){ var k=pick(Object.keys(CONTR)); return mcStr('Which is the contraction for "'+k+'"?', CONTR[k], Object.keys(CONTR).map(function(x){return CONTR[x];}).filter(function(v){return v!==CONTR[k];}).slice(0,3)); }; }, 2);
    addFam('reading','Word study','Count the syllables',[1,5], function(){ return function(){ var words={'cat':1,'apple':2,'banana':3,'butterfly':3,'elephant':3,'sun':1,'water':2,'computer':3,'happy':2,'dinosaur':3}; var k=pick(Object.keys(words)); return mcNum('How many syllables are in "'+k+'"?', words[k], {nonneg:true,spread:2}); }; }, 1);

    // ===== generated Spanish (now infinite) =====
    var ESNUM={'uno':'1','dos':'2','tres':'3','cuatro':'4','cinco':'5','seis':'6','siete':'7','ocho':'8','nueve':'9','diez':'10'};
    addFam('spanish','Numbers','Spanish numbers',[1,8], function(){ return function(){ var k=pick(Object.keys(ESNUM)); return mcStr('What number is "'+k+'"?', ESNUM[k], Object.keys(ESNUM).map(function(x){return ESNUM[x];}).filter(function(v){return v!==ESNUM[k];}).slice(0,3)); }; }, 2);
    var ESVERB=[['hablar','o','hablo'],['comer','o','como'],['vivir','o','vivo'],['estudiar','o','estudio'],['trabajar','o','trabajo']];
    addFam('spanish','Verb conjugation','Present tense (yo)',[5,12], function(){ return function(){ var v=pick(ESVERB); return inp('Conjugate "'+v[0]+'" for yo (I ...):', v[2]); }; }, 2);

    SUBJECTS.forEach(function (s) { s.strandList = Object.keys(s.strands || {}); });
  })();

  /* ---------------- SPEED DRILLS ---------------- */
  var SPEED = [
    { id: 'add', name: 'Addition', icon: 'plus', gen: function (lvl) { var n = 9 + lvl * 20; var a = rnd(1, n), b = rnd(1, n); return { q: a + ' + ' + b, answer: a + b }; } },
    { id: 'sub', name: 'Subtraction', icon: 'minus', gen: function (lvl) { var n = 9 + lvl * 20; var a = rnd(2, n), b = rnd(1, a); return { q: a + ' − ' + b, answer: a - b }; } },
    { id: 'mul', name: 'Multiplication', icon: 'x', gen: function (lvl) { var n = 9 + lvl * 3; var a = rnd(2, n), b = rnd(2, 12); return { q: a + ' × ' + b, answer: a * b }; } },
    { id: 'div', name: 'Division', icon: 'divide', gen: function (lvl) { var b = rnd(2, 9 + lvl * 2), c = rnd(2, 12); return { q: (b * c) + ' ÷ ' + b, answer: c }; } },
    { id: 'frac', name: 'Fractions', icon: 'percent', gen: function (lvl) { var d = pick([2, 3, 4, 5, 6, 8]); var a = rnd(1, d - 1), b = rnd(1, d - 1); if (a + b > d) b = d - a; return { q: a + '/' + d + ' + ' + b + '/' + d + '  (n/' + d + ')', answer: (a + b) + '/' + d }; } },
    { id: 'sqrt', name: 'Square roots', icon: 'square-function', gen: function (lvl) { var r = rnd(2, 12 + lvl * 3); return { q: '√' + (r * r), answer: r }; } },
    { id: 'square', name: 'Squares', icon: 'square', gen: function (lvl) { var r = rnd(2, 12 + lvl * 4); return { q: r + '²', answer: r * r }; } }
  ];
  var SPEED_INDEX = {}; SPEED.forEach(function (s) { SPEED_INDEX[s.id] = s; });

  /* ---------------- API ---------------- */
  var Problems = {
    SUBJECTS: SUBJECTS,
    SPEED: SPEED,
    subject: function (id) { for (var i = 0; i < SUBJECTS.length; i++) if (SUBJECTS[i].id === id) return SUBJECTS[i]; return null; },
    skill: function (id) { return SKILL_INDEX[id]; },
    generate: function (skillId, grade) {
      var k = SKILL_INDEX[skillId]; if (!k) return null;
      var p = k.gen(grade || 'K');
      p.skillId = skillId; p.subjectId = k.subject; p.skillName = k.name;
      return p;
    },
    speed: function (kind, level) { var s = SPEED_INDEX[kind]; if (!s) return null; var q = s.gen(level || 1); q.kind = kind; return q; },
    skillsForGrade: function (subjectId, grade) { var gn = gradeNum(grade), s = this.subject(subjectId); if (!s) return []; return s.skills.filter(function (k) { return gn >= k.grades[0] && gn <= k.grades[1]; }); },
    strandsFor: function (subjectId) { var s = this.subject(subjectId); if (!s) return []; var seen = {}, out = []; s.skills.forEach(function (k) { var st = k.strand || 'Essentials'; if (!seen[st]) { seen[st] = 1; out.push(st); } }); return out; },
    categoryCount: function () { var seen = {}; SUBJECTS.forEach(function (s) { s.skills.forEach(function (k) { seen[s.id + '|' + (k.strand || 'Essentials')] = 1; }); }); return Object.keys(seen).length; },
    // Build a mixed assessment of n questions for a subject at a grade (or 'all').
    buildTest: function (subjectId, grade, n) {
      n = n || 30;
      var pool = [];
      var subs = subjectId === 'all' ? SUBJECTS : [this.subject(subjectId)];
      subs.forEach(function (s) { if (s) s.skills.forEach(function (k) { pool.push(k); }); });
      // widen grade tolerance so a 30-question test always fills
      var gn = gradeNum(grade);
      var eligible = pool.filter(function (k) { return gn >= k.grades[0] - 1 && gn <= k.grades[1] + 2; });
      if (eligible.length < 6) eligible = pool;
      var out = [], guard = 0;
      var seen = {};
      while (out.length < n && guard++ < n * 12) {
        var k = pick(eligible);
        var pr = this.generate(k.id, grade);
        var key = pr.q;
        if (seen[key]) continue;
        seen[key] = 1;
        out.push(pr);
      }
      return out;
    },
    totalSkills: function () { var n = 0; SUBJECTS.forEach(function (s) { n += s.skills.length; }); return n; },
    estimatedProblems: function () {
      // Procedural (generator) skills each produce far more than 120 distinct
      // problems across grades — count them conservatively at 120. Static bank
      // skills are counted by their real item count. Speed drills are generators.
      var gen = 0, banks = 0;
      SUBJECTS.forEach(function (s) { s.skills.forEach(function (k) { if (!(k.gen && k.gen.isBank)) gen += 200; }); });
      Object.keys(BANKS).forEach(function (b) { banks += BANKS[b].length; });
      return gen + banks + SPEED.length * 200;
    },
    gradeNum: gradeNum
  };

  global.Problems = Problems;
})(window);
