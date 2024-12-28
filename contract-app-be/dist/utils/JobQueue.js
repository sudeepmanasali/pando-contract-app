"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queue = void 0;
const bull_1 = __importDefault(require("bull"));
exports.queue = new bull_1.default('csv-processing', {
    redis: {
        host: process.env.REDIS || ''
    }
});
