import {
  planRelease,
  withoutHostUnavailableBuilds,
  type ReleaseConfig,
  type ReleasePlanningContext,
  type ReleaseRegistry,
} from "@pipelab/shared";
import { withoutUnavailableDestinations } from "./unavailable-destinations";
import type { PlanReleaseForHostResult } from "./plan-for-host.types";

/**
 * The one way a saved workflow is planned for this installation: Cloud and host-unavailable parts are
 * dropped first, exactly as a run does. Every consumer of "what does this workflow use" starts here.
 */
export const releaseConfigForHost = (
  config: ReleaseConfig,
  registry: ReleaseRegistry,
  host: ReleasePlanningContext["host"],
): ReleaseConfig =>
  withoutHostUnavailableBuilds(withoutUnavailableDestinations(config), registry, host);

export const planReleaseForHost = (
  config: ReleaseConfig,
  registry: ReleaseRegistry,
  context: ReleasePlanningContext,
): PlanReleaseForHostResult => {
  const resolved = releaseConfigForHost(config, registry, context.host);
  return { config: resolved, plan: planRelease(resolved, registry, context) };
};
