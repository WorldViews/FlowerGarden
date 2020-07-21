
function report(str) { console.log(str); }
function getClockTime() { return new Date()/1000.0; }

var verbosity = 1;
var VERSION = "GardenServer 0.0.0";

//var CHANNELS = ["position", "command", "people"];
var CHANNELS = ["MUSE"];

var CHANNEL_STATS = {};

var activeSockets = [];

var MongoClient = require('mongodb').MongoClient;
var sprintf = require("./js/libs/sprintf").sprintf;
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
    // NEVER use a Sync function except at start-up!
var express = require('express');
var proxy = require('express-http-proxy');
var bodyParser = require('body-parser');
var exec = require("child_process").exec;
//var cors = require('cors');
var fileupload = require('express-fileupload');

function fixPath(pstr) {
    //console.log("fixPath", pstr)
    var i = pstr.indexOf(":")
    //console.log("i", i)
    if (i >= 0 && i < pstr.length-1) {
        if (pstr[i+1] == "/" || pstr[i+1] == "\\") {
            // its alread ok
        }
        else {
            pstr = pstr.replace(":", ":/")
        }
    }
    //console.log("returning", pstr);
    return pstr;
}

function makeDirIfNeeded(dir) {
    //console.log("makeDirIfNeeded", dir);
    dir = fixPath(dir);
    dir = path.normalize(dir);
    try {
        fs.accessSync(dir);
        //console.log("dir already exists", dir)
    } catch (edir) {
        console.log("creating dir", dir);
        fs.mkdirSync(dir, { recursive: true });
    }
}

function makePathIfNeeded(dirpath) {
    //console.log("makePathIfNeeded", dirpath);
    dirpath = fixPath(dirpath);
    dirpath = path.normalize(dirpath);
    let pathComponents = dirpath.split(path.sep);
    let outdir = "";
    pathComponents.forEach(component => {
        outdir = path.join(outdir, component);
        makeDirIfNeeded(outdir);
    });
}

function verifyDir(dir) {
    return makePathIfNeeded(dir);
}

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
    console.log("request index");
    res.sendFile('./index.html', {root: __dirname});
});

//app.use(express.static("./static"));
app.use(express.static("."));
app.use(bodyParser.json());

app.use(fileupload());
//app.use(cors());


app.get('/getFlowers*', async (req, resp) => {
    console.log("/getFlowers path: "+req.path);
    var query = req.query;
    console.log("query: "+JSON.stringify(query));
    var recs = await getFlowersFromDB();
    recs.forEach(rec => console.log("Rec:", rec));
    resp.json(recs);
});

/*
app.use('/api', proxy('localhost:8080', {
    proxyReqPathResolver: function(req) {
        console.log(req.url);
        return '/api' + req.url;
    }
}))
*/

app.get('/version', function (req, res) {
    res.send('Version '+VERSION)
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

app.post('/uploadfile', function (req,res,next) {
    console.log('/uploadfile');
    if (!req.files) {
        console.log("No files provided");
      return res.json({error:'no files were uploaded.'});
    }
    var dir = req.body.dir;
    console.log("dir", dir);
    if (!dir)
      return res.json({error:'no dir'});

    var keys = Object.keys(req.files);

    var baseDir = ".";
    console.log("baseDir:", baseDir);
    var outdir = path.join(baseDir, dir);
    console.log("outdir:", outdir);
    makePathIfNeeded(outdir);

    console.log("outdir", outdir);
    var done = false;
    var n = keys.length;
    for (var i=0;i<n;i++)
    {
        var key = keys[i];
        console.log("key", key);
        var sampleFile = req.files[key];
        var fileName = sampleFile.name;
        console.log("fileName", fileName);

        var filePath = path.join(outdir, fileName);
        console.log("filePath", filePath);

        sampleFile.mv(filePath, function (err) {
            if (err) {
                return res.status(500).json({ error: err });
            }
            if (!done && i >= n) {
                done = true;
                res.status(200).json({ success: 'ok' });
            }
        });
    }   
})

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


//Beginning of quire stuff
var clientId = ":vHCsZnwSWPG-arDM79AqLtvC5HD";
var clientSecret = "cr7a64fs6amxpjtjfghfzqw6rw91akp6gik5bdje";
//const redirectURI = 'http://quire/callback';
const redirectURI = 'http://localhost/quire/callback';

const authorizationUrl = 'https://quire.io/oauth';
const tokenUrl = 'https://quire.io/oauth/token';
const apiUrlBase = 'https://quire.io/api';
var quireCode = null;
var quireTokenData = null;
var quireToken = null;
var request = require('request');

async function exchangeAccessToken(code) {
    return new Promise(function(resolve, reject){
        request.post({
            url: tokenUrl, 
            form: {
              grant_type: 'authorization_code',
              code: code,
              client_id: clientId,
              client_secret: clientSecret
            }
          }, 
          function (error, httpResponse, body) {
            if (error) {
              return reject(error);
            }
            console.log("body: "+body);
            resolve(JSON.parse(body))
          });
    });
}

function getAPIData(apiPath, token) {
    return new Promise(function(resolve, reject){
        var url = apiUrlBase + apiPath;
        //var url = 'http://quire.io/api/organization/list';
        console.log("getCurrentUser ", token, url);
        request.get({
            url: url, 
            headers: {
                //"Authorization": "Bearer " + quireToken
                "Authorization": "Bearer " + token
            }
          }, 
          function (error, httpResponse, body) {
            if (error) {
              return reject(error);
            }
            console.log("got response....", body);
            var obj;
            try {
                obj = JSON.parse(body);
                console.log("obj", obj, JSON.stringify(obj, null, 3));
            }
            catch (e) {
                obj = {'error': 'JSON parse error',
                        'url': url,
                        'string': body}
            }
            resolve(obj);
          });
    });
}

app.get('/quireStart', function (req, res) {
    console.log("/quire "+req.path);
    var query = req.query;
    console.log("query: "+JSON.stringify(query));
    var authUrl = authorizationUrl 
    + '?client_id=' + clientId 
    //+ '&redirect_uri=' + encodeURIComponent(redirectURI);
    + '&redirect_uri=' + redirectURI;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(
     '<html><body>' 
    + '<a href="' + authUrl + '">Connect Quire</a>' 
    + '</body></html>');
    res.end();
});

app.get('/quire/callback', async function (req, resp) {
    console.log("/quire "+req.path);
    var query = req.query;
    console.log("query: "+JSON.stringify(query));
    quireCode = query['code'];
    quireTokenData = await exchangeAccessToken(quireCode);
    quireToken = quireTokenData['access_token'];
    var request = require('request');
    resp.end("callback ok code "+quireCode + " token "+quireToken);
});

app.get('/quire/getUser', async function (req, res) {
    var obj = await getAPIData('/user/id/me', quireToken);
    var jstr = JSON.stringify(obj, null, 3);
    console.log("jstr", jstr);
    //res.end(jstr);
    res.json(obj);
});

app.get('/quire/getOrganizations', async function (req, res) {
    var obj = await getAPIData('/organization/list', quireToken);
    var jstr = JSON.stringify(obj, null, 3);
    console.log("jstr", jstr);
    //res.end(jstr);
    res.json(obj);
});

app.get('/quire/api*', async function (req, res) {
    var path = req.path;
    console.log("path", path);
    var apiPath = path.slice(10);
    console.log("apiPath", apiPath);
    var obj = await getAPIData(apiPath, quireToken);
    var jstr = JSON.stringify(obj, null, 3);
    console.log("jstr", jstr);
    //res.end(jstr);
    res.json(obj);
});
// End of quire stuff..


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
