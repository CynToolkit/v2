import {
  UpdateStatus,
  RendererChannels,
  RendererData,
  RendererEvents,
  RendererEnd,
  RendererMessage,
  RequestId,
  HandleListenerRendererArgs,
  HandleListenerRendererSendFn,
  HandleListenerRenderer as BaseHandleListenerRenderer,
} from "@pipelab/shared";

export type {
  UpdateStatus,
  RendererChannels,
  RendererData,
  RendererEvents,
  RendererEnd,
  RendererMessage,
  RequestId,
  HandleListenerRendererSendFn,
};

export type HandleListenerRenderer<KEY extends RendererChannels> = (
  event: Electron.IpcMainInvokeEvent,
  data: HandleListenerRendererArgs<KEY>,
) => Promise<void>;
