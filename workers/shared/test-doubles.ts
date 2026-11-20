/**
 * Builds a test double that only implements the members the code under test touches.
 * Workers are deployed on their own, so they cannot depend on the app packages that hold the
 * shared copy of this helper.
 */
export function partialDouble<T>(implemented: object): T;
export function partialDouble(implemented: object): object {
  return implemented;
}
