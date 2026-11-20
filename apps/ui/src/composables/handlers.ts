// renderer handler

import type { RendererChannels, RendererMessage } from "@pipelab/shared";
import {
  type HandleListenerRendererArgs,
  type HandleListenerRendererSendFn,
} from "@pipelab/shared";

export type HandleListenerRenderer<KEY extends RendererChannels> = (
  event: Electron.IpcRendererEvent,
  data: HandleListenerRendererArgs<KEY>,
) => Promise<void>;

export const handle = <KEY extends RendererChannels>(
  channel: KEY,
  listener: HandleListenerRenderer<KEY>,
) => {
  if (!window.electron) {
    console.warn(`[Handlers] Electron not available, skipping handler for channel: ${channel}`);
    return () => {};
  }
  return window.electron.ipcRenderer.on(channel, (event, message: RendererMessage) => {
    const { data, requestId } = message;

    const send: HandleListenerRendererSendFn<KEY> = (events) => {
      return window.electron.ipcRenderer.send(requestId, events);
    };

    return listener(event, {
      send,
      value: data,
    });
  });
};
