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
export interface EndEventDataSuccess<DATA> {
  type: "success";
  result: DATA;
}

export interface EndEvent<DATA> {
  type: "end";
  data: EndEventDataSuccess<DATA> | EndEventDataError;
}

export type IpcDefinition = {
  "dialog:alert": [
    // input
    DialogAlertInput,
    EndEvent<DialogAlertEvent>,
  ];
  "dialog:prompt": [
    // input
    DialogAlertInput,
    EndEvent<DialogAlertEvent>,
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
  RendererEndEvent
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

/** What a renderer-channel handler receives: the request payload and a way to answer it. */
export interface HandleListenerRendererArgs<KEY extends RendererChannels> {
  value: RendererData<KEY>;
  send: HandleListenerRendererSendFn<KEY>;
}

export type HandleListenerRenderer<KEY extends RendererChannels> = (
  event: unknown,
  data: HandleListenerRendererArgs<KEY>,
) => Promise<void>;

export interface EndEventDataError {
  type: "error";
  ipcError: string;
  code?: string;
}

export interface DialogAlertInputButton {
  title: string;
  value: string;
}

export interface DialogAlertInput {
  message: string;
  buttons?: DialogAlertInputButton[];
}

export interface DialogAlertEvent {
  answer: string;
}

export interface RendererEndEvent {
  type: "end";
}
