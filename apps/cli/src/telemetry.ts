/**
 * Properties sent with the `command_executed` telemetry event.
 *
 * Only the command name is reported. Positional arguments and option values can
 * carry user data such as connection override values, so they are never sent.
 */
export const buildCommandTelemetry = (command: { name(): string }) => ({
  command: command.name(),
});
