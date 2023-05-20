// @flow
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
var AserAMessage_1 = __importDefault(require("./AserAMessage"));
var AserAMessage_2 = require("./AserAMessage");
var types_1 = require("./types");
var stream_1 = require("stream");
var AserAHelpers_1 = require("./AserAHelpers");
var totalMessagesWritten = 0;
var totalMessagesRead = 0;
var AserAStream = /** @class */ (function (_super) {
    __extends(AserAStream, _super);
    function AserAStream(streamDef, outputStream, motherId) {
        var _this_1 = _super.call(this, {
            readableObjectMode: true,
            writableObjectMode: true
        }) || this;
        _this_1.streamDef = streamDef;
        _this_1.streamDoc = JSON.stringify(streamDef, null, "\t");
        _this_1.streamClass = streamDef.streamClass;
        _this_1.inputConfig = streamDef.streamConfig;
        _this_1.outputStream = outputStream;
        _this_1.catchError = AserAHelpers_1.yCatch.bind(_this_1);
        _this_1.keepForRetry = AserAHelpers_1.keepForRetry.bind(_this_1);
        _this_1.createAck = AserAHelpers_1.createAck.bind(_this_1);
        _this_1.ack = AserAHelpers_1.ack.bind(_this_1);
        _this_1.log = {
            info: AserAHelpers_1.aseraLogger.info.bind(_this_1),
            warn: AserAHelpers_1.aseraLogger.warn.bind(_this_1),
            error: AserAHelpers_1.aseraLogger.error.bind(_this_1),
            debug: AserAHelpers_1.aseraLogger.debug.bind(_this_1),
            trace: AserAHelpers_1.aseraLogger.trace.bind(_this_1)
        };
        _this_1.documentation = {};
        _this_1.streamIdentifier = "";
        if (motherId != null) {
            _this_1.streamIdentifier = motherId + "_" + _this_1.streamDef.streamId;
        }
        else {
            _this_1.streamIdentifier = _this_1.streamDef.streamId;
        }
        _this_1.asyncEvents = {};
        _this_1.streamId = _this_1.streamDef.streamId;
        _this_1.config = _this_1.setStates(_this_1.inputConfig);
        if (_this_1.config.log === undefined) {
            if (outputStream) {
                _this_1.config.log = outputStream.getLog();
            }
            else {
                _this_1.config.log = types_1.LOGLEVELS.warn;
            }
        }
        if (_this_1.config.version === undefined) {
            if (outputStream) {
                _this_1.config.version = outputStream.getVersion();
            }
            else {
                _this_1.config.version = "undefined";
            }
        }
        _this_1.msg_typeStates = {};
        _this_1.streams = _this_1.setStreams(streamDef.streamConfig.streams);
        _this_1.converterStream = null;
        if (_this_1.config.converterStream) {
            _this_1.converterStream = new _this_1.config.converterStream.streamClass(_this_1.config.converterStream, outputStream, _this_1.streamId);
        } // createMessage = function (msg_type, payload, msgId)
        // $FlowFixMe
        _this_1.createMessage = AserAMessage_2.message({
            creator: _this_1.streamIdentifier
        });
        _this_1.log.info("StreamId: " + _this_1.streamId);
        /* Statistics parameters */
        _this_1.datact = 0;
        _this_1.totalct = 0;
        _this_1.lastct = 0;
        _this_1.started = false;
        _this_1.startedTs = "";
        _this_1.stoppedTs = "";
        _this_1.startStopHistory = [];
        _this_1.msg_typeCt = {};
        _this_1.statistics = {};
        _this_1.totalerrors = 0;
        _this_1.streamMessagesWritten = 0;
        _this_1.streamMessagesRead = 0;
        _this_1.initiated = false;
        var _this = _this_1;
        _this_1.on("checkForOperatorCommand", function (msg) {
            try {
                if (msg.message_data.type === "asera.operator.sendStatus" ||
                    msg.message_data.type === "asera.operator.shutdownAll") {
                    var newmsg = msg.createMessageWithThisAsMother(_this.createMessage({
                        message_data: {
                            type: "asera.operator.system.status"
                        },
                        payload: _this.getStatus()
                    }));
                    newmsg.identity_data.identity = _this.config.systemIdentifier;
                    _this.writeMessage(newmsg);
                }
                if (msg.message_data.type === "asera.operator.createDocumentation") {
                    _this.log.info("emitting create doc");
                    _this.emit("createDocumentation", msg);
                }
                else if (msg.message_data.type === "asera.operator.shutdownAll") {
                    _this.shutDownAll(_this);
                }
                else if (msg.message_data.type === "asera.operator.emit") {
                    var pl = msg.message_payload();
                    _this.log.info("emit " + pl.streamIdentifier);
                    var str = _this.getStream(pl.streamIdentifier);
                    if (str) {
                        str.emit(pl.emit);
                    }
                    else {
                        _this.log.info("stream not found");
                    }
                }
                else if (msg.message_data.type === "asera.operator.command") {
                    var pl = msg.message_payload();
                    _this.log.info("Operator command " +
                        pl.aseraServer +
                        " / " +
                        _this.streamIdentifier);
                    if (pl.aseraServer !== "All" &&
                        pl.aseraServer !== _this.streamIdentifier) {
                        return;
                    }
                    _this.log.info({
                        msg: "Operator command to be executed",
                        operatormsg: msg
                    });
                    _this.writeMessage(msg.createMessageWithThisAsMother(_this.createMessage({
                        message_data: {
                            type: pl.type
                        },
                        payload: pl.payload
                    })));
                }
                else {
                    _this.log.error("message type not found " + msg.type());
                }
            }
            catch (error) {
                _this.catchError({
                    error: error,
                    msg: msg
                });
            }
        });
        _this_1.on("updateStreamStates", function (streamsAndStates) {
            _this.updateStreamStates(streamsAndStates);
        });
        _this_1.on("addParameters", function (msg) { });
        _this_1.on("requestAppShutdown", function (msg) {
            _this.shutDownAll(_this);
        });
        _this_1.on("start", function (msg) {
            // constructor calls set started at end
        });
        _this_1.on("data", function (msg) {
            /* TODO update statistics */
            try {
                totalMessagesRead += 1;
                _this.streamMessagesRead += 1;
                _this.datact += 1;
                _this.lastct += 1;
                _this.totalct += 1;
                if (_this.config.log === types_1.LOGLEVELS.trace) {
                    _this.log.info("START " + msg.type());
                }
            }
            catch (error) {
                _this.catchError({
                    error: error,
                    msg: msg
                });
            }
        });
        _this_1.on("error", function (error) {
            /* update statistics */
            _this.catchError({
                error: error
            });
        });
        return _this_1;
    }
    AserAStream.prototype.updateStreamStates = function (streamsAndStates) {
        var _this_1 = this;
        streamsAndStates.forEach(function (stream) {
            if (stream.streamIdentifier === _this_1.streamIdentifier) {
                var stateIds = Object.keys(stream.config);
                stateIds.forEach(function (state) {
                    _this_1.config[state] = stream.config[state];
                });
            }
        });
        for (var key in this.streams) {
            this.streams[key].updateStreamStates(streamsAndStates);
        }
    };
    AserAStream.prototype.getStreamStates = function (streamIdentifier) {
        if (streamIdentifier === this.streamIdentifier) {
            return this.config;
        }
        else if (this.streams !== null) {
            for (var key in this.streams) {
                var st = this.streams[key].getStreamStates(streamIdentifier);
                if (st)
                    return st;
            }
        }
        else {
            return null;
        }
    };
    AserAStream.prototype.getStream = function (streamIdentifier) {
        if (streamIdentifier === this.streamIdentifier) {
            return this;
        }
        else if (this.streams !== null) {
            for (var key in this.streams) {
                var st = this.streams[key].getStream(streamIdentifier);
                if (st)
                    return st;
            }
        }
        else {
            return null;
        }
        return null;
    };
    AserAStream.prototype.getDocumentationSkeleton = function (type) {
        return {
            entity: {
                id: this.streamId,
                type: "StreamDef",
                border: false
            },
            stream: {
                entity: {
                    id: this.streamId,
                    type: type,
                    border: true,
                    mouseOver: JSON.stringify(this.statistics, null, "\t") +
                        (this.outputStream !== null ? this.streamDoc + "\t" : "\t")
                }
            },
            sources: [],
            sinks: [],
            links: []
        };
    };
    AserAStream.prototype.createDocumentEntity = function (type, id, border) {
        return {
            entity: {
                id: id,
                type: type,
                border: border
            }
        };
    };
    AserAStream.prototype.createDocumentation = function (connectTo) {
        var streamDoc = this.getDocumentationSkeleton("Stream");
        this.createDocumentationConnections(streamDoc);
        streamDoc.links.push(this.createDocumentEntity("Link", connectTo || "", true));
        return streamDoc;
    };
    AserAStream.prototype.createDocumentationConnections = function (streamDoc) { };
    AserAStream.prototype.getLog = function () {
        return this.config.log || types_1.LOGLEVELS.info;
    };
    AserAStream.prototype.getVersion = function () {
        return this.config.version;
    };
    AserAStream.prototype.setStarted = function () {
        if (this.initiated) {
            this.started = true;
            this.startedTs = AserAHelpers_1.ts();
            this.startTimers();
        }
    };
    AserAStream.prototype.getStarted = function () {
        return this.started;
    };
    AserAStream.prototype.getInitiated = function () {
        var _this_1 = this;
        return function () {
            return _this_1.initiated === true;
        };
    };
    AserAStream.prototype.setStoppped = function () {
        this.started = false;
        this.stoppedTs = AserAHelpers_1.ts();
        this.startStopHistory.push({
            start: this.startedTs,
            stop: this.stoppedTs,
            count: this.datact,
            totalCt: this.totalct
        });
    };
    AserAStream.prototype.startTimers = function () {
        if (this.config.timers) {
            var _this_2 = this;
            this.config.timers.forEach(function (timer) {
                _this_2.log.info("start timer for emitting " + timer.emitId);
                timer.timerprocess = setInterval(function () {
                    _this_2.emit(timer.emitId);
                }, timer.ms);
            });
        }
    };
    AserAStream.prototype.stopTimers = function () {
        if (this.config.timers) {
            this.config.timers.forEach(function (timer) {
                clearInterval(timer.timerprocess);
            });
        }
    };
    AserAStream.prototype.getStatus = function () {
        var statArr = [];
        this.pushStat(statArr, this);
        return statArr;
    };
    AserAStream.prototype.pushStat = function (statArr, stream) {
        var lastctr = stream.lastct;
        if (this.config.log >= types_1.LOGLEVELS.trace) {
            stream.log.debug("statistics for ".concat(stream.streamIdentifier));
        }
        statArr.push(AserAHelpers_1.aItem({
            itemType: "yourstatistics",
            id: stream.streamIdentifier,
            payload: stream.streamStatistics(stream),
            version: -1,
            owner: this.config.systemIdentifier
        }));
        stream.lastct = 0;
        for (var key in stream.streams) {
            this.pushStat(statArr, stream.streams[key]);
        }
    };
    AserAStream.prototype.extraStatistics = function () {
        if (this.outputStream === null) {
            return {
                totalMessagesWritten: totalMessagesWritten,
                totalMessagesRead: totalMessagesRead
            };
        }
        else
            return {};
    };
    AserAStream.prototype.streamStatistics = function (stream) {
        var lastctr = stream.lastct;
        stream.statistics = {
            streamId: stream.streamIdentifier,
            streamClass: stream.streamClass,
            statistics: {
                inErrorMode: stream.config.inError,
                started: stream.started,
                startedTime: stream.started ? stream.startedTs : null,
                currentCt: stream.datact,
                sincelast: lastctr,
                totalCt: stream.totalct,
                history: stream.startStopHistory,
                msg_type: stream.msg_typeCt,
                total_errors: stream.totalerrors,
                errors: stream.errors,
                streamMessagesWritten: stream.streamMessagesWritten,
                streamMessagesRead: stream.streamMessagesRead,
                extra: stream.extraStatistics()
            }
        };
        return stream.statistics;
    };
    AserAStream.prototype.shutDownAll = function (stream) {
        var _this_1 = this;
        /* eslint-disable no-unused-vars */
        this.log.info(this.streamIdentifier + " shutdown. First call for close adapters");
        for (var key in stream.streams) {
            stream.streams[key].emit("shutdown");
        }
        setTimeout(function () {
            for (var key in stream.streams) {
                stream.streams[key].emit("shutdownFinal");
            }
            _this_1.log.info(_this_1.streamIdentifier +
                " sleep for additional 15 more sec and then exit");
            setTimeout(function () {
                process.exit(12);
            }, 15000);
        }, 15000);
    };
    AserAStream.prototype.accumulateOnMsgType = function (msgT) {
        if (!this.msg_typeCt[msgT]) {
            this.msg_typeCt[msgT] = 0;
        }
        this.msg_typeCt[msgT] += 1;
    };
    AserAStream.prototype.generateStream = function (streamDef) {
        var s = streamDef.streamClass;
        // @ts-ignore
        return new s(streamDef, this, this.streamIdentifier);
    };
    AserAStream.prototype.setStreams = function (strs) {
        var _this_1 = this;
        var streams = {};
        if (strs) {
            strs.map(function (stream, j) {
                streams[stream.streamId] = _this_1.generateStream(stream);
            });
        }
        return streams;
    };
    AserAStream.prototype.setStates = function (istates) {
        // go through keys, if keys = map with function, read source and create function
        if (!istates)
            return {};
        var stateIds = Object.keys(istates);
        var states = {};
        stateIds.forEach(function (state) {
            var val = istates[state];
            states[state] = val;
        });
        return states;
    };
    AserAStream.prototype.getStreamId = function () {
        return this.streamId;
    };
    AserAStream.prototype.writeToStream = function (msg, type) {
        var id = AserAHelpers_1.aId();
        if (this.converterStream) {
            this.converterStream.writeMessage(this.createMessage({
                message_data: {
                    type: type
                        ? type
                        : this.config.type
                            ? this.config.type
                            : "nomsgtype",
                    message_id: id
                },
                payload: msg
            }));
        }
        else if (this.config.raw) {
            this.outputStream.writeMessage(this.createMessage({
                message_data: {
                    type: type
                        ? type
                        : this.config.type
                            ? this.config.type
                            : "nomsgtype",
                    message_id: id
                },
                payload: this.config.toStringFormat
                    ? msg.toString(this.config.toStringFormat)
                    : msg.toString()
            }));
        }
        else {
            console.dir(msg);
            this.outputStream.writeMessage(msg instanceof AserAMessage_1.default
                ? msg
                : new AserAMessage_1.default(JSON.parse(msg.toString()), type
                    ? type
                    : this.config.settype
                        ? this.config.type
                        : null));
        }
        return id;
    };
    AserAStream.prototype.writeMessage = function (msg) {
        // $FlowFixMe
        totalMessagesWritten += 1;
        this.streamMessagesWritten += 1;
        this.write(msg);
    };
    AserAStream.prototype.setMessageTypeStates = function (type, typeStates) {
        var _this = this;
        if (!this.msg_typeStates[type]) {
            this.msg_typeStates[type] = new Map();
        }
        Object.keys(typeStates).forEach(function (mtname) {
            _this.msg_typeStates[type][mtname] = typeStates[mtname];
        });
    };
    AserAStream.prototype.getMsgTypeStateValue = function (type, stateVar, usetype) {
        if (usetype === void 0) { usetype = null; }
        if (type && this.msg_typeStates[type]) {
            if (this.msg_typeStates[type][stateVar]) {
                return this.msg_typeStates[type][stateVar];
            }
        }
        return this.config[stateVar]
            ? this.config[stateVar]
            : usetype || "asera.messagetype.notdefined";
    };
    return AserAStream;
}(stream_1.Transform)); // $FlowFixMe
stream_1.Transform.prototype._transform = function (data, encoding, callback) {
    this.push(data);
    callback();
};
exports.default = AserAStream;
