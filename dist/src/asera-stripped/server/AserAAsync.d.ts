import { AsyncRequestParameters, AsyncResponseParameters } from "./types";
export declare const asyncEvent: ({ msg, type, parameters, receiveData, ackData, errorFunction, timeout_ms }: AsyncRequestParameters) => Promise<any>;
export declare const asyncEventResponse: ({ msg }: AsyncResponseParameters) => void;
