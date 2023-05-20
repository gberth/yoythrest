/// <reference types="node" />
import AserAMessage from "./AserAMessage";
import { Payload, StreamDef, StreamConfig, AseraStreamEntity, AseraStreamDoc } from "./types";
import { Transform as Stream } from "stream";
declare class AserAStream extends Stream {
    this: Object;
    streamDef: StreamDef;
    streamDoc: string;
    streamClass: AserAStream;
    inputConfig: StreamConfig;
    outputStream: AserAStream;
    catchError: Function;
    keepForRetry: Function;
    log: {
        info: Function;
        error: Function;
        warn: Function;
        trace: Function;
        debug: Function;
    };
    createAck: Function;
    ack: Function;
    documentation: {};
    streamIdentifier: string;
    streamId: string;
    config: {
        [key: string]: any;
    };
    msg_typeStates: {
        [key: string]: any;
    };
    streams: {
        [key: string]: AserAStream;
    };
    converterStream: AserAStream | null;
    createMessage: (x0: {
        message_data: any;
        payload: Payload;
    }) => AserAMessage;
    datact: number;
    totalct: number;
    lastct: number;
    started: boolean;
    startedTs: string;
    stoppedTs: string;
    startStopHistory: [any?];
    msg_typeCt: {
        [key: string]: any;
    };
    statistics: {
        [key: string]: any;
    };
    errors?: number;
    totalerrors: number;
    initiated: boolean;
    streamMessagesWritten: number;
    streamMessagesRead: number;
    asyncEvents: {
        [key: string]: any;
    };
    constructor(streamDef: StreamDef, outputStream: AserAStream, motherId: string);
    updateStreamStates(streamsAndStates: [AserAStream]): void;
    getStreamStates(streamIdentifier: string): any;
    getStream(streamIdentifier: string): AserAStream | null;
    getDocumentationSkeleton(type: string): AseraStreamDoc;
    createDocumentEntity(type: string, id: string, border: boolean): AseraStreamEntity;
    createDocumentation(connectTo: string | undefined | null): AseraStreamDoc;
    createDocumentationConnections(streamDoc: AseraStreamDoc): void;
    getLog(): number;
    getVersion(): string;
    setStarted(): void;
    getStarted(): boolean;
    getInitiated(): () => boolean;
    setStoppped(): void;
    startTimers(): void;
    stopTimers(): void;
    getStatus(): any[];
    pushStat(statArr: Array<any>, stream: AserAStream): void;
    extraStatistics(): any;
    streamStatistics(stream: AserAStream): {
        [key: string]: any;
    };
    shutDownAll(stream: AserAStream): void;
    accumulateOnMsgType(msgT: string): void;
    generateStream(streamDef: StreamDef): AserAStream;
    setStreams(strs: Array<StreamDef>): {};
    setStates(istates: {
        [key: string]: any;
    }): {
        [key: string]: any;
    };
    getStreamId(): string;
    writeToStream(msg: any, type?: string): string;
    writeMessage(msg: AserAMessage): void;
    setMessageTypeStates(type: string, typeStates: {
        [key: string]: any;
    }): void;
    getMsgTypeStateValue(type: string | null, stateVar: string, usetype?: string | null): string;
}
export default AserAStream;
