
// A garden with flowers representing Git repos for an organization
//
"use strict"

class GardenJitsi extends Garden {
    constructor(opts) {
        opts.width = opts.width || 70;
        opts.height = opts.height || 100;
        super(opts);
        this.org = opts.organization || "WorldViews";
        this.targetURL = opts.targetURL;
        this.x0 = opts.x0 || 0;
        this.y0 = opts.y0 || 0;
        this.domain = 'meet.jit.si';
        this.initJitsi();
    }

    async initJitsi() {
        var inst = this;
        var parentNode = document.getElementById("rightPanel");
        var options = {
            roomName: "GardenTivoliRoom",
            parentNode
        }
        var api = new JitsiMeetExternalAPI(this.domain, options);
        this.api = api;
        api.addEventListener('participantJoined', e => inst.participantJoined(e));
        api.addEventListener('participantLeft', e => inst.participantLeft(e));
        alert("Jitsi Initiated");
    }

    participantJoined(e) {
        console.log("participantJoined", e);
        window.LAST_E = e;
        console.log("id", e.id);
        console.log("name", e.displayName);
        alert("participant joined "+e.displayName);
    }

    participantLeft(e) {
        console.log("participantLeft", e);
        window.LAST_E = e;
        console.log("id", e.id);
        alert("left");
    }

}

//# sourceURL=js/GitGarden.js
