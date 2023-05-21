// @flow
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AserAStream_1 = __importDefault(require("./AserAStream"));
class AserAAckMessage extends AserAStream_1.default {
    constructor(streamDef, outputStream, motherId) {
        super(streamDef, outputStream, motherId);
        this.handle_message = handle_message.bind(this);
        const _this = this;
        this.on("start", function (msg) {
            _this.log.info("starting " + _this.streamId);
            _this.startTimers();
        });
        this.initiated = true;
        this.on("data", function (msg) {
            _this.handle_message(msg);
        });
    }
}
function handle_message(msg) {
    // @ts-ignore
    const stream = this;
    if (stream.config.ack) {
        stream.ack({
            msg: msg,
            response: false
        });
    }
}
exports.default = AserAAckMessage;
//# sourceMappingURL=AserAAckMessage.js.map