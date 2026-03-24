import app from "./app.js";
import { logger } from "./lib/logger.js";
import { restoreSessionFromEnv } from "./lib/baileys.js";
import { startBotSession } from "./lib/baileys.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  restoreSessionFromEnv();

  try {
    await startBotSession("main");
    logger.info("Main bot session started");
  } catch (err) {
    logger.warn({ err }, "Could not start main bot session on startup");
  }
});
