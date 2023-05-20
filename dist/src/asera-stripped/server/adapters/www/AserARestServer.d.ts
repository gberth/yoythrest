import { StreamDef } from "../../types";
import AserAStream from "../../AserAStream";
declare class AserARestServer extends AserAStream {
    server: any;
    handleRequest: Function;
    initiateServer: Function;
    asyncEvent: Function;
    asyncEventResponse: Function;
    port: Number;
    constructor(streamDef: StreamDef, outputStream: AserAStream, motherId: string);
}
export default AserARestServer;
