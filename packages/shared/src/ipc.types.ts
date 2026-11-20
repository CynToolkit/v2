import type { ILogObjMeta } from "tslog";

export type UpdateStatus =
  | "update-available"
  | "update-downloading"
  | "update-downloaded"
  | "checking-for-update"
  | "update-not-available"
  | "error";

export interface UpdateState {
  status: UpdateStatus;
  version?: string;
  /** Manual download page or installer, set when in-app install is unavailable. */
  downloadUrl?: string;
  /** Download progress from 0 to 100, set while `update-downloading`. */
  progress?: number;
}

export type IpcEvent<TYPE extends string, DATA> = { type: TYPE; data: DATA };
export interface EndEvent<DATA> {
  type: "end";
  data:
    | {
        type: "success";
        result: DATA;
      }
    | {
        type: "error";
        ipcError: string;
        code?: string;
      };
}

export type IpcDefinition = {
  "dialog:alert": [
    // input
    { message: string; buttons?: { title: string; value: string }[] },
    EndEvent<{ answer: string }>,
  ];
  "dialog:prompt": [
    // input
    { message: string; buttons?: { title: string; value: string }[] },
    EndEvent<{ answer: string }>,
  ];
  "log:message": [
    // input
    ILogObjMeta,
    EndEvent<void>,
  ];
  "update:set-status": [
    // input
    UpdateState,
    EndEvent<void>,
  ];
};

export type RendererChannels = keyof IpcDefinition;
export type RendererData<KEY extends RendererChannels> = IpcDefinition[KEY][0];
export type RendererEvents<KEY extends RendererChannels> = IpcDefinition[KEY][1];
export type RendererEnd<KEY extends RendererChannels> = Extract<
  IpcDefinition[KEY][1],
  { type: "end" }
>["data"];

export interface RendererMessage {
  // the channel to communicate
  requestId: RequestId;
  data: RendererData<RendererChannels>;
}
/** Correlates a request with its responses; generated per call, so any string is valid. */
export type RequestId = string;

export type HandleListenerRendererSendFn<KEY extends RendererChannels> = (
  events: RendererEvents<KEY>,
) => void;

export type HandleListenerRenderer<KEY extends RendererChannels> = (
  event: unknown,
  data: { value: RendererData<KEY>; send: HandleListenerRendererSendFn<KEY> },
) => Promise<void>;
