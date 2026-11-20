import * as v from "valibot";

/** A non-null object whose keys are not known statically, such as parsed JSON. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Whether `error` is a Node system error carrying `code`, such as `ENOENT`. */
export const hasErrorCode = (error: unknown, code: string): boolean =>
  error instanceof Error && "code" in error && error.code === code;

/** A string workflow input, or `fallback` when the input is unset or not a string. */
export const stringInput = (
  inputs: Record<string, unknown>,
  key: string,
  fallback = "",
): string => {
  const value = inputs[key];
  return typeof value === "string" ? value : fallback;
};

/** The parsed value when `value` matches `schema`, otherwise `undefined`. */
export const parseOrUndefined = <const TSchema extends v.GenericSchema>(
  schema: TSchema,
  value: unknown,
): v.InferOutput<TSchema> | undefined => {
  const result = v.safeParse(schema, value);
  return result.success ? result.output : undefined;
};

/** Parses JSON text that must be an object, such as a `package.json`. */
export const parseJsonRecord = (text: string): Record<string, unknown> => {
  const value: unknown = JSON.parse(text);
  if (!isRecord(value)) throw new Error("Expected a JSON object.");
  return value;
};

/** The member of `allowed` equal to `value`, typed as that literal, or `undefined`. */
export const pickLiteral = <const T extends string>(
  allowed: readonly T[],
  value: unknown,
): T | undefined => allowed.find((candidate) => candidate === value);

export const NODE_PLATFORMS = [
  "aix",
  "android",
  "darwin",
  "freebsd",
  "haiku",
  "linux",
  "openbsd",
  "sunos",
  "win32",
  "cygwin",
  "netbsd",
] as const satisfies readonly NodeJS.Platform[];

export const NODE_ARCHITECTURES = [
  "arm",
  "arm64",
  "ia32",
  "loong64",
  "mips",
  "mipsel",
  "ppc64",
  "riscv64",
  "s390x",
  "x64",
] as const satisfies readonly NodeJS.Architecture[];

/** An object whose values are all strings, such as a `package.json` dependency table. */
export const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) && Object.values(value).every((item) => typeof item === "string");

/** Throws from expression position, such as `value ?? fail("missing")`. */
export const fail = (message: string): never => {
  throw new Error(message);
};
