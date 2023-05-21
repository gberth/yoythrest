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
exports.asyncEventResponse = exports.asyncEvent = void 0;
const types_1 = require("./types");
const AserAHelpers_1 = require("./AserAHelpers");
const AserAHelpers_2 = require("./AserAHelpers");
const AserAHelpers_3 = require("./AserAHelpers");
const AserAHelpers_4 = require("./AserAHelpers");
const AserAHelpers_5 = require("./AserAHelpers");
// to be put to AseraHelper, bound to this stream
const asyncEvent = function ({ msg, type, parameters, receiveData, ackData, errorFunction, timeout_ms }) {
    return __awaiter(this, void 0, void 0, function* () {
        // @ts-ignore
        const stream = this;
        let timeout;
        let asyncId = "";
        if (!stream.asyncEvents) {
            stream.asyncEvents = {};
        }
        const timeoutFunc = (timeoutId) => {
            return () => {
                let req = stream.asyncEvents[timeoutId];
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
        return new Promise((resolve, reject) => {
            asyncId = AserAHelpers_1.aId();
            let localMsg = stream.createMessage({
                message_data: {
                    message_id: asyncId,
                    type: type
                },
                payload: parameters
            });
            let asyncMsg = msg ? msg.createMessageWithThisAsMother(localMsg) : localMsg;
            if (!asyncMsg.message_data.previous_type &&
                stream.config.ack_type) {
                asyncMsg.message_data.previous_type =
                    stream.config.ack_type;
            }
            asyncMsg.setRequestData(stream, asyncId, types_1.RequestType.REQUEST);
            timeout = setInterval(timeoutFunc(asyncId), timeout_ms ? timeout_ms : stream.config.timeout || 4000);
            let request_data = {
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
        });
    });
};
exports.asyncEvent = asyncEvent;
const asyncEventResponse = function ({ msg }) {
    // @ts-ignore
    const stream = this;
    const findAsyncEvent = (request_data) => {
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
    const request_id = findAsyncEvent(msg.message_data
        .request_data);
    if (request_id) {
        const deleteAndResolve = msg.message_data.request_data &&
            msg.message_data.request_data.requestType &&
            AserAHelpers_2.isAsync(msg.message_data.request_data.requestType);
        const asyncEvent = stream.asyncEvents[request_id];
        if (deleteAndResolve) {
            delete stream.asyncEvents[request_id];
            clearInterval(asyncEvent.timeout);
        }
        try {
            if (asyncEvent.receiveData &&
                msg.message_data.request_data &&
                msg.message_data.request_data.requestType &&
                AserAHelpers_4.isResponse(msg.message_data.request_data.requestType)) {
                asyncEvent.receiveData(msg);
            }
            if (asyncEvent.ackData &&
                msg.message_data.request_data &&
                msg.message_data.request_data.requestType &&
                AserAHelpers_3.isAck(msg.message_data.request_data.requestType)) {
                asyncEvent.ackData(msg);
            }
            if (msg.message_data.request_data &&
                msg.message_data.request_data.requestType &&
                AserAHelpers_5.isError(msg.message_data.request_data.requestType)) {
                asyncEvent.errorFunction(msg);
                asyncEvent.reject();
            }
            if (deleteAndResolve) {
                asyncEvent.resolve();
            }
        }
        catch (e) {
            asyncEvent.reject(e);
        }
    }
};
exports.asyncEventResponse = asyncEventResponse;
//# sourceMappingURL=AserAAsync.js.map