"use strict";
/* jshint node: true, strict: true */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const convict_1 = __importDefault(require("convict"));
const package_json_1 = __importDefault(require("../../package.json"));
// Configuration schema
const conf = convict_1.default({
    env: {
        doc: "Applicaton environments",
        format: ["development", "production", "test"],
        default: "development",
        env: "NODE_ENV",
        arg: "env"
    },
    version: {
        doc: "Version of the application",
        format: String,
        default: package_json_1.default.version
    },
    name: {
        doc: "Name of the application",
        format: String,
        default: "Asera",
        env: "ASERAAPPL"
    },
    aseraconfig: {
        doc: "Stream Config file",
        format: String,
        default: "",
        env: "ASERACONFIG"
    },
    aseraappstreams: {
        doc: "Asera Application stream",
        default: "",
        format: String,
        env: "APPSTREAMS"
    },
});
// Validate all properties and export it
conf.validate();
exports.default = conf;
//# sourceMappingURL=config.js.map