import { sleep } from "../utils.js";

export default async function handleWait({ step }) {
  const { timeout } = step.config;
  await sleep(timeout * 1000);
  return false;
}
