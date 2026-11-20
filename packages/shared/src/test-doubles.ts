/**
 * Builds a test double that only implements the members the code under test touches.
 * Using any other member of the double is the test's responsibility to avoid. Keeping this one
 * documented gap here replaces an unchecked cast at every call site.
 */
export function partialDouble<T>(implemented: object): T;
export function partialDouble(implemented: object): object {
  return implemented;
}

/** Passes a deliberately invalid value to code under test that validates its input at runtime. */
export function invalidInput<T>(value: unknown): T;
export function invalidInput(value: unknown): unknown {
  return value;
}
