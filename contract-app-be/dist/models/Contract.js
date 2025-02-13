"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CONTRACT_SCHEMA = new mongoose_1.default.Schema({
    shipper: {
        type: String,
        required: true,
    },
    transporter: {
        type: String,
        required: true,
    },
    validFrom: {
        type: String,
        required: true,
    },
    validTo: {
        type: String,
        required: true,
    },
    vehicleType: {
        type: String,
        required: true,
    },
    contractType: {
        type: String,
    },
    source: {
        type: String,
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },
});
CONTRACT_SCHEMA.methods.setContractType = function () {
    const today = new Date();
    return this.validFrom <= today && this.validTo >= today;
};
CONTRACT_SCHEMA.pre("save", function (next) {
    const today = new Date();
    const validFrom = new Date(this.validFrom);
    const validTo = new Date(this.validTo);
    if (validFrom <= today && validTo >= today) {
        this.contractType = "Current Contract";
    }
    else if (validFrom > today) {
        this.contractType = "Future Contract";
    }
    else {
        this.contractType = "Expired Contract";
    }
    next();
});
CONTRACT_SCHEMA.index({
    shipper: 1,
    transporter: 1,
    source: 1,
    destination: 1,
    vehcleType: 1
});
module.exports = mongoose_1.default.model("Contract", CONTRACT_SCHEMA);
