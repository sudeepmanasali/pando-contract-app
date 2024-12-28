import { RedisClientType } from "redis";
import { createClient } from "redis";
import WorkerLogger from "./Logger";

let logger = WorkerLogger.getLogger('RedisManager');

interface Summary {
  success: number,
  failed: number,
  missingValueCount: number,
  overLappingCount: number
}

const enum REDIS_STATUS {
  END = 'end',
  CONNECT = 'connect',
  ERROR = 'error'
}

export default class RedisManager {
  private static _redisClient: RedisClientType;
  private static readonly RECONNECT_DELAY = 5000;
  private static readonly MAX_RETRIES = 10;

  static async init(url: string): Promise<void> {
    try {
      RedisManager._redisClient = createClient({ url }) as RedisClientType;

      RedisManager._redisClient.on(REDIS_STATUS.CONNECT, () => {
        logger.info('Redis Client connected successfully ');
      });

      RedisManager._redisClient.on(REDIS_STATUS.ERROR, (err) => {
        logger.error('Redis Client Error:', err);
        if (!RedisManager.isRedisConnected()) {
          RedisManager.reconnectRedisClient(3);
        }
      });

      RedisManager._redisClient.on(REDIS_STATUS.END, () => {
        logger.warn('Redis Client connection closed unexpectedly');
        if (!RedisManager.isRedisConnected()) {
          RedisManager.reconnectRedisClient(3);
        }
      });

      await RedisManager.connect();
    } catch (error) {
      logger.error('Failed to create the redis client, ', error);
    }
  }

  static isRedisConnected(): boolean {
    return RedisManager._redisClient.isOpen;
  }

  static async connect(): Promise<void> {
    try {
      if (!RedisManager.isRedisConnected()) {
        await Promise.all([RedisManager._redisClient.connect()]);
      }
    } catch (error) {
      logger.error('Error while connecting to Redis, retrying...', error);
      setTimeout(() => RedisManager.reconnectRedisClient(3), RedisManager.RECONNECT_DELAY);
    }
  }

  static async reconnectRedisClient(retryAttempt: number): Promise<void> {
    if (retryAttempt <= RedisManager.MAX_RETRIES) {
      try {
        logger.warn(`Trying to reconnect to redis `);
        await RedisManager.connect();
      } catch (error) {
        logger.error('Failed to reconnect to redis client');
      }
    }
  }

  static get redisClient(): RedisClientType {
    return RedisManager._redisClient;
  }

  static async addJob(requestId: string, summary: Summary) {
    try {
      await RedisManager._redisClient.set(requestId, JSON.stringify(summary));
    } catch (error) {
      logger.error('Failed to add the job summary into redis store, ', requestId, error);
    }
  }
}