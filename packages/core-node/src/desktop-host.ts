let desktopHosted = false;

/** Marks this process as the Desktop app hosting the server in-process. */
export const markDesktopHosted = (hosted = true): void => {
  desktopHosted = hosted;
};

export const isDesktopHosted = (): boolean => desktopHosted;
