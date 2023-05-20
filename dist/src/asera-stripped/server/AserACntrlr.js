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
var AserADispatcher_1 = __importDefault(require("./AserADispatcher"));
var AserAMessage_1 = __importDefault(require("./AserAMessage"));
var AserACntrlr = /** @class */ (function (_super) {
    __extends(AserACntrlr, _super);
    function AserACntrlr(streamDef, outputStream, motherId) {
        var _this = _super.call(this, streamDef, outputStream, motherId) || this;
        _this.log.info("All streams belonging to " + streamDef.streamId + " initiated");
        _this.initiated = true;
        process.on("SIGINT", function () {
            _this.shutDownAll(_this);
        });
        process.on("SIGTERM", function () {
            _this.shutDownAll(_this);
        });
        _this.emit("createDocumentation", new AserAMessage_1.default({
            message_data: {
                message_id: "generate",
                type: "asera.operator.createDocumentation",
                request_data: {}
            },
            identity_data: {
                identity: streamDef.streamConfig.systemIdentifier
            },
            payload: {}
        }));
        return _this;
    }
    return AserACntrlr;
}(AserADispatcher_1.default));
exports.default = AserACntrlr;
