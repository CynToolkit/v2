import type { InstallUpdateAfterServerStopsOptions } from "./update-shutdown.types";

export async function installUpdateAfterServerStops(
  options: InstallUpdateAfterServerStopsOptions,
): Promise<void> {
  try {
    await options.stopServer();
    options.setInstalling(true);
    options.quitAndInstall();
  } catch (error) {
    options.setInstalling(false);
    options.onFailure(error);
  }
}
