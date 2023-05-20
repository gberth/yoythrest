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
var types_1 = require("./types");
var AserAStream_1 = __importDefault(require("./AserAStream"));
var AserAHelpers_1 = require("./AserAHelpers");
var AserADispatcher = /** @class */ (function (_super) {
    __extends(AserADispatcher, _super);
    function AserADispatcher(streamDef, outputStream, motherId) {
        var _this_1 = _super.call(this, streamDef, outputStream, motherId) || this;
        _this_1.writeDefault = _this_1.config.writeDefault || false;
        _this_1.messageToStream = {}; // map for resolved messages
        _this_1.msgMap = {};
        var _this = _this_1;
        _this_1.dispatch = _this_1.setDispatcher(_this.config.dispatcherMessages.map(function (disp) { return ({
            type: disp.type,
            streams: disp.streams.map(function (str) {
                if (!_this.streams[str.streamId]) {
                    _this.log.info("Dispatch to stream " + str.streamId + " not found");
                    setTimeout(function () {
                        process.exit(12);
                    }, 5000);
                }
                if (str.typeStates) {
                    _this.streams[str.streamId].setMessageTypeStates(disp.type, str.typeStates);
                }
                return _this.streams[str.streamId];
            })
        }); })); // TODO return error = _this.disptach not function, otherwise oper message
        _this_1.on("data", function (msg) {
            try {
                if (_this.config.log === types_1.LOGLEVELS.trace) {
                    _this.log.info("Dispatch " +
                        _this.streamIdentifier +
                        " " +
                        msg.message_data.type);
                }
                _this.accumulateOnMsgType(msg.message_data.type);
                _this.dispatch(msg);
            }
            catch (error) {
                _this.catchError({
                    error: error,
                    msg: msg
                });
            }
        });
        _this_1.on("config", function (msg) { });
        _this_1.on("createDocumentation", function (msg) {
            if (msg &&
                msg.message_data.type === "asera.operator.createDocumentation") {
                var doc = _this.createServerDocumentation();
                // AserACalculateStreamLayout(doc.streamDoc);
                _this.writeMessage(msg.createMessageWithThisAsMother(_this.createMessage({
                    message_data: {
                        type: "asera.operator.server.documentation"
                    },
                    payload: [
                        AserAHelpers_1.aItem({
                            itemType: "yourdocumentation",
                            id: _this.streamIdentifier,
                            payload: doc,
                            version: -1
                        })
                    ]
                })));
            }
        });
        _this_1.on("notHandled", function (msg) {
            _this.log.info({ txt: "ikke behandlet ennå ", msg: msg });
        });
        _this_1.initiated = true;
        _this_1.setStarted();
        return _this_1;
    }
    AserADispatcher.prototype.createServerDocumentation = function () {
        var streamDoc = [this.getDocumentationSkeleton("Dispatcher")];
        if (this.streams !== null) {
            for (var key in this.streams) {
                streamDoc.push(this.streams[key].createDocumentation(this.streamIdentifier));
            }
        }
        return {
            streamDoc: streamDoc
        };
    };
    AserADispatcher.prototype.setDispatcher = function (dispatchMsgs) {
        var _this = this;
        var buildMap = function (msgEl, mapEl) {
            if (!mapEl[msgEl]) {
                mapEl[msgEl] = {};
            }
            return mapEl[msgEl];
        };
        dispatchMsgs.map(function (dispatchMsg) {
            var lookInMap = _this.msgMap;
            var m = dispatchMsg.type.split(".");
            m.map(function (el, i) {
                lookInMap = buildMap(el, lookInMap);
            });
            if (lookInMap.streams) {
                _this.log.info("Already defined streams for messagetype: ".concat(dispatchMsg.type));
                process.exit(12);
            }
            lookInMap.streams = dispatchMsg.streams;
        });
        return function (msg) {
            function getStreams(sMap, msgt) {
                var el1 = msgt.shift();
                if (!el1)
                    return null;
                var ret = null;
                var entry = sMap[el1];
                var entryall = sMap["*"];
                // if only both msg.value and msgt.* return concat of streams
                if (entry && entry.streams && msgt.length === 0) {
                    if (entryall && entryall.streams) {
                        return entry.streams.concat(entryall.streams);
                    }
                    else {
                        return entry.streams;
                    }
                }
                // if only msgtype and xxxx.* defined - accept xxxx
                if (entry &&
                    msgt.length === 0 &&
                    entry["*"] &&
                    entry["*"].streams) {
                    return entry["*"].streams;
                }
                if (entry) {
                    ret = getStreams(entry, msgt);
                }
                if (!ret && entry && entry["*"] && el1 !== "operator") {
                    ret = getStreams(entry["*"], msgt);
                }
                if (!ret) {
                    var anymsg = sMap["*"];
                    if (anymsg && anymsg.streams && el1 !== "operator") {
                        return anymsg.streams;
                    }
                }
                return ret;
            }
            if (msg.type() === types_1.RequestType.ACK) {
                if (msg.get_request_stream()) {
                    var str = _this.streams[msg.get_request_stream()];
                    if (str) {
                        str.writeMessage(msg);
                        return;
                    }
                    _this.log.error("ACK without known stream " + msg.type());
                    return;
                }
            }
            if (msg.type() && !_this.messageToStream[msg.type()]) {
                var msgEl = msg.type().split(".");
                _this.messageToStream[msg.type()] = getStreams(_this.msgMap, msgEl);
            }
            var strs = _this.messageToStream[msg.type()];
            if (strs) {
                strs.map(function (str) {
                    str.writeMessage(msg);
                });
            }
            else {
                if (_this.writeDefault) {
                    _this.log.info("writeDefault");
                    _this.outputStream.writeMessage(msg);
                }
                else {
                    _this.emit("checkForOperatorCommand", msg);
                }
            }
        };
    };
    return AserADispatcher;
}(AserAStream_1.default));
exports.default = AserADispatcher;
