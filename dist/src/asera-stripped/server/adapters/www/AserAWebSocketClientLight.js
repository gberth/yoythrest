"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AserAStream_1 = __importDefault(require("../../AserAStream"));
const AserAMessage_1 = __importDefault(require("../../AserAMessage"));
const WebSocket = require("ws");
const WebSocketServer = WebSocket.Server;
class AserAWebSocketClientLight extends AserAStream_1.default {
    constructor(streamDef, outputStream, motherId) {
        super(streamDef, outputStream, motherId);
        this.handleWsMessage = handleWsMessage.bind(this);
        this.sendbackMessage = sendbackMessage.bind(this);
        this.sendPingOrTryLogin = sendPingOrTryLogin.bind(this);
        this.initiateConnection = initiateConnection.bind(this);
        this.connectionOpen = false;
        this.requests = {};
        if (this.config.pingmessage) {
            if (!this.config.pingmessage.message_data.creator) {
                this.config.pingmessage.message_data.creator = this.streamIdentifier;
            }
            this.pingmsg = JSON.stringify(this.config.pingmessage);
        }
        const _this = this;
        this.sendPingOrTryLogin();
        this.on("data", function (msg) {
            try {
                _this.sendbackMessage(msg);
            }
            catch (error) {
                _this.connectionOpen = false;
            }
        });
        this.on("ping", function () {
            _this.sendPingOrTryLogin();
        });
        this.initiated = true;
        this.setStarted();
    }
}
function initiateConnection() {
    // @ts-ignore
    const stream = this;
    try {
        stream.wss = new WebSocket(stream.config.wsadress);
        stream.wss.on("open", () => {
            stream.connectionOpen = true;
            if (stream.config.openmessage) {
                stream.wss.send(JSON.stringify(stream.config.openmessage));
            }
        });
        stream.wss.on("message", (msgin) => {
            let msg;
            try {
                msg = new AserAMessage_1.default(JSON.parse(msgin));
                stream.handleWsMessage(msg);
            }
            catch (error) {
                stream.catchError({
                    error: error,
                    msg: msg,
                });
            }
        });
        stream.wss.on("close", () => {
            stream.log.info("connection closed");
            stream.connectionOpen = false;
        });
        stream.wss.on("error", (err) => {
            stream.log.error("ws error");
            stream.log.error(err);
            stream.connectionOpen = false;
        });
        stream.log.info("WS sucessfullyy established");
    }
    catch (error) {
        stream.connectionOpen = false;
        stream.log.error("WS not established");
        stream.log.error(error);
    }
}
function sendPingOrTryLogin() {
    // @ts-ignore
    const stream = this;
    stream.log.info("ping - open? " + stream.connectionOpen.toString());
    if (stream.connectionOpen) {
        if (stream.pingmsg) {
            try {
                stream.log.info("pinger");
                stream.wss.send(stream.pingmsg);
            }
            catch (error) {
                stream.log.info("ping message failed");
                stream.connectionOpen = false;
            }
        }
    }
    else {
        try {
            stream.initiateConnection();
        }
        catch (error) {
            stream.connectionOpen = false;
        }
    }
}
function handleWsMessage(msg) {
    var _a;
    // @ts-ignore
    const stream = this;
    console.log('receive');
    console.dir(msg);
    try {
        // @ts-ignore
        if (msg.get_request_id() && stream.requests[msg.get_request_id()]) {
            // @ts-ignore
            msg.message_data.request_data.stream_id = stream.requests[msg.get_request_id()];
            // @ts-ignore
            delete stream.requests[msg.get_request_id()];
            // @ts-ignore
            (_a = msg.get_request_data()) === null || _a === void 0 ? void 0 : _a.requestType = 'RESPONSE';
        }
        else {
            msg.message_data.request_data.stream_id = stream.streamId;
        }
        stream.outputStream.writeMessage(msg);
    }
    catch (error) {
        stream.log.error("WS Client error write");
        stream.log.error(error);
    }
}
function sendbackMessage(msg) {
    var _a;
    // @ts-ignore
    const stream = this;
    console.log('send');
    console.dir(msg);
    try {
        if (!stream.connectionOpen) {
            stream.initiateConnection();
        }
        if (stream.connectionOpen) {
            if (msg.type() !== 'ACK' && msg.get_request_data() && msg.get_request_id()) {
                // keep stream_id for request
                // @ts-ignore
                stream.requests[msg.get_request_id()] = (_a = msg.get_request_data()) === null || _a === void 0 ? void 0 : _a.stream_id;
            }
            stream.wss.send(JSON.stringify(msg));
        }
    }
    catch (error) {
        stream.log.error("Ws Client error sendback");
        stream.log.error(error);
    }
}
exports.default = AserAWebSocketClientLight;
//# sourceMappingURL=AserAWebSocketClientLight.js.map