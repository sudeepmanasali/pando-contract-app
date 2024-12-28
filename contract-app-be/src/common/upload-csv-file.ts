import fs from "fs";
import dotenv from "dotenv";
import csv from "csv-parser";
import { queue } from "../utils/JobQueue";
import RedisManager from "./redisManager";
import { Job } from "bull";
import crypto from "crypto";
import AppLogger from "./Logger";
import { JOB_STATUSES } from "./constants";

dotenv.config();

let logger = AppLogger.getLogger("CSVFileProcessor");

interface Summary {
  success: number;
  failed: number;
  overLappingCount: number;
  missingValueCount: number;
  pending?: number;
}

export default class CSVFileProcessor {
  private readonly chunkSize = 2000;
  dataChunk: Job[] = [];
  currentRow = 0;
  processedRows = new Set<number>();
  jobIds: string[] = [];
  csvFilePath: string = "";
  requestId: string;

  constructor(requestId: string) {
    this.requestId = requestId;
  }

  processCsvFile(filePath: string): Promise<Summary> {
    this.csvFilePath = filePath;
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          try {
            this.createDataChunks(row);
          } catch (error) {
            throw error;
          }
        })
        .on("end", () => this.jobCompletionStatus(resolve, reject))
        .on("error", (error) => {
          logger.error(
            "Error in processing and saving the csv file data to database",
            error
          );
          reject(error);
        });
    });
  }

  private createDataChunks(row: any) {
    if (this.processedRows.has(this.currentRow)) {
      return;
    }
    this.processedRows.add(this.currentRow);
    this.currentRow++;

    this.dataChunk.push(row);

    if (this.dataChunk.length >= this.chunkSize) {
      this.addChunkToQueue();
    }
  }

  private async jobCompletionStatus(
    resolve: (arg0: Summary) => void,
    reject: (arg0: Summary) => void
  ): Promise<void> {
    try {
      if (this.dataChunk.length > 0) {
        this.addChunkToQueue();
      }

      this.deleteCSVFile(this.csvFilePath);

      let pendingJobs = await this.checkJobStatuses();
      let summary = await this.getRequestSummary();
      await this.removeJobIdFromRedis();

      logger.info(`success: ${summary?.success}, failed: ${summary?.failed}, overlaps: ${summary?.overLappingCount}, 
        missing fields: ${summary?.missingValueCount}, pending : ${pendingJobs.length}`);
      resolve({ ...summary, pending: pendingJobs.length });
    } catch (err) {
      logger.error(`Failed to check the csv data`, err);
      reject({
        success: 0,
        failed: 0,
        overLappingCount: 0,
        pending: this.jobIds.length,
        missingValueCount: 0,
      });
    }
  }

  private generateRandomHexId = (length = 5): string => {
    return crypto.randomBytes(length).toString("hex");
  };

  private addChunkToQueue(): void {
    let jobId = this.generateRandomHexId() + "-" + this.requestId;
    this.jobIds.push(jobId);
    queue.add(this.dataChunk, {
      jobId,
    });
    RedisManager.addJob(jobId, JOB_STATUSES.PENDING);
    this.dataChunk = [];
  }

  private async removeJobIdFromRedis(): Promise<void> {
    try {
      await Promise.all(
        this.jobIds.map((jobId) => RedisManager.removeJob(jobId))
      );
      await Promise.all(
        this.jobIds.map((jobId) =>
          RedisManager.removeJob(jobId.split("-").reverse().join("-"))
        )
      );
      logger.info("Removed all jobs from redis successfully");
    } catch (error) {
      logger.error("Error while removing the jobs from redis", error);
      throw new Error("Failed to check job statuses");
    }
  }

  private async checkJobStatuses(): Promise<string[]> {
    let maxRetries = this.jobIds.length, retry = 0, jobs = [...this.jobIds];
    while (retry <= maxRetries) {

      let jobStatuses = await Promise.all(
        jobs.map((jobId) => RedisManager.getJobInfo(jobId))
      );

      jobs = jobs.filter((job, index) => {
        return ![JOB_STATUSES.COMPLETED, JOB_STATUSES.FAILED].includes(
          jobStatuses[index]
        );
      });
      const allJobsProcessed = jobStatuses.every((status) => {
        return (
          status === JOB_STATUSES.COMPLETED || status === JOB_STATUSES.FAILED
        );
      });

      if (allJobsProcessed) {
        return [];
      }

      retry++;
      logger.warn(`Retry to check job status ${retry} / ${maxRetries}`);
      await this.delay(3000);
    }
    logger.warn(`Retry limit reached ${maxRetries}. Some jobs may still be pending`);
    return jobs;
  }

  private async getRequestSummary(): Promise<Summary> {
    try {
      let summary = await Promise.all(
        this.jobIds.map((jobId) =>
          RedisManager.getJobInfo(jobId.split("-").reverse().join("-"))
        )
      );

      return summary.reduce(
        (report, curr) => {
          let obj = JSON.parse(curr);

          return obj
            ? {
              success: report.success + obj.success,
              failed: report.failed + obj.failed,
              missingValueCount:
                report.missingValueCount + obj.missingValueCount,
              overLappingCount:
                report.overLappingCount + obj.overLappingCount,
            }
            : { ...report };
        },
        { success: 0, failed: 0, missingValueCount: 0, overLappingCount: 0 }
      );
    } catch (error) {
      logger.error("cannot generate the summary,", error);
      return {
        success: 0,
        failed: 0,
        missingValueCount: 0,
        overLappingCount: 0,
      };
    }
  }

  private deleteCSVFile(filePath: string): void {
    fs.unlink(filePath, (err) => {
      if (err) logger.error("Failed to delete the file ", err.message);
      else {
        logger.info("Successfully deleted the file ", filePath);
      }
    });
  }

  private delay(ms: number): Promise<NodeJS.Timeout> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
