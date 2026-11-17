// Prints the changelog section for a version, in GitHub release-notes markdown.
// Usage: node scripts/release-notes.mjs <version> [changelog-path]
import { readFileSync } from "node:fs";

const [version, path = "apps/cli/CHANGELOG.md"] = process.argv.slice(2);
if (!version) {
  console.error("Usage: release-notes.mjs <version> [changelog-path]");
  process.exit(1);
}

const lines = readFileSync(path, "utf8").split("\n");
const start = lines.findIndex((line) => line.trim() === `## ${version}`);
if (start === -1) {
  console.error(`No changelog entry for ${version} in ${path}`);
  process.exit(1);
}
let end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
if (end === -1) end = lines.length;

const body = lines
  .slice(start + 1, end)
  .join("\n")
  .trim();
console.log(body);
