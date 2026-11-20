import { Channels, Data, Events, End, RequestId } from "./apis";
import { WebSocket as WSWebSocket } from "ws";

// WebSocket connection states
export type WebSocketConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"
  | "reconnecting";

// WebSocket server types
export interface WebSocketServerConfig {
  port?: number;
  host?: string;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface WebSocketServerEvents {
  connection: (ws: WSWebSocket, request: IncomingMessage) => void;
  message: (ws: WSWebSocket, data: Buffer) => void;
  close: (ws: WSWebSocket) => void;
  error: (ws: WSWebSocket, error: Error) => void;
}

// WebSocket client types
export interface WebSocketClientConfig {
  url?: string;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  timeout?: number;
}

export interface WebSocketClientEvents {
  open: () => void;
  message: (event: MessageEvent) => void;
  close: (event: CloseEvent) => void;
  error: (error: Event) => void;
}

// Unified WebSocket event types
export interface WebSocketEvent {
  sender: string;
  timestamp?: number;
}

// WebSocket message types
/** One member per channel, so `channel` and `data` stay paired when the message is narrowed. */
export interface RequestMessageFor<KEY extends Channels> {
  channel: KEY;
  requestId: RequestId;
  data: Data<KEY>;
}

export type WebSocketRequestMessage = {
  [KEY in Channels]: RequestMessageFor<KEY>;
}[Channels];

/** A server-pushed event, paired with its channel the same way as a request. */
export interface EventMessageFor<KEY extends Channels> {
  type: "event";
  channel: KEY;
  data: Events<KEY>;
}

export type WebSocketEventMessage = {
  [KEY in Channels]: EventMessageFor<KEY>;
}[Channels];

export interface WebSocketResponseMessage {
  type: "response";
  requestId: RequestId;
  events: Events<Channels>;
}

export interface WebSocketErrorMessage {
  type: "error";
  requestId: RequestId;
  error: string;
  code?: string;
}

export type WebSocketMessage =
  | WebSocketRequestMessage
  | WebSocketResponseMessage
  | WebSocketErrorMessage;

// WebSocket connection info
export interface WebSocketConnectionInfo {
  id: string;
  state: WebSocketConnectionState;
  url: string;
  connectedAt?: Date;
  lastActivity?: Date;
}

export interface Agent {
  id: string;
  name: string;
  isSelf: boolean;
  connectedAt?: number;
}

// Handler function types
/** What a WebSocket handler receives: the request payload and a way to answer it. */
export interface WebSocketHandlerArgs<KEY extends Channels> {
  value: Data<KEY>;
  /**
   * Method syntax on purpose: it makes `WebSocketHandlerArgs<KEY>` assignable to
   * `WebSocketHandlerArgs<Channels>`, which is what lets the server keep one entry per channel in a
   * single map. The server only ever calls an entry with the payload of its own channel.
   */
  send(events: Events<KEY>): Promise<void>;
}

/** One registered channel handler. The method syntax is deliberate, see `WebSocketHandlerArgs`. */
export interface WebSocketHandlerEntry<KEY extends Channels> {
  channel: KEY;
  run(event: WebSocketEvent, data: WebSocketHandlerArgs<KEY>): Promise<void>;
}

/** A client listener for the events a channel pushes. The method syntax is deliberate, see `WebSocketHandlerArgs`. */
export interface EventSubscription<KEY extends Channels> {
  channel: KEY;
  notify(data: Events<KEY>): void;
}

export type WebSocketHandler<KEY extends Channels> = (
  event: WebSocketEvent,
  data: WebSocketHandlerArgs<KEY>,
) => Promise<void>;

/** The payload of a request the client is about to send; the channel may take no data at all. */
export interface OutgoingRequestData<KEY extends Channels> {
  data: Data<KEY> | undefined;
}

export type OutgoingRequestMessage<KEY extends Channels> = Omit<RequestMessageFor<KEY>, "data"> &
  OutgoingRequestData<KEY>;

export type WebSocketSendFunction<KEY extends Channels> = (events: Events<KEY>) => Promise<void>;

// WebSocket listener types
export type WebSocketListener<KEY extends Channels> = (event: Events<KEY>) => Promise<void>;

// WebSocket API interface
export interface WebSocketAPI {
  execute: <KEY extends Channels>(
    channel: KEY,
    data?: Data<KEY>,
    listener?: WebSocketListener<KEY>,
  ) => Promise<End<KEY>>;
  send: <KEY extends Channels>(channel: KEY, data?: Data<KEY>) => Promise<End<KEY>>;
  on: <KEY extends Channels>(
    channel: KEY,
    listener: (event: WebSocketEvent, data: Events<KEY>) => void,
  ) => () => void;
  isConnected: () => boolean;
  disconnect: () => void;
}

// WebSocket manager interface
export interface WebSocketManager {
  connect: (url?: string) => Promise<void>;
  disconnect: () => void;
  send: <KEY extends Channels>(channel: KEY, data?: Data<KEY>) => Promise<End<KEY>>;
  isConnected: () => boolean;
  getConnectionState: () => WebSocketConnectionState;
  onStateChange: (callback: (state: WebSocketConnectionState) => void) => () => void;
}

// Error types
export class WebSocketError extends Error {
  constructor(
    message: string,
    public code?: string,
    public requestId?: RequestId,
  ) {
    super(message);
    this.name = "WebSocketError";
  }
}

export class WebSocketConnectionError extends WebSocketError {
  constructor(
    message: string,
    public url?: string,
  ) {
    super(message);
    this.name = "WebSocketConnectionError";
  }
}

export class WebSocketTimeoutError extends WebSocketError {
  constructor(
    message: string,
    public timeout: number,
    requestId?: RequestId,
  ) {
    super(message);
    this.name = "WebSocketTimeoutError";
  }
}

// Type guards
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isWebSocketRequestMessage = (message: unknown): message is WebSocketRequestMessage =>
  isRecord(message) && typeof message.channel === "string" && Boolean(message.requestId);

export const isWebSocketResponseMessage = (message: unknown): message is WebSocketResponseMessage =>
  isRecord(message) &&
  message.type === "response" &&
  Boolean(message.requestId) &&
  Boolean(message.events);

export const isWebSocketErrorMessage = (message: unknown): message is WebSocketErrorMessage =>
  isRecord(message) &&
  message.type === "error" &&
  Boolean(message.requestId) &&
  Boolean(message.error);

// Utility types for better type inference
export type WebSocketMessageType<T extends Channels> = {
  channel: T;
  requestId: RequestId;
  data: Data<T>;
};

export type WebSocketResponseType<T extends Channels> = {
  type: "response";
  requestId: RequestId;
  events: Events<T>;
};

// Import for Node.js HTTP server
import { IncomingMessage } from "http";
