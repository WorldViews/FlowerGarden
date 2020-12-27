
"use strict";

function toRadians(d) { return Math.PI*d/180.0; }
function toDegrees(r) { return 180*r/Math.PI; }

class CurvyTextCSS {
    constructor() {
        this.text = "";
        this.rotation = 0;
        this.cx = 400;
        this.cy = 400;
        this.r0 = 100;
        this.spacing = 60;
        this.textId = "#curvyText";
    }

    setText(text, reps) {
        reps = reps || 1;
        var str = text;
        for (var i=0; i<reps-1; i++) {
            str = str + " " + text;
        }
        text = str;
        this.text = text;
        var str = "";
        for (var i=0; i<text.length; i++) {
            var c = text[i];
            var span = `<span id="c${i+1}">${c}</span>\n`;
            str += span
        }
        console.log("str", str);
        $(this.textId).html(str);
    }

    setChrPose(i, x, y, angle) {
        var id = "#c" + i;
        var trans = "translate(" + x + "px," + y + "px) rotate(" + angle + "deg)";
        //console.log(id, trans);
        $(id).css('webkit-transform', trans);
    }

    positionOnSpiral() {
        var r = this.r0;
        var theta0 = this.rotation;
        var theta = theta0;
        var h = this.spacing;
        var orient = 90;
        for (var i = 1; i <= this.text.length; i++) {
            r = this.r0 + h*(theta - theta0) / (2 * Math.PI)
            var x = this.cx + r*Math.cos(theta);
            var y = this.cy + r*Math.sin(theta);
            this.setChrPose(i, x, y, toDegrees(theta)+orient);
            var ds = 20;
            var dTheta = ds / r;
            theta += dTheta;
        }
    }

    update() {
        var inst = this;
        this.positionOnSpiral();
        this.rotation += 0.005;
        requestAnimationFrame(() => inst.update());
    }

    start(){
        this.update();
    }
}



