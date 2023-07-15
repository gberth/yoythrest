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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stream_1 = require("stream");
const Message_1 = __importDefault(require("./Message"));
const helpers_1 = require("./helpers");
const { unzip } = require('node:zlib');
const EventEmitter = require('events');
const connection_event = new EventEmitter();
function send_conn(wsaddress) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!stream.connections[wsaddress].connectionOpen) {
            console.log("wait for open", wsaddress);
            yield new Promise(resolve => connection_event.once(wsaddress, resolve));
            console.log("waited for open", stream.connections[wsaddress].connectionOpen);
        }
        if (stream.connections[wsaddress].connectionOpen) {
            stream.connections[wsaddress].send_msgs.forEach((msg) => {
                stream.connections[wsaddress].ws.send(msg.stringify());
            });
            stream.connections[wsaddress].send_msgs = [];
        }
        else {
            console.error("no connection", wsaddress);
        }
    });
}
const WebSocket = require("ws");
let stream = {
    connections: {},
    requests: {},
    timeoutstarted: false
};
let wss = null;
class FromWs extends stream_1.Transform {
    constructor(wsaddress) {
        super({
            readableObjectMode: true,
            writableObjectMode: true
        });
        const _this = this;
        // @ts-ignore    
        _this.wsaddress = wsaddress;
        _this.on("data", (msgin) => {
            let msg;
            try {
                msg = new Message_1.default(JSON.parse(msgin));
                let result;
                const reqid = msg.get_request_id();
                let res = stream.requests[reqid].res;
                if (stream.requests[reqid]) {
                    console.log("jada");
                    if (stream.requests[reqid].type === "ping") {
                        console.log("ping ok");
                    }
                    else {
                        // @ts-ignore    
                        if (msg.message_payload().photo) {
                            console.dir(msg.message_payload().camera_status);
                            const newbuffer = Buffer.from(msg.message_payload().photo, 'base64');
                            unzip(newbuffer, (err, buffer) => {
                                if (err) {
                                    console.error('An error occurred:', err);
                                    return;
                                }
                                const newjson = JSON.parse(buffer);
                                result = Buffer.from(newjson);
                                res.type("image/jpg");
                                res.send(result);
                            });
                        }
                        delete stream.requests[reqid];
                    }
                }
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}
class ToWs extends stream_1.Transform {
    constructor(wsaddress) {
        super({
            readableObjectMode: true,
            writableObjectMode: true
        });
        const _this = this;
        // @ts-ignore    
        _this.wsaddress = wsaddress;
        _this.on("data", (msgin) => {
            let msg;
            try {
                console.log(".................to server open=", stream.connections[wsaddress].connectionOpen, msgin);
                stream.connections[wsaddress].send_msgs.push(msgin);
                send_conn(wsaddress);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}
stream_1.Transform.prototype._transform = function (data, encoding, callback) {
    this.push(data);
    callback();
};
function initiateConnection(wsaddress) {
    console.log("initiate for " + wsaddress);
    try {
        wss = new WebSocket("wss:\\" + wsaddress);
        if (!stream.connections[wsaddress]) {
            stream.connections[wsaddress] = {
                connectionOpen: false,
                ws: wss,
                fromws: new FromWs(wsaddress),
                tows: new ToWs(wsaddress),
                send_msgs: []
            };
        }
        if (!stream.timeoutstarted) {
            stream.timeoutstarted = true;
            start_ping();
        }
        stream.connections[wsaddress].ws = wss;
        const connection = stream.connections[wsaddress];
        wss.on("open", () => {
            console.log("connection open " + wsaddress);
            connection.connectionOpen = true;
            connection_event.emit(wsaddress);
        });
        wss.on("message", (msgin) => {
            console.log("From server ----------", msgin.length, msgin.substring(0, 2000));
            connection.fromws.write(msgin);
        });
        wss.on("close", () => {
            console.error("connection closed");
            connection.connectionOpen = false;
            connection_event.emit(wsaddress);
            initiateConnection(wsaddress);
        });
        wss.on("error", (err) => {
            console.error("ws error");
            console.error(err);
            connection.connectionOpen = false;
            connection_event.emit(wsaddress);
            initiateConnection(wsaddress);
        });
        console.log("WS sucessfullyy established");
    }
    catch (error) {
        console.error("WS not established");
        initiateConnection(wsaddress);
        connection_event.emit(wsaddress);
        console.error(error);
    }
    return wss;
}
function start_ping() {
    setInterval(send_ping(), 30000);
}
function send_ping() {
    return () => {
        Object.keys(stream.connections).forEach((connection) => {
            const pingmsg = new Message_1.default({ message_data: { type: "ping", message_id: "generate", request_data: {} }, identity_data: {}, payload: {} });
            stream.requests[pingmsg.get_request_id()] = { type: "ping", req: null, res: null };
            stream.connections[connection].tows.write(pingmsg);
        });
    };
}
const app = express_1.default();
const port = process.env.PORT || 8080;
app.use(express_1.default.json());
app.get('/', (_req, res) => {
    return res.send('Express Typescript on Vercel');
});
app.get('/ping', (_req, res) => {
    return res.send('pong 🏓');
});
app.post('/yts', (_req, res) => {
    console.dir(_req.body);
    try {
        const msg = new Message_1.default(_req.body);
        msg.setRequestData("yoythrest", helpers_1.yId(), "send");
        stream.requests[msg.get_request_id()] = { type: msg.type(), req: _req, res: res };
        console.dir(msg);
    }
    catch (error) {
        console.log(error);
    }
});
app.get('/termux', (_req, res) => {
    console.dir(_req.query);
    if (!_req.query.ws) {
        return res.send('Missing attribute ws');
    }
    if (!_req.query.type) {
        return res.send('Missing attribute type');
    }
    if (!_req.query.server) {
        return res.send('Missing attribute server');
    }
    if (!stream.connections[_req.query.ws]) {
        initiateConnection(_req.query.ws);
    }
    let newmsg = new Message_1.default({
        message_data: {
            message_id: "generate",
            type: _req.query.type,
            request_data: {
                server: _req.query.server,
                stream_id: "yoythrest",
            }
        },
        identity_data: {
            identity: "g37cdcd0-ae54-11e7-b461-eb2f2858d486"
        },
        payload: Object.assign({}, _req.query)
    });
    newmsg.setRequestData("yoythrest", helpers_1.yId(), "send");
    stream.requests[newmsg.get_request_id()] = { type: _req.query.type, req: _req, res: res };
    stream.connections[_req.query.ws].tows.write(newmsg);
});
app.listen(port, () => {
    return console.log(`Server is listening on ${port}`);
});
//# sourceMappingURL=index.js.map