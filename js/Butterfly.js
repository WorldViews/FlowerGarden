
// SOme of this code is based on flower samples from
// https://www.html5canvastutorials.com/advanced/html5-canvas-blooming-flowers-effect/

"use strict"

class Butterfly extends Pic {
    constructor(opts) {
        opts.width = opts.width || 40;
        opts.height = opts.height || 30;
        opts.url = "images/butterfly1.webp";
        super(opts);
        this.vx = 0.11;
        this.vy = 0;
        this.homex = 0;
        this.homey = 0;
        this.targetURL = opts.targetURL;
    }

    tick() {
        //console.log("Butterfly tick");
        var dt = 0.001;
        var dx = this.x - this.homex;
        var dy = this.y - this.homey;
        var rs = 2;
        var rv = 1;
        var k = 0.002;
        var k2 = 0.95;
        var fx = -k * dx;
        var fy = -k * dy;
        var vrx = uniform(-rv, rv);
        var vry = uniform(-rv, rv);
        this.vx += vrx + fx;
        this.vy += vry + fy;
        this.vx *= k2;
        this.vy *= k2;
        var rx = uniform(-rs, rs);
        var ry = uniform(-rs, rs);
        this.x += this.vx + rx;
        this.y += this.vy + ry;
    }
}
