
var tool = null;

function getClockTime() {
    return new Date().getTime() / 1000.0;
}

var Light_num = 0;
class Light extends CanvasTool.Graphic {
    constructor(opts) {
        opts.id = opts.id || Light_num++;
        super(opts);
        this.vx = 0;
        this.vy = 0;
        this.radius = 5;
        this.rgb = [100, 200, 30];
    }

    static reset() {
        Light_num = 0;
    }

    tick() {
    }

    onClick(e) {
        this.happiness = 0;
        if (e.shiftKey)
            this.happiness = 1;
    }

    adjustPosition() {
        if (0) {
            var s = 6;
            this.x += s * (Math.random() - 0.5);
            this.y += s * (Math.random() - 0.5);
        }
        else {
            var s = 1;
            this.vx += s * (Math.random() - 0.5);
            this.vy += s * (Math.random() - 0.5);
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= .9;
            this.vy *= .9;
        }
    }

    setState(rgb) {
        this.rgb = rgb;
        var r, g, b;
        [r, g, b] = this.rgb;
        this.fillStyle = sprintf("rgb(%d,%d,%d)", r, g, b);
    }

    getState() {
        return this.rgb.slice();
    }

}

class Link extends CanvasTool.Graphic {
    constructor(opts) {
        super(opts);
        this.id1 = opts.id1;
        this.id2 = opts.id2;
    }

    draw(canvas, ctx) {
        //console.log("Link.draw");
        var a1 = tool.getGraphic(this.id1);
        var a2 = tool.getGraphic(this.id2);
        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.strokeStyle;
        ctx.fillStyle = this.fillStyle;
        ctx.beginPath();
        ctx.moveTo(a1.x, a1.y);
        ctx.lineTo(a2.x, a2.y);
        ctx.fill();
        ctx.stroke();
    }
}


class Blinky extends CanvasTool {
    constructor(canvasName) {
        super(canvasName);
        tool = this;
        this.background = "#111";
        this.distThresh = 50;
        this.numLights = 40;
        this.harmony = 50;
        this.run = true;
        this.grid = true;
        this.style = "spiral";
        this.rule = "snake";
        this.mobile = false;
        this.speed = 1;
        this.playTime = 0;
        this.prevClockTime = getClockTime();
        this.setupDATGUI();
        this.initBlinky();
    }

    setupDATGUI() {
        var P = this;
        var gui = new dat.GUI();
        gui.add(P, 'numLights', 1, 200).onChange(() => P.reset());
        //gui.add(P, 'distThresh', 0, 200);
        gui.add(P, 'harmony', 0, 100);
        //gui.add(P, 'run');
        gui.add(P, "speed", 0, 5);
        gui.add(P, 'style', ['grid', 'random', 'spiral']).onChange(() => P.reset());
        gui.add(P, 'rule', ['blinky', 'uniform', 'snake']).onChange(() => P.reset());
        gui.add(P, 'reset');
    }

    update() {
        this.reset();
        this.tick();
    }

    reset() {
        this.initBlinky();
    }

    add(x, y, id) {
        var light = new Light({ x, y });
        this.lights[light.id] = light;
        this.lightVec.push(light);
        this.addGraphic(light);
        return light;
    }

    addLink(id1, id2) {
        var link = new Link({ id: "link" + this.numLinks++, id1, id2 });
        this.links[[id1, id2]] = link;
        this.addGraphic(link);
    }

    connect(id1, id2) {
        this.links[[id1, id2]] = true;
    }

    distBetween(id1, id2) {
        var a1 = this.lights[id1];
        var a2 = this.lights[id2];
        var dx = a1.x - a2.x;
        var dy = a1.y - a2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    initBlinky() {
        tool = this;
        super.init();
        this.setView(300, 300, 800)
        Light.reset();
        this.numLights = Math.floor(this.numLights);
        this.playTime = 0;
        this.prevClockTime = getClockTime();
        this.stepNum = 0;
        this.numLinks = 0;
        this.lights = {};
        this.lightVec = [];
        this.links = {};
        this.initPositions();
        //console.log("*** graphics:", this.graphics);
    }

    initPositions() {
        var style = this.style;
        console.log("initPositions:", style);
        if (style == "spiral") {
            return this.initSpiral();
        }
        if (style == "grid") {
            return this.initGrid();
        }
        if (style == "random") {
            return this.initRand();
        }
        alert("Unrecognized style " + style);
    }

    initSpiral() {
        var x0 = 250;
        var y0 = 250;

        var a = .6;
        var b = 10;
        var prev = null;
        for (var i = 0; i < this.numLights; i++) {
            var t = a * i;
            var r = b * t;
            var x = x0 + r * Math.cos(a * t);
            var y = y0 + r * Math.sin(a * t);
            var node = this.add(x, y, i);
            if (prev) {
                this.addLink(node.id, prev.id);
            }
            prev = node;
        }
    }

    initTree() {
        var node = this.add(100, 100, 0);
        this.i0 = 1;
        var N = this.numLights;
        this.addChildren(node, 1, 3);
    }

    addChildren(parent, level, maxLevel) {
        var x = parent.x - 30;
        var y = parent.y + 100;
        for (var i = 0; i < nChildren; i++) {
            var N = Math.floor(sizes[i]);
            if (this.i0 >= this.numLights)
                return;
            var node = this.add(x, y, this.i0);
            this.connect(parent.id, node.id);
            nodes.push(node);
            x += 10;
            i += 1;
        }
        return i;
    }

    initGrid() {
        var n = Math.sqrt(this.numLights);
        n = Math.floor(n);
        var W = 600;
        var H = 600;
        var w = W / n;
        var h = H / n;
        for (var i = 0; i < this.numLights; i++) {
            var j = Math.floor(i / n);
            var k = i % n;
            var x = j * w;
            var y = k * h;
            this.add(x, y, i);
        }
    }

    initRand() {
        var W = 600;
        var H = 600;
        for (var i = 0; i < this.numLights; i++) {
            var x = Math.random() * W;
            var y = Math.random() * H;
            this.add(x, y, i);
        }
    }

    adjustStates0() {
        for (var id in this.lights)
            this.lights[id].adjustState();
    }

    adjustStates() {
        var rule = this.rule;
        var cells = this.lightVec;
        if (rule == "snake") {
            update_snake(cells, this.harmony, this.stepNum, this.playTime, this);
        }
        if (rule == "uniform") {
            update_uniform(cells, this.harmony, this.stepNum, this.playTime, this);
        }
        if (rule == "blinky") {
            update_blinky(cells, this.harmony, this.stepNum, this.playTime, this);
        }
    }

    adjustPositions() {
        for (var id in this.lights)
            this.lights[id].adjustPosition();
    }

    computeLinks(maxDist) {
        this.links = {};
        for (var i1 in this.lights) {
            for (var i2 in this.lights) {
                if (this.distBetween(i1, i2) < maxDist)
                    this.connect(i1, i2);
            }
        }
    }

    drawLinks() {
        var ctx = this.canvas.getContext('2d');
        this.setTransform(ctx);
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.strokeStyle;
        //ctx.fillStyle = this.fillStyle;
        ctx.fillStyle = this.null;
        ctx.beginPath();
        for (var id1 in this.lights) {
            var a1 = this.lights[id1];
            for (var id2 in this.lights) {
                if (!this.links[[id1, id2]])
                    continue;
                var a2 = this.lights[id2];
                ctx.moveTo(a1.x, a1.y);
                ctx.lineTo(a2.x, a2.y);
            }
        }
        ctx.stroke();
    }

    draw() {
        super.clearCanvas();
        this.drawLinks();
        super.drawGraphics();
    }

    getNumLights() {
        return Object.keys(this.lights).length;
    }

    tick() {
        //console.log("tick...");
        var t = getClockTime();
        var dt = t - this.prevClockTime;
        this.prevClockTime = t;
        this.playTime += this.speed * dt;
        this.stepNum++;
        var str = sprintf("t: %8.2f N: %3d NumLights: %3d",
            this.playTime, this.stepNum, this.getNumLights())
        $("#stats").html(str);
        if (this.mobile)
            this.adjustPositions();
        this.adjustStates();
        //this.computeLinks(this.distThresh);
        this.draw();
        for (var id in this.lights)
            this.lights[id].tick();
    }

    start() {
        console.log("Blinky.start");
        this.init();
        this.initBlinky();
        this.tick();
        let inst = this;
        setInterval(() => inst.tick(), 20);
    }
}



function update_snake(cells, harmony, stepNum, t, tool) {

    var n = cells.length;
    if (stepNum % 10 != 0)
        return;
    /*
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    cells[n - 1].setState([r, g, b]);
    */
    h = (0.2*t) % 1;
    s = 0.99;
    l = harmony/100.0;
    console.log("h,s,l", h, s, l);
    var rgb = hslToRgb(h,s,l);
    cells[n-1].setState(rgb);
    for (var i = 0; i < n - 1; i++) {
        cells[i].setState(cells[i + 1].getState());
    }
}

function update_uniform(cells, harmony, stepNum, t, tool) {
    var v = Math.floor(255 * harmony / 100.00);
    for (var i = 0; i < cells.length; i++) {
        cells[i].setState([v, v, v]);
    }
}

function update_blinky(cells, harmony, stepNum, t, tool) {
    var n = cells.length;
    var rgb;
    var k = Math.floor(t * harmony / 15) % 2;
    for (var i = 0; i < n; i++) {
        if (k == 0)
            rgb = [250, 60, 20];
        else
            rgb = [20, 250, 40];
        cells[i].setState(rgb);
    }
}

//https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
/**
* Converts an HSL color value to RGB. Conversion formula
* adapted from http://en.wikipedia.org/wiki/HSL_color_space.
* Assumes h, s, and l are contained in the set [0, 1] and
* returns r, g, and b in the set [0, 255].
*
* @param   {number}  h       The hue
* @param   {number}  s       The saturation
* @param   {number}  l       The lightness
* @return  {Array}           The RGB representation
*/
function hslToRgb(h, s, l) {
    var r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}