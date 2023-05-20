import convict from "convict";
declare const conf: convict.Config<{
    env: string;
    version: string;
    name: string;
    aseraconfig: string;
    aseraappstreams: string;
}>;
export default conf;
