/// <reference path="./declarations.d.ts" />
import { createProviderDefinition } from "@pipelab/shared";
import { basename, normalize } from "node:path";
import { isChromiumProfileDirectory, listChromiumBrowserProfiles } from "./browser-profiles";
import type { ReleaseFieldOption, ReleaseSourceDefinition } from "@pipelab/shared";
import { getConstructProjectVersion, getSavedConstructVersion } from "./saved-version";
export { discoverBrowserProfiles, inspectChromiumProfile } from "./browser-profiles";

import { constructWorkflowTaskFactories } from "./export-c3p";
import { constructMetadata, constructSourceDescriptor, constructVersionKeywords } from "./metadata";
import { constructProducer } from "./producer";
import { checkConstructPreflight, testConstructConnection } from "./preflight";

export const constructSource: ReleaseSourceDefinition = {
  ...constructSourceDescriptor,
  validate: (config) => [
    ...(typeof config.path === "string" && config.path
      ? []
      : [
          {
            code: "construct.project.required",
            message: "A Construct project path is required.",
            severity: "error" as const,
            path: "path",
          },
        ]),
    ...(typeof config.profilePath === "string" && config.profilePath
      ? []
      : [
          {
            code: "construct.profile.required",
            message: "A browser profile path is required.",
            severity: "error" as const,
            path: "profilePath",
          },
        ]),
    ...(Object.hasOwn(config, "accountConnectionId") &&
    typeof config.accountConnectionId !== "string"
      ? [
          {
            code: "construct.connection.invalid",
            message: "A Construct Account alias must be a string.",
            severity: "error" as const,
            path: "accountConnectionId",
          },
        ]
      : []),
  ],
  inspect: async (config) => {
    const profiles = await listChromiumBrowserProfiles();
    const selectedProfileValue =
      typeof config.profilePath === "string" ? config.profilePath.trim() : "";
    const selectedProfilePath = selectedProfileValue ? normalize(selectedProfileValue) : "";
    const selectedProfileListed = profiles.some(
      (profile) => normalize(profile.path) === selectedProfilePath,
    );
    const selectedProfileIsCustom =
      Boolean(selectedProfilePath) &&
      !selectedProfileListed &&
      (await isChromiumProfileDirectory(selectedProfilePath));
    const selectedProfileExists =
      !selectedProfilePath || selectedProfileListed || selectedProfileIsCustom;
    // Offer the release the project was saved with first, so it can be pinned in one click.
    const savedVersion =
      typeof config.path === "string" && config.path.trim()
        ? await getSavedConstructVersion(config.path.trim())
        : undefined;
    const projectVersion =
      typeof config.path === "string" && config.path.trim()
        ? await getConstructProjectVersion(config.path.trim())
        : undefined;
    const versionOptions: ReleaseFieldOption[] = [
      ...(savedVersion
        ? [{ label: `${savedVersion} · saved in project`, value: savedVersion }]
        : []),
      ...constructVersionKeywords,
    ];
    const fieldOptions = profiles.map((profile) => ({
      label: `${profile.browser} / ${profile.profileName}`,
      value: profile.path,
    }));
    if (selectedProfileIsCustom) {
      fieldOptions.push({
        label: `Custom / ${basename(selectedProfilePath)}`,
        value: selectedProfilePath,
      });
    }
    return {
      version: projectVersion,
      issues: selectedProfileExists
        ? []
        : [
            {
              code: "construct.profile.unavailable",
              message:
                "The selected Chromium profile is no longer available. Choose an existing profile.",
              severity: "error",
              path: "profilePath",
            },
          ],
      fieldOptions: {
        profilePath: fieldOptions,
        version: versionOptions,
      },
    };
  },
  compile: (config) => ({
    steps: [
      {
        id: "release-construct-source",
        uses: "@pipelab/core/passthrough",
        with: { path: config.path },
        artifacts: { output: { descriptor: constructSource.output } },
      },
    ],
    artifact: {
      reference: { stepId: "release-construct-source", artifact: "output" },
      descriptor: constructSource.output,
    },
  }),
};

export const provider = createProviderDefinition({
  ...constructMetadata,
  release: { sources: [constructSource], producers: [constructProducer] },
  workflowTasks: constructWorkflowTaskFactories,
  connectionTests: { "@pipelab/plugin-construct": testConstructConnection },
  preflights: { "@pipelab/plugin-construct/export-construct-project": checkConstructPreflight },
});

export { constructWorkflowTaskFactories };
export default provider;
