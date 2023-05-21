"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const index_1 = require("./index");
const AserAHelpers_1 = require("./server/AserAHelpers");
const start = function ({ aseraDefinition, businessStreams, serverId, testStreams, version, log }) {
    const findStream = (classString) => {
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
    const setStream = (stream) => {
        stream.streamClassId = stream.streamClassId || stream.streamClass;
        stream.streamClass = findStream(stream.streamClassId);
        if (stream.streamConfig.converterStream) {
            stream.streamConfig.converterStreamId =
                stream.streamConfig.converterStream;
            stream.streamConfig.converterStream = findStream(stream.streamConfig.converterStream.streamClass);
        }
        if (stream.streamConfig.streams) {
            stream.streamConfig.streams.map((streamDef, j) => {
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
//# sourceMappingURL=AserA.js.map