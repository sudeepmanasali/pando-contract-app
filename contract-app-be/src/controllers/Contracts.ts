import crypto from "crypto";
import AppLogger from "../common/Logger";
import CSVFileProcessor from "../common/upload-csv-file";

const Contract = require("../models/Contract");

let logger = AppLogger.getLogger("contract-controller");

export const createContractsFromCSVFile = async (req: any, res: any, next: any) => {
  let requestId = crypto.randomBytes(5).toString("hex");
  try {
    let csvFileProcessor = new CSVFileProcessor(requestId);
    let summary = await csvFileProcessor.processCsvFile(req.file.path)
    logger.info(`${summary.success} contracts created`);
    res.status(200).json(summary);
  } catch (error) {
    logger.error("Csv file parsing failed", req.file, error);
    res.status(500).json({ message: "Csv file parsing failed", error });
  }
};

export const createContract = async (req: any, res: any) => {
  try {
    let contract = new Contract(req.body);

    let contractFromDb = await Contract.find({
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

    let currentTime = new Date();
    let validToDate = new Date(contract.validTo);
    if (validToDate < currentTime) {
      res.status(400).json({ message: "Invalid date input" });
    }

    if (contractFromDb.length === 0) {
      let response = await contract.save();
      logger.info("Contract created successfully...!", response._id);
      res.status(201).json(response);
    } else {
      throw new Error('Contract already exists');
    }
  } catch (error) {
    logger.error("Unable to save contract to the database", error);
    res.status(500).json({ message: "Unable to save contract to the database", error });
  }
};

export const getAllContracts = async (req: any, res: any) => {
  try {
    let contracts = await Contract.find({}).limit(10);
    res.status(200).json(contracts);
  } catch (error) {
    logger.error("Unable to retrive the contracts data", error);
    res.status(500).json({ message: "Unable to retrive the contracts", error });
  }
};

export const getContractsDocumentCount = async (req: any, res: any) => {
  try {
    let count = await Contract.countDocuments();
    res.status(200).json(count);
  } catch (error) {
    logger.error("Unable to retrive the contract count", error);
    res.status(500).json({ message: "Unable to retrive the contract count", error });
  }
};


export const getContractsPagedata = async (req: any, res: any) => {
  try {
    let page = +req.query.page;
    let offset = +req.query.offset;
    let skipLines = (page - 1) * offset;

    let count = await Contract.countDocuments();
    if (skipLines - count >= 0 || skipLines >= count) {
      logger.info("No contracts available for the requested page");
      res.status(200).json([]);
      return;
    }

    let contracts = await Contract.find().skip(skipLines).limit(offset);
    res.status(200).json(contracts);
  } catch (error) {
    logger.error("failed to retrive paginated data, ", error);
    res.status(400).json({ message: "failed to retrive paginated data,", error });
  }
};
