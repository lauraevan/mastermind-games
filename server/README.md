# Mastermind Academy — auth + progress server

A tiny, **dependency-free** Node.js server that gives the site real accounts:

- **Passwords are hashed server-side with [scrypt]** (`salt:hash`) and are never
  stored or returned in plain text.
- **Sessions are stateless JWTs** (HMAC-SHA256), signed with `JWT_SECRET`.
- **Progress syncs per user**, so a student can sign in on any device and pick
  up where they left off.
- **Per-IP rate limiting** on signup/login, timing-safe password and token
  comparison, and a login response that doesn't reveal whether a username
  exists.
- It also **serves the static site**, so a single process runs everything.

No `npm install` is needed — it only uses Node's built-in modules
(`http`, `crypto`, `fs`, `path`).

## Run it locally

```bash
# from the repo root
JWT_SECRET="$(openssl rand -hex 32)" node server/server.js
# → http://localhost:8787
```

Then open <http://localhost:8787/> and register an account. Because the site is
now served from the same origin as the API, `store.js` automatically switches
from local-demo mode to real server accounts.

### Environment variables

| Var          | Default        | Notes                                                        |
|--------------|----------------|--------------------------------------------------------------|
| `PORT`       | `8787`         | Port to listen on.                                           |
| `JWT_SECRET` | random         | **Set this in production.** If unset, a random secret is used and every restart invalidates existing sessions. |
| `DATA_DIR`   | `server/data`  | Where `users.json` and `progress.json` are written.          |

`server/data/` is git-ignored — it holds real user records and must not be
committed.

## API

All endpoints are under `/api`. Bodies and responses are JSON. Authenticated
routes expect an `Authorization: Bearer <token>` header.

| Method | Path            | Auth | Purpose                                   |
|--------|-----------------|------|-------------------------------------------|
| GET    | `/api/health`   | –    | Liveness + user count.                    |
| POST   | `/api/signup`   | –    | `{name, username, grade, password}` → `{token, user}`. |
| POST   | `/api/login`    | –    | `{username, password}` → `{token, user}`. |
| GET    | `/api/me`       | ✔    | Current user.                             |
| PUT    | `/api/grade`    | ✔    | `{grade}` → updated user.                 |
| GET    | `/api/progress` | ✔    | The user's saved progress.                |
| PUT    | `/api/progress` | ✔    | `{progress}` — replace saved progress.    |

Validation: usernames are `^[a-z0-9_]{3,20}$`, passwords are at least 6
characters, duplicate usernames return `409`.

## Deploy

Any host that runs Node ≥ 18 works. Set `JWT_SECRET`, mount a persistent volume
for `DATA_DIR`, and start with `npm start` (which runs `node server.js`).

- **Render / Railway / Fly.io** — point the service at this repo, build command
  none, start command `node server/server.js`, and add the `JWT_SECRET` env var.
  On Fly/Railway attach a volume and set `DATA_DIR` to a path on it so accounts
  survive redeploys.
- **A plain VPS** — `git clone`, then run it behind a reverse proxy (nginx,
  Caddy) with a process manager (`systemd`, `pm2`). Terminate TLS at the proxy.

> The static demo on githack has no server, so it stays in local-only mode
> (accounts live in that browser). Serve the site from this Node process to get
> real, server-backed accounts.

[scrypt]: https://nodejs.org/api/crypto.html#cryptoscryptsyncpassword-salt-keylen-options
