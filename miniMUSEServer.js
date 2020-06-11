
function report(str) { console.log(str); }
function getClockTime() { return new Date()/1000.0; }

var verbosity = 1;

//var CHANNELS = ["position", "command", "people"];
var CHANNELS = ["MUSE"];

var CHANNEL_STATS = {};

var activeSockets = [];

var MongoClient = require('mongodb').MongoClient;
var sprintf = require("./js/libs/sprintf").sprintf;
var http = require('http');
var https = require('https');
var fs = require('fs');
    // NEVER use a Sync function except at start-up!
var express = require('express');
var proxy = require('express-http-proxy');
var bodyParser = require('body-parser');
var exec = require("child_process").exec;


async function getFlowersFromDB(url) {
    var url = url || "mongodb://localhost:27017/";
    var db = await MongoClient.connect(url);
    var dbo = db.db("db1");
    console.log("dbo: "+dbo);
    var recs = await dbo.collection("flowers").find().toArray();
    recs.forEach(rec => {
        rec._id = rec._id.toString();
    });
    console.log("recs", recs);
    return recs;
}

async function dumpFlowersFromDB() {
    var recs = await getFlowers(url);
    console.log("recs", recs);
}

function getConfig()
{
    if (process.argv.length <= 2) {
	console.log("No config file requested");
	return;
    }
    var confPath = __dirname + "/"+ process.argv[2];
    console.log("Config: "+confPath);
/*
    if (!fs.existsSync(confPath)) {
	console.log("No config file");
	return null;
    }
*/
    var buf = fs.readFileSync(confPath);
    var conf = JSON.parse(buf);
    console.log("conf:\n"+JSON.stringify(conf, null, 3));
    return conf;
}

// getConfig();

/////////////////////////////////////////////////////////////////////
//   Setup basic http server using express.  Also handle uploaded
//   JSON via /update/ urls.
//
var serverSSL;

var app = express();
var server = http.createServer(app);

try {
    var privateKey  = fs.readFileSync('ssl/server.key', 'utf8');
    var certificate = fs.readFileSync('ssl/server.crt', 'utf8');
    var credentials = {key: privateKey, cert: certificate};
    serverSSL = https.createServer(credentials, app);
} catch (e) {
    console.log(e);
    //process.exit();
    console.log("Running with no https server");
}
    

app.get('/', function (req, res) {
    res.sendFile('./static/index.html', {root: __dirname});
});

//app.use(express.static("./static"));
app.use(express.static("."));
app.use(bodyParser.json());

app.get('/getFlowers*', async (req, resp) => {
    console.log("/getFlowers path: "+req.path);
    var query = req.query;
    console.log("query: "+JSON.stringify(query));
    var recs = await getFlowersFromDB();
    recs.forEach(rec => console.log("Rec:", rec));
    resp.json(recs);
});

app.use('/api', proxy('localhost:8080', {
    proxyReqPathResolver: function(req) {
        console.log(req.url);
        return '/api' + req.url;
    }
}))

app.get('/version', function (req, res) {
  res.send('Version 0.0.0')
});

app.get('/stats', function(req, resp){
    resp.writeHead(200, {'Content-Type': 'text/html'});
    var t = getClockTime();
    var str = "Active Clients:\n";
    str += "<pre>\n";
    activeSockets.forEach(sock => {
	var info = sock._info;
	str += "client: "+sock.client.conn.remoteAddress+"\n";
	str += "Num from: "+info.numFrom;
	str += " num to: "+info.numTo +"\n";
	if (info.lastMsgTo) {
	    var msg = info.lastMsgTo;
	    var dt = t - msg._sys.time;
	    str += sprintf("Last msg to (%.2f sec ago)\n", dt);
	    str += JSON.stringify(msg, null ,3);
	}
        str += "\n";
    });
    str += "</pre>";
    str += "<hr>";
    str += "Channels:<br>\n";
    str += "<pre>\n";
    for (var channel in CHANNEL_STATS) {
	var stats = CHANNEL_STATS[channel];
	str += channel +"\n";
	str += "Num from: "+stats.numFrom+" num to: "+stats.numTo+"\n";
	if (stats.lastMsgTo) {
	    var msg = stats.lastMsgTo;
	    var dt = t - stats.lastTime;
	    str += sprintf("Last msg to %.2f sec ago from %s:\n", dt, msg._sys.addr)
	    str += JSON.stringify(msg, null,3)+"\n";
	}
	str += "\n";
    }
    str += "</pre>";
    str += "<hr>";
    resp.end(str);
});

app.post('/update/*', function(request, response){
   var obj = request.body;
   console.log("/update path: "+request.path);
   var fileName = request.path.slice("/update/".length);
   fs.writeFileSync(fileName, JSON.stringify(obj, null, 4));
   console.log("fileName: "+fileName);
   console.log("/update got: "+JSON.stringify(obj));
   obj.size = 'big';
   console.log("returning obj: "+JSON.stringify(obj));      // your JSON
   response.send(obj);    // echo the result back
});

app.post('/upload/*', function(request, response){
   var obj = request.body;
   console.log("/upload path: "+request.path);
   console.log("body:", obj);
   var fileName = request.path.slice("/update/".length);
   //fileName = "../"+fileName; 
   console.log("fileName: "+fileName);
   fs.writeFileSync("../"+fileName, JSON.stringify(obj, null, 4));
   console.log("/upload got: "+JSON.stringify(obj));
   obj.size = 'big';
   console.log("returning obj: "+JSON.stringify(obj));      // your JSON
   response.send(obj);    // echo the result back
});

app.get('/dir/*', function (req, resp) {
    console.log("/dir path: "+req.path);
    var dirPath = req.path.slice("/dir/".length);
    dirPath =__dirname.replace("controls","data") + "/"+ dirPath;
    var obj = {dir: dirPath};
    console.log("dirPath: "+dirPath);
    fs.readdir(dirPath, function(err, items) {
        console.log("err: "+err);
        if (err) {
            obj.error = err;
            resp.send(obj);
            return;
        }
        console.log(items);
        for (var i=0; i<items.length; i++) {
            console.log(items[i]);
        }
        obj.items = items;

        resp.send(obj);
    });
});

app.get('/sendMessage*', function (req, resp) {
    console.log("/sendMessage path: "+req.path);
    var query = req.query;
    console.log("query: "+JSON.stringify(query));
    var channel = query.channel || "MUSE";
    var msg = query;
    console.log("channel: "+channel + " msg: "+JSON.stringify(msg));
    handleChannel(channel, msg, null);
    resp.end("sendMessage OK");
});

app.get('/getYoutubeVid*', function (req, resp) {
    console.log("/getYoutubeVid path: "+req.path);
    var query = req.query;
    console.log("query: "+JSON.stringify(query));
    var url = query.url;
    console.log("url: "+url);
    ytl.load(url);
});

/////////////////////////////////////////////////////////////////////
// Setup Socket.io server listening to our app
//var io = require('socket.io').listen(app);
//var io = require('socket.io').listen(server).listen(serverSSL);
var io = require('socket.io').listen(server);
if (serverSSL) {
    console.log("Listening to SSL server");
    io = io.listen(serverSSL);
}
else {
    console.log("No SSL server being used");
}

function handleDisconnect(socket)
{
    report("disconnected "+socket);
    var index = activeSockets.indexOf(socket);
    if (index >= 0) {
        activeSockets.splice(index, 1);
    }
}

function getChannelStats(channel)
{
    var stats = CHANNEL_STATS[channel];
    if (!stats) {
	stats = {numTo: 0, numFrom: 0};
	CHANNEL_STATS[channel] = stats;
    }
    return stats;
}

function handleChannel(channel, msg, sock) {
    //report("got msg on channel "+channel+": "+JSON.stringify(msg));
    var t = getClockTime();
    var stats = getChannelStats(channel);
    stats.numTo += 1;
    stats.lastMsgTo = msg;
    stats.lastTime = t;
    activeSockets.forEach(s => {
	if (s == sock) {
	    return;
	}
	try {
	    s.emit(channel, msg);
	    s._info.lastMsgTo = msg;
	    s._info.numTo++;
	}
	catch (e) {
	    report("failed to send to socket "+s);
	}
    });
    var _sys = {time: getClockTime(), addr: 'self'};
    if (sock) {
	sock._info.numFrom++;
	sock._info.lastMsgFrom = msg;
	_sys.addr = sock.client.conn.remoteAddress;
    }
    msg._sys = _sys;
}

// Emit welcome message on connection
io.on('connection', function(socket) {
    // Use socket to communicate with this particular client only, sending it it's own id
    report("got connection "+socket);
    socket._info = {numFrom: 0, numTo: 0, lastMsg: null};
    activeSockets.push(socket);
    CHANNELS.forEach(channel => {
	var stats = getChannelStats(channel);
	report("setting up events on channel "+channel);
	//socket.on(channel, msg => handleChannel(channel, msg));
	socket.on(channel, msg => {
	    stats.numFrom += 1;
	    if (typeof msg == 'string') {
		//report("warning ... converting string to obj");
		msg = JSON.parse(msg);
	    }
	    handleChannel(channel, msg, socket)});
    });
    socket.on('disconnect', obj => handleDisconnect(socket, obj));
});

var port = 4000;
var portSSL = 4433;
var addr = "0.0.0.0";
if (process.argv[3]) {
    port = process.argv[3];
}
report("listening on address: "+addr+" port:"+port);
//app.listen(port, addr);
server.listen(port, addr);

if (serverSSL) {
    report("listening SSL on address: "+addr+" port:"+portSSL);
    serverSSL.listen(portSSL, addr);
}

var localAddress = null;
if (process.argv[2]) {
    localAddress = process.argv[2];
    console.log("Got local address "+localAddress);
} else {
    require('dns').lookup(require('os').hostname(), function (err, add, fam) {
        localAddress = add;
        console.log("Got local address "+localAddress);
    })    
}
