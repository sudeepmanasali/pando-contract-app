"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const constants_1 = require("../common/constants");
const Contracts_1 = require("../controllers/Contracts");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const Logger_1 = __importDefault(require("../common/Logger"));
let logger = Logger_1.default.getLogger('contract-api-router');
class ContractApiRouter {
    constructor() {
        this.multerFileSaver = this.setUpDiskStorage();
        this.contractApiRouter = express_1.default.Router({
            caseSensitive: true,
            strict: true
        });
    }
    getContractApiRouter() {
        // Uploading the csc file api
        this.contractApiRouter.post("/csv-upload" /* API_REQUEST_ROUTES.UPLOAD_CONTRACT_FILE */, this.multerFileSaver.single(constants_1.CSV_FILE_NAME), Contracts_1.createContractsFromCSVFile);
        // create new contracts based on the form details
        this.contractApiRouter.post("/save-contract" /* API_REQUEST_ROUTES.CREATE_CONTRACT */, Contracts_1.createContract);
        // get all saved contracts
        this.contractApiRouter.get("/all-contracts" /* API_REQUEST_ROUTES.GET_CONTRACTS */, Contracts_1.getAllContracts);
        // get all saved contracts count
        this.contractApiRouter.get("/contracts-count" /* API_REQUEST_ROUTES.GET_CONTRACTS_COUNT */, Contracts_1.getContractsDocumentCount);
        // get contracts based on pagenumber and number of rows
        this.contractApiRouter.get("/contracts-page-data" /* API_REQUEST_ROUTES.GET_CONTRACTS_PAGE_DATA */, Contracts_1.getContractsPagedata);
        return this.contractApiRouter;
    }
    setUpDiskStorage() {
        let diskStorage;
        try {
            diskStorage = multer_1.default.diskStorage({
                destination: (req, file, callback) => {
                    callback(null, constants_1.CSV_FILE_DIRECTORY);
                },
                filename(req, file, callback) {
                    callback(null, file.originalname);
                },
            });
            if (!fs_1.default.existsSync(constants_1.CSV_FILE_DIRECTORY)) {
                fs_1.default.mkdirSync(constants_1.CSV_FILE_DIRECTORY);
            }
            logger.info('csv-uploads directory exists');
        }
        catch (error) {
            logger.error('Failed to create the csv-uploads directory');
        }
        return (0, multer_1.default)({ storage: diskStorage });
    }
}
exports.default = ContractApiRouter;
