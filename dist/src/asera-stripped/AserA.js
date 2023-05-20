"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
var index_1 = require("./index");
var AserAHelpers_1 = require("./server/AserAHelpers");
var start = function (_a) {
    var aseraDefinition = _a.aseraDefinition, businessStreams = _a.businessStreams, serverId = _a.serverId, testStreams = _a.testStreams, version = _a.version, log = _a.log;
    var findStream = function (classString) {
        if (businessStreams && businessStreams[classString]) {
            return businessStreams[classString];
        }
        // @ts-ignore
        else if (index_1.StreamClasses[classString]) {
            // @ts-ignore
            return index_1.StreamClasses[classString];
        }
        else if (testStreams && testStreams[classString]) {
            return testStreams[classString];
        }
        else {
            console.log("Abort: Class not found", classString);
            process.exit(12);
        }
    };
    var setStream = function (stream) {
        stream.streamClassId = stream.streamClassId || stream.streamClass;
        stream.streamClass = findStream(stream.streamClassId);
        if (stream.streamConfig.converterStream) {
            stream.streamConfig.converterStreamId =
                stream.streamConfig.converterStream;
            stream.streamConfig.converterStream = findStream(stream.streamConfig.converterStream.streamClass);
        }
        if (stream.streamConfig.streams) {
            stream.streamConfig.streams.map(function (streamDef, j) {
                setStream(streamDef);
            });
        }
    };
    setStream(aseraDefinition.stream);
    if (serverId) {
        aseraDefinition.stream.streamId = serverId;
    }
    if (version) {
        aseraDefinition.stream.streamConfig.version = version;
    }
    if (log) {
        // initiate log - set log function to helpers
        AserAHelpers_1.setLogOveride(log);
    }
    return new aseraDefinition.stream.streamClass(aseraDefinition.stream, null, null);
};
exports.start = start;
