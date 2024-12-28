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
exports.getContractsPagedata = exports.getContractsDocumentCount = exports.getAllContracts = exports.createContract = exports.createContractsFromCSVFile = void 0;
const crypto_1 = __importDefault(require("crypto"));
const Logger_1 = __importDefault(require("../common/Logger"));
const upload_csv_file_1 = __importDefault(require("../common/upload-csv-file"));
const Contract = require("../models/Contract");
let logger = Logger_1.default.getLogger("contract-controller");
const createContractsFromCSVFile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let requestId = crypto_1.default.randomBytes(5).toString("hex");
    try {
        let csvFileProcessor = new upload_csv_file_1.default(requestId);
        let summary = yield csvFileProcessor.processCsvFile(req.file.path);
        logger.info(`${summary.success} contracts created`);
        res.status(200).json(summary);
    }
    catch (error) {
        logger.error("Csv file parsing failed", req.file, error);
        res.status(500).json({ message: "Csv file parsing failed", error });
    }
});
exports.createContractsFromCSVFile = createContractsFromCSVFile;
const createContract = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let contract = new Contract(req.body);
        let contractFromDb = yield Contract.find({
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
        if (contractFromDb.length === 0) {
            let response = yield contract.save();
            logger.info("Contract created successfully...!", response._id);
            res.status(201).json(response);
        }
        else {
            throw new Error('Contract already exists');
        }
    }
    catch (error) {
        logger.error("Unable to save contract to the database", error);
        res.status(500).json({ message: "Unable to save contract to the database", error });
    }
});
exports.createContract = createContract;
const getAllContracts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let contracts = yield Contract.find({}).limit(10);
        res.status(200).json(contracts);
    }
    catch (error) {
        logger.error("Unable to retrive the contracts data", error);
        res.status(500).json({ message: "Unable to retrive the contracts", error });
    }
});
exports.getAllContracts = getAllContracts;
const getContractsDocumentCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let count = yield Contract.countDocuments();
        res.status(200).json(count);
    }
    catch (error) {
        logger.error("Unable to retrive the contract count", error);
        res.status(500).json({ message: "Unable to retrive the contract count", error });
    }
});
exports.getContractsDocumentCount = getContractsDocumentCount;
const getContractsPagedata = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let page = +req.query.page;
        let offset = +req.query.offset;
        let skipLines = (page - 1) * offset;
        let count = yield Contract.countDocuments();
        if (skipLines - count >= 0 || skipLines >= count) {
            logger.info("No contracts available for the requested page");
            res.status(200).json([]);
            return;
        }
        let contracts = yield Contract.find().skip(skipLines).limit(offset);
        res.status(200).json(contracts);
    }
    catch (error) {
        logger.error("failed to retrive paginated data, ", error);
        res.status(400).json({ message: "failed to retrive paginated data,", error });
    }
});
exports.getContractsPagedata = getContractsPagedata;
