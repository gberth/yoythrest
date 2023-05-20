import AserAStream from "./server/AserAStream";
export declare type StartParameters = {
    aseraDefinition: any;
    businessStreams?: any;
    serverId?: string;
    testStreams?: any;
    version?: string;
    log?: any;
};
export declare const start: ({ aseraDefinition, businessStreams, serverId, testStreams, version, log }: StartParameters) => AserAStream;
