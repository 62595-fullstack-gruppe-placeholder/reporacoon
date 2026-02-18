import { getNow } from "../timeUtil";

/**
 * Log levels used in {@link log}.
 */
type LogLevel = "debug" | "error";

/**
 * Log level map.
 */
export const LogLevel: Record<LogLevel, LogLevel> = {
  debug: "debug",
  error: "error",
} as const;

/**
 * Log a message to the console.
 * @param message message
 * @param level log level (see {@link LogLevel}).
 */
export function log(message: string, level: LogLevel) {
  switch (level) {
    case "debug": {
      if (process.env.REPORACOON_DEBUG === "true") {
        console.debug(formatLogMessage(message, level));
      }
    }
    case "error": {
      console.error(formatLogMessage(message, level));
    }
  }
}

/**
 * Format a message for logging to the console, adding timestamp and level prefixes.
 * @param message the message to log.
 * @param level the level at which to log the message.
 * @returns the formatted message string to write to the console.
 */
function formatLogMessage(message: string, level: LogLevel) {
  return `[${getNow()}] ${level}: ${message}`;
}
