// @flow
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AserADispatcher_1 = __importDefault(require("./AserADispatcher"));
const AserAMessage_1 = __importDefault(require("./AserAMessage"));
class AserACntrlr extends AserADispatcher_1.default {
    constructor(streamDef, outputStream, motherId) {
        super(streamDef, outputStream, motherId);
        this.log.info("All streams belonging to " + streamDef.streamId + " initiated");
        this.initiated = true;
        process.on("SIGINT", () => {
            this.shutDownAll(this);
        });
        process.on("SIGTERM", () => {
            this.shutDownAll(this);
        });
        this.emit("createDocumentation", new AserAMessage_1.default({
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
    }
}
exports.default = AserACntrlr;
//# sourceMappingURL=AserACntrlr.js.map