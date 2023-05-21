"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stream_1 = require("stream");
class FromWs extends stream_1.Transform {
    constructor() {
        super({
            readableObjectMode: true,
            writableObjectMode: true
        });
    }
}
class ToWs extends stream_1.Transform {
    constructor() {
        super({
            readableObjectMode: true,
            writableObjectMode: true
        });
    }
}
let fromws = new FromWs();
let tows = new ToWs();
const app = express_1.default();
const port = process.env.PORT || 8080;
app.get('/', (_req, res) => {
    return res.send('Express Typescript on Vercel');
});
app.get('/ping', (_req, res) => {
    return res.send('pong 🏓');
});
app.post('/yts', (_req, res) => {
    console.log(_req);
    return res.send('yts' + _req);
});
app.listen(port, () => {
    return console.log(`Server is listening on ${port}`);
});
//# sourceMappingURL=index.js.map