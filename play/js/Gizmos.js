
"use strict";

var model = null;

function rand(a,b)
{
    return a + (b-a)*Math.random();
}

function randIdx(n)
{
    return Math.floor(n*Math.random());
}

function randItem(v)
{
    var i = randIdx(v.length);
    return v[i];
}

function randShift(x, y, dMin, dMax)
{
    var d = rand(dMin, dMax);
    var a = rand(0,2*Math.PI);
    var dx = d*Math.cos(a);
    var dy = d*Math.sin(a);
    return {x: x+dx, y: y+dy}
}

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function remove(array, element) {
    const index = array.indexOf(element);
    
    if (index !== -1) {
        array.splice(index, 1);
    }
}

function relativePos ( event ) {
  var bounds = event.target.getBoundingClientRect();
  var x = event.clientX - bounds.left;
  var y = event.clientY - bounds.top;
  return {x: x, y: y};
}

function dist(x0,y0,x1,y1)
{
    var dx = x1-x0;
    var dy = y1-y0;
    return Math.sqrt(dx*dx+dy*dy);
}

function findEndPoint(px, py, L, x,y)
{
    var vx = px - x;
    var vy = py - y;
    var l = Math.sqrt(vx*vx + vy*vy);
    var nvx = vx / l;
    var nvy = vy / l;
    return {x: x + L*nvx, y: y + L*nvy};
}

var numObjs = 0;
function getUniqueName(baseName)
{
    numObjs++;
    return "_"+baseName+"_"+numObjs;
}

class Widget {
    constructor(opts) {
        opts.type = this.constructor.name;
        opts.name = opts.name || getUniqueName(opts.type);
        this.opts = opts;
        this.name = opts.name;
        this.range = [];
        this.lastRangeUpdate = model.gen-1;
    }
    
    update() {
        if (this.lastRangeUpdate != model.gen) {
            this.updateRange();
            this.lastRangeUpdate = model.gen;
        }
    }

    clearTrail()
    {
        this.trail = [];
    }

    getDef() {
        var opts = this.opts;
        if (opts.driver && typeof opts.driver != "string")
            opts.driver = opts.driver.name;
        return this.opts
    }
}

class SlipRod extends Widget {
    constructor(opts) {
        super(opts);
        this.L = opts.L || 50;
        this.px = opts.px;
        this.py = opts.py;
        //this.py = 240;
        this.driver = opts.driver;
    }

    update() {
        super.update();
        this.pt1 = this.driver.pt2;
        this.pt2 = findEndPoint(this.px, this.py, this.L,
                                this.pt1.x, this.pt1.y);
    }

    updateRange() {
        console.log("updateRange");
        this.range = [];
        let domain = this.driver.range;
        //console.log(this.name+".domain: ", domain);
        this.driver.range.forEach(pt1 => {
            let pt2 = findEndPoint(this.px, this.py, this.L, pt1.x, pt1.y);
            this.range.push(pt2);
        });
        //console.log(this.name+".range", this.range);
    }

    findGrip(mp) {
        let p = model.viewToModel(mp);
        if (dist(p.x,p.y, this.px, this.py) < 8)
            return "slideHole";
        if (dist(p.x,p.y, this.pt2.x, this.pt2.y) < 5)
            return "endpoint";
        return null;
    }

    adjust(grip, vmp) {
        console.log("crank.adjust "+vmp);
        let mp = model.viewToModel(vmp);
        if (grip == "slideHole") {
            this.px = mp.x;
            this.py = mp.y;
        }
        if (grip == "endpoint") {
            this.L = dist(this.pt1.x, this.pt1.y, mp.x, mp.y);
        }
        else {
            console.log("Unexpected grip name "+grip);
        }
        this.updateRange();
    }

    draw(c) {
        var ctx = c.getContext("2d");
        //ctx.scale(scale, scale);
        ctx.setTransform(model.scale, 0, 0, model.scale, model.tx, model.ty);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";
        if (this == model.selectedWidget)
            ctx.strokeStyle = "red";
        // Draw anchor point
        ctx.beginPath();
        ctx.arc(this.px, this.py, 3, 0, 2 * Math.PI);
        ctx.stroke();
        // Draw end point
        ctx.beginPath();
        ctx.arc(this.pt2.x, this.pt2.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
        // Draw rod
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.moveTo(this.pt1.x, this.pt1.y);
        ctx.lineTo(this.pt2.x, this.pt2.y);
        ctx.stroke();
        // draw trail
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = "#9900FF";
        if (model.showTrails) {
            var range = this.range;
            ctx.beginPath();
            range.forEach(pt => ctx.lineTo(pt.x,pt.y));
            ctx.stroke();
        }
    }
}

class Crank extends Widget {
    constructor(opts) {
        super(opts);
        this.w = opts.w || 1;
        this.R = opts.R || 20;
        this.x0 = opts.x0;
        this.y0 = opts.y0;
        this.updateRange();
    }

    update() {
        var a = -this.w*model.t;
        this.pt2 = {
            x: this.x0 + this.R*Math.cos(a),
            y: this.y0 + this.R*Math.sin(a)
        }
    }

    updateRange() {
        console.log("updateRange "+this.name);
        this.range = [];
        let numPts = 200;
        for (let i=0; i<=numPts; i++) {
            let a = 2*Math.PI*i/numPts;
            let x = this.x0 + this.R*Math.cos(a);
            let y = this.y0 + this.R*Math.sin(a);
            this.range.push({x,y});
        }
        //console.log("range."+this.name+" ",this.range);
    }

                
    findGrip(mp) {
        let p = model.viewToModel(mp);
        var d = dist(p.x,p.y, this.x0, this.y0);
        if (d < 5)
            return "XY0";
        if (Math.abs(d - this.R) < 5)
            return "R";
        return null;
    }

    adjust(grip, vmp) {
        let mp = model.viewToModel(vmp);
        console.log("crank.adjust "+mp);
        if (grip == "R") {
            this.R = dist(mp.x,mp.y, this.x0,this.y0)
        }
        else if (grip == "XY0") {
            this.x0 = mp.x;
            this.y0 = mp.y;
        }
        else {
            console.log("Unexpected grip name "+grip);
        }
        this.updateRange();
    }

    draw(c) {
        var ctx = c.getContext("2d");
        ctx.setTransform(model.scale, 0, 0, model.scale, model.tx, model.ty);
        var x0 = this.x0, y0 = this.y0;
        var pt2 = this.pt2;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";
        if (this == model.selectedWidget)
            ctx.strokeStyle = "red";
        ctx.beginPath();
        // Draw drivepoint path
        ctx.arc(x0, y0, this.R, 0, 2 * Math.PI);
        ctx.stroke();
        // Draw anchor point
        // Draw crank
        ctx.moveTo(x0,y0);
        ctx.lineTo(pt2.x, pt2.y);
        ctx.stroke();
        // draw trail
        ctx.lineWidth = 0.5;
        if (model.showTrails) {
            var range = this.range;
            ctx.beginPath();
            range.forEach(pt => ctx.lineTo(pt.x,pt.y));
            ctx.stroke();
        }
    }
}

class Model {
    constructor(canvName) {
        this.canvName = canvName || "myCanvas";
        this.widgets = [];
        this.widgetsByName = {};
        //this.loadDefault();
        this.t = 0;
        this.dt = 0.03;
        this.gen = 1;
        this.showTrails = false;
        //this.showRanges = true;
        this.scale = 1.0;
        this.deltaScale = 1.05;
        this.tx = 0;
        this.ty = 0;
        this.mouseDown = false;
        this.mpDown = null;
        this.trDown = null;
        this.maxTrailPts = 300;
        this.selectedWidget = null;
        this.selectedGrip = null;
        this.initUI();
    }
    
    start() {
        let inst = this;
        setInterval(() => inst.update(), 1000/60);
    }

    viewToModel(mp) {
//        return {x: mp.x/this.scale - this.tx,
//                y: mp.y/this.scale - this.ty};
        return {x: (mp.x - this.tx)/this.scale,
                y: (mp.y - this.ty)/this.scale};
    }

    load(specs) {
        console.log("cloaning specs");
        specs = clone(specs);
        model.specs = specs;
        var inst = this;
        this.widgets = [];
        this.widgetsByName = {};
        specs.widgets.forEach(ws => {
            if (ws.type == "SlipRod") {
                inst.addWidget(new SlipRod(ws));
            } else if (ws.type == "Crank") {
                inst.addWidget(new Crank(ws));
            }
            else {
                error("Unrecognized type "+ws.type);
            }
        });
        this.widgets.forEach(w => {
            if (w.opts.driver instanceof Widget) {
                w.driver = w.opts.driver;
                return;
            }
            var dw = this.widgetsByName[w.opts.driver];
            if (dw == null) {
                console.log("*** widget "+w.name+
                            " cannot find driver named "+w.opts.driver);
                return;
            }
            w.driver = dw;
            w.opts.driver = dw;
        });
    }

    addRandomWidgets(n)
    {
        for (var i=0; i<n; i++) {
            var w = randItem(model.widgets);
            this.addRandomWidget(w);
        }
    }

    addRandomWidget(w)
    {
        if (!w)
            w = model.selectedWidget;
        if (!w) {
            console.log("No selected widget");
            return;
        }
        if (w.pt2 == null) {
            console.log("Obj is not SlipRod");
            return;
        }
        var pt = randShift(w.pt2.x, w.pt2.y, 40.0, 200.0);
        var len = rand(40, 250);
        var sr = new SlipRod(
            {L: len, px: pt.x, py: pt.y, driver: w}
        );
        model.addWidget(sr);
        model.selectedWidget = sr;
        model.selectedGrip = null;
    }
    
    addWidget(w) {
        this.widgetsByName[w.name] = w;
        this.widgets.push(w);
    }
    
    loadDefault() {
        var crank = new Crank({x0: 250, y0: 400, R: 50, w: 2.2});
        var slipRod = new SlipRod({px: 250, py: 200, L: 300, driver: crank});
        var crank2 = new Crank({x0: 350, y0: 300, R: 20, w: 1.1});
        var slipRod2 = new SlipRod({px: 320, py: 200, L: 200, driver: crank2});
        var slipRod3 = new SlipRod({px: 120, py: 100, L: 200, driver: slipRod});
        this.widgets = [crank, slipRod, crank2, slipRod2, slipRod3];
    }
    
    dump() {
        var def = this.getDef();
        
        console.log(JSON.stringify(def, null, 3));
    }

    deleteWidget(w) {
        if (w == null)
            return;
        delete this.widgetsByName[w.name];
        remove(this.widgets, w);
    }
    
    getDef() {
        var def = {type: "Model", widgets: []};
        this.widgets.forEach(w => {
            def.widgets.push(w.getDef());
        });
        return def;
    }

    clear() {
        this.widgets.forEach(w => w.clearTrail());
    }
    
    setShowTrails(v) {
        if (!v)
            this.clear();
        this.showTrails = v;
    }

    drawGrid() {
        var c = document.getElementById(this.canvName);
        var ctx = c.getContext("2d");
        var dx = 100;
        var dy = dx;
        var n = 20;
        var h = 10000;
        ctx.strokeStyle = "#000000";
        for (var i = -n; i<=n; i++) {
            var x = i*dx
            ctx.moveTo(x,-h);
	    ctx.lineTo(x, h);
            var y = i*dx
            ctx.moveTo(-h,y);
	    ctx.lineTo(h, y);
        }
        ctx.stroke();
    }
    
    draw() {
        var c = document.getElementById(this.canvName);
        var ctx = c.getContext("2d");
        //ctx.clearRect(0,0,c.width, c.height);
        var s = 1000000;
        ctx.clearRect(-s,-s,2*s,2*s);
        this.drawGrid();
        this.widgets.forEach(w => w.draw(c));
    }
    
    clear() {
        this.widgets.forEach(w => w.clearTrail());
    }

    play() { this.dt = 0.02; }

    pause() { this.dt = 0; }
    
    update() {
        this.t += this.dt;
        this.widgets.forEach(w => w.update());
        this.draw();
        var statusText = "";
        if (model.selectedWidget) {
            statusText += model.selectedWidget.name;
            if (model.selectedGrip)
                statusText += " "+model.selectedGrip;
        }
        statusText += " g: "+this.gen;
        $("#status").html(statusText);
    }

    initUI() {
        model = this;
        var inst = this;
        var w = model.widget;
        this.noticeTrailsState();
        $("#play").click(() => {
            this.togglePlay();
        });
        $("#trails").click(() => {
            this.noticeTrailsState();
        });
        $("#delete").click(() => {
            model.deleteWidget(model.selectedWidget);
        });
        $("#simple").click(() => {
            model.load(MODEL_SIMPLE_1);
        });
        $("#fancy").click(() => {
            model.load(MODEL_FANCY_1);
        });
        $("#c3").click(() => {
            w.clearTrail();
            w.py = 240;
        });
        $("#c4").click(() => {
            w.clearTrail();
            w.py = 280;
        });
        $("#c5").click(() => {
            w.clearTrail();
            w.py = 295;
        });
        $("#myCanvas").bind("mousewheel", e => {
            console.log("mw delta: "+e.wheelDelta);
            var dy = e.originalEvent.deltaY;
            if (dy > 0)
                this.scale *= this.deltaScale;
            if (dy < 0)
                this.scale /= this.deltaScale;
            console.log("dy: "+dy+"  scale: "+model.scale);
            var vmp = relativePos(e);
            this.showPos(vmp);
        });
        $("#myCanvas").mousedown(e => {
            var mp = relativePos(e);
            if (e.shiftKey) {
                if (model.selectedWidget) {
                    var sr = new SlipRod(
                        {L: 200, px: mp.x, py: mp.y,
                         driver: model.selectedWidget});
                    model.addWidget(sr);
                }
                else {
                    var cs = new Crank({x0: mp.x, y0: mp.y, R: 50, w: 1.2});
                    model.addWidget(cs);
                }
            }
            model.mpDown = mp;
            this.trDown = {x: model.tx, y: model.ty};
            model.mouseDown = true;
            model.selectedGrip = null;
            model.selectedWidget = null;
            model.widgets.forEach(w => {
                if (model.selectedWidget == null) {
                    model.selectedGrip = w.findGrip(mp);
                    if (model.selectedGrip != null) {
                        model.selectedWidget = w;
                    }
                }
            });
            console.log("selectedGrip: "+model.selectedGrip);
            console.log("selectedWidget: "+model.selectedWidget);
        });
        $("#myCanvas").mouseup(e => { model.mouseDown = false; });
        $("#myCanvas").mousemove(e => {
            var vmp = relativePos(e);
            this.showPos(vmp);
            if (!model.mouseDown)
                return;
            var w = model.selectedWidget;
            if (w == null) {
                if (!model.mpDown)
                    return;
                let dx = vmp.x - model.mpDown.x;
                let dy = vmp.y - model.mpDown.y;
                //console.log("dx: "+dx+" dy: "+dy);
                model.tx = model.trDown.x + dx;
                model.ty = model.trDown.y + dy;
                return;
            }
            //console.log("x y: "+mp.x+" "+mp.y);
            w.adjust(model.selectedGrip, vmp);
            model.gen++;
            model.clear();
        });
        //$(document).keypress(e => {
        //    inst.handleKey(e);
        //});
        $(document).keydown(e => {
            inst.handleKey(e);
        });
    }

    handleKey(e) {
        console.log("handleKey", e);
        window.LAST_E = e;
        var key = e.key.toLowerCase();
        if (key == "d" || key == "delete")
            this.deleteWidget(model.selectedWidget);
    }

    showPos(vmp)
    {
        var cp = this.viewToModel(vmp);
        var posStr =
            sprintf("scale: %.3f %6.1f %6.1f", this.scale, cp.x, cp.y);
        $("#pos").html(posStr);        
    }
    
    togglePlay()
    {
        //model.dump();
        if ($("#play").val() == "play") {
            model.play();
            $("#play").val("pause");
        }
        else {
            model.pause();
            $("#play").val("play");
        }
    }

    noticeTrailsState()
    {
        //model.dump();
        model.setShowTrails( $("#trails").is(":checked") );
    }
}

$(document).ready(() => {
    model = new Model();
    model.load(MODEL_SIMPLE_1);
    model.start();
});

var MODEL_FANCY_1 =
{
   "type": "Model",
   "widgets": [
      {
         "x0": 250,
         "y0": 400,
         "R": 50,
         "w": 2.2,
         "type": "Crank",
         "name": "_Crank_1"
      },
      {
         "px": 250,
         "py": 200,
         "L": 300,
         "driver": "_Crank_1",
         "type": "SlipRod",
         "name": "_SlipRod_2"
      },
      {
         "x0": 350,
         "y0": 300,
         "R": 20,
         "w": 1.1,
         "type": "Crank",
         "name": "_Crank_3"
      },
      {
         "px": 320,
         "py": 200,
         "L": 200,
         "driver": "_Crank_3",
         "type": "SlipRod",
         "name": "_SlipRod_4"
      },
      {
         "px": 120,
         "py": 100,
         "L": 200,
         "driver": "_SlipRod_2",
         "type": "SlipRod",
         "name": "_SlipRod_5"
      }
   ]
};

var MODEL_SIMPLE_1 =
{
   "type": "Model",
   "widgets": [
      {
         "x0": 250,
         "y0": 400,
         "R": 50,
         "w": 2.2,
         "type": "Crank",
         "name": "_Crank_1"
      },
      {
         "px": 250,
         "py": 200,
         "L": 300,
         "driver": "_Crank_1",
         "type": "SlipRod",
         "name": "_SlipRod_2"
      },
      {
         "px": 120,
         "py": 100,
         "L": 200,
         "driver": "_SlipRod_2",
         "type": "SlipRod",
         "name": "_SlipRod_5"
      }
   ]
}
