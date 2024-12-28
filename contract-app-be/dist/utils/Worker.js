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
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWorker = void 0;
const JobQueue_1 = require("./JobQueue");
const Contract = require('../models/Contract');
const startWorker = () => {
    return new Promise((resolve, reject) => {
        JobQueue_1.queue.process((job) => __awaiter(void 0, void 0, void 0, function* () {
            const batchData = job.data;
            console.log(batchData);
            Contract.insertMany(batchData).then((message) => {
                resolve('completed ');
                console.log('inside try, ', message);
            }).catch((err) => {
                console.log(err);
            });
        }));
        JobQueue_1.queue.on('failed', (job) => {
            console.log('job failed ', job.id);
            reject('failed to process data');
        });
    });
};
exports.startWorker = startWorker;
