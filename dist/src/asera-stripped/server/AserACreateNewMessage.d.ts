import { StreamDef } from "./types";
import AserAStream from "./AserAStream";
declare class AserACreateNewMessage extends AserAStream {
    handle_message: Function;
    constructor(streamDef: StreamDef, outputStream: AserAStream, motherId: string);
}
export default AserACreateNewMessage;
