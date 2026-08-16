# Mastermind Academy

A friendly **K-12 learning platform** in the spirit of sites like IXL. Sign up,
pick your grade, and practice hundreds of skills across six subjects with instant
feedback, XP, daily streaks, and a progress dashboard that shows how you're doing.

## Features

- **Full landing page** — hero, subject catalog, grade levels, how-it-works, FAQ.
- **Sign up & log in** — lightweight local accounts (stored in your browser).
- **Learning dashboard** — a personalized greeting ("Keep on going, *name*!"),
  daily streak, level & XP, today's goal ring, weekly activity chart, per-subject
  progress, recommended skills, and achievements.
- **6 subjects, 68 skills, 500+ problems** — Math, Algebra, Calculus, Reading,
  Spanish, and Science. Problems are generated fresh and **scale to your grade**
  (K–12), so the practice pool is effectively unlimited.
- **Streaks & achievements** — build a daily habit and unlock badges as you grow.

## Structure

```
index.html            Landing page
login.html            Sign up / log in
dashboard.html        Learner dashboard (progress, streaks, achievements)
subjects/*.html       Practice pages (math, algebra, calculus, reading, spanish, science)
assets/css/           Design system + practice styles
assets/js/            store (accounts/progress/streaks), problem bank, dashboard,
                      practice engine, shared layout
```

## Running

It's a static site — no build step, no server required. Open `index.html` in a
browser, or serve the folder with any static file server and visit it.

Progress is saved locally in your browser via `localStorage`, so you can pick up
right where you left off.

## Tech

Vanilla HTML/CSS/JavaScript for the learning experience, plus a small
TypeScript module (compiled to `atlas/`) — see `tsconfig.json`. No frameworks,
no dependencies to install for the site itself.

---

*Practice makes progress.* 🎓
