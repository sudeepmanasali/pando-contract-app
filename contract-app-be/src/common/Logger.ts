import { Logger } from "winston";

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, label, json } = format;


export default class AppLogger {
  static logger: Logger
  static readonly LOG_LEVEL = 'info';

  static getLogger(moduleName: string) {
    return createLogger({
      level: this.LOG_LEVEL,
      format: combine(
        timestamp(),
        label({ label: moduleName, message: false }),
        json(),
        colorize(),
        format.printf((info: any) => {
          return `${info.timestamp}: ${info.level}: [${info.label}] ${JSON.stringify(info.message)}`;
        })
      ),
      transports: [
        new transports.Console()
      ]
    });
  }
}