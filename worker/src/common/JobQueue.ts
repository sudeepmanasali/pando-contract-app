import Bull from "bull";

export const queue = new Bull('csv-processing', {
  redis: {
    host: process.env.REDIS || ''
  }
});
