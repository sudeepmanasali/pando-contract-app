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
exports.RateLimiter = void 0;
const redisManager_1 = __importDefault(require("../common/redisManager"));
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
class RateLimiter {
    constructor() { }
    static init() {
        RateLimiter.rateLimiter = new rate_limiter_flexible_1.RateLimiterRedis({
            storeClient: redisManager_1.default.redisClient,
            points: 1,
            duration: 10,
            keyPrefix: 'rate-limit'
        });
    }
    static rateLimiterMiddleware(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = req.originalUrl, ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            if (url === "/csv-upload" /* API_REQUEST_ROUTES.UPLOAD_CONTRACT_FILE */) {
                const key = `${ip}:${url}`;
                try {
                    yield RateLimiter.rateLimiter.consume(key);
                    next();
                }
                catch (error) {
                    res.status(429).json({
                        message: `Too many requests to ${url}, please try again after 10seconds.`,
                    });
                }
            }
            else {
                next();
            }
        });
    }
}
exports.RateLimiter = RateLimiter;
