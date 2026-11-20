import { Channels, Data, Events, WebSocketRequestMessage } from "@pipelab/shared";
import { WebSocket as WSWebSocket } from "ws";
import { useLogger } from "@pipelab/shared";
import { WebSocketEvent, WebSocketHandler, WebSocketSendFunction } from "@pipelab/shared";

export type HandleListenerSendFn<KEY extends Channels> = WebSocketSendFunction<KEY>;

export type HandleListener<KEY extends Channels> = WebSocketHandler<KEY>;

type HandlerRegistry = { [KEY in Channels]?: WebSocketHandler<KEY> };

const handlers: HandlerRegistry = {};

export const useAPI = () => {
  const { logger } = useLogger();

  const handle = <KEY extends Channels>(channel: KEY, listener: WebSocketHandler<KEY>) => {
    // Written by key, so each entry always matches its channel; TypeScript cannot express that
    // correlation for a generic key on assignment, but reads below are fully typed.
    Object.assign(handlers, { [channel]: listener });

    return {
      channel,
      listener,
    };
  };

  const dispatch = <KEY extends Channels>(
    ws: WSWebSocket,
    message: { channel: KEY; requestId: string; data: Data<KEY> },
  ) => {
    const { channel, data, requestId } = message;
    const handler = handlers[channel];

    if (!handler) {
      logger().warn("No handler found for channel:", channel);
      return;
    }
    logger().debug("Executing handler for channel:", channel);
    const event: WebSocketEvent = {
      sender: ws.url || "websocket-client",
    };

    const send: HandleListenerSendFn<KEY> = (events: Events<KEY>) => {
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

    return handler(event, {
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
