import CSVFileProcessor from "../common/upload-csv-file";
import { createContractsFromCSVFile } from "./Contracts";

jest.mock("../common/upload-csv-file");

describe("createContractsFromCSVFile", () => {
  const mockRequest = {
    file: { path: "test.csv" },
  };

  const mockResponse = () => {
    let res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    return res;
  };

  const mockNext = jest.fn();
  let mockSummary: any;

  beforeEach(() => {
    mockSummary = {
      success: 10,
      failed: 0,
      overLappingCount: 0,
      missingValueCount: 0,
    };
  });

  it("should process the CSV file and return a success summary", async () => {
    const req = mockRequest;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const mockSummary = {
      success: 10,
      failed: 2,
      missingValueCount: 1,
      overLappingCount: 0,
    };

    (CSVFileProcessor as jest.Mock).mockImplementation(() => ({
      processCsvFile: jest.fn().mockResolvedValue(mockSummary),
    }));

    await createContractsFromCSVFile(req, res, mockNext);

    expect(CSVFileProcessor).toHaveBeenCalledWith(expect.any(String));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockSummary);
  });

  it("should handle errors and respond with a 500 status code", async () => {
    const req = mockRequest;
    const res = mockResponse();
    const mockError = new Error("File parsing failed");

    (CSVFileProcessor as jest.Mock).mockImplementation(() => ({
      processCsvFile: jest.fn().mockRejectedValue(mockError),
    }));

    await createContractsFromCSVFile(req, res, mockNext);

    expect(CSVFileProcessor).toHaveBeenCalledWith(expect.any(String));
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Csv file parsing failed",
      error: mockError,
    });
  });
});
