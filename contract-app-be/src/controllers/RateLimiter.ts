import { API_REQUEST_ROUTES } from "../common/constants";
import RedisManager from "../common/redisManager";
import { RateLimiterRedis } from 'rate-limiter-flexible';

export class RateLimiter {
  private static rateLimiter: RateLimiterRedis;

  constructor() { }

  static init(): void {
    RateLimiter.rateLimiter = new RateLimiterRedis({
      storeClient: RedisManager.redisClient,
      points: 1,
      duration: 10,
      keyPrefix: 'rate-limit'
    });
  }


  static async rateLimiterMiddleware(req: any, res: any, next: any): Promise<void> {
    let url = req.originalUrl, ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (url === API_REQUEST_ROUTES.UPLOAD_CONTRACT_FILE) {
      const key = `${ip}:${url}`;

      try {
        await RateLimiter.rateLimiter.consume(key);
        next();
      } catch (error) {
        res.status(429).json({
          message: `Too many requests to ${url}, please try again after 10seconds.`,
        });
      }
    } else {
      next();
    }
  }
}