import {
  Channels,
  Data,
  End,
  Events,
  RequestId,
  type EventMessageFor,
  type OutgoingRequestMessage,
  type RequestMessageFor,
  type WebSocketEventMessage,
  type WebSocketListener,
} from "@pipelab/shared";
import { useLogger } from "@pipelab/shared";
import { klona } from "klona";
import { toRaw } from "vue";
import {
  WebSocketSendFunction,
  WebSocketClientConfig,
  WebSocketConnectionState,
  WebSocketError,
  WebSocketConnectionError,
  WebSocketErrorMessage,
  WebSocketMessage,
  isWebSocketResponseMessage,
  isWebSocketErrorMessage,
} from "@pipelab/shared";
import { websocketPort } from "@pipelab/constants";
import { nanoid } from "nanoid";
import type { DisconnectOptions } from "./websocket-client.types";

type WebSocketSendFn<KEY extends Channels> = WebSocketSendFunction<KEY>;

export function resolveDefaultWebSocketUrl(
  location: Pick<Location, "protocol" | "host" | "hostname" | "search"> | undefined,
  isPackaged: boolean | undefined,
  isDevelopment: boolean,
): string {
  if (!location) return `ws://localhost:${websocketPort}`;

  if (!isDevelopment) {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${location.host}`;
  }

  const queryPort = new URLSearchParams(location.search).get("cliPort");
  const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
  const isValidPort = queryPort !== null && /^\d{1,5}$/.test(queryPort);
  if (isPackaged === false && isLoopback && isValidPort) {
    const port = Number(queryPort);
    if (port >= 1 && port <= 65535) {
      // The Desktop server binds IPv4 loopback. Do not let `localhost`
      // resolve to a separate, unverified IPv6 listener on the same port.
      return `ws://127.0.0.1:${port}`;
    }
  }

  const cliPort = import.meta.env.VITE_PIPELAB_SERVER_PORT || websocketPort;
  return `ws://${location.hostname}:${cliPort}`;
}

const TOKEN_STORAGE_KEY = "pipelab:auth-token";

/**
 * The token arrives in the page URL (query or hash). In-app navigation drops the URL hash,
 * so keep it for the lifetime of the window and a reload still authenticates.
 */
export function resolveAuthToken(location: Pick<Location, "search" | "hash">): string | null {
  const fromUrl =
    new URLSearchParams(location.search).get("token") ||
    new URLSearchParams(location.hash.replace(/^#/, "")).get("token");
  try {
    if (fromUrl) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return fromUrl;
  }
}

// A request waiting for the connection: `run` re-sends it, `reject` fails it if the queue is dropped
interface QueuedMessage {
  run: () => void;
  reject: (reason: unknown) => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<RequestId, (data: WebSocketMessage) => void> = new Map();
  private eventListeners: { [KEY in Channels]?: Set<(data: Events<KEY>) => void> } = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = Infinity;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000; // Cap at 30 seconds
  private isConnecting = false;
  private connectionState: WebSocketConnectionState = "disconnected";
  private stateChangeListeners: Set<(state: WebSocketConnectionState) => void> = new Set();
  private messageQueue: QueuedMessage[] = [];
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  public currentUrl: string;
  private isRenderer = false;

  constructor(private config: WebSocketClientConfig = {}) {
    const isDev = process.env.NODE_ENV === "development";
    let defaultUrl = resolveDefaultWebSocketUrl(
      typeof window === "undefined" ? undefined : window.location,
      typeof window === "undefined" ? undefined : window.isPackaged,
      isDev,
    );

    if (typeof window !== "undefined") {
      const token = resolveAuthToken(window.location);
      if (token) defaultUrl += `?token=${encodeURIComponent(token)}`;
    }

    const { url = defaultUrl, maxReconnectAttempts = Infinity, reconnectDelay = 1000 } = config;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.reconnectDelay = reconnectDelay;
    this.currentUrl = url;

    // Check if running in browser/renderer environment
    this.isRenderer = typeof window !== "undefined";
  }

  public connect(url?: string) {
    const targetUrl = url || this.currentUrl;
    this.currentUrl = targetUrl;

    // Clear any pending reconnection attempt
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    this.connectionState = "connecting";
    this.notifyStateChange();

    try {
      const socket = new WebSocket(targetUrl);
      this.ws = socket;

      socket.onopen = () => {
        if (this.ws !== socket) return;
        const safeTargetUrl = new URL(targetUrl);
        safeTargetUrl.searchParams.delete("token");
        console.log("WebSocket connected to", safeTargetUrl.toString());
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.connectionState = "connected";

        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }

        this.notifyStateChange();

        const { logger } = useLogger();
        logger().debug("WebSocket client connected successfully");

        // Flush any queued messages now that connection is ready
        this.flushQueue();
      };

      socket.onmessage = (event) => {
        if (this.ws === socket) this.handleMessage(event);
      };

      socket.onclose = (event) => {
        if (this.ws !== socket) return;
        console.log("WebSocket disconnected", { code: event.code, reason: event.reason });
        this.isConnecting = false;
        this.connectionState = "disconnected";
        this.ws = null;
        this.rejectPendingRequests("WebSocket connection lost");
        this.clearQueue();
        this.notifyStateChange();

        this.scheduleReconnect();
      };

      socket.onerror = (error) => {
        if (this.ws !== socket) return;
        console.error("WebSocket error:", error);
        this.isConnecting = false;
        this.connectionState = "error";
        this.notifyStateChange();
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.isConnecting = false;
      this.connectionState = "error";
      this.notifyStateChange();
      this.scheduleReconnect();
    }
  }

  private notifyStateChange() {
    this.stateChangeListeners.forEach((listener) => {
      try {
        listener(this.connectionState);
      } catch (error) {
        console.error("Error in state change listener:", error);
      }
    });
  }

  private rejectPendingRequests(message: string): void {
    for (const [requestId, listener] of this.listeners) {
      const error: WebSocketErrorMessage = {
        type: "error",
        requestId,
        error: message,
        code: "CONNECTION_LOST",
      };
      listener(error);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      this.clearQueue();
      return;
    }

    this.reconnectAttempts++;
    // Exponential backoff, capped at maxReconnectDelay
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay,
    );

    const maxAttemptsStr = this.maxReconnectAttempts === Infinity ? "∞" : this.maxReconnectAttempts;

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${maxAttemptsStr}) in ${delay}ms`,
      );
      this.connect();
    }, delay);
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage | WebSocketEventMessage = JSON.parse(event.data);

      if (isWebSocketResponseMessage(message) || isWebSocketErrorMessage(message)) {
        if (this.listeners.has(message.requestId)) {
          this.listeners.get(message.requestId)!(message);
        }
      } else if ("type" in message && message.type === "event" && "channel" in message) {
        this.emitEvent(message);
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  }

  private emitEvent<KEY extends Channels>(message: EventMessageFor<KEY>) {
    this.eventListeners[message.channel]?.forEach((listener) => {
      try {
        listener(message.data);
      } catch (error) {
        console.error(`Error in event listener for channel ${message.channel}:`, error);
      }
    });
  }

  public send<KEY extends Channels>(
    channel: KEY,
    data?: Data<KEY>,
    listener?: WebSocketListener<KEY>,
  ): Promise<End<KEY>> {
    return new Promise(async (resolve, reject) => {
      const { logger } = useLogger();

      // If connection is not ready, queue the message
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        logger().debug("WebSocket not ready, queuing message:", { channel, hasData: !!data });

        const queuedData = toRaw(klona(data));
        this.messageQueue.push({
          run: () => this.sendMessage(channel, queuedData, resolve, reject, nanoid, listener),
          reject,
        });

        return;
      }

      // Connection is ready, send immediately
      this.sendMessage(channel, data, resolve, reject, nanoid, listener);
    });
  }

  private sendMessage<KEY extends Channels>(
    channel: KEY,
    data: Data<KEY> | undefined,
    resolve: (value: End<KEY>) => void,
    reject: (reason: unknown) => void,
    nanoidFn: () => string,
    listener?: WebSocketListener<KEY>,
  ): void {
    const { logger } = useLogger();

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger().error("WebSocket send failed: connection not open");
      reject(new WebSocketConnectionError("WebSocket is not connected"));
      return;
    }

    const requestId: RequestId = nanoidFn();
    const message: OutgoingRequestMessage<KEY> = {
      channel,
      requestId,
      data: toRaw(klona(data)),
    };

    logger().debug("Sending WebSocket message:", {
      channel,
      requestId,
      hasData: !!data,
    });

    this.listeners.set(requestId, (response: WebSocketMessage) => {
      if (isWebSocketErrorMessage(response)) {
        // Handle error messages immediately
        this.listeners.delete(requestId);
        reject(new WebSocketError(response.error, response.code, response.requestId));
      } else if (isWebSocketResponseMessage(response)) {
        // Handle the response events
        const endEvent = response.events;

        if (endEvent.type === "end") {
          // Only resolve and cleanup when we receive the final 'end' message
          this.listeners.delete(requestId);
          resolve(endEvent.data);
        } else {
          // Handle intermediate events - call the provided listener if available
          if (listener) {
            listener(endEvent);
          } else {
            logger().info("Received intermediate event:", {
              requestId,
              eventType: endEvent.type,
              hasData: "data" in endEvent && !!endEvent.data,
            });
          }
        }
      }
    });

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      this.listeners.delete(requestId);
      reject(
        new WebSocketError(
          `Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`,
        ),
      );
    }
  }

  private async flushQueue(): Promise<void> {
    const { logger } = useLogger();

    if (this.messageQueue.length === 0) {
      return;
    }

    logger().debug(`Flushing ${this.messageQueue.length} queued messages`);

    // copy of the queue and clear it
    const queuedMessages = [...this.messageQueue];
    this.messageQueue = [];

    // Send all queued messages
    for (const queuedMessage of queuedMessages) {
      queuedMessage.run();
    }
  }

  private clearQueue(): void {
    const { logger } = useLogger();

    if (this.messageQueue.length === 0) {
      return;
    }

    logger().debug(
      `Clearing ${this.messageQueue.length} queued messages due to connection error/disconnect`,
    );

    // Reject all queued messages
    for (const queuedMessage of this.messageQueue) {
      queuedMessage.reject(new WebSocketConnectionError("WebSocket connection lost"));
    }

    this.messageQueue = [];
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public disconnect(options: DisconnectOptions = { clearQueue: true }) {
    void options;
    this.connectionState = "disconnected";
    this.isConnecting = false;
    this.notifyStateChange();

    // Clear any pending reconnection attempt
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Neither queued nor in-flight requests are safe to replay after disconnect.
    this.clearQueue();
    this.rejectPendingRequests("WebSocket connection lost");

    if (this.ws) {
      const socket = this.ws;
      this.ws = null;
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.close();
    }
    this.reconnectAttempts = 0;
  }

  public getConnectionState(): WebSocketConnectionState {
    return this.connectionState;
  }

  public onStateChange(callback: (state: WebSocketConnectionState) => void): () => void {
    this.stateChangeListeners.add(callback);
    return () => {
      this.stateChangeListeners.delete(callback);
    };
  }

  public reconnect(url?: string) {
    this.disconnect({ clearQueue: true });
    this.connect(url);
  }
  public on<KEY extends Channels>(channel: KEY, listener: (data: Events<KEY>) => void): () => void {
    const listeners = this.eventListeners[channel] ?? new Set<(data: Events<KEY>) => void>();
    // Keyed by channel, so the set only ever holds listeners for that channel's events.
    Object.assign(this.eventListeners, { [channel]: listeners });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
}

// Global WebSocket client instance
let wsClient: WebSocketClient | null = null;

export const getWebSocketClient = (): WebSocketClient => {
  if (!wsClient) {
    wsClient = new WebSocketClient();
  }
  return wsClient;
};

export const useWebSocketAPI = () => {
  const { logger } = useLogger();
  const client = getWebSocketClient();

  /**
   * Send an order and wait for its execution
   */
  const execute = async <KEY extends Channels>(
    channel: KEY,
    data?: Data<KEY>,
    listener?: WebSocketListener<KEY>,
  ): Promise<End<KEY>> => {
    try {
      return await client.send(channel, data, listener);
    } catch (error) {
      logger().error("WebSocket API error:", error);
      throw error;
    }
  };

  return {
    execute,
    isConnected: client.isConnected.bind(client),
    disconnect: client.disconnect.bind(client),
    on: client.on.bind(client),
  };
};
