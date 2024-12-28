const dotenv = require("dotenv");
const Contract = require("./common/Contract");
import mongoose from "mongoose";
import { Job, JobId } from "bull";
import { queue } from "./common/JobQueue";
import WorkerLogger from "./common/Logger";
import RedisManager from "./common/RedisManager";

interface Contract {
  shipper: string;
  source: string;
  destination: string;
  vehicleType: string;
  contractType: string;
  transporter: string;
  validFrom: string;
  validTo: string;
  [key: string]: any;
}

export const enum JOB_STATUSES {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  STALLED = "stalled",
  DELAYED = "delated",
}

let logger = WorkerLogger.getLogger("worker-instance");
dotenv.config();

class Worker {
  private readonly mongoDbURL = process.env.MONGODBURL || "";
  private readonly redisUrl = `redis://${process.env.REDIS}:${process.env.REDIS_PORT}`;
  private _redisClient: any;
  isDbConnected = false;
  isRedisConnected = false;

  constructor() {
    this.listenAppRestartProcess();
  }

  private createRedisInstance(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        await RedisManager.init(this.redisUrl);
        this.isRedisConnected = true;
        this._redisClient = RedisManager.redisClient;
        logger.info("Connected to Redis");
        resolve(true);
      } catch (err) {
        logger.error("Unlable to connect redis client", err);
        reject(false);
      }
    });
  }

  private async connectToMongoDB(): Promise<void> {
    try {
      await mongoose.connect(this.mongoDbURL);
      logger.info("Connected to MongoDB");

      mongoose.connection.once("open", () => {
        logger.info("Mongo DB connected successfully " + this.mongoDbURL);
      });

      mongoose.connection.on("disconnected", () => {
        logger.error("Mongo db disconnected to " + this.mongoDbURL);
      });

      mongoose.connection.on("error", (error) => {
        logger.error("MongoDB connection error: " + this.mongoDbURL, error);
      });

      this.isDbConnected = true;
      this.startJobProcessingIfReady();
    } catch (error) {
      logger.error("MongoDB connection error:", error);
      process.exit(1);
    }
  }

  private startJobProcessingIfReady(): void {
    if (this.isDbConnected && this.isRedisConnected) {
      this.processJobs();
    }
  }

  private async processJobs(): Promise<void> {
    queue.process(async (job: Job) => {
      let jobId = job.id;
      const dataChunk = job.data;
      await this.validateAndInsertContracts(dataChunk, jobId);
    });

    queue.on(JOB_STATUSES.COMPLETED, async (job: Job) => {
      try {
        await this._redisClient.set(job.id, JOB_STATUSES.COMPLETED);
        logger.info(
          `Job ${job.id} completed successfully and updated the status in redis`
        );
      } catch (error) {
        logger.error("Failed to updated the job status in redis, ", error);
      }
    });

    queue.on(JOB_STATUSES.FAILED, async (job: Job) => {
      try {
        await this._redisClient.set(job.id, JOB_STATUSES.FAILED);
        logger.info(`Job ${job.id} failed and updated the status in redis`);
      } catch (error) {
        logger.error("Failed to updated the job status in redis, ", error);
      }
    });
  }

  private async validateAndInsertContracts(contracts: Contract[], jobId: JobId): Promise<void> {
    const validContracts = [];
    let overLappingCount = 0,
      missingValueCount = 0;
    try {
      for (let i = 0; i < contracts.length; i++) {
        const contract = contracts[i];

        if (
          !contract.shipper ||
          !contract.transporter ||
          !contract.validFrom ||
          !contract.validTo ||
          !contract.vehicleType ||
          !contract.source ||
          !contract.destination
        ) {
          logger.info(`Skipping contract with missing fields: ${contract._id}`);
          missingValueCount++;
          continue;
        }

        const overlappingContracts = await Contract.find({
          shipper: contract.shipper,
          transporter: contract.transporter,
          source: contract.source,
          destination: contract.destination,
          vehicleType: contract.vehicleType,
          $or: [
            {
              validFrom: { $lte: contract.validTo },
              validTo: { $gte: contract.validFrom },
            },
            {
              validFrom: { $gte: contract.validFrom },
              validTo: { $lte: contract.validTo },
            },
          ],
        });

        if (overlappingContracts.length > 0) {
          overLappingCount++;
          logger.info(
            `Overlap found for contract: ${overlappingContracts[0]._id}`
          );
          continue;
        }

        validContracts.push(contract);
      }

      if (validContracts.length > 0) {
        await Contract.insertMany(validContracts);
        RedisManager.addJob(jobId.toString().split("-").reverse().join("-"), {
          success: validContracts.length,
          failed: contracts.length - validContracts.length,
          overLappingCount,
          missingValueCount,
        });
        logger.info(
          `Inserted ${validContracts.length} contracts successfully.`
        );
      } else {
        RedisManager.addJob(jobId.toString().split("-").reverse().join("-"), {
          success: 0,
          failed: contracts.length - validContracts.length,
          overLappingCount,
          missingValueCount,
        });
        logger.info("No valid contracts to insert.");
      }
    } catch (error) {
      logger.error("Error validating and inserting contracts:", error);
    }
  }

  async start(): Promise<void> {
    await this.createRedisInstance();
    await this.connectToMongoDB();
  }

  private listenAppRestartProcess(): void {
    process.on("SIGTERM", () => {
      logger.error("Worker app exited");
      this.closeResourceConnections();
    });
  }

  private async closeResourceConnections(): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }

      await RedisManager.redisClient.quit();

      logger.info(
        "Worker instance has been shut down successfully, and all connections are released"
      );
      process.exit(0);
    } catch (error) {
      logger.error("Error during app shutdown:", error);
      process.exit(1);
    }
  }
}

export default (async () => {
  try {
    let workerInstance = new Worker();
    await workerInstance.start();
  } catch (err) {
    logger.error("Worker instance exited, ", err);
  }
})();
