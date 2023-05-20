"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.yCatch = exports.keepForRetry = exports.aItem = exports.ts = exports.listDirectory = exports.returnFileContent = exports.delay = exports.isAsync = exports.isError = exports.isResponse = exports.isAck = exports.ack = exports.createAck = exports.aseraLogger = exports.aId = exports.readCertificates = exports.awaitcondition = exports.setLogOveride = void 0;
var AserAMessage_1 = __importDefault(require("./AserAMessage"));
var AserAStream_1 = __importDefault(require("./AserAStream"));
var types_1 = require("./types");
var merge_1 = __importDefault(require("merge"));
var moment_1 = __importDefault(require("moment"));
var uuid_1 = __importDefault(require("uuid"));
var readline_1 = __importDefault(require("readline"));
var fs_1 = __importDefault(require("fs"));
var q_1 = __importDefault(require("q"));
var mylog;
var helperConsoleLog = function (logtxt) {
    if (mylog) {
        mylog.info(logtxt);
    }
    else {
        console.log(logtxt);
    }
};
var setLogOveride = function (logDirect) {
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
var awaitcondition = function (condtxt, cond, loop, waitTime, quiet) {
    if (loop === void 0) { loop = 10; }
    if (waitTime === void 0) { waitTime = 1000; }
    var index = 1;
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
var timestamp = function () {
    moment_1.default.defaultFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ";
    return moment_1.default()
        .format()
        .trim();
};
function delayMs(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
function keepMessageForRetry(msg) {
    // @ts-ignore
    var stream = this instanceof AserAStream_1.default ? this : null;
    stream.outputStream.writeMessage(msg.createMessageWithThisAsMother(stream.createMessage({
        message_data: {
            type: stream.config.keepForRetryMessageType
        },
        payload: msg
    })));
}
function waitForFileContent(file, errorf) {
    return __awaiter(this, void 0, void 0, function () {
        var promise, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promise = new Promise(function (resolve, reject) {
                        fs_1.default.readFile(file, function (err, data) {
                            if (err) {
                                return reject(err);
                            }
                            resolve(data.toString());
                        });
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, promise];
                case 2:
                    data = _a.sent();
                    helperConsoleLog(data);
                    return [2 /*return*/, data.toString()];
                case 3:
                    error_1 = _a.sent();
                    errorf(error_1);
                    helperConsoleLog("Wait for file content error");
                    helperConsoleLog(error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function waitForListDirectory(searchfor, file, errf) {
    return __awaiter(this, void 0, void 0, function () {
        var promise, list, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promise = new Promise(function (resolve, reject) {
                        fs_1.default.readdir(searchfor, function (err, filenames) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                var ret_1 = [];
                                filenames.forEach(function (filename) {
                                    if (filename.startsWith(file)) {
                                        ret_1.push(filename);
                                    }
                                });
                                resolve(ret_1);
                            }
                        });
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, promise];
                case 2:
                    list = _a.sent();
                    return [2 /*return*/, list];
                case 3:
                    error_2 = _a.sent();
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
var readCertificates = function (ssl) {
    var retSsl = Object.assign({}, ssl);
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
var aId = function () {
    return uuid_1.default.v1().toString();
};
exports.aId = aId;
var log = function (stream, logItem, logLevel) {
    if (logLevel === void 0) { logLevel = types_1.LOGLEVELS.info; }
    if (stream && logLevel < stream.getLog()) {
        return;
    }
    var logtxt = (stream ? stream.streamIdentifier : "nostream") + " : ";
    if (logItem.msg) {
        logtxt += logItem.msg;
        delete logItem.msg;
        logtxt += JSON.stringify(logItem).substr(0, 1000);
    }
    else {
        logtxt +=
            " " + (typeof logItem === "string" || logItem instanceof String)
                ? logItem
                : "";
    }
    //TODO if less than info - log stream state maybe
    if (mylog) {
        switch (logLevel) {
            case types_1.LOGLEVELS.error:
                mylog.error(logtxt);
                break;
            case types_1.LOGLEVELS.warn:
                mylog.warn(logtxt);
                break;
            case types_1.LOGLEVELS.info:
                mylog.info(logtxt);
                break;
            case types_1.LOGLEVELS.debug:
                mylog.debug(logtxt);
                break;
            case types_1.LOGLEVELS.trace:
                mylog.trace(logtxt);
                break;
            default:
                mylog.error("Wrong message type for logging" + JSON.stringify(logtxt));
                break;
        }
        return;
    }
    var logObject = {
        log_ts: exports.ts(),
        stream: stream ? stream.streamIdentifier : "nostream",
        log: logItem,
        logLevel: logLevel
    };
    if (stream && stream.outputStream && stream.streamId !== "aseraLog") {
        stream.outputStream.writeMessage(stream.createMessage({
            message_data: {
                type: "asera.log"
            },
            payload: logObject
        }));
    }
    else {
        console.log(logtxt);
        // nothing todo - log event also logs - nop
    }
};
exports.aseraLogger = {
    info: function (logItem) {
        log(this, logItem);
    },
    warn: function (logItem) {
        log(this, logItem, types_1.LOGLEVELS.warn);
    },
    error: function (logItem) {
        log(this, logItem, types_1.LOGLEVELS.error);
    },
    trace: function (logItem) {
        log(this, logItem, types_1.LOGLEVELS.trace);
    },
    debug: function (logItem) {
        log(this, logItem, types_1.LOGLEVELS.debug);
    }
};
var createAck = function (_a) {
    var msg = _a.msg, msg_type = _a.msg_type, response = _a.response, payload = _a.payload, _b = _a.error, error = _b === void 0 ? false : _b;
    // @ts-ignore
    // deprectaed
    var stream = this instanceof AserAStream_1.default ? this : null;
    if (!stream)
        return null;
    var newmsgt;
    if (msg_type) {
        newmsgt = msg_type;
    }
    else {
        newmsgt = msg.message_data.previous_type
            ? msg.message_data.previous_type.concat(".ack")
            : stream.config.ack && stream.config.ack.type
                ? stream.config.ack.type
                : "unknown";
    }
    var ack = msg.createMessageWithThisAsMother(stream.createMessage({
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
var ack = function (_a) {
    var msg = _a.msg, response = _a.response, _b = _a.error, error = _b === void 0 ? false : _b;
    // @ts-ignore
    var stream = this instanceof AserAStream_1.default ? this : null;
    if (!stream)
        return null;
    var newmsg = msg.createMessageWithThisAsMother(stream.createMessage({
        message_data: {
            type: types_1.RequestType.ACK
        },
        payload: response || {}
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
var isAck = function (type) {
    return (typeof type !== "undefined" &&
        (type === types_1.RequestType.RESPONSE_WITH_ACK ||
            type === types_1.RequestType.ACK ||
            type === types_1.RequestType.ERROR));
};
exports.isAck = isAck;
var isResponse = function (type) {
    return (typeof type !== "undefined" &&
        (type === types_1.RequestType.RESPONSE_WITH_ACK || type === types_1.RequestType.RESPONSE));
};
exports.isResponse = isResponse;
var isError = function (type) {
    return typeof type !== "undefined" && type === types_1.RequestType.ERROR;
};
exports.isError = isError;
var isAsync = function (type) {
    return (typeof type !== "undefined" &&
        (type === types_1.RequestType.ERROR ||
            type === types_1.RequestType.RESPONSE_WITH_ACK ||
            type === types_1.RequestType.RESPONSE ||
            type === types_1.RequestType.ACK));
};
exports.isAsync = isAsync;
var delay = function (ms) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, delayMs(ms)];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.delay = delay;
var returnFileContent = function (file, errf) { return __awaiter(void 0, void 0, void 0, function () {
    var xx;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, waitForFileContent(file, errf)];
            case 1:
                xx = _a.sent();
                return [2 /*return*/, xx];
        }
    });
}); };
exports.returnFileContent = returnFileContent;
var listDirectory = function (directory, file, errf) { return __awaiter(void 0, void 0, void 0, function () {
    var xx;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, waitForListDirectory(directory, file, errf)];
            case 1:
                xx = _a.sent();
                return [2 /*return*/, xx];
        }
    });
}); };
exports.listDirectory = listDirectory;
var ts = function () {
    return timestamp();
};
exports.ts = ts;
var aItem = function (_a) {
    var itemType = _a.itemType, id = _a.id, payload = _a.payload, version = _a.version, owner = _a.owner;
    var item = {
        aItem: {
            aMetaData: {
                aId: id || uuid_1.default.v1().toString(),
                aType: itemType,
                aOwner: owner || ""
            },
            aContent: __assign({}, payload)
        }
    };
    if (version) {
        // @ts-ignore
        item.aItem.aMetaData.aVersion = version;
    }
    return item;
};
exports.aItem = aItem;
var keepForRetry = function (msg) {
    // create a message with msg as payload, with type= this.config.keepForRetryMessageType
    // @ts-ignore
    var stream = this instanceof AserAStream_1.default ? this : null;
    if (stream && stream.config.keepForRetryMessageType) {
        keepMessageForRetry.bind(stream)(msg);
    }
};
exports.keepForRetry = keepForRetry;
var yCatch = function (errorParm) {
    // @ts-ignore
    var stream = this instanceof AserAStream_1.default ? this : null;
    helperConsoleLog("error occured " + (stream ? stream.streamIdentifier : "nostream"));
    if (stream && stream.config && stream.config.console) {
        var readLine = function (lineHandler, resolve, reject) {
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
        var rl_1 = readLine.bind(this);
        var evaluateError = function (evaluate) {
            helperConsoleLog("Evaluate result: " + evaluate + " = " + global.eval(evaluate));
        };
        // @ts-ignore
        var evaluateErr_1 = evaluateError.bind(this);
        new Promise(function (resolve, reject) {
            rl_1(evaluateErr_1, resolve, reject);
        }).then(function () {
            helperConsoleLog("Good bye");
            process.exit(12);
        });
    }
    if ((stream && stream.config.exitOnError) ||
        (errorParm.msg &&
            errorParm.msg instanceof AserAMessage_1.default &&
            errorParm.msg.message_data.type === "asera.critical.error")) {
        helperConsoleLog("Abort as last resort");
        process.exit(12);
    }
    //if (errorParm.msg && JSON.stringify(errorParm.msg.payload).length > 1000) {
    //errorParm.msg.payload = JSON.stringify(errorParm.msg.payload).substr(0,1000)
    //}
    var payload = {
        error: errorParm.error,
        stack: errorParm.error.stack,
        msg: errorParm.msg || null,
        extra: errorParm.rest || null,
        loglevel: types_1.LOGLEVELS.error
    };
    if (stream && stream.outputStream && !mylog) {
        stream ? (stream.config.inError = true) : helperConsoleLog("nostream");
        var newmsg = stream.createMessage({
            message_data: {
                type: "asera.error"
            },
            payload: payload
        });
        stream.outputStream.writeMessage(errorParm.msg && errorParm.msg instanceof AserAMessage_1.default
            ? errorParm.msg.createMessageWithThisAsMother(newmsg)
            : newmsg);
        if (stream && stream.config.onErrorMessageType) {
            var newmsg_1 = stream.createMessage({
                message_data: {
                    type: stream.config.onErrorMessageType
                },
                payload: payload
            });
            stream.outputStream.writeMessage(errorParm.msg && errorParm.msg instanceof AserAMessage_1.default
                ? errorParm.msg.createMessageWithThisAsMother(newmsg_1)
                : newmsg_1);
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
