"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOGLEVELS = exports.RequestType = void 0;
var RequestType;
(function (RequestType) {
    RequestType["ACK"] = "ACK";
    RequestType["RESPONSE"] = "RESPONSE";
    RequestType["RESPONSE_WITH_ACK"] = "RESPONSE_WITH_ACK";
    RequestType["REQUEST"] = "REQUEST";
    RequestType["ERROR"] = "ERROR";
})(RequestType = exports.RequestType || (exports.RequestType = {}));
var LOGLEVELS;
(function (LOGLEVELS) {
    LOGLEVELS[LOGLEVELS["trace"] = 10] = "trace";
    LOGLEVELS[LOGLEVELS["debug"] = 20] = "debug";
    LOGLEVELS[LOGLEVELS["info"] = 30] = "info";
    LOGLEVELS[LOGLEVELS["warn"] = 40] = "warn";
    LOGLEVELS[LOGLEVELS["error"] = 50] = "error";
    LOGLEVELS[LOGLEVELS["fatal"] = 60] = "fatal";
})(LOGLEVELS = exports.LOGLEVELS || (exports.LOGLEVELS = {}));
