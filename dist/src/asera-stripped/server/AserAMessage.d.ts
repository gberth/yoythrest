import { MessageData, Payload, AserAMessageDef, RequestData } from "./types";
import AserAStream from "./AserAStream";
export default class AserAMessage {
    message_data: MessageData;
    identity_data: {
        [key: string]: any;
    };
    payload: Payload;
    static message: (msg_data: {
        [key: string]: string;
    }) => (msg_data: {
        [key: string]: any;
    }, payload: Payload) => AserAMessage;
    constructor(message: AserAMessageDef, overrideMessageType?: string | null);
    identity(): string | null;
    owner(): string | null;
    message_id(): string | null;
    type(): string;
    message_payload(): Payload;
    get_request_data(): RequestData | null;
    get_request_id(): string | null;
    get_request_stream(): string;
    message_payloadElement(element: string): {} | Array<any> | string | null;
    stringyfy(): string;
    createMessageWithThisAsMother(msg: AserAMessage, newMsg?: boolean): AserAMessage;
    keepOldRequestIdAndSetNew(request_id: string, requestType: string): void;
    setRequestData(stream: AserAStream, request_id: string, requestType: string): void;
}
export declare function message(msg_data: {
    [key: string]: string;
}): (x0: {
    message_data: any;
    payload: Payload;
}) => AserAMessage;
