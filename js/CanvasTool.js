// Class for 2D visualization for Kinect skeletons
"use strict"

class CanvasTool {
    constructor(canvasName, opts) {
        opts = opts || {};
        this.timerDelay = opts.timerDelay || 100;
        canvasName = canvasName || "canvas";
        console.log('**** Creating CanvasTool', canvasName);
        this.canvas = document.getElementById(canvasName);
        if (!this.canvas) {
            alert("No canvas named " + canvasName);
            return;
        }
        this.canvasName = canvasName;
        this.ctx = this.canvas.getContext("2d");
        //this.elements = elements;
        this.mouseDownPt = null;
        this.mouseDownTrans = null;
        this.background = "#fff";
        this.init();
        this.setupGUIBindings();
        this.resize();
    }

    dist(a1, a2) {
        var dx = a2.x - a1.x;
        var dy = a2.y - a1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    setupGUIBindings() {
        var inst = this;

        window.addEventListener("resize", e => {
            inst.resize();
        });
        //this.canvas.parentElement.addEventListener("resize", e=> {
        //    inst.resize();
        //});
        this.canvas.addEventListener("contextmenu", e => {
            //var hit = this.getHit(e);
            console.log("contextMenu *****");
            e.preventDefault();
            return false;
        });

        /*
        this.canvas.addEventListener("mousedown", e => {
            var hit = this.getHit(e);
            if (hit) {
                var v = hit.onClick(e);
                if (v)
                    return;
            }
            inst.mouseDownPt = { x: e.clientX, y: e.clientY };
            inst.mouseDownTrans = { tx: inst.tx, ty: inst.ty };
            inst.handleMouseDown(e);
            //console.log("down", e, this.mouseDownPt);
        });
        */

        this.canvas.addEventListener("mousedown", e => {
            var hits = this.getHits(e);
            if (hits.length > 1)
                console.log("hits", hits);
            for (var i=0; i<hits.length; i++) {
                var hit = hits[i];
                var v = hit.onClick(e);
                //if (v)
                //    return;
            }
            inst.mouseDownPt = { x: e.clientX, y: e.clientY };
            inst.mouseDownTrans = { tx: inst.tx, ty: inst.ty };
            inst.handleMouseDown(e);
            //console.log("down", e, this.mouseDownPt);
        });

        this.canvas.addEventListener("mousemove", e => {
            inst.mouseMove(e);
            if (inst.mouseDownPt == null) {
                inst.mouseOver(e);
                return;
            }
            if (e.which == 1) {

            }
            inst.handleMouseDrag(e)
        });
        this.canvas.addEventListener("mouseup", e => {
            inst.mouseDownPt = null;
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log("preventDefaults for mouse up");
            return false;
            //console.log("up", e);
        });
        this.canvas.addEventListener("wheel", e => {
            //console.log("mousewheel", e);
            e.preventDefault();
            if (inst.lockZoom)
                return;
            if (e.deltaY > 0)
                inst.zoom(inst.zf);
            else
                inst.zoom(1 / inst.zf);
        });
    }

    handleMouseDown(e) {
        console.log("handleMouseDown", e);
    }

    handleMousePan(e) {
        var tr = this.mouseDownTrans;
        var dx = e.clientX - this.mouseDownPt.x;
        var dy = e.clientY - this.mouseDownPt.y;
        if (this.panConstraint)
            [dx,dy] = this.panConstraint(dx,dy);
        this.tx = tr.tx + dx;
        this.ty = tr.ty + dy;
    }

    handleMouseDrag(e) {
        //console.log("handleMouseDrag", e);
        if (e.which > 1)
            this.handleMousePan(e);
    }

    mouseMove(e) {
        var pt = this.getMousePos(e);
        var cpt = this.getMousePosCanv(e);
        this.lastMousePos = pt;
        var id = "";
        var g = this.getHit(e);
        if (g)
            id = "" + g.id;
        //console.log("mouse pos", pt);
        // var tstr = sprintf("T: %5.1f %5.1f S: %5.3f %5.3f",
        //    this.tx, this.ty, this.sx, this.sy);
        $("#canvasStat").html(
            sprintf("pt: %5.1f %5.1f   cpt: %5.1f %5.1f  %s",
                pt.x, pt.y, cpt.x, cpt.y, id));
        this.getView();
    }

    // get the mouse position in canvas coordinates
    getMousePosCanv(e) {
        var rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    // convert canvas coordinates to model coordinates
    canvToModel(cpt) {
        return {
            x: (cpt.x - this.tx) / this.sx,
            y: (cpt.y - this.ty) / this.sy
        };
    }

    // get the mouse position in 'model' coordinates
    getMousePos(e) {
        var cpt = this.getMousePosCanv(e);
        return this.canvToModel(cpt);
    }

    mouseOver(e) {
        var pt = this.getMousePos(e);
        //console.log("mouseOver", pt);
        for (var id in this.graphics) {
            var g = this.graphics[id];
            if (g.contains(pt)) {
               // console.log("Over id", id);
                g.onOver(e);
            }
        }
    }

    getHits(e) {
        var pt = this.getMousePos(e);
        //console.log("mouseOver", pt);
        var hits = [];
        for (var id in this.graphics) {
            var g = this.graphics[id];
            if (g.contains(pt)) {
                console.log("hits Over id", id);
                hits.push(g);
            }
        }
        return hits;
    }

    getHit(e) {
        var pt = this.getMousePos(e);
        //console.log("mouseOver", pt);
        var hits = [];
        for (var id in this.graphics) {
            var g = this.graphics[id];
            if (g.contains(pt))
                return g;
        }
        return null;
    }

    init() {
        this.graphics = {};
        this.sx = 1;
        this.sy = 1;
        this.tx = 0;
        this.ty = 0;
        this.zf = .95;
        this.aspectRatio = 1;
        this.lockZoom = false;
    }

    clear() {
        this.graphics = {};
    }

    /*
    zoom(zf) {
        zf = zf || .9;
        this.sx *= zf;
        this.sy *= zf;
    }
    */
    zoom(zf) {
        zf = zf || .9;
        var view = this.getView();
        view.width *= zf;
        this.setView(view);
    }

    pan(dx, dy) {
        this.tx += dx;
        this.ty += dy;
    }

    setViewRange(xLow, xHigh, yLow, yHigh) {
        var x = (xLow + xHigh) / 2.0;
        var y = (yLow + yHigh) / 2.0;
        var w = xHigh - xLow;
        this.setView(x, y, w);
    }

    setViewXminYmin(xLow, yLow, w, h) {
        var view = this.getView();
        if (w == null) {
            w = view.width;
        }
        if (h == null) {
            h = view.height;
        }
        var x = xLow + w/2.0;
        var y = yLow + h/2.0;
         this.setView(x, y, w);
    }

    setViewWidth(w) {
        var s = this.canvas.width / (0.0 + w);
        this.sx = s;
        if (this.aspectRatio)
            this.sy = s*this.aspectRatio;
        this.draw();
    }

    setViewCenter(x, y) {
        var view = this.getView();
        var dx = view.center.x - x;
        var dy = view.center.y - y;
        this.pan(this.sx * dx, this.sy * dy);
        this.draw();
    }

    setView(x, y, w, h) {
        if (typeof x == "object") {
            var v = x;
            var inst = this;
            return this.setView(v.center.x, v.center.y, v.width);
        }
        console.log("setView", x, y, w, h);
        if (w != null) {
            this.setViewWidth(w);
        }
        this.setViewCenter(x, y);
    }

    getView() {
        var cwidth = this.canvas.width;
        var cheight = this.canvas.height;
        var width = cwidth / this.sx;
        var height = cheight / this.sy;
        var center = this.canvToModel({ x: cwidth / 2.0, y: cheight / 2.0 });
        var view = { center, width, height };
        //console.log("view", view);
        return view;
    }

    clearCanvas() {
        //var ctx = this.canvas.getContext('2d');
        var ctx = this.ctx;
        var canvas = this.canvas;
        //ctx.resetTransform(); // stupid -- internet explorer doesn't have this
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.lineWidth = 5;
        ctx.strokeStyle = '#bbb';
        ctx.fillStyle = this.background;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    setTransform(ctx) {
        //ctx.resetTransform(); // stupid -- internet explorer doesn't have this
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(this.tx, this.ty);
        ctx.scale(this.sx, this.sy);
        //ctx.translate(this.tx, this.ty);
    }

    drawGraphics() {
        //var ctx = this.canvas.getContext('2d');
        var ctx = this.ctx;
        this.setTransform(ctx);
        var canvas = this.canvas;
        for (var id in this.graphics) {
            //console.log("draw id", id);
            var graphics = this.graphics[id];
            if (graphics !== undefined) {
                graphics.draw(canvas, ctx);
            }
        }
    }

    draw() {
        this.clearCanvas();
        this.drawGraphics();
    }

    resize() {
        //console.log("resizing the canvas...");
        var view = this.getView();
        console.log("view:", view);
        let canvasWidth = this.canvas.clientWidth;
        let canvasHeight = this.canvas.clientHeight;
        /*
        let maxCanvasSize = 800;
        if (canvasWidth > maxCanvasSize) {
            canvasWidth = maxCanvasSize;
        }
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasWidth;
        */
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.setView(view);
        this.draw();
    }

    setXY(id, x, y) {
        this.graphics[id].x = x;
        this.graphics[id].y = y;
        this.draw();
    }

    getGraphic(id) {
        return this.graphics[id];
    }

    getNumGraphics() {
        return Object.keys(this.graphics).length;
    }

    addGraphic(graphic) {
        graphic.tool = this;
        this.graphics[graphic.id] = graphic;
    }

    getGraphic(id) {
        return this.graphics[id];
    }

    removeGraphic(id) {
        if (id instanceof CanvasTool.Graphic)
            id = id.id;
        //console.log('removing graphic with id ' + id);
        delete this.graphics[id];
        this.draw();
    }

    tick() {
        //console.log("tick...");
        this.tickTime = getClockTime();
        for (var id in this.graphics) {
            this.graphics[id].tick();
        }
        this.draw();
    }

    start() {
        this.setView(0, 0, 10);
        this.tick();
        let inst = this;
        //setInterval(() => inst.tick(), inst.timerDelay);
        this.requestId = window.requestAnimationFrame(e => inst.handleFrame(e));

    }

    handleFrame(e) {
        var inst = this;
        this.tick();
        this.requestId = window.requestAnimationFrame(e => inst.handleFrame(e));
    }

}

var _graphicNum = 0;
function getUniqueId() {
    return "_gr" + _graphicNum++;
}

function getNumVal(v, def) {
    if (v != null)
        return v;
    return def;
}

CanvasTool.Graphic = class {
    constructor(opts) {
        opts = opts || {};
        this.id = opts.id || getUniqueId(this);
        this.x = opts.x || 0;
        this.y = opts.y || 0;
        this.width = opts.width;
        this.height = opts.height;
        this.textAlign = opts.textAlign || "right";
        this.lineWidth = getNumVal(opts.lineWidth, 0.01);
        this.strokeStyle = '#000';
        if (opts.strokeStyle !== undefined)
            this.strokeStyle = opts.strokeStyle;
        this.fillStyle = '#800';
        if (opts.fillStyle !== undefined)
            this.fillStyle = opts.fillStyle;
        this.radius = opts.radius || .1;
        this.alpha = 0.333;
        this.clickable = false;
    }

    tick() {
    }

    draw(canvas, ctx) {
        this.drawCircle(canvas, ctx, this.radius, this.x, this.y);
    }

    drawRect(canvas, ctx, x, y, w, h) {
        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.strokeStyle;
        ctx.fillStyle = this.fillStyle;
        ctx.beginPath();
        if (this.fillStyle)
            ctx.fillRect(x - w / 2, y - h / 2, w, h);
        if (this.strokeStyle)
            ctx.strokeRect(x - w / 2, y - h / 2, w, h);
        ctx.stroke();
    }

    drawText(canvas, ctx, x, y, str, font) {
        font = font || "1px Arial";
        var s = .2;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s,s);
        ctx.font = font;
        var metrics = ctx.measureText(str);
        //let fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
        let actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        //console.log("height:", actualHeight);
        ctx.translate(0, s*metrics.actualBoundingBoxAscent);
        ctx.font = font;
        ctx.textAlign = this.textAlign;
        ctx.fillStyle = this.textStyle || "black";
        //ctx.fillText(str, x, y);
        ctx.fillText(str, 0, 0);
        ctx.restore();
    }


    drawCircle(canvas, ctx, r, x, y) {
        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.strokeStyle;
        ctx.fillStyle = this.fillStyle;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }

    drawPolyLine(canvas, ctx, pts) {
        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (var i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
    }

    contains(pt) {
        var fpt = {x: this.cx, y: this.cy};
        var d = this.tool.dist(fpt, pt);
        //console.log("contains", this.id, d, this.x, this.y, pt, this.radius);
        var v = d <= this.radius;
        //console.log("v", v);
        return v;
    }

    onOver(e) {
        //console.log("Graphic.onOver", this.id, e);
    }

    onClick(e) {
        console.log("Graphic.onClick", this.id, e);
    }
}

CanvasTool.RectGraphic = class extends CanvasTool.Graphic {
    draw(canvas, ctx) {
        this.drawRect(canvas, ctx, this.x, this.y, this.width, this.height);
    }

    contains(pt) {
        return this.x - this.width / 2 < pt.x && pt.x < this.x + this.width / 2 &&
            this.y - this.height / 2 < pt.y && pt.y < this.y + this.height / 2;
    }
}

CanvasTool.TextGraphic = class extends CanvasTool.Graphic {
    constructor(opts) {
        opts.width = opts.width || 1;
        opts.height = opts.height || 1;
        opts.textAlign = opts.textAlign || "center";
        super(opts);
        this.fillStyle = opts.fillStyle;
        //this.width = opts.width || 1;
        //this.height = opts.height || 1;
        this.text = opts.text || "text";
        this.textStyle = opts.textStyle || "black";
    }

    draw(canvas, ctx) {
        ctx.save();
        this.drawRect(canvas, ctx, this.x, this.y, this.width, this.height);
        this.drawText(canvas, ctx, this.x, this.y, this.text);
        ctx.restore();
    }

    contains(pt) {
        return this.x - this.width / 2 < pt.x && pt.x < this.x + this.width / 2 &&
            this.y - this.height / 2 < pt.y && pt.y < this.y + this.height / 2;
    }
}

CanvasTool.IconGraphic = class extends CanvasTool.Graphic {
    constructor(opts) {
        super(opts);
        this.iconName = opts.iconName;
        this.icon = document.getElementById(iconName);
        if (!this.icon) {
            alert("Unable to get icon " + iconName);
        }
        this.radius = 0.04;
        this.alpha = 0.333;
    }

    draw(canvas, ctx) {
        let radiusInPixels = this.radius * canvas.width;
        let x = this.x * canvas.width - radiusInPixels;
        let y = this.y * canvas.height - radiusInPixels;
        ctx.drawImage(
            this.icon, x, y, radiusInPixels * 2, radiusInPixels * 2);
    }
}

CanvasTool.ImageGraphic = class extends CanvasTool.RectGraphic {
    constructor(opts) {
        super(opts);
        this.url = opts.url;
        this.x = opts.x || 0;
        this.y = opts.y || 0;
        this.width = opts.width || 10;
        this.height = opts.height || 10;
        var inst = this;
        console.log("ImageGraphic ", this.id, this.url);
        this.setImageURL(this.url, true);
    }

    setImageURL(url, forceReload) {
        if (url == this.url && !forceReload) {
            console.log("Ignoring redundant setImageURL", url);
            return;
        }
        var inst = this;
        console.log("setImageURL", this.id, url);
        this.url = url;
        var img = new Image;
        img.onload = e => {
            console.log("*** image loaded ***", inst.id, inst.url);
            inst.image = img;
        }   
        img.src = this.url;
    }

    draw(canvas, ctx) {
        if (!this.image)
            return;
        ctx.drawImage(
            this.image,
            this.x-this.width/2.0, this.y-this.height/2.0,
            this.width, this.height);
    }
}

CanvasTool.CloudGraphic = class extends CanvasTool.Graphic {
    constructor(opts) {
        super(opts);
        this.r = opts.r || .2;
        this.a0 = .2;
        this.a1 = 0;
        this.rgb = [200, 0, 0];
    }

    draw(canvas, ctx) {
        this.drawCloud(canvas, ctx, [this.x, this.y], this.r, this.rgb, this.a0, this.a1)
    }

    drawCloud(canvas, ctx, pt, rad, rgb, a0, a1) {
        rad = rad;
        var r, g, b;
        [r, g, b] = rgb;
        if (a0 == null)
            a0 = .2;
        if (a1 == null)
            a1 = 0;
        var color0 = sprintf('rgba(%d,%d,%d,%f)', r, g, b, a0);
        var color1 = sprintf('rgba(%d,%d,%d,%f)', r, g, b, a1);
        var x = pt[0];
        var y = pt[1];

        var innerRadius = 0.01 * rad;
        var outerRadius = rad;
        var gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
        gradient.addColorStop(0, color0);
        gradient.addColorStop(1, color1);
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
}

CanvasTool.GraphGraphic = class extends CanvasTool.Graphic {
    //constructor(id, x, y, width, height, maxNumPoints) {
    constructor(opts) {
        super(opts);
        this.width = opts.width || 10;
        this.height = opts.height || 10;
        this.rgb = opts.rgb || [200, 0, 0];
        this.yvals = [];
        this.maxNumPoints = opts.maxNumPoints || 100;
        for (var i = 0; i < 200; i++) {
            var t = 0.1 * i;
            var w = 3;
            var x = t;
            var y = Math.sin(w * t);
            this.addPoint(y);
        }
        //this.lineWidth = .1;
        this.strokeStyle = opts.strokeStyle || "black";
    }

    addPoint(pt) {
        this.yvals.push(pt);
        if (this.yvals.length > this.maxNumPoints)
            this.yvals.shift();
    }

    draw(canvas, ctx) {
        //console.log("GraphGraphic draw", this.points);
        this.drawGraph(canvas, ctx, this.yvals);
    }

    drawGraph(canvas, ctx, yvals) {
        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.strokeStyle;
        ctx.beginPath();
        var x0 = this.x - this.width / 2;
        var y0 = this.y;
        ctx.moveTo(x0, y0 + yvals[0]);
        for (var i = 1; i < yvals.length; i++) {
            var x = x0 + this.width * i / yvals.length;
            var y = y0 + yvals[i];
            //console.log("x,y", x, y);
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
}


CanvasTool.TrailGraphic = class extends CanvasTool.Graphic {
    constructor(opts) {
        super(opts);
        this.rgb = opts.rgb || [200, 0, 0];
        this.points = opts.points || [];
        this.width = getNumVal(opts.width, 10);
        this.height = getNumVal(opts.height, 10);
        this.maxNumPoints = opts.maxNumPoints || 100;
        /*
        for (var i=0; i<200; i++) {
            var t = 0.1*i;
            var w = 3;
            var x = t;
            var y = Math.sin(w*t);
            this.addPoint([x,y]);
        }
        */
        //this.lineWidth = .1;
        this.strokeStyle = "black";
    }

    addPoint(pt) {
        this.points.push(pt);
        if (this.points.length > this.maxNumPoints)
            this.points.shift();
    }

    draw(canvas, ctx) {
        //console.log("GraphGraphic draw", this.points);
        this.drawTrail(ctx, this.points);
    }

    drawTrail(ctx, points) {
        if (!points || points.length == 0)
            return;
        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.strokeStyle;
        ctx.beginPath();
        var x0 = this.x - this.width / 2;
        var y0 = this.y;
        var p0 = this.points[0];
        ctx.moveTo(x0 + p0[0], y0 + p0[1]);
        for (var i = 1; i < points.length; i++) {
            var x = x0 + points[i][0];
            var y = y0 + points[i][1];
            //console.log("x,y", x, y);
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
}


