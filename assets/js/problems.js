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

  /* ---------------- STATIC BANKS ---------------- */
  function bankMC(item, bank) { var others = bank.filter(function (b) { return b.a !== item.a; }).map(function (b) { return b.a; }); return mcStr(item.q, item.a, shuffle(others).slice(0, 3), item.e || ''); }
  function bankGen(id) { return function () { var b = BANKS[id]; return bankMC(pick(b), b); }; }

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
    history: [
      { q: 'Who was the first U.S. president?', a: 'George Washington' }, { q: 'The Declaration of Independence was signed in', a: '1776' },
      { q: 'Who wrote the Emancipation Proclamation?', a: 'Abraham Lincoln' }, { q: 'Ancient pyramids were built by the', a: 'Egyptians' },
      { q: 'The Great Wall is located in', a: 'China' }, { q: 'WWII ended in', a: '1945' }, { q: 'The Roman Empire\'s capital was', a: 'Rome' },
      { q: 'Who led the Indian independence movement nonviolently?', a: 'Gandhi' }, { q: 'The ship that sank in 1912 was the', a: 'Titanic' },
      { q: 'The U.S. Civil War ended in', a: '1865' }, { q: 'Who explored and reached the Americas in 1492?', a: 'Columbus' },
      { q: 'The document limiting the English king\'s power (1215) was the', a: 'Magna Carta' }
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
      { id: 'time', name: 'Elapsed time', grades: [2, 5], gen: G.time }
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
      { id: 'radical', name: 'Simplifying radicals', grades: [9, 12], gen: G.radical }
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
      { id: 'analogies', name: 'Analogies', grades: [4, 10], gen: bankGen('analogies') }
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
      { id: 'sciChem', name: 'Chemistry basics', grades: [6, 11], gen: bankGen('sciChem') }
    ] },
    { id: 'history', name: 'History', color: 'var(--s-reading)', icon: 'library', blurb: 'People, events and turning points that shaped the world.', skills: [
      { id: 'history', name: 'World & U.S. history', grades: [4, 12], gen: bankGen('history') }
    ] },
    { id: 'geography', name: 'Geography', color: 'var(--s-math)', icon: 'globe', blurb: 'Continents, capitals, landforms and the physical world.', skills: [
      { id: 'geography', name: 'World geography', grades: [3, 12], gen: bankGen('geography') }
    ] }
  ];

  var SKILL_INDEX = {};
  SUBJECTS.forEach(function (s) { s.skills.forEach(function (k) { k.subject = s.id; SKILL_INDEX[k.id] = k; }); });

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
      // count generator skills at a conservative 25 distinct variants each,
      // plus every static bank item, plus speed drills.
      var n = 0, banks = 0;
      SUBJECTS.forEach(function (s) { s.skills.forEach(function (k) { n += 25; }); });
      Object.keys(BANKS).forEach(function (b) { banks += BANKS[b].length; });
      return n + banks + SPEED.length * 40;
    },
    gradeNum: gradeNum
  };

  global.Problems = Problems;
})(window);
