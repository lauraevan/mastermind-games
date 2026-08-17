/* ============================================================
 * Mastermind Academy — auth + progress API server
 * Dependency-free (Node built-ins only). Passwords are hashed
 * server-side with scrypt and NEVER stored or returned in plain
 * text. Sessions are stateless HMAC-signed JWTs. Progress is
 * stored per user so it syncs across devices.
 *
 * Run:  node server/server.js
 * Env:  PORT (default 8787), JWT_SECRET (set this in production!),
 *       DATA_DIR (default ./server/data)
 * ============================================================ */
'use strict';
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '8787', 10);
const ROOT = path.resolve(__dirname, '..');            // repo root (static site)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PROG_FILE = path.join(DATA_DIR, 'progress.json');
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn('[warn] JWT_SECRET not set — using a random secret. Sessions reset on restart. Set JWT_SECRET in production.');
}
const TOKEN_TTL = 60 * 60 * 24 * 30; // 30 days

// ---------- tiny JSON store (in-memory + persisted) ----------
function loadJSON(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return {}; } }
fs.mkdirSync(DATA_DIR, { recursive: true });
const users = loadJSON(USERS_FILE);
const progress = loadJSON(PROG_FILE);
let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users));
      fs.writeFileSync(PROG_FILE, JSON.stringify(progress));
    } catch (e) { console.error('persist error', e); }
  }, 150);
}

// ---------- password hashing (scrypt) ----------
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return salt + ':' + hash;
}
function verifyPassword(pw, stored) {
  const parts = String(stored).split(':');
  if (parts.length !== 2) return false;
  const test = crypto.scryptSync(pw, parts[0], 64);
  const real = Buffer.from(parts[1], 'hex');
  return test.length === real.length && crypto.timingSafeEqual(test, real);
}

// ---------- JWT (HS256, no deps) ----------
function b64url(input) { return Buffer.from(input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'); }
function b64urlJSON(obj) { return b64url(JSON.stringify(obj)); }
function signToken(payload) {
  const now = Math.floor(Date.now() / 1000);
  const body = Object.assign({ iat: now, exp: now + TOKEN_TTL }, payload);
  const head = b64urlJSON({ alg: 'HS256', typ: 'JWT' });
  const data = head + '.' + b64urlJSON(body);
  const sig = b64url(crypto.createHmac('sha256', JWT_SECRET).update(data).digest());
  return data + '.' + sig;
}
function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const data = parts[0] + '.' + parts[1];
  const expected = b64url(crypto.createHmac('sha256', JWT_SECRET).update(data).digest());
  const a = Buffer.from(expected), b = Buffer.from(parts[2]);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let body;
  try { body = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')); }
  catch (e) { return null; }
  if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
  return body;
}

// ---------- rate limiting (per IP, sliding window) ----------
const hits = {};
function rateLimit(ip, max, windowMs) {
  const now = Date.now();
  const arr = (hits[ip] || []).filter(function (t) { return now - t < windowMs; });
  arr.push(now);
  hits[ip] = arr;
  return arr.length <= max;
}

// ---------- helpers ----------
function send(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}
function readBody(req) {
  return new Promise(function (resolve) {
    let data = '';
    req.on('data', function (c) { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', function () { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve(null); } });
  });
}
function publicUser(u) { return { name: u.name, username: u.username, grade: u.grade, avatar: u.avatar, createdAt: u.createdAt }; }
function authUser(req) {
  const h = req.headers['authorization'] || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const body = verifyToken(m[1]);
  if (!body) return null;
  return users[body.sub] || null;
}
function pickAvatar(name) {
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0] || '')[0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

// ---------- static file serving (so one server runs the whole app) ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.map': 'application/json' };
function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel === '/' || rel === '') rel = '/index.html';
  const full = path.normalize(path.join(ROOT, rel));
  if (!full.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  fs.stat(full, function (err, st) {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(full).pipe(res);
  });
}

// ---------- routes ----------
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
async function api(req, res, url) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0];

  if (url === '/api/health') return send(res, 200, { ok: true, users: Object.keys(users).length });

  if (url === '/api/signup' && req.method === 'POST') {
    if (!rateLimit('su:' + ip, 15, 60000)) return send(res, 429, { error: 'Too many attempts. Try again shortly.' });
    const b = await readBody(req);
    if (!b) return send(res, 400, { error: 'Bad request.' });
    const name = String(b.name || '').trim().slice(0, 60);
    const username = String(b.username || '').trim().toLowerCase();
    const grade = String(b.grade || 'K').slice(0, 3);
    const password = String(b.password || '');
    if (!name) return send(res, 400, { error: 'Please enter your name.' });
    if (!USERNAME_RE.test(username)) return send(res, 400, { error: 'Username must be 3–20 chars: letters, numbers, underscore.' });
    if (password.length < 6) return send(res, 400, { error: 'Password must be at least 6 characters.' });
    if (users[username]) return send(res, 409, { error: 'That username is already taken.' });
    const u = { name: name, username: username, grade: grade, avatar: pickAvatar(name), pass: hashPassword(password), createdAt: Date.now() };
    users[username] = u;
    persist();
    return send(res, 200, { token: signToken({ sub: username }), user: publicUser(u) });
  }

  if (url === '/api/login' && req.method === 'POST') {
    if (!rateLimit('li:' + ip, 20, 60000)) return send(res, 429, { error: 'Too many attempts. Try again shortly.' });
    const b = await readBody(req);
    if (!b) return send(res, 400, { error: 'Bad request.' });
    const username = String(b.username || '').trim().toLowerCase();
    const u = users[username];
    // Always run a hash to avoid leaking whether the user exists (timing).
    const ok = u ? verifyPassword(String(b.password || ''), u.pass) : verifyPassword('x', hashPassword('y'));
    if (!u || !ok) return send(res, 401, { error: 'Incorrect username or password.' });
    return send(res, 200, { token: signToken({ sub: username }), user: publicUser(u) });
  }

  if (url === '/api/me' && req.method === 'GET') {
    const u = authUser(req);
    if (!u) return send(res, 401, { error: 'Not signed in.' });
    return send(res, 200, { user: publicUser(u) });
  }

  if (url === '/api/grade' && req.method === 'PUT') {
    const u = authUser(req); if (!u) return send(res, 401, { error: 'Not signed in.' });
    const b = await readBody(req);
    u.grade = String((b && b.grade) || u.grade).slice(0, 3); persist();
    return send(res, 200, { user: publicUser(u) });
  }

  if (url === '/api/progress' && req.method === 'GET') {
    const u = authUser(req); if (!u) return send(res, 401, { error: 'Not signed in.' });
    return send(res, 200, { progress: progress[u.username] || null });
  }
  if (url === '/api/progress' && req.method === 'PUT') {
    const u = authUser(req); if (!u) return send(res, 401, { error: 'Not signed in.' });
    const b = await readBody(req);
    if (!b || typeof b.progress !== 'object') return send(res, 400, { error: 'Bad request.' });
    progress[u.username] = b.progress; persist();
    return send(res, 200, { ok: true });
  }

  return send(res, 404, { error: 'Unknown endpoint.' });
}

const server = http.createServer(function (req, res) {
  if (req.method === 'OPTIONS') { send(res, 204, {}); return; }
  const url = req.url || '/';
  if (url.startsWith('/api/')) { api(req, res, url.split('?')[0]).catch(function (e) { console.error(e); send(res, 500, { error: 'Server error.' }); }); return; }
  serveStatic(req, res, url);
});
server.listen(PORT, function () {
  console.log('Mastermind server running: http://localhost:' + PORT);
  console.log('  API:    http://localhost:' + PORT + '/api/health');
  console.log('  Site:   http://localhost:' + PORT + '/');
});
