import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { isExternalHttpUrl, isTrustedRendererUrl } from "./trusted-origin";

const trusted = ["http://127.0.0.1:4000"];

describe("isTrustedRendererUrl", () => {
  it("accepts the app's own origin", () => {
    assert.equal(isTrustedRendererUrl("http://127.0.0.1:4000/?cliPort=1#token=x", trusted), true);
  });

  it("rejects other hosts, ports, schemes and unparseable values", () => {
    for (const url of [
      "http://127.0.0.1:4001/",
      "http://localhost:4000/",
      "https://127.0.0.1:4000/",
      "https://example.com/",
      "file:///etc/passwd",
      "about:blank",
      "not a url",
      "",
      undefined,
    ]) {
      assert.equal(isTrustedRendererUrl(url, trusted), false, String(url));
    }
  });

  it("trusts nothing when no origin is known", () => {
    assert.equal(isTrustedRendererUrl("http://127.0.0.1:4000/", []), false);
  });
});

describe("isExternalHttpUrl", () => {
  it("allows only http and https", () => {
    assert.equal(isExternalHttpUrl("https://pipelab.app"), true);
    assert.equal(isExternalHttpUrl("http://example.com"), true);
    assert.equal(isExternalHttpUrl("file:///etc/passwd"), false);
    assert.equal(isExternalHttpUrl("javascript:alert(1)"), false);
    assert.equal(isExternalHttpUrl("nope"), false);
  });
});
