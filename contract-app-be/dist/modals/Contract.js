"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CONTRACT_SCHEMA = new mongoose_1.default.Schema({
    contractId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true
    },
    shipper: {
        type: String,
        required: true
    },
    transporter: {
        type: String,
        required: true
    },
    valid_from: {
        type: String,
        required: true
    },
    valid_to: {
        type: String,
        required: true
    },
    vehicle_type: {
        type: String,
        required: true
    },
    source: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    }
});
module.exports = mongoose_1.default.model("Contract", CONTRACT_SCHEMA);
