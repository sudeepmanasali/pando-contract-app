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
const mockStream = { pipe: jest.fn(), on: jest.fn() };
jest.mock("fs", () => ({
    createReadStream: jest.fn().mockReturnValue(mockStream),
    unlink: jest.fn(),
}));
jest.mock("./RedisManager");
const redisManager_1 = __importDefault(require("./redisManager"));
const upload_csv_file_1 = __importDefault(require("./upload-csv-file"));
const fs_1 = __importDefault(require("fs"));
describe("CSVFileProcessor", () => {
    let processor;
    beforeEach(() => {
        jest.clearAllMocks();
        processor = new upload_csv_file_1.default("requestId123");
        mockStream.pipe.mockReturnValue(mockStream);
        mockStream.on.mockImplementation((event, cb) => {
            cb("Error in processing and saving the csv file data to database");
            return mockStream;
        });
    });
    it("should add row to dataChunk", () => {
        const addChunkToQueueSpy = jest.spyOn(processor, "addChunkToQueue");
        processor.chunkSize = 2;
        const mockRow = { id: 1 };
        processor["createDataChunks"](mockRow);
        expect(processor.dataChunk).toHaveLength(1);
        expect(processor.dataChunk).toEqual([mockRow]);
        expect(addChunkToQueueSpy).toHaveBeenCalledTimes(0);
    });
    it("should add row to dataChunk and add it to the queue", () => {
        jest.spyOn(processor, "generateRandomHexId").mockReturnValue("1234");
        let requestId = processor.requestId;
        processor.chunkSize = 1;
        const mockRow = { id: 1 };
        processor["createDataChunks"](mockRow);
        expect(processor.jobIds).toHaveLength(1);
        expect(processor.jobIds).toEqual(["1234-" + requestId]);
    });
    it("Should return empty array when all the jobs status is completed", () => __awaiter(void 0, void 0, void 0, function* () {
        processor.jobIds = ["1234-requestId123"];
        redisManager_1.default.getJobInfo.mockReturnValue(Promise.resolve("completed"));
        let response = yield processor["checkJobStatuses"]();
        expect(response).toEqual([]);
    }));
    it("should return empty array when all the jobs status is failed", () => __awaiter(void 0, void 0, void 0, function* () {
        processor.jobIds = ["1234-requestId123"];
        redisManager_1.default.getJobInfo.mockReturnValue(Promise.resolve("failed"));
        let response = yield processor["checkJobStatuses"]();
        expect(response).toEqual([]);
    }));
    it("Should return array of jobs ids whose status is pending", () => __awaiter(void 0, void 0, void 0, function* () {
        processor.jobIds = ["1234-requestId123"];
        redisManager_1.default.getJobInfo.mockReturnValue(Promise.resolve("pending"));
        jest.spyOn(processor, "delay").mockResolvedValue("");
        jest.useFakeTimers();
        let response = yield processor["checkJobStatuses"]();
        expect(response).toEqual(["1234-requestId123"]);
    }));
    it("should remove the jobs and its info from redis when the job status is complete or failed", () => __awaiter(void 0, void 0, void 0, function* () {
        processor.jobIds = ["1234-requestId123"];
        redisManager_1.default.removeJob.mockReturnValue(Promise.resolve("OK"));
        yield processor["removeJobIdFromRedis"]();
        expect(redisManager_1.default.removeJob).toHaveBeenCalledWith("requestId123-1234");
        expect(redisManager_1.default.removeJob).toHaveBeenCalledWith("1234-requestId123");
    }));
    it("Error thrown when removing the jobs and its info from redis when the job status is complete or failed", () => __awaiter(void 0, void 0, void 0, function* () {
        processor.jobIds = ["1234-requestId123"];
        redisManager_1.default.removeJob.mockReturnValue(Promise.reject("ZERO"));
        try {
            yield processor["removeJobIdFromRedis"]();
        }
        catch (error) {
            expect(redisManager_1.default.removeJob).toHaveBeenCalledTimes(1);
        }
    }));
    it("should return the summary of contracts", () => __awaiter(void 0, void 0, void 0, function* () {
        processor.jobIds = ["1234-requestId123", "1235-requestId123"];
        redisManager_1.default.getJobInfo.mockReturnValue(Promise.resolve(JSON.stringify({
            success: 1,
            failed: 2,
            overLappingCount: 0,
            missingValueCount: 0,
        })));
        let response = yield processor["getRequestSummary"]();
        expect(response).toEqual({
            success: 2,
            failed: 4,
            overLappingCount: 0,
            missingValueCount: 0,
        });
    }));
    it("should return the summary of contracts", () => __awaiter(void 0, void 0, void 0, function* () {
        processor.jobIds = ["1234-requestId123", "1235-requestId123"];
        redisManager_1.default.getJobInfo.mockReturnValue(Promise.reject({}));
        let response = yield processor["getRequestSummary"]();
        expect(response).toEqual({
            success: 0,
            failed: 0,
            overLappingCount: 0,
            missingValueCount: 0,
        });
    }));
    it("should process the uploaded csv file", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.spyOn(processor, "createDataChunks").mockReturnValue("");
        try {
            yield processor["processCsvFile"]("test.csv");
        }
        catch (error) {
            expect(error).toBe("Error in processing and saving the csv file data to database");
        }
    }));
    xit("should resolve the promise after the specified delay", () => __awaiter(void 0, void 0, void 0, function* () {
        jest.spyOn(global, "setTimeout");
        const delayTime = 1000;
        const delayPromise = processor["delay"](delayTime);
        yield expect(delayPromise).resolves.toBeUndefined();
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), delayTime);
    }));
    it("should log an error if file deletion fails", () => {
        const filePath = "file.csv";
        const errorMessage = "File not found";
        jest.spyOn(processor.logger, "error");
        fs_1.default.unlink.mockImplementation((path, callback) => {
            callback(new Error(errorMessage));
        });
        processor["deleteCSVFile"](filePath);
        expect(processor.logger.error).toHaveBeenCalledWith("Failed to delete the file ", errorMessage);
    });
    it("should log a success message if file deletion is successful", () => {
        const filePath = "/path/file.csv";
        fs_1.default.unlink.mockImplementation((path, callback) => {
            callback(null);
        });
        processor["deleteCSVFile"](filePath);
        expect(processor.logger.error).toHaveBeenCalledWith("Successfully deleted the file ", filePath);
    });
});
