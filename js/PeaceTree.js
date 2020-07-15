
// SOme of this code is based on flower samples from
// https://www.html5canvastutorials.com/advanced/html5-canvas-blooming-flowers-effect/

"use strict"

console.log("in PeaceTree.js");

class PeaceTree extends CanvasTool.Graphic {
    constructor(opts) {
        super(opts);
        this.name = opts.name;
        console.log("PeaceTree ...yup ... opts", opts);
        this.pts = [];
        this.addSpiral(32, 25);
        window.PT = this;
        this.value = 0;
        this.dataUrl = "https://io.adafruit.com/api/v2/reachandteach/feeds/peacetree";
        this.getData();
        this.mqtt = null;
        //this.startMQTT();
        this.startPolling();
    }

    startMQTT() {
        var inst = this;
        try {
            this.mqtt = new GardenMQTT();
            this.mqtt.observer = val => inst.noticeVal(val);
            this.mqtt.connect();
        }
        catch (e) {
            console.log("Cannot get and connect MQTT", e);
        }
    }

    noticeVal(val) {
        console.log("PeaceTree.noticeVal", val);
        this.value = Number(val);
    }

    startPolling() {
        var inst = this;
        this.pollingId = setInterval(() => inst.getData(), 5000);
    }

    async getData() {
        var data = await loadJSON(this.dataUrl);
        console.log("***** PeaceTree score ****", data);
        this.value = Number(data.last_value);
    }

    addSpiral(n, r0) {
        this.pts = [];
        var r = r0;
        for (var i = 0; i < n; i++) {
            var t = 2 * i;
            var x = this.x + r * Math.cos(t);
            var y = this.y + r * Math.sin(t);
            this.pts.push([x, y]);
            r += 1;
        }
    }

    getColor() {
        var r = Math.floor(this.value/4);
        return sprintf("rgb(%d,%d,%d)", r, 100, 0);
    }

    draw(canvas, ctx) {
        this.drawRect(canvas, ctx, this.x, this.y, 10, 10);
        var drawLines = true;
        if (drawLines) {
            var prevPt = this.pts[0];
            ctx.beginPath();
            ctx.lineWidth = 0.2;
            ctx.strokeStyle = 'black';
            for (var i = 1; i < this.pts.length; i++) {
                var pt = this.pts[i];
                ctx.moveTo(prevPt[0], prevPt[1]);
                ctx.lineTo(pt[0], pt[1]);
                prevPt = pt;
            }
            ctx.stroke();
        }
        this.fillStyle = this.getColor();
        for (var i = 0; i < this.pts.length; i++) {
            var pt = this.pts[i];
            this.drawCircle(canvas, ctx, 3, pt[0], pt[1]);
        }

        this.drawText(canvas, ctx, this.x, this.y, this.name);
    }
}

