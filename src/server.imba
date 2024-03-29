import { publicEncrypt } from "node:crypto";
const WebSocket = require("ws");

import { dirname } from 'path/posix'
import express from 'express'
import path from 'path'
import index from './app/index.html'
import fs from "fs";
import {get_type, get_original_type, msg_ok, is_ack} from "./app/controls/helpers.imba"


# Using Imba with Express as the server is quick to set up:
const app = express()
const port = process.env.PORT or 3000
let wss
let connected = false
let connection_id
let n_errors = 0
let n_identify_errors = 0
let n_pings = 0
let app_in_error = false
let msg_waiting = []

def connectionOk(force=false)
	if wss and wss.readyState === WebSocket.OPEN and (connected or force)
		return true

	console.error(`ws status? {wss.readyState} connected {connected}`)  
	if wss
		if wss.readyState !== WebSocket.OPEN
			connected = false
			if wss.readyState !== WebSocket.CONNECTING
				console.error("Try new connect")
				initiate_connection()
			return false
	else
		initiate_connection()
	return false


def send_msgs(msg, force=false)
	if not connectionOk(force)
		console.error(`waiting {msg_waiting.length}`)
		if msg
			msg_waiting.push(msg)
		return

	if msg_waiting.length > 0
		for m in msg_waiting
			console.dir(m)
			wss.send(JSON.stringify(m))
		msg_waiting = []
	if msg
		console.dir(msg)
		wss.send(JSON.stringify(msg))

def ping 
	n_pings += 1
	send_msgs(pingmessage, false)
	setTimeout(&,15000) do
		console.log('Send ping if outstanding pings <=4 : ' + n_pings)
		if wss and wss.readyState === WebSocket.OPEN
			ping()

def encrypt_secret(key, secret)
	let usekey
	if not (key.startsWith("---") or key.startsWith("ssh"))
		usekey = fs.readFileSync(process.env[key] || key).toString("utf-8");
	else
		usekey = key
	return publicEncrypt(
		usekey,
		Buffer.from(secret, "utf-8")
		);

const openmessage =
	message_data:
		type: 'server_login'
		creator: "yoythrest"
		request_data:
			stream_id: "yoythrest"
	identity_data:
		identity: process.env.YOYTHRESTID
	payload:
		yoyth_login_identity: process.env.YOYTHRESTID,
		yoyth_login_name: process.env.YOYTHAPP,
		yoyth_secret: encrypt_secret(process.env.YOYTHIDSPUBLICKEY, process.env.YOYTHSECRET),
		yoyth_ids_public_key: process.env.YOYTHSECRET

const pingmessage =
	message_data:
		type: 'ping'
		creator: "yoythrest"
		request_data:
			stream_id: "yoythrest"
		original:
			type: 'ping'			
	identity_data:
		identity: process.env.YOYTHRESTID
	payload: {}

const ytsquery =
	message_data:
		type: 'vipps_access_request'
		creator: "yoythrest"
		request_data:
			stream_id: "rest_web_server"
	identity_data:
		identity: process.env.YOYTHRESTID
		from_identity: process.env.YOYTHRESTID
		to_identity: process.env.YOYTHIDSIDENTITY
	payload:
		query: {}

console.dir(openmessage)

def initiate_connection
	console.log(process.env.YOYTHWSADDRESS);
	wss = new WebSocket(
		process.env.YOYTHWSADDRESS
	);
	wss.on("open", do 
		console.log("open")
		send_msgs(undefined, true)
		ping())
	wss.on("message", do |msgin|
		console.log(msgin)
		const smsg = JSON.parse(msgin);
		console.log(smsg)
		n_errors = 0
		if smsg.connection_id
			if connection_id and not smsg.reidentify
				console.log("send back")
				send_msgs({
					connection_id: smsg.connection_id,
					reconnect_id: connection_id,
					identity: process.env.YOYTHRESTID
				}, true)
				return;
			if smsg.reconnected
				console.log("reconnected")
				connected = true
				return
			send_msgs(openmessage, true)
		if smsg.message_data
			// can be ack on login or ping
			if is_ack(smsg)
				if get_original_type(smsg) === get_type(openmessage)
					if msg_ok(smsg)
						connected = true
						n_identify_errors = 0
						console.log("connect to identity server ok")
					else
						console.error("connect to identity server failed")
						n_identify_errors += 1
						connected = false
				elif get_original_type(smsg) === get_type(pingmessage)
					n_pings -= 1
					console.log("ping ok")
			else
				console.log("what msg?")
				console.dir(smsg)

	)
	wss.on("close", do |reason|
		console.error("close")
		console.dir(reason)
		n_errors += 1
		connected = false
	)
	wss.on("error", do |error|
		n_errors += 1
		console.log("error")
		console.dir(error)		
		connected = false
	)

initiate_connection()

# Express works like usual, so we can allow JSON in the POST request:
const jsonBody = express.json({ limit: '1kb' })

app.post('/justtesting') do(req,res)
	console.dir(req)
	console.dir("body")
	console.dir(req.body)
	res.send({
		body: req.body
	})

app.get('/yts') do(req,res)
	console.log("ytsrequest")
	console.dir(req.body)
	console.dir(req.query)
	res.send()
	ytsquery.payload.query = req.query
	send_msgs(ytsquery)			

	# lag msg og send til ids-server

app.get('/yoythrest/apiadmin/ping') do(req,res)
	res.send({
		ping: "OK"
	})
# catch-all route that returns our index.html
app.get(/.*/) do(req,res)
	# only render the html for requests that prefer an html response
	unless req.accepts(['image/*', 'html']) == 'html'
		return res.sendStatus(404)

	res.send(index.body)

# Express is set up and ready to go!
imba.serve(app.listen(port))
