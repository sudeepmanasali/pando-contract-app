import Bull from "bull";
import { Queue } from "bullmq";

export const queue = new Bull('csv-processing', {
  redis: {
    host: process.env.REDIS || ''
  }
});
