
console.log("Loading MUSEControl.js");

var CURRENT_CHOICE = null;
var CURRENT_YAW = 0;

//function getParameterByName(name) {
//    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
//    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
//}

if (typeof io == "undefined") {
    var io = require("socket.io-client");
}

/*
This class uses socket.io to disribute messages.
If the server is running on worldviews the nginx config routes
paths starting with /FlowerGarden/api to the node server and
all other urls are handled statically by nginx.   So to
get through our node server, the URL used by the socket.io
client must connect using /FlowerGarden/api/socket.io.
*/
class MUSEControl
{
    constructor(sioURL, sioPath) {
        var inst = this;
        if (!sioURL) {
            sioURL = getParameterByName("sioURL");
        }
        if (!sioURL) {
            sioURL = document.location.host;
        }
        this.url = sioURL;
        if (!sioPath) {
             sioPath = getParameterByName("sioPath");
        }
        if (!sioPath) {
            if (document.location.host == "worldviews.org")
                sioPath = "/FlowerGarden/api/socket.io";
            else    
                sioPath = "/api/socket.io";
        }
        var opts = {path: sioPath};
        console.log("getting socket at: "+sioURL, opts);
        this.sock = io(sioURL, opts);
        console.log("Got socket "+this.sock);
        this.sock.on("MUSE", msg => {
            inst.handleMessage(msg);
        });
        this.msgHandler = null;
        //setInterval(function() { inst.update(); }, 50);
    }

    setMessageHandler(handler) {
        this.msgHandler = handler;
    }

    handleMessage(msg) {
        console.log("Got message: ", msg);
        if (this.msgHandler)
            this.msgHandler(msg);
    }

    sendMessage(msg, channel) {
        channel = channel || "MUSE";
        var jstr = JSON.stringify(msg);
        console.log("MUSEControl.sendMessage "+channel+" "+ jstr);
        this.sock.emit(channel, jstr);
    }

    setYawPitch(yaw, pitch)
    {
        pitch = pitch || 0;
        let msg = {'type': 'pano.control', panoView: [yaw, pitch]};
        console.log("setYawPitch sending "+JSON.stringify(msg));
        portal.sendMessage(msg);
    }

    panScene(deg)
    {
        //deg = deg || 0.5;
        deg = deg || 1.0;
        CURRENT_YAW += deg;
        console.log("pan scene by "+deg);
        portal.sendMessage({'type': 'pano.control',
                            panoView: [CURRENT_YAW,0]} );
    }
    
    setPlayTime(t) {
        this.sendMessage({'type': 'setPlayTime', time: t} );
    }

    play() {
        this.sendMessage({type: 'play', playSpeed: 1} );
    }

    pause() {
        this.sendMessage({type: 'pause', playSpeed: 0} );
    }

    setVolume(v) {
        this.sendMessage({type: 'setVolume', volume: v} );
    }

    setVideoId(videoId) {
        console.log("MUSEControl.setVideo "+videoId);
        var msg = {type: 'setVideoId',
                   videoId: videoId
                  };
        this.sendMessage(msg);
    }

    setDisplayURL(url) {
        console.log("MUSEControl.setDisplayURL "+url);
        var msg = {type: 'setDisplayURL',
                   url: url
                  };
        this.sendMessage(msg);
    }
}

if (typeof exports !== 'undefined') {
    console.log("setting up exports");
    exports.MUSEControl = MUSEControl;
}
