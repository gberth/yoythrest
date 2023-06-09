import express, { Request, Response } from 'express'
import { Transform as Stream } from "stream";
import Message from "./Message"
import { yId } from "./helpers"

const EventEmitter = require('events');

const connection_event = new EventEmitter();

async function send_conn(wsaddress: string) {
    if (!stream.connections[wsaddress].connectionOpen) {
      console.log("wait for open", wsaddress)
      await new Promise(resolve => connection_event.once(wsaddress, resolve));
      console.log("waited for open", stream.connections[wsaddress].connectionOpen)
    }
      if (stream.connections[wsaddress].connectionOpen) {
        stream.connections[wsaddress].send_msgs.forEach((msg:Message) => {
          stream.connections[wsaddress].ws.send(msg.stringify())
        })
        stream.connections[wsaddress].send_msgs = []
      } else {
        console.error("no connection", wsaddress)
      }
}

const WebSocket = require("ws");
type stream_attr = {
  connections: {[key: string]: any} 
  requests: {[key: string]: {type: string, req: Request, res: Response}};
  timeoutstarted: boolean
};
type StreamDef = {
  wsaddress: string
}
let stream:stream_attr = {
  connections:{},
  requests: {},
  timeoutstarted: false
}

let wss:any = null
class FromWs extends Stream {
  constructor(wsaddress:string
  ) {
    super({
      readableObjectMode: true,
      writableObjectMode: true
    });
    const _this = this
    // @ts-ignore    
    _this.wsaddress = wsaddress
    _this.on("data", (msgin: string) => {
      let msg;

      try {
        msg = new Message(JSON.parse(msgin));
        const reqid = msg.get_request_id()
        if (stream.requests[reqid]) {
          console.log("jada")
          if (stream.requests[reqid].type === "ping") {
            console.log("ping ok")
          } else {
  // @ts-ignore    
          if (msg.message_payload().data || msg.message_payload().photo) {
  // @ts-ignore
            let res = stream.requests[reqid].res
  // @ts-ignore
            let data = msg.message_payload().data as ArrayBuffer || msg.message_payload().photo as ArrayBuffer
            res.type("image/jpg")
            res.send(Buffer.from(data))
          } else {
            stream.requests[reqid].res.send(msgin)
          }
        }
          delete stream.requests[reqid]       
        }
      }
      catch (error) {
        console.log(error)
    }
    });
}
}

class ToWs extends Stream {
  constructor(wsaddress:string
  ) {
    super({
      readableObjectMode: true,
      writableObjectMode: true
    });
    const _this = this
  // @ts-ignore    
    _this.wsaddress = wsaddress
    _this.on("data", (msgin: Message) => {
      let msg;
      try {
        console.log(".................to server open=", stream.connections[wsaddress].connectionOpen, msgin)
        stream.connections[wsaddress].send_msgs.push(msgin)
        send_conn(wsaddress)
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

function initiateConnection(wsaddress:string): WebSocket {
  console.log("initiate for " + wsaddress)
  try {
    wss = new WebSocket("wss:\\" + wsaddress);
    if (!stream.connections[wsaddress]) {
      stream.connections[wsaddress] = {
        connectionOpen: false,
        ws: wss,
        fromws: new FromWs(wsaddress),
        tows: new ToWs(wsaddress),
        send_msgs: []
      }
    }
    if (!stream.timeoutstarted) {
      stream.timeoutstarted = true
      start_ping()
    }
    stream.connections[wsaddress].ws = wss    
    const connection = stream.connections[wsaddress]
    wss.on("open", () => {
      console.log("connection open " + wsaddress)
      connection.connectionOpen = true;
      connection_event.emit(wsaddress);
    });
    wss.on("message", (msgin: string) => {
      console.log("From server ----------", msgin.substring(0,2000))
      connection.fromws.write(msgin)
    })
    wss.on("close", () => {
      console.error("connection closed");
      connection.connectionOpen = false;
      connection_event.emit(wsaddress);
      initiateConnection(wsaddress)
    });
    wss.on("error", (err: any) => {
      console.error("ws error");
      console.error(err);
      connection.connectionOpen = false;
      connection_event.emit(wsaddress);
      initiateConnection(wsaddress)
      });
    console.log("WS sucessfullyy established");
  } catch (error) {
    console.error("WS not established");
    initiateConnection(wsaddress)
    connection_event.emit(wsaddress);
    console.error(error);
  }
  return wss
}

function start_ping() {
    setInterval(
    send_ping(), 30000);
}

function send_ping() {
  return () => {
    Object.keys(stream.connections).forEach((connection) => {
      const pingmsg = new Message({message_data: {type: "ping", message_id: "generate", request_data: {}}, identity_data: {}, payload: {}})
        stream.requests[pingmsg.get_request_id()] = {type: "ping", req: null, res: null}
      stream.connections[connection].tows.write(pingmsg)
    })
  }
}

const app = express()

const port = process.env.PORT || 8080

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
        stream.requests[msg.get_request_id()] = {type: msg.type(), req: _req, res: res}
        console.dir(msg)
      }
      catch (error) {
        console.log(error)
    }
})

app.get('/termux', (_req: Request, res: Response) => {

    console.dir(_req.query)
    if (!_req.query.ws) {
        return res.send('Missing attribute ws')
    }
    if (!_req.query.type) {
        return res.send('Missing attribute type')
    }
    if (!_req.query.user) {
        return res.send('Missing attribute type')
    }

    if (!stream.connections[_req.query.ws as string]) {
      initiateConnection(_req.query.ws as string)
    }
      let newmsg = new Message({
      message_data: {
        message_id: "generate",
        type: _req.query.type as string,
        request_data: {
          user: _req.query.user as string
        }
      },
   identity_data:{
      identity:"g37cdcd0-ae54-11e7-b461-eb2f2858d486"
   },
   payload: {..._req.query}
  })

        newmsg.setRequestData("yoythrest", yId(), "send")
        stream.requests[newmsg.get_request_id()] = {type: _req.query.type as string, req: _req, res: res}

    stream.connections[_req.query.ws as string].tows.write(newmsg)
  })
app.listen(port, () => {
    return console.log(`Server is listening on ${port}`)
})