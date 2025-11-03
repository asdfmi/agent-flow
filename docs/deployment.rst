Deployment & Tooling
====================

Docker Compose
--------------

``docker-compose.yml`` defines two services.

- **portal**
  - Exposes port 3000
- **crawler**
  - Exposes port 4000

Prisma & Database
-----------------
- Apply the SQLite schema with ``pnpm --dir portal exec prisma db push``.
- Seed the demo workflow via ``pnpm --dir portal exec prisma db seed``.

Playwright
----------
- Docker builds run ``pnpm exec playwright install --with-deps chromium``; do the same locally to ensure dependencies are present.

Scripting & CI
--------------
- ``pnpm run lint``: run ESLint across the repository.
- ``pnpm --dir portal run vite``: launch the portal UI in dev mode.
- ``pnpm --dir portal run start:push``: push the Prisma schema and start the API.
- ``pnpm --dir crawler start``: start the crawler service (``node index.js``).

Documentation
-------------
- Use ``docs/index.rst`` as the root when generating with Sphinx or similar tooling.
- Publish the generated HTML to GitHub Pages, S3/CloudFront, Netlify, etc., for external access.
