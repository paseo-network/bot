import pino from "pino";

const level = process.env.LOG_LEVEL ?? "info";

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
export const logger = pino({ level }, pino.transport({ target: "pino/file" }));
logger.debug("Logger created");
