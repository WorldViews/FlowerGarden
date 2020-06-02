
var tool = null;

var Actor_num = 0;
class Actor extends CanvasTool.Graphic {
    constructor(opts) {
        opts.id = opts.id || Actor_num++;
        super(opts);
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
        if (0) {
            var s = 6;
            this.x += s*(Math.random() - 0.5);
            this.y += s*(Math.random() - 0.5);
        }
        else {
            var s = 1;
            this.vx += s*(Math.random() - 0.5);
            this.vy += s*(Math.random() - 0.5);
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= .9;
            this.vy *= .9;
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
}

class Interaction extends CanvasTool.Graphic {
    constructor(opts) {
        super(opts);
        this.ids = opts.ids;
        this.lineWidth = 2;
        this.startGen = tool.stepNum;
    }

    tick() {
        var dn = tool.stepNum - this.startGen;
        if (dn > 200) {
            this.destroy();
        }
    }

    destroy() {
        console.log("destroy interaction", this.id);
        tool.removeGraphic(this.id);
        delete tool.interactions[this.id];
    }

    draw(canvas, ctx) {
        //console.log("Link.draw ids:", this.ids);
        //console.log("graphics:", tool.graphics);
        ctx.lineWidth = this.lineWidth;
        ctx.strokeStyle = this.strokeStyle;
        ctx.fillStyle = this.fillStyle;
        var inst = this;
        ctx.beginPath();
        inst.ids.forEach(id1 => {
            inst.ids.forEach(id2 => {
                var a1 = tool.getGraphic(id1);
                var a2 = tool.getGraphic(id2);
                if (!a1 || !a2) {
                    console.log("cant get "+id1+" and "+id2);
                    return;
                }
                ctx.moveTo(a1.x, a1.y);
                ctx.lineTo(a2.x, a2.y);                 
            })
        })
        ctx.fill();
        ctx.stroke();
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


class RAKTool extends CanvasTool {
//class RAKTool  {
    constructor(canvasName) {
        super(canvasName);
        this.distThresh = 50;
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
        gui.add(P, 'distThresh', 0, 200);
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

    addLink(id1, id2) {
        var link = new Link({id: "link"+this.numLinks++, id1, id2});
        this.links[[id1,id2]] = link;
        this.addGraphic(link);
    }

    connect(id1, id2) {
        this.links[[id1,id2]] = true;
    }

    distBetween(id1, id2) {
        var a1 = this.actors[id1];
        var a2 = this.actors[id2];
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
        this.links = {};
        this.interactions = {};
        this.initPositions();
        console.log("********* graphics:", this.graphics);
        this.initInteractions();
        console.log("********* graphics:", this.graphics);
    }

    initInteractions() {
        var int1 = new Interaction({id: "i1", ids: [0,1,2,3]});
        this.interactions["i1"] = int1;
        this.addGraphic(int1);
    }

    initPositions() {
        if (this.grid) {
            this.initGrid();
        }
        else {
            this.initRand();
        }
        //this.connect(1,2);
        //this.connect(2,3);
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

    adjustPositions() {
        for (var id in this.actors)
            this.actors[id].adjustPosition();
    }

    computeLinks(maxDist) {
        this.links = {};
        for (var i1 in this.actors) {
            for (var i2 in this.actors) {
                if (this.distBetween(i1,i2) < maxDist)
                    this.connect(i1,i2);
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
        for (var id1 in this.actors) {
            var a1 = this.actors[id1];
            for (var id2 in this.actors) {
                if (!this.links[[id1,id2]])
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

    getNumInteractions() {
        return Object.keys(this.interactions).length;
    }

    tick() {
        //console.log("tick...");
        this.stepNum++;
        if (this.mobile)
            this.adjustPositions();
        this.adjustStates();
        this.computeLinks(this.distThresh);
        this.draw();
        for (var id in this.actors)
            this.actors[id].tick();
         for (var id in this.interactions)
            this.interactions[id].tick();
        var str = sprintf("N: %3d NumActors: %3d  NumInteractions: %3d",
                this.stepNum, this.getNumActors(), this.getNumInteractions())
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

