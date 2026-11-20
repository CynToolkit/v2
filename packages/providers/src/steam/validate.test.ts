import { describe, expect, it } from "vitest";
import { steamDestination } from "./index";
import { partialDouble } from "@pipelab/shared/test-doubles";

const issueCodes = (appId: string, depotId: string) =>
  steamDestination
    .validate(
      partialDouble({
        id: "steam",
        provider: steamDestination.id,
        enabled: true,
        config: { accountConnectionId: "a", appId },
        slots: [{ id: "s", enabled: true, config: { depotId } }],
      }),
      partialDouble({ host: { platform: "linux", architecture: "x64" } }),
    )
    .map((issue) => issue.code);

describe("steam id validation", () => {
  it("accepts digits and run-time bindings", () => {
    expect(issueCodes("480", "481")).toEqual([]);
    expect(issueCodes("${{ env.STEAM_APP }}", "${{ env.STEAM_DEPOT }}")).toEqual([]);
  });
  it("rejects literal non-digit ids", () => {
    expect(issueCodes("app", "sdf")).toEqual(["steam.app-id.digits", "steam.depot.digits"]);
  });
});
