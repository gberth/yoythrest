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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.yCatch = exports.aItem = exports.ts = exports.listDirectory = exports.returnFileContent = exports.delay = exports.isAsync = exports.isError = exports.isResponse = exports.isAck = exports.ack = exports.createAck = exports.aId = exports.readCertificates = exports.awaitcondition = exports.setLogOveride = void 0;
const Message_1 = __importDefault(require("./Message"));
const types_1 = require("./types");
const merge_1 = __importDefault(require("merge"));
const moment_1 = __importDefault(require("moment"));
const uuid_1 = require("uuid");
const readline_1 = __importDefault(require("readline"));
const fs_1 = __importDefault(require("fs"));
const q_1 = __importDefault(require("q"));
var mylog;
const helperConsoleLog = (logtxt) => {
    if (mylog) {
        mylog.info(logtxt);
    }
    else {
        console.log(logtxt);
    }
};
const setLogOveride = (logDirect) => {
    mylog = logDirect;
};
exports.setLogOveride = setLogOveride;
function promiseWhile(condition, body) {
    var done = q_1.default.defer();
    function loop() {
        // When the result of calling `condition` is no longer true, we are
        // done.
        if (!condition())
            return done.resolve(); // Use `when`, in case `body` does not return a promise.
        // When it completes loop again otherwise, if it fails, reject the
        // done promise
        q_1.default.when(body(), loop, done.reject);
    } // Start running the loop in the next tick so that this function is
    // completely async. It would be unexpected if `body` was called
    // synchronously the first time.
    q_1.default.nextTick(loop); // The promise
    return done.promise;
}
const awaitcondition = (condtxt, cond, loop = 10, waitTime = 1000, quiet) => {
    let index = 1;
    if (!quiet) {
        helperConsoleLog("Await ".concat(condtxt) + "/" + cond());
    }
    return promiseWhile(function () {
        return !cond() && index <= loop;
    }, function () {
        if (!quiet) {
            helperConsoleLog(condtxt + " " + index + "/" + loop);
        }
        index++;
        return q_1.default.delay(waitTime); // arbitrary async
    });
};
exports.awaitcondition = awaitcondition;
const timestamp = () => {
    moment_1.default.defaultFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ";
    return moment_1.default()
        .format()
        .trim();
};
function delayMs(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function waitForFileContent(file, errorf) {
    return __awaiter(this, void 0, void 0, function* () {
        let promise = new Promise((resolve, reject) => {
            fs_1.default.readFile(file, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data.toString());
            });
        });
        try {
            let data = yield promise;
            helperConsoleLog(data);
            return data.toString();
        }
        catch (error) {
            errorf(error);
            helperConsoleLog("Wait for file content error");
            helperConsoleLog(error);
        }
    });
}
function waitForListDirectory(searchfor, file, errf) {
    return __awaiter(this, void 0, void 0, function* () {
        let promise = new Promise((resolve, reject) => {
            fs_1.default.readdir(searchfor, (err, filenames) => {
                if (err) {
                    reject(err);
                }
                else {
                    let ret = [];
                    filenames.forEach(filename => {
                        if (filename.startsWith(file)) {
                            ret.push(filename);
                        }
                    });
                    resolve(ret);
                }
            });
        });
        try {
            let list = yield promise;
            return list;
        }
        catch (error) {
            return [];
        }
    });
}
const readCertificates = (ssl) => {
    let retSsl = Object.assign({}, ssl);
    if (ssl.ca) {
        retSsl.ca = fs_1.default
            .readFileSync(process.env[ssl.ca] || ssl.ca)
            .toString("utf-8");
    }
    if (ssl.key) {
        retSsl.key = fs_1.default
            .readFileSync(process.env[ssl.key] || ssl.key)
            .toString("utf-8");
    }
    if (ssl.cert) {
        retSsl.cert = fs_1.default
            .readFileSync(process.env[ssl.cert] || ssl.cert)
            .toString("utf-8");
    }
    return retSsl;
};
exports.readCertificates = readCertificates;
const aId = () => {
    return uuid_1.v4().toString();
};
exports.aId = aId;
const createAck = function ({ msg, type, response, payload, error = false }) {
    // @ts-ignore
    // deprectaed
    const stream = this instanceof AserAStream ? this : null;
    if (!stream)
        return null;
    let newmsgt;
    if (type) {
        newmsgt = type;
    }
    else {
        newmsgt = msg.message_data.previous_type
            ? msg.message_data.previous_type.concat(".ack")
            : stream.config.ack && stream.config.ack.type
                ? stream.config.ack.type
                : "unknown";
    }
    let ack = msg.createMessageWithThisAsMother(stream.createMessage({
        message_data: {
            type: newmsgt
        },
        payload: response && payload ? payload : {}
    }));
    // don't understand
    ack.message_data.request_data = merge_1.default.recursive(true, {}, ack.message_data.request_data ? ack.message_data.request_data : {});
    // @ts-ignore
    ack.message_data.request_data.requestType = response
        ? types_1.RequestType.RESPONSE_WITH_ACK
        : types_1.RequestType.ACK;
    // @ts-ignore
    ack.message_data.request_data.who = stream.streamIdentifier;
    // @ts-ignore
    ack.message_data.request_data.ts = exports.ts();
    if (error) {
        // @ts-ignore
        ack.message_data.request_data.requestType = types_1.RequestType.ERROR;
    }
    stream.outputStream.writeMessage(ack);
};
exports.createAck = createAck;
const ack = function ({ msg, response, payload, error = false }) {
    // @ts-ignore
    const stream = this instanceof AserAStream ? this : null;
    if (!stream)
        return null;
    let newmsg = msg.createMessageWithThisAsMother(stream.createMessage({
        message_data: {
            type: types_1.RequestType.ACK
        },
        payload: payload || {}
    }));
    // @ts-ignore
    newmsg.message_data.request_data.requestType = response
        ? types_1.RequestType.RESPONSE_WITH_ACK
        : types_1.RequestType.ACK;
    // @ts-ignore
    newmsg.message_data.request_data.ts = exports.ts();
    if (error) {
        // @ts-ignore
        newmsg.message_data.request_data.requestType = types_1.RequestType.ERROR;
    }
    stream.outputStream.writeMessage(newmsg);
};
exports.ack = ack;
const isAck = (type) => {
    return (typeof type !== "undefined" &&
        (type === types_1.RequestType.RESPONSE_WITH_ACK ||
            type === types_1.RequestType.ACK ||
            type === types_1.RequestType.ERROR));
};
exports.isAck = isAck;
const isResponse = (type) => {
    return (typeof type !== "undefined" &&
        (type === types_1.RequestType.RESPONSE_WITH_ACK || type === types_1.RequestType.RESPONSE));
};
exports.isResponse = isResponse;
const isError = (type) => {
    return typeof type !== "undefined" && type === types_1.RequestType.ERROR;
};
exports.isError = isError;
const isAsync = (type) => {
    return (typeof type !== "undefined" &&
        (type === types_1.RequestType.ERROR ||
            type === types_1.RequestType.RESPONSE_WITH_ACK ||
            type === types_1.RequestType.RESPONSE ||
            type === types_1.RequestType.ACK));
};
exports.isAsync = isAsync;
const delay = (ms) => __awaiter(void 0, void 0, void 0, function* () {
    yield delayMs(ms);
});
exports.delay = delay;
const returnFileContent = (file, errf) => __awaiter(void 0, void 0, void 0, function* () {
    let xx = yield waitForFileContent(file, errf);
    return xx;
});
exports.returnFileContent = returnFileContent;
const listDirectory = (directory, file, errf) => __awaiter(void 0, void 0, void 0, function* () {
    let xx = yield waitForListDirectory(directory, file, errf);
    return xx;
});
exports.listDirectory = listDirectory;
const ts = () => {
    return timestamp();
};
exports.ts = ts;
const aItem = ({ itemType, id, payload, version, owner }) => {
    let item = {
        aItem: {
            aMetaData: {
                aId: id || uuid_1.v4().toString(),
                aType: itemType,
                aOwner: owner || ""
            },
            aContent: Object.assign({}, payload)
        }
    };
    if (version) {
        // @ts-ignore
        item.aItem.aMetaData.aVersion = version;
    }
    return item;
};
exports.aItem = aItem;
const yCatch = function (errorParm) {
    // @ts-ignore
    const stream = this instanceof AserAStream ? this : null;
    helperConsoleLog("error occured " + (stream ? stream.streamIdentifier : "nostream"));
    if (stream && stream.config && stream.config.console) {
        const readLine = (lineHandler, resolve, reject) => {
            readline_1.default
                .createInterface({
                input: process.stdin,
                output: process.stdout
            })
                .on("line", function (line) {
                if (line === "") {
                    resolve(true);
                }
                else {
                    lineHandler(line);
                }
            });
        };
        // @ts-ignore
        const rl = readLine.bind(this);
        const evaluateError = (evaluate) => {
            helperConsoleLog(`Evaluate result: ${evaluate} = ${global.eval(evaluate)}`);
        };
        // @ts-ignore
        const evaluateErr = evaluateError.bind(this);
        new Promise((resolve, reject) => {
            rl(evaluateErr, resolve, reject);
        }).then(() => {
            helperConsoleLog("Good bye");
            process.exit(12);
        });
    }
    if ((stream && stream.config.exitOnError) ||
        (errorParm.msg &&
            errorParm.msg instanceof Message_1.default &&
            errorParm.msg.type() === "asera.critical.error")) {
        helperConsoleLog("Abort as last resort");
        process.exit(12);
    }
    //if (errorParm.msg && JSON.stringify(errorParm.msg.payload).length > 1000) {
    //errorParm.msg.payload = JSON.stringify(errorParm.msg.payload).substring(0,1000)
    //}
    let payload = {
        error: errorParm.error,
        stack: errorParm.error.stack,
        msg: errorParm.msg || null,
        extra: errorParm.rest || null,
        loglevel: types_1.LOGLEVELS.error
    };
    if (stream && stream.outputStream && !mylog) {
        stream ? (stream.config.inError = true) : helperConsoleLog("nostream");
        let newmsg = stream.createMessage({
            message_data: {
                type: "asera.error"
            },
            payload: payload
        });
        stream.outputStream.writeMessage(errorParm.msg && errorParm.msg instanceof Message_1.default
            ? errorParm.msg.createMessageWithThisAsMother(newmsg)
            : newmsg);
        if (stream && stream.config.onErrorType) {
            let newmsg = stream.createMessage({
                message_data: {
                    type: stream.config.onErrorType
                },
                payload: payload
            });
            stream.outputStream.writeMessage(errorParm.msg && errorParm.msg instanceof Message_1.default
                ? errorParm.msg.createMessageWithThisAsMother(newmsg)
                : newmsg);
        } // if this.keepForResend - create a retryMessage
    }
    else if (stream && mylog) {
        log(stream, payload.error, types_1.LOGLEVELS.error);
        log(stream, payload, types_1.LOGLEVELS.error);
    }
    else {
        console.dir(payload);
    }
};
exports.yCatch = yCatch;
const log = (stream, payload, level) => {
    console.log("error");
};
//# sourceMappingURL=helpers.js.map