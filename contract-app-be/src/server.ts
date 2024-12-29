import express, { Express } from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import http from "http";
import ContractApiRouter from "./routers/ContractApiRouter";
import RedisManager from "./common/redisManager";
import AppLogger from "./common/Logger";
import { RateLimiter } from "./controllers/RateLimiter";

dotenv.config();

let logger = AppLogger.getLogger("main-app");

class App {
  private readonly port = process.env.PORT || "8089";
  private readonly mongoDbURL = process.env.MONGODBURL || "";
  private readonly redisUrl = `redis://${process.env.REDIS}:${process.env.REDIS_PORT}`;
  private app: Express;
  private server: any;

  constructor() {
    this.app = express();
    this.app.disable("x-powered-by");
    this.listenAppRestartProcess();
  }

  async start(): Promise<void> {
    try {
      await RedisManager.init(this.redisUrl);
      let connectStatus = await mongoose.connect(this.mongoDbURL);
      if (connectStatus) {
        logger.info("Mongodb connected to " + this.mongoDbURL);
      }
      this.server = http.createServer(this.app);

      mongoose.connection.once("open", () => {
        logger.info("Mongo DB connected successfully " + this.mongoDbURL);
      });

      mongoose.connection.on("disconnected", () => {
        logger.error("Mongo db disconnected to " + this.mongoDbURL);
      });

      mongoose.connection.on("error", (error) => {
        logger.error("MongoDB connection error: " + this.mongoDbURL, error);
      });

      RateLimiter.init();

      this.app
        .use(
          cors({
            origin: "*",
          })
        )
        .use(bodyParser.json())
        .use(bodyParser.urlencoded({ extended: true }));

      this.mountRoutes();

      if (connectStatus) {
        this.server.listen(this.port, () => {
          logger.info(`Server running at http://localhost:${this.port}`);
        });
      }
    } catch (error) {
      logger.error("App exited: ", error);
    }
  }

  private mountRoutes(): void {
    let contractApiRouter = new ContractApiRouter();
    this.app.use(RateLimiter.rateLimiterMiddleware);
    this.app.use(contractApiRouter.getContractApiRouter());
  }

  private listenAppRestartProcess(): void {
    process.on("SIGTERM", () => {
      logger.error("App exited");
      this.closeResourceConnections();
    });
  }

  private async closeResourceConnections(): Promise<void> {
    try {
      if (this.server) {
        this.server.close();
        logger.info("Stopping HTTP server...");
      }

      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }

      await RedisManager.redisClient.quit();

      logger.info(
        "Application has been shut down successfully and all resource connections are released"
      );
      process.exit(0);
    } catch (error) {
      logger.error("Error during app shutdown:", error);
      process.exit(1);
    }
  }
}

export default (() => {
  const app = new App();
  app.start();
})();
