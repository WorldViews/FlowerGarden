
var tool = null;

var Actor_num = 0;
class Actor extends CanvasTool.Graphic {
    constructor(opts) {
        opts.id = opts.id || Actor_num++;
        super(opts);
        this.tool = tool;
        this.fx = 0;
        this.fy = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 5;
        this.happiness = 0.5;
    }

    static reset() {
        Actor_num = 0;
    }

    tick() {
    }

    onClick(e) {
        this.happiness = 0;
        if (e.shiftKey)
            this.happiness = 1;
    }

    adjustPosition() {
        var P = this.tool;
        if (0) {
            var s = 6;
            this.x += s*(Math.random() - 0.5);
            this.y += s*(Math.random() - 0.5);
        }
        else {
            var s = 1;
            var m = 2.0;
            this.vx += s*(Math.random() - 0.5);
            this.vy += s*(Math.random() - 0.5);
            this.vx += this.fx/P.mass;
            this.vy += this.fy/P.mass;
            this.x += this.vx;
            this.y += this.vy;
            //this.vx *= (1 - P.drag);
            //this.vy *= (1 - P.drag);
        }
    }

    adjustState() {
        var s = .1;
        this.happiness += s*(Math.random() - 0.5);
        if (this.happiness > .8)
            this.fillStyle = "#0a0";
        if (this.happiness < .3) {
            this.fillStyle = "#a00";
        }
    }

    draw(canvas, ctx) {
        super.draw(canvas, ctx);
        this.drawShell(ctx, tool.egoDistThresh/2.0);
    }

    drawShell(ctx, r)
    {
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.strokeStyle;
        ctx.fillStyle = this.fillStyle;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, 2 * Math.PI);
        //ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

class RAKTool extends CanvasTool {
//class RAKTool  {
    constructor(canvasName) {
        super(canvasName);
        this.egoDistThresh = 40;
        this.groupDistThresh = 0;
        this.egoK = 1.0;
        this.groupK = 0.0;
        this.mass = 2;
        this.drag1 = 0.01;
        this.drag2 = 0.01;
        this.numActors = 0;
        this.grid = true;
        this.mobile = true;
        tool = this;
        this.setupDATGUI();
    }

    setupDATGUI()
    {
        var P = this;
        var gui = new dat.GUI();
        gui.add(P, 'numActors', 2, 1000);
        gui.add(P, 'egoDistThresh', 0, 200);
        gui.add(P, 'groupDistThresh', 0, 200);
        gui.add(P, 'egoK', 0, 2);
        gui.add(P, 'groupK', 0, 2);
        gui.add(P, 'drag1', 0, 1);
        gui.add(P, 'drag2', 0, 1);
        gui.add(P, 'mass', 0, 4);
        gui.add(P, 'mobile');
        gui.add(P, 'grid');
        gui.add(P, 'reset');
    }

    reset() {
        this.init();
    }

    add(x, y, id) {
         var actor = new Actor({x, y});
        this.actors[actor.id] = actor;
        this.addGraphic(actor);
    }

    connect(id1, id2, links, d) {
        links[[id1,id2]] = d;
    }

    distBetween(a1, a2) {
        if (typeof a1 === 'string')
            a1 = this.actors[a1];
        if (typeof a2 === 'string')
            a2 = this.actors[a2];
        var dx = a1.x-a2.x;
        var dy = a1.y-a2.y;
        return Math.sqrt(dx*dx + dy*dy);
    }

    init() {
        tool = this;
        super.init();
        this.setView(300, 300, 800)
        Actor.reset();
        this.stepNum = 0;
        this.numActors = 20;
        this.numLinks = 0;
        this.actors = {};
        this.egoLinks = {};
        this.groupLinks = {};
        this.initPositions();
        console.log("********* graphics:", this.graphics);
        //this.initInteractions();
        console.log("********* graphics:", this.graphics);
    }

    initPositions() {
        if (this.grid) {
            this.initGrid();
        }
        else {
            this.initRand();
        }
    }

    initGrid() {
        var n = Math.sqrt(this.numActors);
        n = Math.floor(n);
        var W = 600;
        var H = 600;
        var w = W / n;
        var h = H / n;
        for (var i=0; i<this.numActors; i++) {
            var j = Math.floor(i/n);
            var k = i % n;
            var x = j * w;
            var y = k * h;
            this.add(x,y,i);
        }
    }

    initRand() {
        var W = 600;
        var H = 600;
        for (var i=0; i<this.numActors; i++) {
            var x = Math.random()*W;
            var y = Math.random()*H;
            this.add(x, y, i);
        }
    }

    adjustStates() {
        for (var id in this.actors)
            this.actors[id].adjustState();
    }

    computeBoundaryForces(links) {
        var xmin = 0;
        var xmax = 600;
        var ymin = 0;
        var ymax = 600;
        var f = 4;
        for (var id in this.actors) {
            var a1 = this.actors[id];
            if (a1.x < xmin)
                a1.fx += f;
            if (a1.x > xmax)
                a1.fx -= f;
            if (a1.y < ymin)
                a1.fy += f;
            if (a1.y > ymax)
                a1.fy -= f;
        }
    }

    computeDragForces(links) {
        var P = this;
        for (var id in this.actors) {
            var a = this.actors[id];
            var v = Math.sqrt(a.vx*a.vx + a.vy*a.vy);
            a.fx += -P.drag1*a.vx
            a.fy += -P.drag1*a.vy
            a.fx += -v*P.drag2*a.vx
            a.fy += -v*P.drag2*a.vy
        }
    }

    clearForces() {
        for (var id in this.actors) {
            var a1 = this.actors[id];
            a1.fx = 0;
            a1.fy = 0;
        }
    }

    computeForces(links, k) {
        for (var id in this.actors) {
            var a1 = this.actors[id];
            for (var i2 in this.actors) {
                var d0 = links[[id,i2]];
                if (d0 == null)
                    continue;
                var a2 = this.actors[i2];
                var d = this.distBetween(a1,a2);
                var dd = (d - d0)
                //dd = dd < 0 ? -1 : 1;
                var nx = (a2.x - a1.x)/d;
                var ny = (a2.y - a1.y)/d;
                var fx = k*dd*nx;
                var fy = k*dd*ny;
                a1.fx += fx;
                a1.fy += fy;
                console.log(sprintf("d0: %6.1f d: %6.1f dd: %6.3f k: %6.3f fx: %8.3f fy: %8.3f",
                                    d0, d, dd, k, fx, fy))
           }
        }
    }

    adjustPositions() {
        this.clearForces();
        this.computeForces(this.egoLinks, this.egoK);
        this.computeForces(this.groupLinks, this.groupK);
        this.computeBoundaryForces();
        this.computeDragForces();
        for (var id in this.actors) {
           this.actors[id].adjustPosition();
        }
    }

    computeLinks(links, distThresh) {
        for (var i1 in this.actors) {
            for (var i2 in this.actors) {
                if (i1 == i2)
                    continue;
                var d = this.distBetween(i1,i2);
                if (d < distThresh)
                    this.connect(i1, i2, links, distThresh);
           }
        }
    }

    drawLinks() {
        this.drawLinks_(this.egoLinks, 6, 'red');
        this.drawLinks_(this.groupLinks, 1, 'blue');
    }

    drawLinks_(links, width, strokeStyle) {
            var ctx = this.canvas.getContext('2d');
        this.setTransform(ctx);
        ctx.lineWidth = width;
        ctx.strokeStyle = strokeStyle;
        //ctx.fillStyle = this.fillStyle;
        ctx.fillStyle = this.null;
        ctx.beginPath();
        for (var id1 in this.actors) {
            var a1 = this.actors[id1];
            for (var id2 in this.actors) {
                var lab = links[[id1,id2]];
                if (!lab)
                    continue;
                var a2 = this.actors[id2];
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

    getNumActors() {
        return Object.keys(this.actors).length;
    }


    tick() {
        //console.log("tick...");
        this.stepNum++;
        if (this.mobile)
            this.adjustPositions();
        this.adjustStates();
        this.egoLinks = {};
        this.computeLinks(this.egoLinks, this.egoDistThresh);
        this.groupLinks = {};
        this.computeLinks(this.groupLinks, this.groupDistThresh);
        this.draw();
        for (var id in this.actors)
            this.actors[id].tick();
        var str = sprintf("N: %3d NumActors: %3d",
                this.stepNum, this.getNumActors())
        $("#stats").html(str);
    }

    start() {
        console.log("HAK.start");
        this.init();
        this.tick();
        let inst = this;
        setInterval(() => inst.tick(), 20);
    }
 }

