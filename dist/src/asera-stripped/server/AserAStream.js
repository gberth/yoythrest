// @flow
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AserAMessage_1 = __importDefault(require("./AserAMessage"));
const AserAMessage_2 = require("./AserAMessage");
const types_1 = require("./types");
const stream_1 = require("stream");
const AserAHelpers_1 = require("./AserAHelpers");
var totalMessagesWritten = 0;
var totalMessagesRead = 0;
class AserAStream extends stream_1.Transform {
    constructor(streamDef, outputStream, motherId) {
        super({
            readableObjectMode: true,
            writableObjectMode: true
        });
        this.streamDef = streamDef;
        this.streamDoc = JSON.stringify(streamDef, null, "\t");
        this.streamClass = streamDef.streamClass;
        this.inputConfig = streamDef.streamConfig;
        this.outputStream = outputStream;
        this.catchError = AserAHelpers_1.yCatch.bind(this);
        this.keepForRetry = AserAHelpers_1.keepForRetry.bind(this);
        this.createAck = AserAHelpers_1.createAck.bind(this);
        this.ack = AserAHelpers_1.ack.bind(this);
        this.log = {
            info: AserAHelpers_1.aseraLogger.info.bind(this),
            warn: AserAHelpers_1.aseraLogger.warn.bind(this),
            error: AserAHelpers_1.aseraLogger.error.bind(this),
            debug: AserAHelpers_1.aseraLogger.debug.bind(this),
            trace: AserAHelpers_1.aseraLogger.trace.bind(this)
        };
        this.documentation = {};
        this.streamIdentifier = "";
        if (motherId != null) {
            this.streamIdentifier = motherId + "_" + this.streamDef.streamId;
        }
        else {
            this.streamIdentifier = this.streamDef.streamId;
        }
        this.asyncEvents = {};
        this.streamId = this.streamDef.streamId;
        this.config = this.setStates(this.inputConfig);
        if (this.config.log === undefined) {
            if (outputStream) {
                this.config.log = outputStream.getLog();
            }
            else {
                this.config.log = types_1.LOGLEVELS.warn;
            }
        }
        if (this.config.version === undefined) {
            if (outputStream) {
                this.config.version = outputStream.getVersion();
            }
            else {
                this.config.version = "undefined";
            }
        }
        this.msg_typeStates = {};
        this.streams = this.setStreams(streamDef.streamConfig.streams);
        this.converterStream = null;
        if (this.config.converterStream) {
            this.converterStream = new this.config.converterStream.streamClass(this.config.converterStream, outputStream, this.streamId);
        } // createMessage = function (msg_type, payload, msgId)
        // $FlowFixMe
        this.createMessage = AserAMessage_2.message({
            creator: this.streamIdentifier
        });
        this.log.info("StreamId: " + this.streamId);
        /* Statistics parameters */
        this.datact = 0;
        this.totalct = 0;
        this.lastct = 0;
        this.started = false;
        this.startedTs = "";
        this.stoppedTs = "";
        this.startStopHistory = [];
        this.msg_typeCt = {};
        this.statistics = {};
        this.totalerrors = 0;
        this.streamMessagesWritten = 0;
        this.streamMessagesRead = 0;
        this.initiated = false;
        const _this = this;
        this.on("checkForOperatorCommand", function (msg) {
            try {
                if (msg.message_data.type === "asera.operator.sendStatus" ||
                    msg.message_data.type === "asera.operator.shutdownAll") {
                    let newmsg = msg.createMessageWithThisAsMother(_this.createMessage({
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
                    let pl = msg.message_payload();
                    _this.log.info("emit " + pl.streamIdentifier);
                    let str = _this.getStream(pl.streamIdentifier);
                    if (str) {
                        str.emit(pl.emit);
                    }
                    else {
                        _this.log.info("stream not found");
                    }
                }
                else if (msg.message_data.type === "asera.operator.command") {
                    let pl = msg.message_payload();
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
                    _this.log.error(`message type not found ${msg.type()}`);
                }
            }
            catch (error) {
                _this.catchError({
                    error: error,
                    msg: msg
                });
            }
        });
        this.on("updateStreamStates", function (streamsAndStates) {
            _this.updateStreamStates(streamsAndStates);
        });
        this.on("addParameters", function (msg) { });
        this.on("requestAppShutdown", function (msg) {
            _this.shutDownAll(_this);
        });
        this.on("start", function (msg) {
            // constructor calls set started at end
        });
        this.on("data", function (msg) {
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
        this.on("error", function (error) {
            /* update statistics */
            _this.catchError({
                error: error
            });
        });
    }
    updateStreamStates(streamsAndStates) {
        streamsAndStates.forEach(stream => {
            if (stream.streamIdentifier === this.streamIdentifier) {
                var stateIds = Object.keys(stream.config);
                stateIds.forEach((state) => {
                    this.config[state] = stream.config[state];
                });
            }
        });
        for (const key in this.streams) {
            this.streams[key].updateStreamStates(streamsAndStates);
        }
    }
    getStreamStates(streamIdentifier) {
        if (streamIdentifier === this.streamIdentifier) {
            return this.config;
        }
        else if (this.streams !== null) {
            for (const key in this.streams) {
                let st = this.streams[key].getStreamStates(streamIdentifier);
                if (st)
                    return st;
            }
        }
        else {
            return null;
        }
    }
    getStream(streamIdentifier) {
        if (streamIdentifier === this.streamIdentifier) {
            return this;
        }
        else if (this.streams !== null) {
            for (const key in this.streams) {
                let st = this.streams[key].getStream(streamIdentifier);
                if (st)
                    return st;
            }
        }
        else {
            return null;
        }
        return null;
    }
    getDocumentationSkeleton(type) {
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
    }
    createDocumentEntity(type, id, border) {
        return {
            entity: {
                id: id,
                type: type,
                border: border
            }
        };
    }
    createDocumentation(connectTo) {
        let streamDoc = this.getDocumentationSkeleton("Stream");
        this.createDocumentationConnections(streamDoc);
        streamDoc.links.push(this.createDocumentEntity("Link", connectTo || "", true));
        return streamDoc;
    }
    createDocumentationConnections(streamDoc) { }
    getLog() {
        return this.config.log || types_1.LOGLEVELS.info;
    }
    getVersion() {
        return this.config.version;
    }
    setStarted() {
        if (this.initiated) {
            this.started = true;
            this.startedTs = AserAHelpers_1.ts();
            this.startTimers();
        }
    }
    getStarted() {
        return this.started;
    }
    getInitiated() {
        return () => {
            return this.initiated === true;
        };
    }
    setStoppped() {
        this.started = false;
        this.stoppedTs = AserAHelpers_1.ts();
        this.startStopHistory.push({
            start: this.startedTs,
            stop: this.stoppedTs,
            count: this.datact,
            totalCt: this.totalct
        });
    }
    startTimers() {
        if (this.config.timers) {
            let _this = this;
            this.config.timers.forEach(function (timer) {
                _this.log.info("start timer for emitting " + timer.emitId);
                timer.timerprocess = setInterval(() => {
                    _this.emit(timer.emitId);
                }, timer.ms);
            });
        }
    }
    stopTimers() {
        if (this.config.timers) {
            this.config.timers.forEach(function (timer) {
                clearInterval(timer.timerprocess);
            });
        }
    }
    getStatus() {
        let statArr = [];
        this.pushStat(statArr, this);
        return statArr;
    }
    pushStat(statArr, stream) {
        let lastctr = stream.lastct;
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
        for (const key in stream.streams) {
            this.pushStat(statArr, stream.streams[key]);
        }
    }
    extraStatistics() {
        if (this.outputStream === null) {
            return {
                totalMessagesWritten: totalMessagesWritten,
                totalMessagesRead: totalMessagesRead
            };
        }
        else
            return {};
    }
    streamStatistics(stream) {
        let lastctr = stream.lastct;
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
    }
    shutDownAll(stream) {
        /* eslint-disable no-unused-vars */
        this.log.info(this.streamIdentifier + " shutdown. First call for close adapters");
        for (const key in stream.streams) {
            stream.streams[key].emit("shutdown");
        }
        setTimeout(() => {
            for (const key in stream.streams) {
                stream.streams[key].emit("shutdownFinal");
            }
            this.log.info(this.streamIdentifier +
                " sleep for additional 15 more sec and then exit");
            setTimeout(function () {
                process.exit(12);
            }, 15000);
        }, 15000);
    }
    accumulateOnMsgType(msgT) {
        if (!this.msg_typeCt[msgT]) {
            this.msg_typeCt[msgT] = 0;
        }
        this.msg_typeCt[msgT] += 1;
    }
    generateStream(streamDef) {
        const s = streamDef.streamClass;
        // @ts-ignore
        return new s(streamDef, this, this.streamIdentifier);
    }
    setStreams(strs) {
        var streams = {};
        if (strs) {
            strs.map((stream, j) => {
                streams[stream.streamId] = this.generateStream(stream);
            });
        }
        return streams;
    }
    setStates(istates) {
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
    }
    getStreamId() {
        return this.streamId;
    }
    writeToStream(msg, type) {
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
    }
    writeMessage(msg) {
        // $FlowFixMe
        totalMessagesWritten += 1;
        this.streamMessagesWritten += 1;
        this.write(msg);
    }
    setMessageTypeStates(type, typeStates) {
        const _this = this;
        if (!this.msg_typeStates[type]) {
            this.msg_typeStates[type] = new Map();
        }
        Object.keys(typeStates).forEach(function (mtname) {
            _this.msg_typeStates[type][mtname] = typeStates[mtname];
        });
    }
    getMsgTypeStateValue(type, stateVar, usetype = null) {
        if (type && this.msg_typeStates[type]) {
            if (this.msg_typeStates[type][stateVar]) {
                return this.msg_typeStates[type][stateVar];
            }
        }
        return this.config[stateVar]
            ? this.config[stateVar]
            : usetype || "asera.messagetype.notdefined";
    }
} // $FlowFixMe
stream_1.Transform.prototype._transform = function (data, encoding, callback) {
    this.push(data);
    callback();
};
exports.default = AserAStream;
//# sourceMappingURL=AserAStream.js.map