// @flow
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var AserAStream_1 = __importDefault(require("./AserAStream"));
var AserACreateNewMessage = /** @class */ (function (_super) {
    __extends(AserACreateNewMessage, _super);
    function AserACreateNewMessage(streamDef, outputStream, motherId) {
        var _this_1 = _super.call(this, streamDef, outputStream, motherId) || this;
        _this_1.handle_message = handle_message.bind(_this_1);
        var _this = _this_1;
        _this_1.on("start", function (msg) {
            _this.log.info("starting " + _this.streamId);
            _this.startTimers();
        });
        _this_1.initiated = true;
        _this_1.on("data", function (msg) {
            _this.handle_message(msg);
        });
        return _this_1;
    }
    return AserACreateNewMessage;
}(AserAStream_1.default));
function handle_message(msg) {
    // @ts-ignore
    var stream = this;
    stream.outputStream.writeMessage(msg.createMessageWithThisAsMother(stream.createMessage({
        message_data: {
            type: stream.getMsgTypeStateValue(msg.type(), "changeMessageType")
        },
        payload: msg.message_payload()
    })));
}
exports.default = AserACreateNewMessage;
