/*
This Node extension adds socket.io based MUSE messaging to a node server.
Usage:
   var MUSENode = require(".//js/MUSENode").MUSENode;
   MUSENode(app,server,serverSSL);
   
   The serverSSL is optional
*/
function report(str) { console.log(str); }
function getClockTime() { return new Date() / 1000.0; }

var verbosity = 1;

//var CHANNELS = ["position", "command", "people"];
var CHANNELS = ["MUSE"];

var CHANNEL_STATS = {};

var activeSockets = [];

var sprintf = require("./libs/sprintf").sprintf;

function handleDisconnect(socket) {
    report("disconnected " + socket);
    var index = activeSockets.indexOf(socket);
    if (index >= 0) {
        activeSockets.splice(index, 1);
    }
}

function getChannelStats(channel) {
    var stats = CHANNEL_STATS[channel];
    if (!stats) {
        stats = { numTo: 0, numFrom: 0 };
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
            report("failed to send to socket " + s);
        }
    });
    var _sys = { time: getClockTime(), addr: 'self' };
    if (sock) {
        sock._info.numFrom++;
        sock._info.lastMsgFrom = msg;
        _sys.addr = sock.client.conn.remoteAddress;
    }
    msg._sys = _sys;
}

function setupMUSE(app, server, serverSSL) {
    app.get('/api/stats', function (req, resp) {
        resp.writeHead(200, { 'Content-Type': 'text/html' });
        var t = getClockTime();
        var str = "Active Clients:\n";
        str += "<pre>\n";
        activeSockets.forEach(sock => {
            var info = sock._info;
            str += "client: " + sock.client.conn.remoteAddress + "\n";
            str += "Num from: " + info.numFrom;
            str += " num to: " + info.numTo + "\n";
            if (info.lastMsgTo) {
                var msg = info.lastMsgTo;
                var dt = t - msg._sys.time;
                str += sprintf("Last msg to (%.2f sec ago)\n", dt);
                str += JSON.stringify(msg, null, 3);
            }
            str += "\n";
        });
        str += "</pre>";
        str += "<hr>";
        str += "Channels:<br>\n";
        str += "<pre>\n";
        for (var channel in CHANNEL_STATS) {
            var stats = CHANNEL_STATS[channel];
            str += channel + "\n";
            str += "Num from: " + stats.numFrom + " num to: " + stats.numTo + "\n";
            if (stats.lastMsgTo) {
                var msg = stats.lastMsgTo;
                var dt = t - stats.lastTime;
                str += sprintf("Last msg to %.2f sec ago from %s:\n", dt, msg._sys.addr)
                str += JSON.stringify(msg, null, 3) + "\n";
            }
            str += "\n";
        }
        str += "</pre>";
        str += "<hr>";
        resp.end(str);
    });


    app.get('/api/sendMessage*', function (req, resp) {
        console.log("/api/sendMessage path: " + req.path);
        var query = req.query;
        console.log("query: " + JSON.stringify(query));
        var channel = query.channel || "MUSE";
        var msg = query;
        console.log("channel: " + channel + " msg: " + JSON.stringify(msg));
        handleChannel(channel, msg, null);
        resp.end("sendMessage OK");
    });



    /////////////////////////////////////////////////////////////////////
    // Setup Socket.io server listening to our app
    //var io = require('socket.io').listen(app);
    //var io = require('socket.io').listen(server).listen(serverSSL);
    //var io = require('socket.io').listen(server);
    var io = require('socket.io')({ path: '/api/socket.io' }).listen(server);
    if (serverSSL) {
        console.log("Listening to SSL server");
        io = io.listen(serverSSL);
    }
    else {
        console.log("No SSL server being used");
    }


    // Emit welcome message on connection
    io.on('connection', function (socket) {
        // Use socket to communicate with this particular client only, sending it it's own id
        report("got connection " + socket);
        socket._info = { numFrom: 0, numTo: 0, lastMsg: null };
        activeSockets.push(socket);
        CHANNELS.forEach(channel => {
            var stats = getChannelStats(channel);
            report("setting up events on channel " + channel);
            //socket.on(channel, msg => handleChannel(channel, msg));
            socket.on(channel, msg => {
                stats.numFrom += 1;
                if (typeof msg == 'string') {
                    //report("warning ... converting string to obj");
                    msg = JSON.parse(msg);
                }
                handleChannel(channel, msg, socket)
            });
        });
        socket.on('disconnect', obj => handleDisconnect(socket, obj));
    });
}

exports.MUSENode = setupMUSE;



