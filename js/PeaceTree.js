
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
    }

    addSpiral(n, r0) {
        this.pts = [];
        var r = r0;
        for (var i=0; i<n; i++) {
            var t = 2*i;
            var x = this.x + r* Math.cos(t);
            var y = this.y + r*Math.sin(t);
            this.pts.push([x,y]);
            r += 1;
        }
    }

    draw(canvas, ctx) {
        this.drawRect(canvas, ctx, this.x, this.y, 10, 10);
        var drawLines = true;
        if (drawLines) {
            var prevPt = this.pts[0];
            ctx.beginPath();
            ctx.lineWidth = 0.2;
            ctx.strokeStyle = 'black';
            for (var i=1; i<this.pts.length; i++) {
                var pt = this.pts[i];
                ctx.moveTo(prevPt[0], prevPt[1]);
                ctx.lineTo(pt[0], pt[1]);
                prevPt = pt;
            }
            ctx.stroke();
        }
        for (var i=0; i<this.pts.length; i++) {
            var pt = this.pts[i];
            this.drawCircle(canvas, ctx, 3, pt[0], pt[1]);
        }

        this.drawText(canvas, ctx, this.x, this.y, this.name);
    }
}

