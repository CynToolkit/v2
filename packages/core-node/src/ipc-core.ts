import { Channels, Events, WebSocketRequestMessage } from "@pipelab/shared";
import { WebSocket as WSWebSocket } from "ws";
import { useLogger } from "@pipelab/shared";
import {
  WebSocketEvent,
  WebSocketHandler,
  WebSocketHandlerEntry,
  WebSocketSendFunction,
} from "@pipelab/shared";

export type HandleListenerSendFn<KEY extends Channels> = WebSocketSendFunction<KEY>;

export type HandleListener<KEY extends Channels> = WebSocketHandler<KEY>;

/** One entry per channel; an entry only ever receives the payload of its own channel. */
const handlers = new Map<Channels, WebSocketHandlerEntry<Channels>>();

export const useAPI = () => {
  const { logger } = useLogger();

  const handle = <KEY extends Channels>(channel: KEY, listener: WebSocketHandler<KEY>) => {
    handlers.set(channel, { channel, run: listener });

    return {
      channel,
      listener,
    };
  };

  const dispatch = (ws: WSWebSocket, message: WebSocketRequestMessage) => {
    const { channel, data, requestId } = message;
    const handler = handlers.get(channel);

    if (!handler) {
      logger().warn("No handler found for channel:", channel);
      return;
    }
    logger().debug("Executing handler for channel:", channel);
    const event: WebSocketEvent = {
      sender: ws.url || "websocket-client",
    };

    const send: HandleListenerSendFn<Channels> = (events: Events<Channels>) => {
      const serialized = JSON.stringify(events);
      logger().debug(
        "sending response to",
        requestId,
        ":",
        serialized.length > 500 ? serialized.substring(0, 500) + "..." : serialized,
      );
      const response = {
        type: "response",
        requestId,
        events,
      };

      if (ws.readyState === WSWebSocket.OPEN) {
        ws.send(JSON.stringify(response), (error) => {
          if (error) {
            logger().error("Failed to send WebSocket response:", error);
          }
        });
      } else {
        logger().debug(
          `Cannot send response to ${requestId}: WebSocket is not open (state: ${ws.readyState})`,
        );
      }
      return Promise.resolve();
    };

    return handler.run(event, {
      send,
      value: data,
    });
  };

  const processWebSocketMessage = (ws: WSWebSocket, message: WebSocketRequestMessage) =>
    dispatch(ws, message);

  return {
    handle,
    processWebSocketMessage,
    handlers,
  };
};
