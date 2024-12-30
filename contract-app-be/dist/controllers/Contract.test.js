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
const upload_csv_file_1 = __importDefault(require("../common/upload-csv-file"));
const Contracts_1 = require("./Contracts");
jest.mock("../common/upload-csv-file");
describe("createContractsFromCSVFile", () => {
    const mockRequest = {
        file: { path: 'test.csv' },
    };
    const mockResponse = () => {
        let res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        return res;
    };
    const mockNext = jest.fn();
    let mockSummary;
    beforeEach(() => {
        mockSummary = { success: 10, failed: 0, invalidInput: 0, missingValueCount: 0 };
    });
    it("should process the CSV file and return a success summary", () => __awaiter(void 0, void 0, void 0, function* () {
        const req = mockRequest;
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        ;
        const mockSummary = { success: 10, failed: 2, missingValueCount: 1, invalidInput: 0 };
        upload_csv_file_1.default.mockImplementation(() => ({
            processCsvFile: jest.fn().mockResolvedValue(mockSummary),
        }));
        yield (0, Contracts_1.createContractsFromCSVFile)(req, res, mockNext);
        expect(upload_csv_file_1.default).toHaveBeenCalledWith(expect.any(String));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockSummary);
    }));
    it("should handle errors and respond with a 500 status code", () => __awaiter(void 0, void 0, void 0, function* () {
        const req = mockRequest;
        const res = mockResponse();
        const mockError = new Error("File parsing failed");
        upload_csv_file_1.default.mockImplementation(() => ({
            processCsvFile: jest.fn().mockRejectedValue(mockError),
        }));
        yield (0, Contracts_1.createContractsFromCSVFile)(req, res, mockNext);
        expect(upload_csv_file_1.default).toHaveBeenCalledWith(expect.any(String));
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "Csv file parsing failed",
            error: mockError,
        });
    }));
});
