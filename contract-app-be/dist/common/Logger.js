"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, label, json } = format;
class AppLogger {
    static getLogger(moduleName) {
        return createLogger({
            level: this.LOG_LEVEL,
            format: combine(timestamp(), label({ label: moduleName, message: false }), json(), colorize(), format.printf((info) => {
                return `${info.timestamp}: ${info.level}: [${info.label}] ${JSON.stringify(info.message)}`;
            })),
            transports: [
                new transports.Console()
            ]
        });
    }
}
AppLogger.LOG_LEVEL = 'info';
exports.default = AppLogger;
