/// <reference types="node" />
import AserAMessage from "./AserAMessage";
import AserAStream from "./AserAStream";
export declare type RequestParameters = NVP;
export declare type AsyncRequestParameters = {
    msg: AserAMessage | null;
    type: string;
    parameters: RequestParameters;
    receiveData?: Function;
    ackData?: Function;
    errorFunction: Function;
    timeout_ms?: number;
};
export declare type AsyncResponseParameters = {
    msg: AserAMessage;
};
export declare type AsyncEventData = {
    status: string;
    msg: AserAMessage | null;
    timeout: NodeJS.Timer;
    receiveData: Function | null;
    ackData: Function | null;
    errorFunction: Function;
    resolve: Function;
    reject: Function;
    parameters: any;
};
export declare type AserAItem = {
    aItem: {
        aMetaData: {
            aId: string;
            aType: string;
            aVersion?: number;
            aCreator?: string;
            aCreated?: string;
            aCreatedTx?: string;
            aOwner: string;
            aModified?: string;
            aModifiedTx?: string;
            aStatus?: string;
            aImg?: string;
            any?: any;
            aVersionLog?: string;
        };
        aContent: Payload;
    };
    _id?: string;
};
export declare type RequestData = {
    stream_id?: string;
    request_id?: string | undefined | null;
    requestType?: string;
    request_id_trace?: Array<string>;
    [key: string]: any;
};
export declare enum RequestType {
    ACK = "ACK",
    RESPONSE = "RESPONSE",
    RESPONSE_WITH_ACK = "RESPONSE_WITH_ACK",
    REQUEST = "REQUEST",
    ERROR = "ERROR"
}
export declare type MessageData = {
    message_id: string;
    type: string;
    original_message_id?: string;
    previous_message_id?: string;
    original_type?: string;
    previous_type?: string;
    input_type?: string;
    request_data: RequestData;
    creator?: string;
    created?: string;
    message_versionLlog?: string;
    [key: string]: any;
};
export declare type Payload = NVP | {
    items?: Array<any>;
    collections?: [];
    searchString?: string;
    aItem?: AserAItem;
    distributions?: {
        [key: string]: any;
    };
    log?: any;
} | Array<any> | string;
export declare type AserAMessageDef = {
    message_data: MessageData;
    identity_data: {
        [key: string]: any | null;
    };
    payload: Payload;
};
export declare type CreateMessageWithThisAsMother = (msg: AserAMessage) => AserAMessage;
export declare type AserAErrorDef = {
    error: Error;
    msg?: AserAMessage;
    rest?: any;
};
export declare type AckParameters = {
    msg: AserAMessage;
    msg_type?: string;
    response: boolean;
    payload?: {};
    error?: boolean;
};
export declare type SslOptions = {
    rejectUnauthorized: boolean | undefined;
    ca: string | undefined;
    key: string | undefined;
    cert: string | undefined;
};
export declare type AserACatchDef = (x0: AserAErrorDef) => void;
export declare type NVP = {
    [key: string]: any;
};
export declare type StreamConfig = {
    streams: Array<StreamDef>;
    dispatcherMessages: {} | undefined | null;
    any: any | undefined | null;
    systemIdentifier: string | null;
};
export declare type StreamDef = {
    streamId: string;
    streamClass: AserAStream;
    streamConfig: StreamConfig;
};
export declare enum LOGLEVELS {
    trace = 10,
    debug = 20,
    info = 30,
    warn = 40,
    error = 50,
    fatal = 60
}
export declare type AseraStreamEntity = {
    entity: any;
};
export declare type AseraStreamDoc = {
    entity: any;
    stream: any;
    sources: Array<AseraStreamEntity>;
    sinks: Array<AseraStreamEntity>;
    links: Array<AseraStreamEntity>;
};
export declare type MysqlQuery = {
    sql: string;
    values: any[];
    status?: boolean;
    finished?: boolean;
    blocksize?: number;
};
export declare type QueryResult = {
    data: any[];
    finished: boolean;
    status_ok?: boolean;
    queue: number;
    done: number;
    noof: number;
};
export declare type MysqlPayload = {
    transaction?: boolean;
    queries: MysqlQuery[];
};
export declare type BigQQuery = {
    sql: string;
    parameters: {
        [key: string]: any;
    };
    status?: boolean;
    finished?: boolean;
};
export declare type BigQueryResult = {
    data: any[];
    finished: boolean;
    status_ok?: boolean;
};
export declare type BigQueryPayload = {
    queries: BigQQuery[];
};
