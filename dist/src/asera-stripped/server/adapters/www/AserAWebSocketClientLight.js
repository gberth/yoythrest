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
var AserAStream_1 = __importDefault(require("../../AserAStream"));
var AserAMessage_1 = __importDefault(require("../../AserAMessage"));
var WebSocket = require("ws");
var WebSocketServer = WebSocket.Server;
var AserAWebSocketClientLight = /** @class */ (function (_super) {
    __extends(AserAWebSocketClientLight, _super);
    function AserAWebSocketClientLight(streamDef, outputStream, motherId) {
        var _this_1 = _super.call(this, streamDef, outputStream, motherId) || this;
        _this_1.handleWsMessage = handleWsMessage.bind(_this_1);
        _this_1.sendbackMessage = sendbackMessage.bind(_this_1);
        _this_1.sendPingOrTryLogin = sendPingOrTryLogin.bind(_this_1);
        _this_1.initiateConnection = initiateConnection.bind(_this_1);
        _this_1.connectionOpen = false;
        _this_1.requests = {};
        if (_this_1.config.pingmessage) {
            if (!_this_1.config.pingmessage.message_data.creator) {
                _this_1.config.pingmessage.message_data.creator = _this_1.streamIdentifier;
            }
            _this_1.pingmsg = JSON.stringify(_this_1.config.pingmessage);
        }
        var _this = _this_1;
        _this_1.sendPingOrTryLogin();
        _this_1.on("data", function (msg) {
            try {
                _this.sendbackMessage(msg);
            }
            catch (error) {
                _this.connectionOpen = false;
            }
        });
        _this_1.on("ping", function () {
            _this.sendPingOrTryLogin();
        });
        _this_1.initiated = true;
        _this_1.setStarted();
        return _this_1;
    }
    return AserAWebSocketClientLight;
}(AserAStream_1.default));
function initiateConnection() {
    // @ts-ignore
    var stream = this;
    try {
        stream.wss = new WebSocket(stream.config.wsadress);
        stream.wss.on("open", function () {
            stream.connectionOpen = true;
            if (stream.config.openmessage) {
                stream.wss.send(JSON.stringify(stream.config.openmessage));
            }
        });
        stream.wss.on("message", function (msgin) {
            var msg;
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
        stream.wss.on("close", function () {
            stream.log.info("connection closed");
            stream.connectionOpen = false;
        });
        stream.wss.on("error", function (err) {
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
    var stream = this;
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
    var stream = this;
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
    var stream = this;
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
