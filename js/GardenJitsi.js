
// A garden with flowers representing Git repos for an organization
//
"use strict"

// This is a garden now, but that probably doesn't make 
// sense since it doesn't render in a canvas, but in div.
class GardenJitsi extends Garden {
    constructor(gtool, opts) {
        console.log("GardenJitsi", opts);
        opts = opts || {};
        opts.width = opts.width || 70;
        opts.height = opts.height || 100;
        super(opts);
        this.org = opts.organization || "WorldViews";
        this.targetURL = opts.targetURL;
        this.x0 = opts.x0 || 0;
        this.y0 = opts.y0 || 0;
        this.domain = 'meet.jit.si';
        this.parentId = opts.parentId || "rightPanel";
        this.initJitsi();
    }

    async initJitsi() {
        var parentId = this.parentId;
        console.log("initJitsi", parentId);
        //$("#rightPanel").html("");
        $("#"+parentId).html("");
        var inst = this;
        //var parentNode = document.getElementById("rightPanel");
        var parentNode = document.getElementById(parentId);
        var options = {
            roomName: "GardenTivoliRoom",
            parentNode
        }
        var api = new JitsiMeetExternalAPI(this.domain, options);
        this.api = api;
        api.addEventListener('participantJoined', e => inst.participantJoined(e));
        api.addEventListener('participantLeft', e => inst.participantLeft(e));
        //alert("Jitsi Initiated");
    }

    participantJoined(e) {
        console.log("participantJoined", e);
        window.LAST_E = e;
        console.log("id", e.id);
        console.log("name", e.displayName);
        //alert("participant joined "+e.displayName);
    }

    participantLeft(e) {
        console.log("participantLeft", e);
        window.LAST_E = e;
        console.log("id", e.id);
        //alert("left");
    }

}

//# sourceURL=js/GitGarden.js
