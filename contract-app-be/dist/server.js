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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = __importDefault(require("http"));
const ContractApiRouter_1 = __importDefault(require("./routers/ContractApiRouter"));
const redisManager_1 = __importDefault(require("./common/redisManager"));
const Logger_1 = __importDefault(require("./common/Logger"));
const RateLimiter_1 = require("./controllers/RateLimiter");
dotenv_1.default.config();
let logger = Logger_1.default.getLogger("main-app");
class App {
    constructor() {
        this.port = process.env.PORT || "8089";
        this.mongoDbURL = process.env.MONGODBURL || "";
        this.redisUrl = `redis://${process.env.REDIS}:${process.env.REDIS_PORT}`;
        this.app = (0, express_1.default)();
        this.app.disable("x-powered-by");
        this.listenAppRestartProcess();
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield redisManager_1.default.init(this.redisUrl);
                let connectStatus = yield mongoose_1.default.connect(this.mongoDbURL);
                if (connectStatus) {
                    logger.info("Mongodb connected to " + this.mongoDbURL);
                }
                this.server = http_1.default.createServer(this.app);
                mongoose_1.default.connection.once("open", () => {
                    logger.info("Mongo DB connected successfully " + this.mongoDbURL);
                });
                mongoose_1.default.connection.on("disconnected", () => {
                    logger.error("Mongo db disconnected to " + this.mongoDbURL);
                });
                mongoose_1.default.connection.on("error", (error) => {
                    logger.error("MongoDB connection error: " + this.mongoDbURL, error);
                });
                RateLimiter_1.RateLimiter.init();
                this.app
                    .use((0, cors_1.default)({
                    origin: "*",
                }))
                    .use(body_parser_1.default.json())
                    .use(body_parser_1.default.urlencoded({ extended: true }));
                this.mountRoutes();
                if (connectStatus) {
                    this.server.listen(this.port, () => {
                        logger.info(`Server running at http://localhost:${this.port}`);
                    });
                }
            }
            catch (error) {
                logger.error("App exited: ", error);
            }
        });
    }
    mountRoutes() {
        let contractApiRouter = new ContractApiRouter_1.default();
        this.app.use(RateLimiter_1.RateLimiter.rateLimiterMiddleware);
        this.app.use(contractApiRouter.getContractApiRouter());
    }
    listenAppRestartProcess() {
        process.on("SIGTERM", () => {
            logger.error("App exited");
            this.closeResourceConnections();
        });
    }
    closeResourceConnections() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.server) {
                    this.server.close();
                    logger.info("Stopping HTTP server...");
                }
                if (mongoose_1.default.connection.readyState === 1) {
                    yield mongoose_1.default.connection.close();
                }
                yield redisManager_1.default.redisClient.quit();
                logger.info("Application has been shut down successfully, and all connections are released");
                process.exit(0);
            }
            catch (error) {
                logger.error("Error during app shutdown:", error);
                process.exit(1);
            }
        });
    }
}
exports.default = (() => {
    const app = new App();
    app.start();
})();
