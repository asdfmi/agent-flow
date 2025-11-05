Development Workflow
====================

Follow the same short setup outlined in the README.

1. Install dependencies::

      pnpm install

2. Push the Prisma schema::

      pnpm --dir portal exec prisma db push --schema prisma/schema.prisma

3. Install the Playwright Chromium bundle (one-time)::

      pnpm --dir crawler exec playwright install --with-deps chromium

4. Start the local stack (portal API, UI watcher, crawler)::

      pnpm run dev

Environment variables
---------------------

- ``portal/.env`` — e.g. ``DATABASE_URL="file:./dev.sqlite"``, ``INTERNAL_SECRET="dev-internal-secret"``, ``CRAWLER_BASE_URL="http://localhost:4000"``
- ``crawler/.env`` — e.g. ``PORTAL_BASE_URL="http://localhost:3000"``, ``INTERNAL_SECRET="dev-internal-secret"``, ``PORT=4000``, ``MAX_CONCURRENCY=4``

Additional tooling
------------------

- ``pnpm run lint`` — repository-wide ESLint
- ``pnpm --dir portal run build:ui`` — production UI build
- ``pnpm --dir portal exec node server/index.js`` / ``pnpm --dir crawler exec node index.js`` — production-style services
- Documentation root: ``docs/index.rst``
