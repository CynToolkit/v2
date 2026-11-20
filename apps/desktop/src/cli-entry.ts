import { dirname, join } from "node:path";

// Packaged layout: <app>/.vite/build/cli-entry.js next to <app>/dist/cli (ui + assets).
// Must run before the CLI program loads: it reads this while resolving bundled assets.
process.env.PIPELAB_CLI_DIR ||= join(dirname(dirname(__dirname)), "dist", "cli");

// The CLI program parses process.argv when loaded, so this import runs the command.
void import("@pipelab/cli/program");
