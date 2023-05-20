import { StreamDef } from "../../types";
import AserAStream from "../../AserAStream";
declare class AserAWebSocketServerLight extends AserAStream {
    handle_message: Function;
    connections: {};
    wsconnection: {};
    connectionsData: {};
    connectionct: number;
    maxconnections: number;
    connect: any;
    wss: any;
    initialAserAData: any;
    initiated: boolean;
    requests: {};
    raw: boolean;
    payload_only: boolean;
    raw_type: string | undefined;
    constructor(streamDef: StreamDef, outputStream: AserAStream, motherId: string);
}
export default AserAWebSocketServerLight;
