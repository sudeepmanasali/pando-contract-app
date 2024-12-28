"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const JobQueue_1 = require("../utils/JobQueue");
const redisManager_1 = __importDefault(require("./redisManager"));
const crypto_1 = __importDefault(require("crypto"));
const Logger_1 = __importDefault(require("./Logger"));
dotenv_1.default.config();
let logger = Logger_1.default.getLogger("CSVFileProcessor");
class CSVFileProcessor {
    constructor(requestId) {
        this.chunkSize = 2000;
        this.dataChunk = [];
        this.currentRow = 0;
        this.processedRows = new Set();
        this.jobIds = [];
        this.csvFilePath = "";
        this.generateRandomHexId = (length = 5) => {
            return crypto_1.default.randomBytes(length).toString("hex");
        };
        this.requestId = requestId;
    }
    processCsvFile(filePath) {
        this.csvFilePath = filePath;
        return new Promise((resolve, reject) => {
            fs_1.default.createReadStream(filePath)
                .pipe((0, csv_parser_1.default)())
                .on("data", (row) => {
                try {
                    this.createDataChunks(row);
                }
                catch (error) {
                    throw error;
                }
            })
                .on("end", () => this.jobCompletionStatus(resolve, reject))
                .on("error", (error) => {
                logger.error("Error in processing and saving the csv file data to database", error);
                reject(error);
            });
        });
    }
    createDataChunks(row) {
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
    jobCompletionStatus(resolve, reject) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.dataChunk.length > 0) {
                    this.addChunkToQueue();
                }
                this.deleteCSVFile(this.csvFilePath);
                let pendingJobs = yield this.checkJobStatuses();
                let summary = yield this.getRequestSummary();
                yield this.removeJobIdFromRedis();
                logger.info(`success: ${summary === null || summary === void 0 ? void 0 : summary.success}, failed: ${summary === null || summary === void 0 ? void 0 : summary.failed}, overlaps: ${summary === null || summary === void 0 ? void 0 : summary.overLappingCount}, 
        missing fields: ${summary === null || summary === void 0 ? void 0 : summary.missingValueCount}, pending : ${pendingJobs.length}`);
                resolve(Object.assign(Object.assign({}, summary), { pending: pendingJobs.length }));
            }
            catch (err) {
                logger.error(`Failed to check the csv data`, err);
                reject({
                    success: 0,
                    failed: 0,
                    overLappingCount: 0,
                    pending: this.jobIds.length,
                    missingValueCount: 0,
                });
            }
        });
    }
    addChunkToQueue() {
        let jobId = this.generateRandomHexId() + "-" + this.requestId;
        this.jobIds.push(jobId);
        JobQueue_1.queue.add(this.dataChunk, {
            jobId,
        });
        redisManager_1.default.addJob(jobId, "pending" /* JOB_STATUSES.PENDING */);
        this.dataChunk = [];
    }
    removeJobIdFromRedis() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield Promise.all(this.jobIds.map((jobId) => redisManager_1.default.removeJob(jobId)));
                yield Promise.all(this.jobIds.map((jobId) => redisManager_1.default.removeJob(jobId.split("-").reverse().join("-"))));
                logger.info("Removed all jobs from redis successfully");
            }
            catch (error) {
                logger.error("Error while removing the jobs from redis", error);
                throw new Error("Failed to check job statuses");
            }
        });
    }
    checkJobStatuses() {
        return __awaiter(this, void 0, void 0, function* () {
            let maxRetries = this.jobIds.length, retry = 0, jobs = [...this.jobIds];
            while (retry <= maxRetries) {
                let jobStatuses = yield Promise.all(jobs.map((jobId) => redisManager_1.default.getJobInfo(jobId)));
                jobs = jobs.filter((job, index) => {
                    return !["completed" /* JOB_STATUSES.COMPLETED */, "failed" /* JOB_STATUSES.FAILED */].includes(jobStatuses[index]);
                });
                const allJobsProcessed = jobStatuses.every((status) => {
                    return (status === "completed" /* JOB_STATUSES.COMPLETED */ || status === "failed" /* JOB_STATUSES.FAILED */);
                });
                if (allJobsProcessed) {
                    return [];
                }
                retry++;
                logger.warn(`Retry to check job status ${retry} / ${maxRetries}`);
                yield this.delay(3000);
            }
            logger.warn(`Retry limit reached ${maxRetries}. Some jobs may still be pending`);
            return jobs;
        });
    }
    getRequestSummary() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let summary = yield Promise.all(this.jobIds.map((jobId) => redisManager_1.default.getJobInfo(jobId.split("-").reverse().join("-"))));
                return summary.reduce((report, curr) => {
                    let obj = JSON.parse(curr);
                    return obj
                        ? {
                            success: report.success + obj.success,
                            failed: report.failed + obj.failed,
                            missingValueCount: report.missingValueCount + obj.missingValueCount,
                            overLappingCount: report.overLappingCount + obj.overLappingCount,
                        }
                        : Object.assign({}, report);
                }, { success: 0, failed: 0, missingValueCount: 0, overLappingCount: 0 });
            }
            catch (error) {
                logger.error("cannot generate the summary,", error);
                return {
                    success: 0,
                    failed: 0,
                    missingValueCount: 0,
                    overLappingCount: 0,
                };
            }
        });
    }
    deleteCSVFile(filePath) {
        fs_1.default.unlink(filePath, (err) => {
            if (err)
                logger.error("Failed to delete the file ", err.message);
            else {
                logger.info("Successfully deleted the file ", filePath);
            }
        });
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.default = CSVFileProcessor;
