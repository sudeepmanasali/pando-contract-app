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
const redis_1 = require("redis");
const Logger_1 = __importDefault(require("./Logger"));
let logger = Logger_1.default.getLogger('RedisManager');
class RedisManager {
    static init(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                RedisManager._redisClient = (0, redis_1.createClient)({ url });
                RedisManager._redisClient.on("connect" /* REDIS_STATUS.CONNECT */, () => {
                    logger.info('Redis Client connected successfully ');
                });
                RedisManager._redisClient.on("error" /* REDIS_STATUS.ERROR */, (err) => {
                    logger.error('Redis Client Error:', err);
                    if (!RedisManager.isRedisConnected()) {
                        RedisManager.reconnectRedisClient(3);
                    }
                });
                RedisManager._redisClient.on("end" /* REDIS_STATUS.END */, () => {
                    logger.warn('Redis Client connection closed unexpectedly');
                    if (!RedisManager.isRedisConnected()) {
                        RedisManager.reconnectRedisClient(3);
                    }
                });
                yield RedisManager.connect();
            }
            catch (error) {
                logger.error('Failed to create the redis client, ', error);
            }
        });
    }
    static get redisClient() {
        return RedisManager._redisClient;
    }
    static isRedisConnected() {
        return RedisManager._redisClient.isOpen;
    }
    static connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!RedisManager.isRedisConnected()) {
                    yield Promise.all([RedisManager._redisClient.connect()]);
                }
            }
            catch (error) {
                logger.error('Error while connecting to Redis, retrying...', error);
                setTimeout(() => RedisManager.reconnectRedisClient(3), RedisManager.RECONNECT_DELAY);
            }
        });
    }
    static reconnectRedisClient(retryAttempt) {
        return __awaiter(this, void 0, void 0, function* () {
            if (retryAttempt <= RedisManager.MAX_RETRIES) {
                try {
                    logger.warn(`Trying to reconnect to redis `);
                    yield RedisManager.connect();
                }
                catch (error) {
                    logger.error('Failed to reconnect to redis client');
                }
            }
        });
    }
    static addJob(jobId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield RedisManager._redisClient.set(jobId, status);
            }
            catch (error) {
                logger.error('Failed to add the job into redis store, ', jobId, error);
            }
        });
    }
    static getJobInfo(jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield RedisManager._redisClient.get(jobId);
            }
            catch (error) {
                logger.error('Failed to add the job into redis store, ', jobId, error);
            }
        });
    }
    static removeJob(jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield RedisManager._redisClient.del(jobId);
            }
            catch (error) {
                logger.error('Failed to add the job into redis store, ', jobId, error);
            }
        });
    }
}
RedisManager.RECONNECT_DELAY = 5000;
RedisManager.MAX_RETRIES = 10;
exports.default = RedisManager;
