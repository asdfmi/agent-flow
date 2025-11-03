import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.workflow.deleteMany();

  const steps = [
    {
      stepKey: "nav_home",
      type: "navigate",
      label: "Navigate to Qiita",
      config: {
        url: "https://qiita.com/",
        waitUntil: "domcontentloaded",
      },
      successConfig: {
        timeout: 5,
        condition: { visible: { xpath: "//article[1]" } },
      },
      nextStepKey: "wait_hydrate",
    },
    {
      stepKey: "wait_hydrate",
      type: "wait",
      label: "Wait for hydration",
      successConfig: {
        timeout: 2,
        condition: { delay: 1 },
      },
      nextStepKey: "open_first_article",
    },
    {
      stepKey: "open_first_article",
      type: "click",
      label: "Open first article",
      config: {
        xpath: "//article[1]/h2/a",
        options: { button: "left" },
      },
      successConfig: {
        timeout: 5,
        condition: { visible: { xpath: "//article//h1" } },
      },
      nextStepKey: "wait_after_nav",
    },
    {
      stepKey: "wait_after_nav",
      type: "wait",
      label: "Wait after navigation",
      successConfig: {
        timeout: 2,
        condition: { delay: 1 },
      },
      nextStepKey: "scroll_1",
    },
  ];

  for (let idx = 0; idx < 10; idx += 1) {
    const currentKey = `scroll_${idx + 1}`;
    const nextKey = idx === 9 ? "log_complete" : `scroll_${idx + 2}`;
    steps.push({
      stepKey: currentKey,
      type: "scroll",
      label: `Scroll chunk ${idx + 1}`,
      config: { dy: 600, dx: 0 },
      successConfig: {
        timeout: 3,
        condition: { delay: 1 },
      },
      nextStepKey: nextKey,
    });
  }

  steps.push({
    stepKey: "log_complete",
    type: "log",
    label: "Reached bottom",
    config: {
      target: "browgent",
      level: "info",
      message: "Finished scrolling Qiita feed",
    },
  });

  await prisma.workflow.create({
    data: {
      slug: "qiita-mock",
      title: "Qiita trending scroll demo",
      description: "Navigate to Qiita and scroll down the feed multiple times while logging progress.",
      startStepId: "nav_home",
      steps: {
        create: steps,
      },
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
