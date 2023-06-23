"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stream_1 = require("stream");
const Message_1 = __importDefault(require("./Message"));
const helpers_1 = require("./helpers");
const WebSocket = require("ws");
let stream = {
    connectionOpen: false,
    requests: {}
};
let wss = null;
class FromWs extends stream_1.Transform {
    constructor() {
        super({
            readableObjectMode: true,
            writableObjectMode: true
        });
        const _this = this;
        _this.on("data", (msgin) => {
            let msg;
            try {
                msg = new Message_1.default(JSON.parse(msgin));
                const reqid = msg.get_request_id();
                if (stream.requests[reqid]) {
                    console.log("jada");
                    stream.requests[reqid].res.send(msgin);
                }
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}
class ToWs extends stream_1.Transform {
    constructor() {
        super({
            readableObjectMode: true,
            writableObjectMode: true
        });
        const _this = this;
        _this.on("data", (msgin) => {
            let msg;
            if (!stream.connectionOpen) {
                initiateConnection();
            }
            try {
                wss.send(msgin.stringify());
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
let fromws = new FromWs();
let tows = new ToWs();
function initiateConnection() {
    try {
        wss = new WebSocket(process.env.WSADDRESS);
        wss.on("open", () => {
            stream.connectionOpen = true;
        });
        wss.on("message", (msgin) => {
            console.log("From server ----------", msgin);
            fromws.write(msgin);
        });
        wss.on("close", () => {
            console.error("connection closed");
            stream.connectionOpen = false;
            initiateConnection();
        });
        wss.on("error", (err) => {
            console.error("ws error");
            console.error(err);
            stream.connectionOpen = false;
            initiateConnection();
        });
        console.log("WS sucessfullyy established");
    }
    catch (error) {
        stream.connectionOpen = false;
        console.error("WS not established");
        console.error(error);
    }
}
const app = express_1.default();
const port = process.env.PORT || 8080;
initiateConnection();
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
        stream.requests[msg.get_request_id()] = { req: _req, res: res };
        console.dir(msg);
        tows.write(msg);
    }
    catch (error) {
        console.log(error);
    }
});
app.listen(port, () => {
    return console.log(`Server is listening on ${port}`);
});
//# sourceMappingURL=index.js.map