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

Production Deployment
---------------------
1. **Build artefacts**
   - ``pnpm --dir portal run build:ui`` to produce ``portal/ui/dist``.
   - Bundle the crawler with your preferred Node.js process manager (e.g. systemd, PM2, containers).
2. **Configure environments**
   - Portal: ``DATABASE_URL`` (SQLite file or remote database), ``INTERNAL_SECRET`` (shared token with crawler), ``CRAWLER_BASE_URL`` (crawler origin).
   - Crawler: ``PORTAL_BASE_URL`` (public portal URL), ``INTERNAL_SECRET`` (must match portal), ``PORT`` / ``MAX_CONCURRENCY``.
3. **Serve static UI**
   - Optional: front the portal with Nginx/Caddy and proxy ``/api`` and ``/ws`` to the Node.js server.
4. **Observability**
   - Scrape ``/healthz`` from both services. The crawler endpoint returns active run metrics; the portal responds with ``{ ok: true }`` when online.
   - Enable log aggregation for run failures by tailing portal and crawler stdout/stderr.
5. **Backups**
   - Schedule regular copies of the Prisma database (SQLite file) or configure managed backups if using PostgreSQL/MySQL in production.

Container Example
-----------------
An outline for Docker-based setups:

.. code-block:: dockerfile

   FROM node:22-slim AS base
   WORKDIR /app
   COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
   COPY portal/package.json portal/
   COPY crawler/package.json crawler/
   RUN corepack enable && pnpm fetch

   FROM base AS build-portal
   COPY portal portal
   RUN pnpm --filter browgent-portal install --offline
   RUN pnpm --dir portal run build:ui

   FROM base AS runtime
   ENV NODE_ENV=production
   COPY --from=build-portal /app /app
   COPY crawler crawler
   RUN pnpm --filter browgent-crawler install --offline
   CMD ["pnpm", "--dir", "portal", "exec", "node", "server/index.js"]

Adjust the final ``CMD`` to launch the crawler in a separate container or process.
