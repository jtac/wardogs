# wardogs

Fan-made tools for playing WARDOGS with friends. Live at https://goblincrew.wardogs.workers.dev/ (Worker "goblincrew" on the "wardogs" account subdomain) (GitHub Pages mirrors the clock only).

- `index.html` — Deployment Clock, the front page: countdown to the Steam Early Access unlock (10 Sep 2026, 16:00 UTC), roll call, sentry mini window
- `dispatches/` — squad message board with pictures (needs the Worker API in `src/worker.js`)
- `artillery/` — built copy of apollyon-sys/wardogs-calculator (MIT), L81 mortar and SPH-2 artillery calculator with team map; rebuild from upstream with `npm run build` and copy `dist/` here, then re-apply the patch in `artillery/js/map/tiles.js` that removes `image.crossOrigin` (their tile CDN CORS only allows their own domain)
- `assets/brand/` — brand notes, voice rules and CSS tokens derived from the Team17 press kit (art files not committed)

Deploy: `npx wrangler deploy`

WARDOGS is a trademark of Bulkhead. Unofficial; not affiliated with Bulkhead or Team17.
