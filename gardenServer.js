
function report(str) { console.log(str); }
function getClockTime() { return new Date() / 1000.0; }

var verbosity = 1;
var VERSION = "GardenServer 0.0.0";

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
var cors = require('cors');
var fileupload = require('express-fileupload');
var Quire = require("./js/Quire").Quire;
var MUSENode = require("./js/MUSENode").MUSENode;

function fixPath(pstr) {
    //console.log("fixPath", pstr)
    var i = pstr.indexOf(":")
    //console.log("i", i)
    if (i >= 0 && i < pstr.length - 1) {
        if (pstr[i + 1] == "/" || pstr[i + 1] == "\\") {
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

function getConfig() {
    if (process.argv.length <= 2) {
        console.log("No config file requested");
        return;
    }
    var confPath = __dirname + "/" + process.argv[2];
    console.log("Config: " + confPath);
    /*
        if (!fs.existsSync(confPath)) {
        console.log("No config file");
        return null;
        }
    */
    var buf = fs.readFileSync(confPath);
    var conf = JSON.parse(buf);
    console.log("conf:\n" + JSON.stringify(conf, null, 3));
    return conf;
}

// getConfig();

/////////////////////////////////////////////////////////////////////
//   Setup basic http server using express.

var serverSSL;
var app = express();
var server = http.createServer(app);

// Try to find certificate and run SSL server
try {
    var privateKey = fs.readFileSync('ssl/server.key', 'utf8');
    var certificate = fs.readFileSync('ssl/server.crt', 'utf8');
    var credentials = { key: privateKey, cert: certificate };
    serverSSL = https.createServer(credentials, app);
} catch (e) {
    //console.log(e);
    //process.exit();
    console.log("*** Running with no https server");
}


//app.use(express.static("./static"));
app.use(express.static("."));
app.use("/rhythm", express.static("../RhythmTools/public"))
app.use(bodyParser.json());

app.use(fileupload());
app.use(cors());

// just a test to check deployment using nginx
app.get('/api', function (req, res) {
    console.log("request index");
    res.sendFile('./index.html', { root: __dirname });
});


app.get('/api/version', function (req, res) {
    res.send('Version ' + VERSION)
});


app.post('/update/*', function (request, response) {
    var obj = request.body;
    console.log("/update path: " + request.path);
    var fileName = request.path.slice("/update/".length);
    fs.writeFileSync(fileName, JSON.stringify(obj, null, 4));
    console.log("fileName: " + fileName);
    console.log("/update got: " + JSON.stringify(obj));
    obj.size = 'big';
    console.log("returning obj: " + JSON.stringify(obj));      // your JSON
    response.send(obj);    // echo the result back
});

app.post('/upload/*', function (request, response) {
    var obj = request.body;
    console.log("/upload path: " + request.path);
    console.log("body:", obj);
    var fileName = request.path.slice("/update/".length);
    //fileName = "../"+fileName; 
    console.log("fileName: " + fileName);
    fs.writeFileSync("../" + fileName, JSON.stringify(obj, null, 4));
    console.log("/upload got: " + JSON.stringify(obj));
    obj.size = 'big';
    console.log("returning obj: " + JSON.stringify(obj));      // your JSON
    response.send(obj);    // echo the result back
});

app.post('/uploadfile', function (req, res, next) {
    console.log('/uploadfile');
    if (!req.files) {
        console.log("No files provided");
        return res.json({ error: 'no files were uploaded.' });
    }
    var dir = req.body.dir;
    console.log("dir", dir);
    if (!dir)
        return res.json({ error: 'no dir' });

    var keys = Object.keys(req.files);

    var baseDir = ".";
    console.log("baseDir:", baseDir);
    var outdir = path.join(baseDir, dir);
    console.log("outdir:", outdir);
    makePathIfNeeded(outdir);

    console.log("outdir", outdir);
    var done = false;
    var n = keys.length;
    for (var i = 0; i < n; i++) {
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
    console.log("/dir path: " + req.path);
    var dirPath = req.path.slice("/dir/".length);
    dirPath = __dirname.replace("controls", "data") + "/" + dirPath;
    var obj = { dir: dirPath };
    console.log("dirPath: " + dirPath);
    fs.readdir(dirPath, function (err, items) {
        console.log("err: " + err);
        if (err) {
            obj.error = err;
            resp.send(obj);
            return;
        }
        console.log(items);
        for (var i = 0; i < items.length; i++) {
            console.log(items[i]);
        }
        obj.items = items;

        resp.send(obj);
    });
});


app.get('/getYoutubeVid*', function (req, resp) {
    console.log("/getYoutubeVid path: " + req.path);
    var query = req.query;
    console.log("query: " + JSON.stringify(query));
    var url = query.url;
    console.log("url: " + url);
    ytl.load(url);
});


//Beginning of quire stuff
Quire(app);
MUSENode(app, server, serverSSL);

var port = 4000;
var portSSL = 4433;
var addr = "0.0.0.0";
if (process.argv[3]) {
    port = process.argv[3];
}
report("listening on address: " + addr + " port:" + port);
//app.listen(port, addr);
server.listen(port, addr);

if (serverSSL) {
    report("listening SSL on address: " + addr + " port:" + portSSL);
    serverSSL.listen(portSSL, addr);
}

/*
var localAddress = null;
if (process.argv[2]) {
    localAddress = process.argv[2];
    console.log("Got local address " + localAddress);
} else {
    require('dns').lookup(require('os').hostname(), function (err, add, fam) {
        localAddress = add;
        console.log("Got local address " + localAddress);
    })
}
*/
