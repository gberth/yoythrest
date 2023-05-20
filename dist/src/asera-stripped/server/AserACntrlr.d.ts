import { StreamDef } from "./types";
import AserADispatcher from "./AserADispatcher";
export default class AserACntrlr extends AserADispatcher {
    constructor(streamDef: StreamDef, outputStream: AserADispatcher, motherId: string);
}
