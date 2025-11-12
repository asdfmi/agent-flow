const PLAYWRIGHT_WAIT_UNTIL = Object.freeze({
  page_loaded: "load",
  dom_ready: "domcontentloaded",
  network_idle: "networkidle",
  response_received: "commit",
});

export default async function handleNavigate({ automation, step }) {
  const { url, waitUntil } = step.config;
  await automation.page.goto(url, {
    waitUntil: PLAYWRIGHT_WAIT_UNTIL[waitUntil] ?? "load",
  });
}
