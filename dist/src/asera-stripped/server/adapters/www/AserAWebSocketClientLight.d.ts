import { StreamDef } from "../../types";
import AserAStream from "../../AserAStream";
declare class AserAWebSocketClientLight extends AserAStream {
    handleWsMessage: Function;
    sendbackMessage: Function;
    sendPingOrTryLogin: Function;
    initiateConnection: Function;
    connectionOpen: boolean;
    requests: {};
    pingmsg: any;
    constructor(streamDef: StreamDef, outputStream: AserAStream, motherId: string);
}
export default AserAWebSocketClientLight;
