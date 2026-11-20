import { describe, expect, it } from "vitest";
import { itchDestination } from "./index";
import { partialDouble } from "@pipelab/shared/test-doubles";

const issuesFor = (channel: string) =>
  itchDestination.validate(
    partialDouble({
      id: "itch",
      provider: itchDestination.id,
      enabled: true,
      config: { accountConnectionId: "a", project: "game" },
      slots: [{ id: "s", enabled: true, config: { channel } }],
    }),
    partialDouble({ host: { platform: "linux", architecture: "x64" } }),
  );

describe("itch channel validation", () => {
  it("accepts conventional and new channel names", () => {
    expect(issuesFor("windows-beta")).toEqual([]);
    expect(issuesFor("Win_64.v2")).toEqual([]);
  });
  it.each(["win beta", "win:beta", "a/b"])(
    "rejects %j, which would corrupt the push target",
    (channel) => {
      expect(issuesFor(channel).map((issue) => issue.code)).toEqual(["itch.channel.invalid"]);
    },
  );
});

describe("itch channel validation with bindings", () => {
  it("does not judge a ${{ env.X }} binding, which is resolved at run time", () => {
    expect(issuesFor("${{ env.ITCH_CHANNEL }}")).toEqual([]);
  });
});
