"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.message = void 0;
const merge_1 = __importDefault(require("merge"));
const underscore_1 = __importDefault(require("underscore"));
/* eslint-disable no-use-before-define */
const AserAHelpers_1 = require("./AserAHelpers");
const AserAHelpers_2 = require("./AserAHelpers");
class AserAMessage {
    constructor(message, overrideMessageType) {
        // a message must contain message_data
        if (!message.message_data) {
            console.log(message);
            throw new Error("Asera message not valid" + message.toString());
        }
        this.message_data = Object.assign({}, message.message_data);
        this.identity_data = Object.assign({}, message.identity_data);
        this.message_data.created = this.message_data.created || AserAHelpers_2.ts(); // clone ?
        this.payload = message.payload;
        if (this.message_data.message_id !== "generate" && overrideMessageType) {
            this.message_data.type = overrideMessageType;
        }
        if (!this.message_data.message_id ||
            this.message_data.message_id === "generate") {
            this.message_data.message_id = AserAHelpers_1.aId();
        }
        if (!this.message_data.request_data) {
            // @ts-ignore
            this.message_data.request_data = {};
        }
    }
    identity() {
        return this.identity_data.identity || null;
    }
    owner() {
        return this.identity_data.aOwner || null;
    }
    message_id() {
        return this.message_data.message_id || null;
    }
    type() {
        return this.message_data.type || this.message_data.message_type;
    }
    message_payload() {
        return this.payload;
    }
    get_request_data() {
        return this.message_data.request_data || null;
    }
    get_request_id() {
        return this.message_data.request_data ? (this.message_data.request_data.request_id || null) : null;
    }
    get_request_stream() {
        if (this.message_data.request_data && this.message_data.request_data.stream_id) {
            return this.message_data.request_data.stream_id;
        }
        else {
            return 'no_request_stream_id';
        }
    }
    message_payloadElement(element) {
        if (underscore_1.default.isObject(this.payload)) {
            return underscore_1.default.propertyOf(this.payload)(element);
        }
        return null;
    }
    stringyfy() {
        return JSON.stringify({
            message_data: this.message_data,
            identity_data: this.identity_data,
            payload: this.payload
        });
    }
    // copy message data from this (mother) to input message
    createMessageWithThisAsMother(msg, newMsg = false) {
        msg.message_data.original_message_id = this.message_data.original_message_id
            ? this.message_data.original_message_id
            : this.message_data.message_id;
        msg.message_data.original_type = this.message_data
            .original_type
            ? this.message_data.original_type
            : this.message_data.type;
        msg.message_data.previous_message_id = this.message_data.message_id;
        msg.message_data.previous_type = this.message_data.type;
        if (!newMsg) {
            msg.message_data.request_data = this.message_data.request_data
                ? merge_1.default.recursive({}, this.message_data.request_data)
                : {};
        }
        msg.identity_data = this.identity_data;
        return msg;
    }
    keepOldRequestIdAndSetNew(request_id, requestType) {
        if (this.message_data.request_data) {
            if (this.message_data.request_data.request_id &&
                !this.message_data.request_data.request_id_trace) {
                this.message_data.request_data.request_id_trace = [];
            }
            if (this.message_data.request_data.request_id_trace &&
                this.message_data.request_data.request_id) {
                this.message_data.request_data.request_id_trace.push(this.message_data.request_data.request_id);
            }
        }
        else
            // @ts-ignore
            this.message_data.request_data = {};
        this.message_data.request_data.request_id = request_id;
        this.message_data.request_data.requestType = requestType;
    }
    setRequestData(stream, request_id, requestType) {
        if (!this.message_data.request_data) {
            // @ts-ignore
            this.message_data.request_data = {};
        }
        this.message_data.request_data.stream_id = stream.streamId;
        this.message_data.request_data.request_id = request_id;
        this.message_data.request_data.requestType = requestType;
    }
}
exports.default = AserAMessage;
function message(msg_data) {
    return function ({ message_data, payload }) {
        return new AserAMessage({
            message_data: merge_1.default.recursive(true, message_data, msg_data),
            identity_data: {},
            payload: payload
        });
    };
}
exports.message = message;
//# sourceMappingURL=AserAMessage.js.map