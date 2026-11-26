import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const username = process.env.CONSTRUCT_CI_USERNAME;
const password = process.env.CONSTRUCT_CI_PASSWORD;
const userDataDirectory = process.env.CONSTRUCT_CI_PROFILE_USER_DATA;
const githubEnv = process.env.GITHUB_ENV;

if (!username || !password || !userDataDirectory || !githubEnv) {
  throw new Error("Construct CI credentials and a disposable profile path are required.");
}

await mkdir(userDataDirectory, { recursive: true });

const seedProfile = async () => {
  const form = new FormData();
  form.append("username", username);
  form.append("password", password);
  form.append("productType", "games");

  const response = await fetch("https://account.construct.net/login.json", {
    method: "POST",
    body: form,
  });
  if (!response.ok) throw new Error(`Construct login request failed with HTTP ${response.status}.`);

  const result = await response.json();
  const login = result?.request?.status === "ok" ? result.response : undefined;
  if (
    (typeof login?.userID !== "string" && typeof login?.userID !== "number") ||
    typeof login?.token !== "string"
  ) {
    throw new Error("Construct rejected the CI test account credentials.");
  }

  // Match the Construct export's browser: the default headless shell does not write the
  // Default/Preferences file that Pipelab requires in a selected profile.
  const context = await chromium.launchPersistentContext(userDataDirectory, {
    headless: true,
    channel: "chromium",
  });
  try {
    const page = await context.newPage();
    await page.goto(
      "https://account.construct.net/login?theme=default&lang=en-US&productType=games",
      {
        waitUntil: "load",
        timeout: 60_000,
      },
    );
    await page.waitForFunction(() => typeof localforage !== "undefined", { timeout: 30_000 });
    await page.evaluate(async (value) => {
      await localforage.setItem("login-data", value);
    }, login);
    const tokenResponsePromise = page.waitForResponse(
      (value) => {
        const url = new URL(value.url());
        return url.origin === "https://account.construct.net" && url.pathname === "/token.json";
      },
      { timeout: 30_000 },
    );
    const [, tokenResponse] = await Promise.all([
      page.goto("https://editor.construct.net/", {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      }),
      tokenResponsePromise,
    ]);
    const tokenPayload = await tokenResponse.json().catch(() => undefined);
    if (!tokenResponse.ok() || tokenPayload?.request?.status !== "ok") {
      // Only the HTTP and request status are reported; the payload can hold session tokens.
      throw new Error(
        `Construct did not confirm the disposable profile session (HTTP ${tokenResponse.status()}, status ${String(tokenPayload?.request?.status)}).`,
      );
    }
  } finally {
    await context.close();
  }
};

// The three OS jobs sign in to the same test account at about the same time, and Construct
// occasionally refuses one of the concurrent sessions, so retry with a growing pause.
const attempts = 3;
for (let attempt = 1; ; attempt++) {
  try {
    await seedProfile();
    break;
  } catch (error) {
    if (attempt >= attempts) throw error;
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Construct profile attempt ${attempt} of ${attempts} failed: ${message}`);
    await delay(15_000 * attempt);
  }
}

const profile = join(userDataDirectory, "Default");
await appendFile(githubEnv, `CONSTRUCT_CI_PROFILE_PATH=${profile}\n`);
console.log("Created disposable authenticated Construct profile.");
