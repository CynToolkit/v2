import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import handler from "serve-handler";
import { buildRendererCsp, rendererSecurityHeaders } from "./renderer-csp";

const script = 'try { document.documentElement.classList.add("dark"); } catch {}';
const html = `<!doctype html><html><head><script>${script}</script></head><body><script type="module" crossorigin src="/assets/index.js"></script></body></html>`;

const setup = async (onTestFinished: (cleanup: () => Promise<void>) => void, headers?: string) => {
  const dir = await mkdtemp(join(tmpdir(), "pipelab-csp-"));
  onTestFinished(() => rm(dir, { recursive: true, force: true }));
  await writeFile(join(dir, "index.html"), html);
  if (headers) await writeFile(join(dir, "_headers"), headers);
  return dir;
};

describe("renderer CSP", () => {
  it("hashes only the inline boot script and forbids eval and inline handlers", async ({
    onTestFinished,
  }) => {
    const policy = buildRendererCsp(await setup(onTestFinished));
    const hash = createHash("sha256").update(script).digest("base64");
    expect(policy).toContain(`script-src 'self' 'sha256-${hash}'`);
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-(inline|eval)'/);
    expect(policy).toContain("script-src-attr 'none'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy.match(/sha256-/g)).toHaveLength(1);
  });

  it("reuses the connect origins the Editor build recorded", async ({ onTestFinished }) => {
    const policy = buildRendererCsp(
      await setup(
        onTestFinished,
        "/*\n  Content-Security-Policy-Report-Only: default-src 'self'; connect-src 'self' https://abc.supabase.co wss://abc.supabase.co; img-src 'self'\n",
      ),
    );
    expect(policy).toContain("connect-src 'self' https://abc.supabase.co wss://abc.supabase.co;");
  });

  it("is sent on served files", async ({ onTestFinished }) => {
    const dir = await setup(onTestFinished);
    const headers = rendererSecurityHeaders(dir);
    const server = http.createServer((request, response) =>
      handler(request, response, { public: dir, headers }),
    );
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    onTestFinished(() => new Promise((resolve) => server.close(() => resolve())));
    const { port } = server.address() as { port: number };
    const response = await fetch(`http://127.0.0.1:${port}/index.html`);
    expect(response.headers.get("content-security-policy")).toBe(buildRendererCsp(dir));
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
