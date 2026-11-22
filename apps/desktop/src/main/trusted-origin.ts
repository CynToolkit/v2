/** Origin of a URL, or `undefined` when it is missing or not parseable. */
const originOf = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  try {
    const { origin } = new URL(url);
    // Opaque origins (file:, data:, about:blank) serialize to "null" and are never trusted.
    return origin === "null" ? undefined : origin;
  } catch {
    return undefined;
  }
};

/** Whether `url` belongs to one of the renderer origins the app itself serves. */
export const isTrustedRendererUrl = (
  url: string | undefined,
  trustedOrigins: readonly string[],
): boolean => {
  const origin = originOf(url);
  return origin !== undefined && trustedOrigins.includes(origin);
};

/** Whether an external navigation target may be handed to the system browser. */
export const isExternalHttpUrl = (url: string): boolean => {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};
