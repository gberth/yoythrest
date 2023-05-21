"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AserAStream_1 = __importDefault(require("../../AserAStream"));
const AserAMessage_1 = __importDefault(require("../../AserAMessage"));
const AserAHelpers_1 = require("../../AserAHelpers");
const WebSocket = require("ws");
const WebSocketServer = WebSocket.Server;
class AserAWebSocketServerLight extends AserAStream_1.default {
    constructor(streamDef, outputStream, motherId) {
        super(streamDef, outputStream, motherId);
        this.handle_message = handle_message.bind(this);
        this.connect = connect.bind(this);
        let port = process.env.PORT || process.env[this.config.port] || this.config.port;
        this.wss = new WebSocketServer({
            port: port
        });
        this.raw = this.config.raw || false;
        this.raw_type = this.config.raw_type || undefined;
        this.payload_only = this.config.payload_only || false;
        this.log.info(`listening on port: ${port}`);
        this.initialAserAData = null;
        this.connections = {};
        this.wsconnection = {};
        this.connectionsData = {};
        this.connectionct = 0;
        this.maxconnections = 0;
        this.requests = {};
        const _this = this;
        this.wss.broadcast = broadcast.bind(this);
        this.wss.on("connection", this.connect);
        this.on("data", function (msg) {
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
        this.initiated = true;
        this.setStarted();
    }
}
function connect(ws) {
    // @ts-ignore
    const stream = this;
    const connId = AserAHelpers_1.aId();
    stream.connections[ws] = connId;
    stream.wsconnection[connId] = ws;
    stream.log.info(`connected websockets: ${connId}`);
    stream.connectionct += 1;
    stream.maxconnections = Math.max(stream.connectionct, stream.maxconnections);
    ws.on("message", function incoming(msg) {
        let newmsg, reqdata;
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
            reqdata = Object.assign(Object.assign({}, newmsg.get_request_data()), { ws: ws });
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
    const stream = this;
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
    const stream = this;
    // handle ack
    if (msg.type() === 'ACK') {
        // @ts-ignore
        let reqdata = stream.requests[msg.get_request_data().request_id];
        // write back original request data
        msg.message_data.request_data = Object.assign({}, reqdata);
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
//# sourceMappingURL=AserAWebSocketServerLight.js.map