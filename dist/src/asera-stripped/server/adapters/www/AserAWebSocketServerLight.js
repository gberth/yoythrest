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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var AserAStream_1 = __importDefault(require("../../AserAStream"));
var AserAMessage_1 = __importDefault(require("../../AserAMessage"));
var AserAHelpers_1 = require("../../AserAHelpers");
var WebSocket = require("ws");
var WebSocketServer = WebSocket.Server;
var AserAWebSocketServerLight = /** @class */ (function (_super) {
    __extends(AserAWebSocketServerLight, _super);
    function AserAWebSocketServerLight(streamDef, outputStream, motherId) {
        var _this_1 = _super.call(this, streamDef, outputStream, motherId) || this;
        _this_1.handle_message = handle_message.bind(_this_1);
        _this_1.connect = connect.bind(_this_1);
        var port = process.env.PORT || process.env[_this_1.config.port] || _this_1.config.port;
        _this_1.wss = new WebSocketServer({
            port: port
        });
        _this_1.raw = _this_1.config.raw || false;
        _this_1.raw_type = _this_1.config.raw_type || undefined;
        _this_1.payload_only = _this_1.config.payload_only || false;
        _this_1.log.info("listening on port: " + port);
        _this_1.initialAserAData = null;
        _this_1.connections = {};
        _this_1.wsconnection = {};
        _this_1.connectionsData = {};
        _this_1.connectionct = 0;
        _this_1.maxconnections = 0;
        _this_1.requests = {};
        var _this = _this_1;
        _this_1.wss.broadcast = broadcast.bind(_this_1);
        _this_1.wss.on("connection", _this_1.connect);
        _this_1.on("data", function (msg) {
            try {
                _this.handle_message(msg);
            }
            catch (error) {
                _this.catchError({
                    error: error,
                    msg: msg
                });
            }
        });
        _this_1.initiated = true;
        _this_1.setStarted();
        return _this_1;
    }
    return AserAWebSocketServerLight;
}(AserAStream_1.default));
function connect(ws) {
    // @ts-ignore
    var stream = this;
    var connId = AserAHelpers_1.aId();
    stream.connections[ws] = connId;
    stream.wsconnection[connId] = ws;
    stream.log.info("connected websockets: " + connId);
    stream.connectionct += 1;
    stream.maxconnections = Math.max(stream.connectionct, stream.maxconnections);
    ws.on("message", function incoming(msg) {
        var newmsg, reqdata;
        if (stream.raw) {
            newmsg = new AserAMessage_1.default({
                message_data: {
                    type: stream.raw_type,
                    creator: stream.stream_id,
                    request_data: { conn_id: connId }
                },
                identity_data: {},
                payload: msg
            });
        }
        else {
            newmsg = new AserAMessage_1.default(JSON.parse(msg));
            reqdata = __assign(__assign({}, newmsg.get_request_data()), { ws: ws });
            newmsg.message_data.request_data.stream_id = stream.stream_id;
            if (!newmsg.message_data.request_data.request_id) {
                newmsg.message_data.request_data.request_id = newmsg.message_id();
            }
            // @ts-ignore
            stream.requests[newmsg.message_data.request_data.request_id] = reqdata;
        }
        stream.outputStream.writeMessage(newmsg);
    });
    ws.on("close", function incoming(code, reason) {
        // create system message, remove if last connection for user
        stream.log.info("ws closes");
    });
}
function broadcast(data) {
    // @ts-ignore
    var stream = this;
    stream.wss.clients.forEach(function each(client) {
        /* global WebSocket */
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}
function handle_message(msg) {
    var _a, _b, _c;
    // @ts-ignore
    var stream = this;
    // handle ack
    if (msg.type() === 'ACK') {
        // @ts-ignore
        var reqdata = stream.requests[msg.get_request_data().request_id];
        // write back original request data
        msg.message_data.request_data = __assign({}, reqdata);
        if (reqdata.ws.readyState === WebSocket.OPEN) {
            reqdata.ws.send(JSON.stringify(msg));
        }
    }
    else if ((_a = msg.get_request_data()) === null || _a === void 0 ? void 0 : _a.conn_id) {
        if (stream.raw) {
            stream.wsconnection[(_b = msg.get_request_data()) === null || _b === void 0 ? void 0 : _b.conn_id].send(JSON.stringify(msg.message_payload()));
        }
        else {
            stream.wsconnection[(_c = msg.get_request_data()) === null || _c === void 0 ? void 0 : _c.conn_id].send(JSON.stringify(msg));
        }
    }
    else if (msg.type() === 'BROADCAST') {
        stream.wss.broadcast(msg);
    }
}
exports.default = AserAWebSocketServerLight;
