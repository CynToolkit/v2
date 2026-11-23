import * as p from "@clack/prompts";
import { PipelabContext } from "@pipelab/core-node";
import { setupSettingsConfigFile } from "@pipelab/core-node";
import { getDefaultUserDataPath } from "../paths";
import type { UserDataOptions } from "./options.types";

const INTEGRATION_LABELS: Record<string, string> = {
  path: "Add 'pipelab' to your PATH",
  completion: "Shell autocompletion",
  telemetry: "Anonymous telemetry",
};

export async function setupCommand(options: UserDataOptions) {
  p.intro(`Welcome to Pipelab CLI Setup Wizard`);

  // Stages the wizard offers but cannot perform yet; reported at the end and
  // reflected in the exit status so automation does not read them as success.
  const notImplemented: string[] = [];

  const userDataPath = options.userData || getDefaultUserDataPath();
  const context = new PipelabContext({ userDataPath });

  // 1. Authentication
  const authType = await p.select({
    message: "How would you like to authenticate?",
    options: [
      { value: "token", label: "Access Token (not implemented yet)" },
      { value: "credentials", label: "Email & Password (not implemented yet)" },
      { value: "skip", label: "Skip for now" },
    ],
  });

  if (p.isCancel(authType)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  if (authType === "token" || authType === "credentials") {
    notImplemented.push("Authentication (no credentials were stored)");
  }

  // 2. Configuration
  const settings = await setupSettingsConfigFile(context);
  const config = await settings.getConfig();

  const configChanges = await p.group({
    theme: () =>
      p.select({
        message: "Select your preferred theme:",
        initialValue: config.theme,
        options: [
          { value: "dark", label: "Dark" },
          { value: "light", label: "Light" },
        ],
      }),
    locale: () =>
      p.select({
        message: "Select your language:",
        initialValue: config.locale,
        options: [
          { value: "en-US", label: "English" },
          { value: "fr-FR", label: "French" },
          { value: "pt-BR", label: "Portuguese" },
        ],
      }),
  });

  if (p.isCancel(configChanges)) {
    p.cancel("Setup aborted.");
    process.exit(0);
  }

  const theme = configChanges.theme === "light" ? "light" : "dark";
  const localeValue = configChanges.locale;
  const locale = isLocale(localeValue) ? localeValue : "en-US";

  await settings.setConfig({
    ...config,
    theme,
    locale,
  });

  // 3. Integrations
  const integrations = await p.multiselect({
    message: "Which integrations would you like to enable?",
    options: [
      { value: "path", label: INTEGRATION_LABELS.path, hint: "not implemented yet" },
      { value: "completion", label: INTEGRATION_LABELS.completion, hint: "not implemented yet" },
      { value: "telemetry", label: INTEGRATION_LABELS.telemetry, hint: "not implemented yet" },
    ],
  });

  if (p.isCancel(integrations)) return;

  for (const integration of integrations) {
    notImplemented.push(`${INTEGRATION_LABELS[String(integration)] ?? String(integration)}`);
  }

  if (notImplemented.length > 0) {
    p.log.error(
      `These selections are not implemented and were NOT applied:\n${notImplemented
        .map((item) => `  - ${item}`)
        .join("\n")}`,
    );
    p.outro("Setup finished with unapplied selections (theme and language were saved).");
    process.exitCode = 1;
    return;
  }

  p.note(
    `Theme and language were saved.\n\nType 'pipelab --help' to get started.`,
    "Setup Complete",
  );

  p.outro("Setup complete.");
}

function isLocale(
  value: unknown,
): value is "en-US" | "fr-FR" | "pt-BR" | "zh-CN" | "es-ES" | "de-DE" {
  return (
    typeof value === "string" &&
    ["en-US", "fr-FR", "pt-BR", "zh-CN", "es-ES", "de-DE"].includes(value)
  );
}
