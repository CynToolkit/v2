import { describe, expect, test } from "vitest";
import { IncomingMessage } from "node:http";
import {
  hasValidAuthToken,
  isAllowedOrigin,
  isAuthorizedRequest,
  isLoopbackHost,
  isTokenEnforced,
  requiresAuthentication,
} from "./server-security";

const request = (headers: Record<string, string>, url = "/") =>
  ({ headers, url }) as unknown as IncomingMessage;

describe("server security policy", () => {
  test("treats loopback hosts as local and remote hosts as protected", () => {
    expect(isLoopbackHost("127.0.0.1")).toBe(true);
    expect(isLoopbackHost("localhost")).toBe(true);
    expect(requiresAuthentication("127.0.0.1")).toBe(false);
    expect(requiresAuthentication("0.0.0.0")).toBe(true);
  });

  test("accepts a bearer token or query token", () => {
    expect(hasValidAuthToken(request({ authorization: "Bearer secret" }), "secret")).toBe(true);
    expect(hasValidAuthToken(request({}, "/?token=secret"), "secret")).toBe(true);
    expect(hasValidAuthToken(request({ authorization: "Bearer wrong" }), "secret")).toBe(false);
  });

  test("allows same-origin and explicitly configured origins only", () => {
    expect(isAllowedOrigin(request({ host: "example.test", origin: "http://example.test" }))).toBe(
      true,
    );
    expect(
      isAllowedOrigin(request({ host: "example.test", origin: "https://trusted.test" }), [
        "https://trusted.test",
      ]),
    ).toBe(true);
    expect(isAllowedOrigin(request({ host: "example.test", origin: "https://evil.test" }))).toBe(
      false,
    );
  });

  test("requires both origin and authentication for remote requests", () => {
    const options = {
      host: "0.0.0.0",
      authToken: "secret",
      allowedOrigins: ["https://trusted.test"],
    };

    expect(
      isAuthorizedRequest(
        request({
          host: "example.test",
          origin: "https://trusted.test",
          authorization: "Bearer secret",
        }),
        options,
      ),
    ).toBe(true);
    expect(
      isAuthorizedRequest(
        request({ host: "example.test", origin: "https://trusted.test" }),
        options,
      ),
    ).toBe(false);
  });

  test("allows unauthenticated development access when explicitly enabled", () => {
    expect(
      isAuthorizedRequest(request({ host: "example.test", origin: "http://example.test" }), {
        host: "0.0.0.0",
        allowedOrigins: [],
        allowUnauthenticated: true,
      }),
    ).toBe(true);
  });

  test("requires the development renderer Origin to match the loopback WebSocket host", () => {
    const options = {
      host: "127.0.0.1",
      allowedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
      allowUnauthenticated: true,
    };

    expect(
      isAuthorizedRequest(
        request({ host: "127.0.0.1:49152", origin: "http://127.0.0.1:5173" }),
        options,
      ),
    ).toBe(true);
    expect(
      isAuthorizedRequest(
        request({ host: "127.0.0.1:49152", origin: "http://localhost:5173" }),
        options,
      ),
    ).toBe(false);
  });

  describe("loopback server with a configured token", () => {
    const options = {
      host: "127.0.0.1",
      authToken: "secret",
      allowedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
    };

    test("enforces the token even though the host is loopback", () => {
      expect(isTokenEnforced(options)).toBe(true);
      expect(isTokenEnforced({ host: "127.0.0.1" })).toBe(false);
    });

    test("rejects a local process that has no token, with or without an Origin", () => {
      expect(isAuthorizedRequest(request({ host: "127.0.0.1:49152" }), options)).toBe(false);
      expect(
        isAuthorizedRequest(
          request({ host: "127.0.0.1:49152", origin: "http://127.0.0.1:49152" }),
          options,
        ),
      ).toBe(false);
    });

    test("rejects a wrong token and accepts the right one", () => {
      expect(
        isAuthorizedRequest(request({ host: "127.0.0.1:49152" }, "/?token=wrong"), options),
      ).toBe(false);
      expect(
        isAuthorizedRequest(request({ host: "127.0.0.1:49152" }, "/?token=secret"), options),
      ).toBe(true);
    });

    test("still enforces the token in development mode", () => {
      expect(
        isAuthorizedRequest(request({ host: "127.0.0.1:49152" }), {
          ...options,
          allowUnauthenticated: true,
        }),
      ).toBe(false);
      expect(
        isAuthorizedRequest(
          request({ host: "127.0.0.1:49152", origin: "http://127.0.0.1:5173" }, "/?token=secret"),
          { ...options, allowUnauthenticated: true },
        ),
      ).toBe(true);
    });
  });
});
