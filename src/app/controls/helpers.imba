import moment from "moment";

const timestamp = do()
	moment.defaultFormat = "YYYY-MM-DDTHH:mm:ss.SSSZ"
	return moment().format().trim();

def get_type(msg)
	if msg && msg.message_data
		return msg.message_data.type
	return undefined

def is_ack(msg)
	return msg.message_data.type === "ACK"

def get_original_type(msg)
	return msg.message_data.original.type

def msg_ok(msg)
	return msg.message_data.request_data && msg.message_data.request_data.requestType && msg.message_data.request_data.requestType != "ERROR"

def get_date(dd: Date)
	let d
	if dd 
		d = dd
	else
		d = new Date()
	return d.toISOString().substring(0,10)

def get_dayno(dd: string)
	const d = new Date(dd)
	let dayno = d.getDay()
	if dayno === 0
		dayno = 7
	return dayno

def get_month(dd)
	return get_date(dd)[0:7]

def get_year(dd)
	return get_date(dd)[0:4]

def get_week(dd)
	const d = new Date(dd)
	let week = d.isoWeek();
	if (week < 10)
		week = "0" + week;
	return get_year(dd) + "W" + week

def translate_attr(attrid, translate_to)
	if typeof translate_to[attrid] === "string" 
		return translate_to[attrid]
	else
		if attrid === "dayno"
			return get_dayno()
		if attrid === "today"
			return get_date()
		if attrid === "week"
			return get_week()
		if attrid === "month"
			return get_month()
		if attrid === "year"
			return get_month()
		return "\{" + attrid + "\}"

def translate_text(text, translate_to)
	let newtext = text
	let ix2 = -1
	while true
		let ix1 = newtext.indexOf('\{', ix2+1)
		if ix1 === -1
			return newtext
		ix2 = newtext.indexOf('\}', ix1)
		if ix2 === -1 
			return newtext
		let pref = ""
		let post = ""
		if ix1 > 0
			pref = newtext.substring(0,ix1)  			
		if ix2 < newtext.length - 1
			post = newtext.substring(ix2+1)
		newtext = pref + translate_attr(newtext.substring(ix1+1, ix2), translate_to) + post
		
def clone_and_translate_array(attributes, translate_to)
	let new_values = []
	for attribute, ix in attributes
		let res
		if attribute.indexOf("\{") == 0 
			res = attribute.split("\{")[1].split("\}")[0]
		else
			res = attribute
		if Array.isArray(translate_to[res]) and res.length == attribute.length - 2
			new_values.push(translate_to[res])
		else 
			new_values.push(translate_text(attribute, translate_to))
	return new_values

export {get_dayno, get_date, get_month, get_year, get_week, clone_and_translate_array, translate_text, is_ack, get_type, get_original_type, msg_ok}