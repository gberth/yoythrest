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
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncEventResponse = exports.asyncEvent = void 0;
var types_1 = require("./types");
var AserAHelpers_1 = require("./AserAHelpers");
var AserAHelpers_2 = require("./AserAHelpers");
var AserAHelpers_3 = require("./AserAHelpers");
var AserAHelpers_4 = require("./AserAHelpers");
var AserAHelpers_5 = require("./AserAHelpers");
// to be put to AseraHelper, bound to this stream
var asyncEvent = function (_a) {
    var msg = _a.msg, type = _a.type, parameters = _a.parameters, receiveData = _a.receiveData, ackData = _a.ackData, errorFunction = _a.errorFunction, timeout_ms = _a.timeout_ms;
    return __awaiter(this, void 0, void 0, function () {
        var stream, timeout, asyncId, timeoutFunc;
        return __generator(this, function (_b) {
            stream = this;
            asyncId = "";
            if (!stream.asyncEvents) {
                stream.asyncEvents = {};
            }
            timeoutFunc = function (timeoutId) {
                return function () {
                    var req = stream.asyncEvents[timeoutId];
                    if (req) {
                        clearInterval(req.timeout);
                        delete stream.asyncEvents[timeoutId];
                        try {
                            req.reject("Timeout");
                        }
                        catch (error) {
                            stream.log.error({
                                msg: "Async error handled by error function",
                                error: error
                            });
                        }
                    }
                    errorFunction({
                        msgId: msg ? msg.message_id() : null,
                        type: type,
                        parameters: parameters,
                        request: req,
                        reason: "timeout exceeded: ".concat(stream.config.timeout)
                    });
                };
            };
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    asyncId = AserAHelpers_1.aId();
                    var localMsg = stream.createMessage({
                        message_data: {
                            message_id: asyncId,
                            type: type
                        },
                        payload: parameters
                    });
                    var asyncMsg = msg ? msg.createMessageWithThisAsMother(localMsg) : localMsg;
                    if (!asyncMsg.message_data.previous_type &&
                        stream.config.ack_type) {
                        asyncMsg.message_data.previous_type =
                            stream.config.ack_type;
                    }
                    asyncMsg.setRequestData(stream, asyncId, types_1.RequestType.REQUEST);
                    timeout = setInterval(timeoutFunc(asyncId), timeout_ms ? timeout_ms : stream.config.timeout || 4000);
                    var request_data = {
                        status: "waiting",
                        parameters: parameters,
                        msg: msg ? msg : null,
                        timeout: timeout,
                        receiveData: receiveData === undefined ? null : receiveData,
                        ackData: ackData === undefined ? null : ackData,
                        errorFunction: errorFunction,
                        resolve: resolve,
                        reject: reject
                    };
                    stream.asyncEvents[asyncId] = request_data;
                    stream.outputStream.writeMessage(asyncMsg);
                })];
        });
    });
};
exports.asyncEvent = asyncEvent;
var asyncEventResponse = function (_a) {
    var msg = _a.msg;
    // @ts-ignore
    var stream = this;
    var findAsyncEvent = function (request_data) {
        if (request_data.request_id &&
            stream.asyncEvents &&
            stream.asyncEvents[request_data.request_id])
            return request_data.request_id;
        if (stream.asyncEvents && request_data.request_id_trace) {
            for (var i = 0; i < request_data.request_id_trace.length; i++) {
                if (stream.asyncEvents[request_data.request_id_trace[i]])
                    return request_data.request_id_trace[i];
            }
        }
        return null;
    };
    var request_id = findAsyncEvent(msg.message_data
        .request_data);
    if (request_id) {
        var deleteAndResolve = msg.message_data.request_data &&
            msg.message_data.request_data.requestType &&
            AserAHelpers_2.isAsync(msg.message_data.request_data.requestType);
        var asyncEvent_1 = stream.asyncEvents[request_id];
        if (deleteAndResolve) {
            delete stream.asyncEvents[request_id];
            clearInterval(asyncEvent_1.timeout);
        }
        try {
            if (asyncEvent_1.receiveData &&
                msg.message_data.request_data &&
                msg.message_data.request_data.requestType &&
                AserAHelpers_4.isResponse(msg.message_data.request_data.requestType)) {
                asyncEvent_1.receiveData(msg);
            }
            if (asyncEvent_1.ackData &&
                msg.message_data.request_data &&
                msg.message_data.request_data.requestType &&
                AserAHelpers_3.isAck(msg.message_data.request_data.requestType)) {
                asyncEvent_1.ackData(msg);
            }
            if (msg.message_data.request_data &&
                msg.message_data.request_data.requestType &&
                AserAHelpers_5.isError(msg.message_data.request_data.requestType)) {
                asyncEvent_1.errorFunction(msg);
                asyncEvent_1.reject();
            }
            if (deleteAndResolve) {
                asyncEvent_1.resolve();
            }
        }
        catch (e) {
            asyncEvent_1.reject(e);
        }
    }
};
exports.asyncEventResponse = asyncEventResponse;
