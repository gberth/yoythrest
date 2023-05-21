"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AserAStream_1 = __importDefault(require("../../AserAStream"));
const AserAMessage_1 = __importDefault(require("../../AserAMessage"));
const AserAAsync_1 = require("../../AserAAsync");
const restify_1 = __importDefault(require("restify"));
class AserARestServer extends AserAStream_1.default {
    constructor(streamDef, outputStream, motherId) {
        super(streamDef, outputStream, motherId);
        this.server = restify_1.default.createServer({
            name: this.config.name,
            version: this.config.version
        });
        this.server.use(restify_1.default.plugins.acceptParser(this.server.acceptable));
        this.server.use(restify_1.default.plugins.queryParser());
        this.server.use(restify_1.default.plugins.bodyParser());
        this.handleRequest = handleRequest.bind(this);
        this.initiateServer = initiateServer.bind(this);
        this.asyncEvent = AserAAsync_1.asyncEvent.bind(this);
        this.asyncEventResponse = AserAAsync_1.asyncEventResponse.bind(this);
        this.port = process.env.PORT || process.env[this.config.port] || (isNaN(this.config.port) ? 8001 : this.config.port);
        this.initiateServer();
        const _this = this;
        this.on("data", function (msg) {
            try {
                // find request, and resolve
                _this.asyncEventResponse({ msg: msg });
            }
            catch (error) {
                _this.catchError({ msg: null, error: error, text: "Rest error" });
            }
        });
    }
}
function initiateServer() {
    // @ts-ignore
    const stream = this;
    stream.config.routes.forEach((routeDef) => {
        stream.log.info("Route ".concat(stream.config.baseroute.concat(routeDef.route)));
        stream.server[routeDef.action || "post"](stream.config.baseroute.concat(routeDef.route), function (req, res, next) {
            stream.handleRequest(req, res, next, routeDef.type = "", routeDef.raw, routeDef.json);
        });
    });
    stream.server.listen(stream.port, function () {
        stream.log.info(`${stream.server.name} listening at ${stream.server.url}`);
    });
}
function handleRequest(req, res, next, type, raw = false, json = false) {
    // @ts-ignore
    const stream = this;
    let returnData = [];
    const keepData = () => {
        return (keep) => {
            returnData.push(keep.message_payload());
        };
    };
    const asyncEventError = () => {
        return (e) => {
            res.send(new Error("Server Error " + e));
            next();
            stream.catchError({ msg: null, error: e, text: "AsyncEventError" });
        };
    };
    let msg = null;
    let payload = null;
    let msgtype = null;
    if (!raw && json) {
        msg = new AserAMessage_1.default(req.body);
        payload = msg.message_payload();
        msgtype = msg.type();
    }
    else {
        payload = stream.config.bodyonly ? Object.assign({}, req.body) : Object.assign({}, req);
        msgtype = type && payload[type] && typeof payload[type] === "string"
            ? payload[type]
            : type;
    }
    Promise.all([
        stream.asyncEvent({
            msg,
            type: msgtype,
            parameters: payload,
            receiveData: keepData(),
            errorFunction: asyncEventError()
        })
    ])
        .then(() => {
        res.send(returnData.length === 1 ? returnData[0] : returnData);
        next();
    })
        .catch(e => {
        stream.catchError({ msg: null, error: e, text: "Promise All error" });
    });
}
exports.default = AserARestServer;
//# sourceMappingURL=AserARestServer.js.map