"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Contracts_1 = require("../controllers/Contracts");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
// const router = express.Router();
// const diskStorage = multer.diskStorage({
//   destination: (req, file, callback) => {
//     callback(null, "csv-uploads")
//   },
//   filename(req, file, callback) {
//     callback(null, file.originalname);
//   },
// });
// if (!fs.existsSync('csv-uploads')) {
//   fs.mkdirSync('csv-uploads');
// }
// let uploadingInstance = multer({ storage: diskStorage });
// // Uploading the csc file api
// router.post(API_REQUEST_ROUTES.UPLOAD_CONTRACT_FILE, uploadingInstance.single("csv-file"), createContractsFromCSVFile);
// // create new contracts based on the form details
// router.post(API_REQUEST_ROUTES.CREATE_CONTRACT, createContract);
// // To get all saved contracts
// router.get(API_REQUEST_ROUTES.GET_CONTRACTS, getAllContracts);
// // To get all saved contracts
// router.get(API_REQUEST_ROUTES.GET_CONTRACTS_COUNT, getContractsDocumentCount);
// export default router;
class ContractApiRouter {
    constructor() {
        this.multerFileSaver = this.setUpDiskStorage();
        this.router = express_1.default.Router();
    }
    getContractApiRouter() {
        // Uploading the csc file api
        this.router.post("/csv-upload" /* API_REQUEST_ROUTES.UPLOAD_CONTRACT_FILE */, this.multerFileSaver.single("csv-file"), Contracts_1.createContractsFromCSVFile);
        // create new contracts based on the form details
        this.router.post("/create-contract" /* API_REQUEST_ROUTES.CREATE_CONTRACT */, Contracts_1.createContract);
        // To get all saved contracts
        this.router.get("/get-al-contracts" /* API_REQUEST_ROUTES.GET_CONTRACTS */, Contracts_1.getAllContracts);
        return this.router;
    }
    setUpDiskStorage() {
        const diskStorage = multer_1.default.diskStorage({
            destination: (req, file, callback) => {
                callback(null, "csv-uploads");
            },
            filename(req, file, callback) {
                callback(null, file.originalname);
            },
        });
        if (!fs_1.default.existsSync('csv-uploads')) {
            fs_1.default.mkdirSync('csv-uploads');
        }
        return (0, multer_1.default)({ storage: diskStorage });
    }
}
exports.default = ContractApiRouter;
