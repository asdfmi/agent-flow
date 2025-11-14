# Agent Flow

Agent Flow automates browser tasks end-to-end, combining clicks and text input with AI-powered generation, classification, and decision-making. It provides real-time visibility with logs and screenshots, and can extract web data as metrics for tracking and analysis. It’s not just automation — it’s an AI-driven workflow engine for the browser.

See full architecture and API details at https://asdfmi.github.io/agent-flow/.

## Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Push the Prisma schema:
   ```bash
   pnpm --dir portal exec prisma db push --schema prisma/schema.prisma
   ```
3. Install Playwright Chromium (one-time):
   ```bash
   pnpm --dir runner exec playwright install --with-deps chromium
   ```
4. Run
   ```bash
   pnpm dev
   ```
