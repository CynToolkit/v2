/** Construct export types, kept apart from the editor automation so metadata can name them. */
export const CONSTRUCT_EXPORT_TYPES = ["web", "webview2", "wkwebview", "cef"] as const;
export type ConstructExportType = (typeof CONSTRUCT_EXPORT_TYPES)[number];
