"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("./types");
const AserAStream_1 = __importDefault(require("./AserAStream"));
const AserAHelpers_1 = require("./AserAHelpers");
class AserADispatcher extends AserAStream_1.default {
    constructor(streamDef, outputStream, motherId) {
        super(streamDef, outputStream, motherId);
        this.writeDefault = this.config.writeDefault || false;
        this.messageToStream = {}; // map for resolved messages
        this.msgMap = {};
        const _this = this;
        this.dispatch = this.setDispatcher(_this.config.dispatcherMessages.map(disp => ({
            type: disp.type,
            streams: disp.streams.map(str => {
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
        }))); // TODO return error = _this.disptach not function, otherwise oper message
        this.on("data", function (msg) {
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
        this.on("config", function (msg) { });
        this.on("createDocumentation", function (msg) {
            if (msg &&
                msg.message_data.type === "asera.operator.createDocumentation") {
                let doc = _this.createServerDocumentation();
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
        this.on("notHandled", function (msg) {
            _this.log.info({ txt: "ikke behandlet ennå ", msg: msg });
        });
        this.initiated = true;
        this.setStarted();
    }
    createServerDocumentation() {
        let streamDoc = [this.getDocumentationSkeleton("Dispatcher")];
        if (this.streams !== null) {
            for (const key in this.streams) {
                streamDoc.push(this.streams[key].createDocumentation(this.streamIdentifier));
            }
        }
        return {
            streamDoc
        };
    }
    setDispatcher(dispatchMsgs) {
        const _this = this;
        const buildMap = function (msgEl, mapEl) {
            if (!mapEl[msgEl]) {
                mapEl[msgEl] = {};
            }
            return mapEl[msgEl];
        };
        dispatchMsgs.map(function (dispatchMsg) {
            var lookInMap = _this.msgMap;
            let m = dispatchMsg.type.split(".");
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
                let el1 = msgt.shift();
                if (!el1)
                    return null;
                var ret = null;
                let entry = sMap[el1];
                let entryall = sMap["*"];
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
                    let anymsg = sMap["*"];
                    if (anymsg && anymsg.streams && el1 !== "operator") {
                        return anymsg.streams;
                    }
                }
                return ret;
            }
            if (msg.type() === types_1.RequestType.ACK) {
                if (msg.get_request_stream()) {
                    let str = _this.streams[msg.get_request_stream()];
                    if (str) {
                        str.writeMessage(msg);
                        return;
                    }
                    _this.log.error("ACK without known stream " + msg.type());
                    return;
                }
            }
            if (msg.type() && !_this.messageToStream[msg.type()]) {
                const msgEl = msg.type().split(".");
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
    }
}
exports.default = AserADispatcher;
//# sourceMappingURL=AserADispatcher.js.map