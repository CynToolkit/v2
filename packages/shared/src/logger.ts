import { Logger } from "tslog";

const createDefaultLogger = () =>
  new Logger({
    minLevel: 3, // INFO
  });

const _logger = createDefaultLogger();

export const useLogger = () => {
  const attachTransport = (transport: (logObj: unknown) => void) => {
    _logger.attachTransport(transport);
  };

  return {
    logger: () => _logger,
    attachTransport,
  };
};
