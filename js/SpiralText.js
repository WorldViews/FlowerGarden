"use strict"


class SpiralText extends CanvasTool.TextGraphic {
    constructor(opts) {
        if (opts.repeat) {
            var text = "";
            for (var i = 0; i < opts.repeat; i++) {
                if (i > 0)
                    text += "  ";
                text += opts.text;
            }
            opts.text = text;
        }
        super(opts);
        this.rMin = opts.rMin || 100;
        this.rotation = 20;
        //this.font = "40px Arial";
    }

    tick() {
        this.rotation += 0.01;
    }

    draw(canvas, ctx) {
        ctx.save();
        this.drawText(canvas, ctx, this.x, this.y, this.text, this.font);
        ctx.restore();
    }

    drawText1(canvas, ctx, x, y, str, font) {
        font = font || "1px Arial";
        //var s = .2;
        ctx.save();
        ctx.translate(x, y);
        //ctx.scale(s, s);
        ctx.font = font;
        ctx.textAlign = this.textAlign;
        ctx.fillStyle = this.textStyle || "black";
        //var x0 = x;
        //var y0 = y;
        var x1 = x;
        var y1 = y;
        var x0 = 0;
        var y0 = 0;
        var t0 = -this.rotation;
        var t = t0;
        var rMin = this.rMin;
        var w = 80;
        var orient = Math.PI / 2;
        //ctx.translate(x, y);
        for (var i = 0; i < str.length; i++) {
            var r = rMin + w * (t - t0) / (2 * Math.PI);
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
            x = x0 + r * Math.cos(t);
            y = y0 + r * Math.sin(t);
            if (1) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(t + orient);
                ctx.fillText(chr, 0, 0);
                ctx.restore();
            }
            else {
                var c = Math.cos(t + orient);
                var s = Math.sin(t + orient);
                ctx.setTransform(c, s, -s, c, x1 + x + 200, y1 + y + 200);
                ctx.fillText(chr, 0, 0);
            }
            // ds = r * dt
            // dt = ds / r
            var dt = ds / r;
            t += dt;
        }
        ctx.restore();
    }

    drawText(canvas, ctx, x, y, str, font) {
        font = font || "1px Arial";
        //var s = .2;
        ctx.save();
        ctx.translate(x, y);
        //ctx.scale(s, s);
        ctx.font = font;
        ctx.textAlign = this.textAlign;
        ctx.fillStyle = this.textStyle || "black";
        var x0 = 0;
        var y0 = 0;
        var t0 = -this.rotation;
        var t = t0;
        var rMin = this.rMin;
        var w = 80;
        var orient = Math.PI / 2;
        //ctx.translate(x, y);
        for (var i = 0; i < str.length; i++) {
            //var r = rMin + w * (t - t0) / (2 * Math.PI);
            var r = rMin + w * (t ) / (2 * Math.PI);
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
            x = x0 + r * Math.cos(t);
            y = y0 + r * Math.sin(t);
            ctx.save();
            ctx.translate(x, y);
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
