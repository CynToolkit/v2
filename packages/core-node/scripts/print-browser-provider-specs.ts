import { buildBrowserProviderSpecs } from "../src/release/browser-provider-specs";

// The UI's Vite plugin runs this and reads the last stdout line as JSON.
process.stdout.write(`\n${JSON.stringify(buildBrowserProviderSpecs())}\n`);
