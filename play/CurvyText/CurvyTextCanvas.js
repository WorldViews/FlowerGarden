
"use strict";


class CurvyTextCanvas {
    constructor() {
        this.canvas = document.querySelector("#curvyTextCanvas");
        if (!this.canvas) {
            alert("Cannot get canvas at canvasTextCanvas");
        }
        this.rotation = 0;
        this.ringSpacing = 35;
        this.rMin = 60;
        this.font = "20px Ariel";
        var str = "Now is the time to check your wallets and start  your engines.";
        var reps = 10;
        var text = str;
        for (var i=0; i<reps-1; i++) {
            text += " "+str;
        }
        this.text = text;
        this.draw();
    }

    start() {
        var inst = this;
        requestAnimationFrame(() => inst.update());
    }

    update() {
        var inst = this;
        this.rotation += 0.01;
        this.draw();
        requestAnimationFrame(() => inst.update());
    }

    draw() {
        var canvas = this.canvas;
        var ctx = canvas.getContext("2d");
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'black';
        ctx.fillStyle = 'white';
        var cx = canvas.width/2;
        var cy = canvas.height/2;
        //ctx.strokeRect(0, 0, canvas.width, canvas.height);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        this.drawText(canvas, ctx, cx, cy, this.text);
    }

    drawText(canvas, ctx, x, y, str) {
        //var s = .2;
        ctx.save();
        ctx.translate(x, y);
        if (this.font)
            ctx.font = this.font;
        ctx.textAlign = this.textAlign;
        ctx.fillStyle = this.textStyle || "black";
        var x0 = 0;
        var y0 = 0;
        var t0 = this.rotation;
        var t = t0;
        var rMin = this.rMin;

        var orient = Math.PI / 2;
        //ctx.translate(x, y);
        for (var i = 0; i < str.length; i++) {
            //var r = rMin + w * (t - t0) / (2 * Math.PI);
            var r = rMin + this.ringSpacing * (t / (2 * Math.PI));
            var chr = str[i];
            var metrics = ctx.measureText(chr);
            window.metrics = metrics;
            let fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
            //let actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            //console.log("height:", actualHeight);
            //ctx.translate(0, s * metrics.actualBoundingBoxAscent);
            //ctx.fillText(str, x, y);
            //var ds = 20;
            var ds = metrics.width / 2 + 5;
            var tx = x0 + r * Math.cos(t);
            var ty = y0 + r * Math.sin(t);
            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(t + orient);
            ctx.fillText(chr, 0, 0);
            ctx.restore();
            // ds = r * dt
            // dt = ds / r
            var dt = ds / r;
            t += dt;
        }
        ctx.restore();
    }

}

