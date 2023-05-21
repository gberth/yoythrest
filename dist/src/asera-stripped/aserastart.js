"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AserA = __importStar(require("./AserA"));
const fs_1 = __importDefault(require("fs"));
const package_json_1 = __importDefault(require("../../package.json"));
const config_1 = __importDefault(require("./config"));
const startapp = () => {
    const log = null;
    const logger = console;
    const appName = config_1.default.get("name");
    const appConfig = config_1.default.get("aseraconfig");
    const appStreams = config_1.default.get("aseraappstreams");
    let startOk = true;
    let appStreamsExport;
    let bc;
    if (!appName) {
        logger.error("Application name (env variable ASERAAPPL) must be given ");
        startOk = false;
    }
    if (!appConfig) {
        logger.error("Application stream config file (env variable ASERACONFIG) must be given ");
        startOk = false;
    }
    if (!appStreams) {
        logger.error("Application stream export file (env variable ASERASTREAMS) must be given ");
        startOk = false;
    }
    if (startOk) {
        appStreamsExport = require(appStreams);
        if (!appStreamsExport) {
            logger.error(`Require on ${appStreams} failed`);
            startOk = false;
        }
        else {
            bc = appStreamsExport.BusinessClasses;
            if (!bc) {
                logger.error(`Exported object BusinessClasses not found on ${appStreams}`);
                startOk = false;
            }
        }
    }
    if (!startOk) {
        process.exit(12);
    }
    logger.info("ASERA Application : ", appName);
    logger.info("Stream definition file : ", appConfig);
    logger.info("Application Streams : ", appStreams);
    function jsonfile(file) {
        return new Promise((resolve, reject) => {
            fs_1.default.readFile(file, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(JSON.parse(data.toString()));
            });
        });
    }
    function configurateserver() {
        Promise.all([jsonfile(appConfig)])
            .then(data => {
            AserA.start({
                businessStreams: bc,
                aseraDefinition: data[0],
                serverId: appName,
                version: package_json_1.default.version,
                log: logger
            });
        })
            .catch(err => logger.error(err));
    }
    configurateserver();
};
exports.default = startapp;
//# sourceMappingURL=aserastart.js.map