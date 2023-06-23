import express, { Request, Response } from 'express'
import { Transform as Stream } from "stream";
import Message from "./Message"
import { yId } from "./helpers"

const WebSocket = require("ws");
type stream_attr = {
  connectionOpen: boolean;
  requests: {[key: string]: {req: Request, res: Response}};
};

let stream:stream_attr = {
  connectionOpen: false,
  requests: {}
}

let wss:any = null
class FromWs extends Stream {
  constructor(
  ) {
    super({
      readableObjectMode: true,
      writableObjectMode: true
    });
    const _this = this
    _this.on("data", (msgin: string) => {
      let msg;

      try {
        msg = new Message(JSON.parse(msgin));
        const reqid = msg.get_request_id()
        if (stream.requests[reqid]) {
          console.log("jada")
          stream.requests[reqid].res.send(msgin)          
        }
      }
      catch (error) {
        console.log(error)
    }
    });
}
}
class ToWs extends Stream {
  constructor(
  ) {
    super({
      readableObjectMode: true,
      writableObjectMode: true
    });
    const _this = this
    _this.on("data", (msgin: Message) => {
      let msg;
      if (! stream.connectionOpen) {
        initiateConnection()
      }
      try {
        wss.send(msgin.stringify())
      }
      catch (error) {
        console.log(error)
    }
    });
}
}
Stream.prototype._transform = function (
  data: any,
  encoding: any,
  callback: any
) {
  this.push(data);
  callback();
};

let fromws = new FromWs()
let tows = new ToWs()

function initiateConnection(): void {
  try {
    wss = new WebSocket(process.env.WSADDRESS);

    wss.on("open", () => {
      stream.connectionOpen = true;
    });
    wss.on("message", (msgin: string) => {
      console.log("From server ----------", msgin)
      fromws.write(msgin)
    })
    wss.on("close", () => {
      console.error("connection closed");
      stream.connectionOpen = false;
      initiateConnection()
    });
    wss.on("error", (err: any) => {
      console.error("ws error");
      console.error(err);
      stream.connectionOpen = false;
      initiateConnection()
      });
    console.log("WS sucessfullyy established");
  } catch (error) {
    stream.connectionOpen = false;
    console.error("WS not established");
    console.error(error);
  }
}

const app = express()

const port = process.env.PORT || 8080
initiateConnection()

app.use(express.json())
app.get('/', (_req: Request, res: Response) => {
    return res.send('Express Typescript on Vercel')
})

app.get('/ping', (_req: Request, res: Response) => {
    return res.send('pong 🏓')
})

app.post('/yts', (_req: Request, res: Response) => {
    console.dir(_req.body)
    try { 
        const msg = new Message(_req.body);

        msg.setRequestData("yoythrest", yId(), "send")
        stream.requests[msg.get_request_id()] = {req: _req, res: res}
        console.dir(msg)
        tows.write(msg)
      }
      catch (error) {
        console.log(error)
    }
})

app.listen(port, () => {
    return console.log(`Server is listening on ${port}`)
})