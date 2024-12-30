const mockStream = { pipe: jest.fn(), on: jest.fn() };

jest.mock("fs", () => ({
  createReadStream: jest.fn().mockReturnValue(mockStream),
  unlink: jest.fn(),
}));
jest.mock("./RedisManager");

import RedisManager from "./redisManager";
import CSVFileProcessor from "./upload-csv-file";
import fs from "fs";

describe("CSVFileProcessor", () => {
  let processor: CSVFileProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new CSVFileProcessor("requestId123");
    (mockStream.pipe as jest.Mock).mockReturnValue(mockStream);
    (mockStream.on as jest.Mock).mockImplementation((event: any, cb: any) => {
      cb("Error in processing and saving the csv file data to database");
      return mockStream;
    });
  });

  it("should add row to dataChunk", () => {
    const addChunkToQueueSpy = jest.spyOn(processor as any, "addChunkToQueue");
    processor.chunkSize = 2;
    const mockRow = { id: 1 };

    processor["createDataChunks"](mockRow);

    expect(processor.dataChunk).toHaveLength(1);
    expect(processor.dataChunk).toEqual([mockRow]);
    expect(addChunkToQueueSpy).toHaveBeenCalledTimes(0);
  });

  it("should add row to dataChunk and add it to the queue", () => {
    jest.spyOn(processor as any, "generateRandomHexId").mockReturnValue("1234");
    let requestId = processor.requestId;
    processor.chunkSize = 1;
    const mockRow = { id: 1 };

    processor["createDataChunks"](mockRow);
    expect(processor.jobIds).toHaveLength(1);
    expect(processor.jobIds).toEqual(["1234-" + requestId]);
  });

  it("Should return empty array when all the jobs status is completed", async () => {
    processor.jobIds = ["1234-requestId123"];
    (RedisManager.getJobInfo as jest.Mock).mockReturnValue(
      Promise.resolve("completed")
    );
    let response = await processor["checkJobStatuses"]();

    expect(response).toEqual([]);
  });

  it("should return empty array when all the jobs status is failed", async () => {
    processor.jobIds = ["1234-requestId123"];
    (RedisManager.getJobInfo as jest.Mock).mockReturnValue(
      Promise.resolve("failed")
    );
    let response = await processor["checkJobStatuses"]();

    expect(response).toEqual([]);
  });

  it("Should return array of jobs ids whose status is pending", async () => {
    processor.jobIds = ["1234-requestId123"];
    (RedisManager.getJobInfo as jest.Mock).mockReturnValue(
      Promise.resolve("pending")
    );
    jest.spyOn(processor as any, "delay").mockResolvedValue("");
    jest.useFakeTimers();
    let response = await processor["checkJobStatuses"]();

    expect(response).toEqual(["1234-requestId123"]);
  });

  it("should remove the jobs and its info from redis when the job status is complete or failed", async () => {
    processor.jobIds = ["1234-requestId123"];
    (RedisManager.removeJob as jest.Mock).mockReturnValue(
      Promise.resolve("OK")
    );
    await processor["removeJobIdFromRedis"]([]);

    expect(RedisManager.removeJob).toHaveBeenCalledWith("requestId123-1234");
    expect(RedisManager.removeJob).toHaveBeenCalledWith("1234-requestId123");
  });

  it("Error thrown when removing the jobs and its info from redis when the job status is complete or failed", async () => {
    processor.jobIds = ["1234-requestId123"];
    (RedisManager.removeJob as jest.Mock).mockReturnValue(
      Promise.reject("ZERO")
    );

    try {
      await processor["removeJobIdFromRedis"]([]);
    } catch (error) {
      expect(RedisManager.removeJob).toHaveBeenCalledTimes(1);
    }
  });

  it("should return the summary of contracts", async () => {
    processor.jobIds = ["1234-requestId123", "1235-requestId123"];
    (RedisManager.getJobInfo as jest.Mock).mockReturnValue(
      Promise.resolve(
        JSON.stringify({
          success: 1,
          failed: 2,
          invalidInput: 0,
          missingValueCount: 0,
        })
      )
    );

    let response = await processor["getRequestSummary"]();

    expect(response).toEqual({
      success: 2,
      failed: 4,
      invalidInput: 0,
      missingValueCount: 0,
    });
  });

  it("should return the summary of contracts", async () => {
    processor.jobIds = ["1234-requestId123", "1235-requestId123"];
    (RedisManager.getJobInfo as jest.Mock).mockReturnValue(Promise.reject({}));

    let response = await processor["getRequestSummary"]();

    expect(response).toEqual({
      success: 0,
      failed: 0,
      invalidInput: 0,
      missingValueCount: 0,
    });
  });

  it("should process the uploaded csv file", async () => {
    jest.spyOn(processor as any, "createDataChunks").mockReturnValue("");
    try {
      await processor["processCsvFile"]("test.csv");
    } catch (error) {
      expect(error).toBe(
        "Error in processing and saving the csv file data to database"
      );
    }
  });

  xit("should resolve the promise after the specified delay", async () => {
    jest.spyOn(global, "setTimeout");
    const delayTime = 1000;
    const delayPromise = processor["delay"](delayTime);
    await expect(delayPromise).resolves.toBeUndefined();
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), delayTime);
  });

  it("should log an error if file deletion fails", () => {
    const filePath = "file.csv";
    const errorMessage = "File not found";
    jest.spyOn(processor.logger, "error");
    (fs.unlink as unknown as jest.Mock).mockImplementation((path, callback) => {
      callback(new Error(errorMessage));
    });

    processor["deleteCSVFile"](filePath);
    expect(processor.logger.error).toHaveBeenCalledWith(
      "Failed to delete the file ",
      errorMessage
    );
  });

  it("should log a success message if file deletion is successful", () => {
    const filePath = "/path/file.csv";
    (fs.unlink as unknown as jest.Mock).mockImplementation((path, callback) => {
      callback(null);
    });

    processor["deleteCSVFile"](filePath);
    expect(processor.logger.error).toHaveBeenCalledWith(
      "Successfully deleted the file ",
      filePath
    );
  });
});
