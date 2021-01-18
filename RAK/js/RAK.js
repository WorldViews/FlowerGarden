
var tool = null;

function rand() { return Math.random(); }
function interp(f, x1, x2) { return x1 * (1 - f) + x2 * f; }
class Act {
    constructor(action, actor, targetActor) {
        this.action = action;
        this.actor = actor;
        this.target = targetActor;
        this.t0 = actor.rak.getPlayTime();
        this.dur = 1;
    }
}

var Actor_num = 0;
class Actor extends CanvasTool.CircleGraphic {
    constructor(rak, opts) {
        opts.id = opts.id || Actor_num++;
        opts.radius = 15;
        super(opts);
        this.rak = rak;
        this.prevPlayTime = rak.getPlayTime();
        this.deltaT = 0;
        this.vx = 0;
        this.vy = 0;
        // this.radius = 10;
        this.happiness = rak.initialHappiness;
        this.acts = [];
    }

    static reset() {
        Actor_num = 0;
    }

    tick() {
        var pt = this.rak.getPlayTime();
        this.deltaT = pt - this.prevPlayTime;
        this.prevPlayTime = pt;
        this.handleQueuedActs();
        this.produceActs();
    }

    produceActs() {
        var inst = this;
        var ids = this.getNeighbors();
        var rak = this.rak;
        ids.forEach(id => {
            if (rand() > rak.pAction)
                return;
            if (inst.happiness < 0.333) {
                if (rand() < rak.pNiceGivenSad) {
                    this.act("smile", id);
                }
                else if (rand() < rak.pMeanGivenSad) {
                    this.act("frown", id);
                }
            }
            if (inst.happiness > 0.666) {
                //console.log("happy", inst.id);
                if (rand() < rak.pNiceGivenHappy) {
                    this.act("smile", id);
                }
                else if (rand() < rak.pMeanGivenHappy) {
                    this.act("frown", id);
                }
            }
        });
        //console.log("id", this.id, "neighbors", ids);
    }

    queueAct(act) {
        if (this.acts.length >= 1) {
            //console.log("act queue overflow");
            return;
        }
        this.acts.push(act);
        this.rak.numActs++;
        this.rak.numPendingActs++;
        //console.log("queue length", this.acts.length);
    }

    handleQueuedActs() {
        var t = this.rak.getPlayTime();
        while (this.acts.length > 0) {
            var act = this.acts[0];
            if (t - act.t0 >= act.dur) {
                act.target.respond(act);
                this.acts = this.acts.slice(1);
                this.rak.numPendingActs--;
            }
            break;
        }
    }

    act(action, target) {
        //console.log("act", this.id, action, target);
        var targetActor = this.rak.actors[target];
        var act = new Act(action, this, targetActor);
        var queueActs = true;
        if (queueActs)
            this.queueAct(act);
        else {
            this.rak.numActs++;
            targetActor.respond(act);
        }
    }

    respond(act) {
        if (act.action == "smile")
            this.happiness += 1;
        if (act.action == "frown")
            this.happiness -= 1;
    }

    getNeighbors() {
        var ids = [];
        var rak = this.rak;
        var id = this.id;
        for (var id2 in rak.actors) {
            if (rak.links[[id, id2]])
                ids.push(id2);
        }
        return ids;
    }

    onOver(e) {
        console.log("onOver", this.id);
    }

    onClick(e) {
        console.log("actor.click", this.id, e.shiftKey);
        this.happiness = 1;
        if (e.shiftKey)
            this.happiness = 0;
    }

    adjustPosition() {
        if (0) {
            var s = 6;
            this.x += s * (Math.random() - 0.5);
            this.y += s * (Math.random() - 0.5);
        }
        else {
            var s = 100 * this.deltaT;
            this.vx += s * (Math.random() - 0.5);
            this.vy += s * (Math.random() - 0.5);
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= .9;
            this.vy *= .9;
        }
    }

    adjustState() {
        var s = this.rak.emotionalDrift;
        this.happiness += s * (Math.random() - 0.5);
        if (this.happiness > 1)
            this.happiness = 1;
        if (this.happiness < 0)
            this.happiness = 0;
    }

    draw(canvas, ctx) {
        if (this.happiness < .33) {
            this.fillStyle = "#a00";
        }
        else if (this.happiness < .66) {
            this.fillStyle = "gray";
        }
        else {
            this.fillStyle = "#0a0";
        }
        super.draw(canvas, ctx);
        this.drawActs(canvas, ctx);
    }

    drawActs(canvas, ctx) {
        var inst = this;
        var t = this.rak.getPlayTime();
        this.acts.forEach(act => {
            var f = (t - act.t0) / act.dur;
            var x = interp(f, inst.x, act.target.x);
            var y = interp(f, inst.y, act.target.y);
            //ctx.lineWidth = 10;
            ctx.strokeStyle = act.action == "smile" ? "green" : "red";
            ctx.fillStyle = act.action == "smile" ? "green" : "red";
            /*
            ctx.beginPath();
            ctx.moveTo(inst.x, inst.y);
            ctx.lineTo(act.target.x, act.target.y);
            ctx.stroke();
            */
            ctx.beginPath();
            ctx.arc(x, y, 3.0, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        });
    }
}

// This is a clique of nodes that sticks around for a limitted
// duration.
// This is not being used.
class Group extends CanvasTool.Graphic {
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
        console.log("destroy group", this.id);
        tool.removeGraphic(this.id);
        delete tool.groups[this.id];
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
                    console.log("cant get " + id1 + " and " + id2);
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
    constructor(canvasName, opts) {
        super(canvasName);
        opts = opts || {};
        this.playSpeed = 1.0;
        this.distThresh = 50;
        this.pAction = 0.1;
        this.numActors = 20;
        this.numActs = 0;
        this.numPendingActs = 0;
        this.grid = true;
        this.mobile = true;
        this.emotionalDrift = 0.1;
        this.pNiceGivenHappy = 0.1;
        this.pNiceGivenSad = 0.0;
        this.pMeanGivenHappy = 0.0;
        this.pMeanGivenSad = 0.0;
        this.initialHappiness = .4;
        this.run = true;
        tool = this;
        this.setupDATGUI();
        this.setOpts(opts);
    }

    updateGui() {
        this.gui.__controllers.forEach(c => c.updateDisplay());
        /*
        for (var i in gui.__controllers) {
            gui.__controllers[i].updateDisplay();
        }
        */
    }

    setOpts(opts) {
        console.log("setOpts", opts);
        this.distThresh = opts.distThresh || 50;
        this.numActors = opts.numActors || 20;
        this.grid = true;
        if (opts.grid != undefined)
            this.grid = opts.grid;
        this.mobile = true;
        if (opts.mobile != undefined)
            this.mobile = opts.mobile;
        this.emotionalDrift = opts.emotionalDrift;
        this.reset();
        this.updateGui();
    }

    setupDATGUI() {
        var P = this;
        var gui = new dat.GUI();
        this.gui = gui;
        gui.add(P, "run");
        gui.add(P, "playSpeed", 0, 2.0);
        gui.add(P, 'numActors', 2, 400);
        gui.add(P, 'distThresh', 0, 200);
        gui.add(P, "emotionalDrift", 0, 1);
        gui.add(P, "pAction", 0, 1.0);
        gui.add(P, "pNiceGivenHappy", 0, 1.0);
        gui.add(P, "pNiceGivenSad", 0, 1.0);
        gui.add(P, "pMeanGivenHappy", 0, 1.0);
        gui.add(P, "pMeanGivenSad", 0, 1.0);
        gui.add(P, 'mobile');
        gui.add(P, 'grid');
        gui.add(P, 'reset');
    }

    reset() {
        this.init();
    }

    add(x, y, id) {
        var actor = new Actor(this, { x, y });
        this.actors[actor.id] = actor;
        this.addGraphic(actor);
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
        var a1 = this.actors[id1];
        var a2 = this.actors[id2];
        var dx = a1.x - a2.x;
        var dy = a1.y - a2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    init() {
        tool = this;
        super.init();
        this.setView(300, 300, 800)
        Actor.reset();
        this.playTime = 0;
        this.prevClockTime = getClockTime();
        this.stepNum = 0;
        this.numActs = 0;
        //this.numActors = 20;
        this.numLinks = 0;
        this.actors = {};
        this.links = {};
        this.groups = {};
        this.initPositions();
        //console.log("********* graphics:", this.graphics);
        //this.initInteractions();
    }

    getPlayTime() {
        return this.playTime;
    }

    initInteractions() {
        var int1 = new Group({ id: "i1", ids: [0, 1, 2, 3] });
        this.groups["i1"] = int1;
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
        for (var i = 0; i < this.numActors; i++) {
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
        for (var i = 0; i < this.numActors; i++) {
            var x = Math.random() * W;
            var y = Math.random() * H;
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
                if (i1 == i2)
                    continue;
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
        for (var id1 in this.actors) {
            var a1 = this.actors[id1];
            for (var id2 in this.actors) {
                if (!this.links[[id1, id2]])
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

    getNumGroups() {
        return Object.keys(this.groups).length;
    }

    tick() {
        //console.log("tick...");
        var t = getClockTime();
        var dt = t - this.prevClockTime;
        this.prevClockTime = t;
        if (this.run) {
            this.playTime += this.playSpeed * dt;
        }
        if (!this.run) {
            this.computeLinks(this.distThresh);
            this.draw();
            return;
        }
        this.stepNum++;
        if (this.mobile)
            this.adjustPositions();
        this.adjustStates();
        this.computeLinks(this.distThresh);
        this.draw();
        for (var id in this.actors)
            this.actors[id].tick();
        for (var id in this.groups)
            this.groups[id].tick();
        this.showStats();
    }

    showStats() {
        var happiness = 0;
        for (var id in this.actors) {
            var actor = this.actors[id];
            happiness += actor.happiness;
        }
        var avgHappiness = happiness / this.getNumActors();
        var str = sprintf("N: %3d t: %5.1f NumActors: %3d  NumActs: %3d  Avg Happiness: %4.2f  Pending: %3d",
            this.stepNum, this.getPlayTime(), this.getNumActors(), this.numActs, avgHappiness, this.numPendingActs);
        $("#stats").html(str);

    }

    handleFrame() {
        var inst = this;
        try {
            inst.tick();
        }
        catch (e) {
            console.log("error", e);
        }
        requestAnimationFrame(() => inst.handleFrame());
    }

    start() {
        console.log("HAK.start");
        this.init();
        this.handleFrame();
        //this.tick();
        //let inst = this;
        //setInterval(() => inst.tick(), 20);
    }
}
