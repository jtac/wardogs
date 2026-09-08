# wardogs

Fan-made tools for playing WARDOGS with friends. Live at https://goblincrew.wardogs.workers.dev/ (Worker "goblincrew" on the "wardogs" account subdomain) (GitHub Pages mirrors the clock only).

- `index.html` — Deployment Clock, the front page: countdown to the Steam Early Access unlock (10 Sep 2026, 16:00 UTC), roll call, sentry mini window
- `dispatches/` — squad message board with pictures (needs the Worker API in `src/worker.js`)
- `assets/brand/` — brand notes, voice rules and CSS tokens derived from the Team17 press kit (art files not committed)

Deploy: `npx wrangler deploy`

WARDOGS is a trademark of Bulkhead. Unofficial; not affiliated with Bulkhead or Team17.
