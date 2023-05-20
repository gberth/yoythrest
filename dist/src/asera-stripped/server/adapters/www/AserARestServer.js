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
var AserAAsync_1 = require("../../AserAAsync");
var restify_1 = __importDefault(require("restify"));
var AserARestServer = /** @class */ (function (_super) {
    __extends(AserARestServer, _super);
    function AserARestServer(streamDef, outputStream, motherId) {
        var _this_1 = _super.call(this, streamDef, outputStream, motherId) || this;
        _this_1.server = restify_1.default.createServer({
            name: _this_1.config.name,
            version: _this_1.config.version
        });
        _this_1.server.use(restify_1.default.plugins.acceptParser(_this_1.server.acceptable));
        _this_1.server.use(restify_1.default.plugins.queryParser());
        _this_1.server.use(restify_1.default.plugins.bodyParser());
        _this_1.handleRequest = handleRequest.bind(_this_1);
        _this_1.initiateServer = initiateServer.bind(_this_1);
        _this_1.asyncEvent = AserAAsync_1.asyncEvent.bind(_this_1);
        _this_1.asyncEventResponse = AserAAsync_1.asyncEventResponse.bind(_this_1);
        _this_1.port = process.env.PORT || process.env[_this_1.config.port] || (isNaN(_this_1.config.port) ? 8001 : _this_1.config.port);
        _this_1.initiateServer();
        var _this = _this_1;
        _this_1.on("data", function (msg) {
            try {
                // find request, and resolve
                _this.asyncEventResponse({ msg: msg });
            }
            catch (error) {
                _this.catchError({ msg: null, error: error, text: "Rest error" });
            }
        });
        return _this_1;
    }
    return AserARestServer;
}(AserAStream_1.default));
function initiateServer() {
    // @ts-ignore
    var stream = this;
    stream.config.routes.forEach(function (routeDef) {
        stream.log.info("Route ".concat(stream.config.baseroute.concat(routeDef.route)));
        stream.server[routeDef.action || "post"](stream.config.baseroute.concat(routeDef.route), function (req, res, next) {
            stream.handleRequest(req, res, next, routeDef.type = "", routeDef.raw, routeDef.json);
        });
    });
    stream.server.listen(stream.port, function () {
        stream.log.info(stream.server.name + " listening at " + stream.server.url);
    });
}
function handleRequest(req, res, next, type, raw, json) {
    if (raw === void 0) { raw = false; }
    if (json === void 0) { json = false; }
    // @ts-ignore
    var stream = this;
    var returnData = [];
    var keepData = function () {
        return function (keep) {
            returnData.push(keep.message_payload());
        };
    };
    var asyncEventError = function () {
        return function (e) {
            res.send(new Error("Server Error " + e));
            next();
            stream.catchError({ msg: null, error: e, text: "AsyncEventError" });
        };
    };
    var msg = null;
    var payload = null;
    var msgtype = null;
    if (!raw && json) {
        msg = new AserAMessage_1.default(req.body);
        payload = msg.message_payload();
        msgtype = msg.type();
    }
    else {
        payload = stream.config.bodyonly ? __assign({}, req.body) : __assign({}, req);
        msgtype = type && payload[type] && typeof payload[type] === "string"
            ? payload[type]
            : type;
    }
    Promise.all([
        stream.asyncEvent({
            msg: msg,
            type: msgtype,
            parameters: payload,
            receiveData: keepData(),
            errorFunction: asyncEventError()
        })
    ])
        .then(function () {
        res.send(returnData.length === 1 ? returnData[0] : returnData);
        next();
    })
        .catch(function (e) {
        stream.catchError({ msg: null, error: e, text: "Promise All error" });
    });
}
exports.default = AserARestServer;
