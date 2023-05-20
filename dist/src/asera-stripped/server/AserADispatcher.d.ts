import { StreamDef, AseraStreamDoc } from "./types";
import AserAStream from "./AserAStream";
declare class AserADispatcher extends AserAStream {
    dispatch: Function;
    writeDefault: boolean;
    messageToStream: {
        [key: string]: AserAStream[] | null;
    };
    msgMap: {
        [key: string]: any;
    };
    constructor(streamDef: StreamDef, outputStream: AserAStream, motherId: string);
    createServerDocumentation(): {
        streamDoc: AseraStreamDoc[];
    };
    private setDispatcher;
}
export default AserADispatcher;
