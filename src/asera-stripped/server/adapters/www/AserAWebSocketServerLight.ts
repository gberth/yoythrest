import { AserAMessageDef, RequestData, StreamDef } from "../../types";
import AserAStream from "../../AserAStream";
import AserAMessage from "../../AserAMessage";

import { aId } from "../../AserAHelpers";

const WebSocket = require("ws");
const WebSocketServer = WebSocket.Server;

class AserAWebSocketServerLight extends AserAStream {
  handle_message: Function;
  connections: {};
  wsconnection: {};
  connectionsData: {};
  connectionct: number;
  maxconnections: number;
  connect: any;
  wss: any;
  initialAserAData: any;
  initiated: boolean;
  requests: {}
  raw: boolean
  payload_only: boolean
  raw_type: string | undefined

  constructor(
    streamDef: StreamDef,
    outputStream: AserAStream,
    motherId: string
  ) {
    super(streamDef, outputStream, motherId);
    this.handle_message = handle_message.bind(this);
    this.connect = connect.bind(this);
    let port = process.env.PORT || process.env[this.config.port] || this.config.port;
    this.wss = new WebSocketServer({
      port: port
    });
    this.raw = this.config.raw || false
    this.raw_type = this.config.raw_type || undefined
    this.payload_only = this.config.payload_only || false

    this.log.info(`listening on port: ${port}`);
    this.initialAserAData = null;
    this.connections = {};
    this.wsconnection = {};
    this.connectionsData = {};
    this.connectionct = 0;
    this.maxconnections = 0;
    this.requests = {}
    const _this = this;
    this.wss.broadcast = broadcast.bind(this);
    this.wss.on("connection", this.connect);
    this.on("data", function (msg: AserAMessage) {
      try {
        _this.handle_message(msg);
      } catch (error) {
        _this.catchError({
          error: error,
          msg: msg
        });
      }
    });
    this.initiated = true;
    this.setStarted();
  }
}

function connect(ws: any) {
  // @ts-ignore
  const stream = this;
  const connId = aId();
  stream.connections[ws] = connId;
  stream.wsconnection[connId] = ws;
  stream.log.info(`connected websockets: ${connId}`);

  stream.connectionct += 1;
  stream.maxconnections = Math.max(stream.connectionct, stream.maxconnections);

  ws.on("message", function incoming(msg: any) {
    let newmsg, reqdata
    if (stream.raw) {
      newmsg = new AserAMessage({
        message_data: {
          type: stream.raw_type,
          creator: stream.stream_id,
          request_data: { conn_id: connId } as RequestData
        },
        identity_data: {},
        payload: msg
      } as AserAMessageDef)

    } else {
      newmsg = new AserAMessage(JSON.parse(msg))
      reqdata = {
        ...newmsg.get_request_data(),
        ws: ws
      }
      newmsg.message_data.request_data.stream_id = stream.stream_id
      if (!newmsg.message_data.request_data.request_id) {
        newmsg.message_data.request_data.request_id = newmsg.message_id()
      }
      // @ts-ignore
      stream.requests[newmsg.message_data.request_data.request_id] = reqdata
    }
    stream.outputStream.writeMessage(newmsg);
  });
  ws.on("close", function incoming(code: any, reason: any) {
    // create system message, remove if last connection for user
    stream.log.info("ws closes");
  });
}

function broadcast(data: any): void {
  // @ts-ignore
  const stream = this;

  stream.wss.clients.forEach(function each(client: any) {
    /* global WebSocket */
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function handle_message(msg: AserAMessage): void {
  // @ts-ignore
  const stream = this;
  // handle ack
  if (msg.type() === 'ACK') {
    // @ts-ignore
    let reqdata = stream.requests[msg.get_request_data().request_id]
    // write back original request data
    msg.message_data.request_data = {
      ...reqdata
    }
    if (reqdata.ws.readyState === WebSocket.OPEN) {
      reqdata.ws.send(JSON.stringify(msg));
    }
  } else if (msg.get_request_data()?.conn_id) {
    if (stream.raw) {
      stream.wsconnection[msg.get_request_data()?.conn_id].send(JSON.stringify(msg.message_payload()))
    } else {
      stream.wsconnection[msg.get_request_data()?.conn_id].send(JSON.stringify(msg))
    }
  } else
    if (msg.type() === 'BROADCAST') {
      stream.wss.broadcast(msg);
    }
}

export default AserAWebSocketServerLight;
