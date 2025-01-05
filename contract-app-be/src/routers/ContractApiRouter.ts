import express, { Router } from 'express';
import { API_REQUEST_ROUTES, CSV_FILE_DIRECTORY, CSV_FILE_NAME } from '../common/constants';
import { createContract, createContractsFromCSVFile, getAllContracts, getContractProgress, getContractsDocumentCount, getContractsPagedata } from '../controllers/Contracts';
import multer, { Multer } from "multer";
import fs from 'fs';
import AppLogger from '../common/Logger';

let logger = AppLogger.getLogger('contract-api-router');

export default class ContractApiRouter {
  private multerFileSaver: Multer;
  private readonly contractApiRouter: Router;

  constructor() {
    this.multerFileSaver = this.setUpDiskStorage();
    this.contractApiRouter = express.Router({
      caseSensitive: true,
      strict: true
    });
  }

  getContractApiRouter(): Router {

    // Uploading the csc file api
    this.contractApiRouter.post(API_REQUEST_ROUTES.UPLOAD_CONTRACT_FILE, this.multerFileSaver.single(CSV_FILE_NAME), createContractsFromCSVFile)

    // create new contracts based on the form details
    this.contractApiRouter.post(API_REQUEST_ROUTES.CREATE_CONTRACT, createContract);

    // get all saved contracts
    this.contractApiRouter.get(API_REQUEST_ROUTES.GET_CONTRACTS, getAllContracts);

    // get all saved contracts count
    this.contractApiRouter.get(API_REQUEST_ROUTES.GET_CONTRACTS_COUNT, getContractsDocumentCount);

    // get contracts based on pagenumber and number of rows
    this.contractApiRouter.get(API_REQUEST_ROUTES.GET_CONTRACTS_PAGE_DATA, getContractsPagedata);

    // get progress of csv file procssing and saving
    this.contractApiRouter.get(API_REQUEST_ROUTES.GET_PROGRESS, getContractProgress);

    return this.contractApiRouter;
  }

  setUpDiskStorage(): Multer {
    let diskStorage;
    try {
      diskStorage = multer.diskStorage({
        destination: (req, file, callback) => {
          callback(null, CSV_FILE_DIRECTORY)
        },
        filename(req, file, callback) {
          callback(null, file.originalname);
        },
      });

      if (!fs.existsSync(CSV_FILE_DIRECTORY)) {
        fs.mkdirSync(CSV_FILE_DIRECTORY);
      }
      logger.info('csv-uploads directory exists');

    } catch (error) {
      logger.error('Failed to create the csv-uploads directory');
    }
    return multer({ storage: diskStorage });
  }
}