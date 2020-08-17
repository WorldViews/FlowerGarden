"use strict"

console.log("in PeaceTree.js");

class Garden extends CanvasTool.RectGraphic {
    constructor(opts) {
        super(opts);
        this.name = opts.name;
        this.gtool = gtool;
        this.font = "100px Arial";
        this.textStyle = "white";
        this.textAlign = "center";
    }

    draw(canvas, ctx) {
        super.draw(canvas, ctx);
        if (this.name)
            this.drawText(canvas, ctx, this.x, this.y, this.name, this.font);
    }

    // load flowers from a JSON object
    async load(obj) {
        console.log("loadGardenJSON");
        var gtool = this.gtool;
        var inst = this;
        if (obj.requirements) {
            window.MODS = {};
            for (var i=0; i<obj.requirements.length; i++) {
                let jsfile = obj.requirements[i];
                console.log("*** Loading", jsfile);
                try {
                    var module = await import(jsfile);
                    console.log("got", jsfile, module);
                    window.MODS[jsfile] = module;
                    //import * as myModule from '/modules/my-module.js';
                }
                catch (e) {
                    console.log("failed for "+jsfile+" error:"+e);
                }
            }
        }
        if (obj.flowers) {
            obj.flowers.forEach(flower => {
                console.log("flower:", flower);
                gtool.addFlower(flower);
            });
        }
        if (obj.pictures) {
            obj.pictures.forEach(pic => {
                gtool.addPic(pic);
            });
        }
        if (obj.items) {
            obj.items.forEach(item => {
                gtool.addItem(item);
            });
        }
    }

    onClick(e) {
        return false;
    }

    /*
    async loadGardenerSpec(spec) {
        console.log("loadGardnerSpec", spec);
        var otype = spec.type;
        spec.gtool = this.gtool;
        var obj = await createObject(spec);
        console.log("addItem got", obj);
        // this.gtool.addGraphic(obj);
    }
    */
}

class WildFlowers extends Garden {
    constructor(opts) {
        console.log("******* Bingo bingo .... WildFlowers...", opts);
        super(opts);
        this.gtool = opts.gtool;
        this.plantOnClick = opts.plantOnClick;
        if (this.plantOnClick == null)
            this.plantOnClick = true;
        var num = opts.maxNumWildFlowers || 10;
        this.xMin = this.x - this.width / 2;
        this.xMax = this.x + this.width / 2;
        this.yMin = this.y - this.height / 2;
        this.yMax = this.y + this.height / 2;
        this.timer = null;
        this.plants = [];
        this.startWildFlowers(num);
        window.WF = this;
        console.log("xLow xHigh", this.xLow, this.xHigh);
    }

    onClick(e) {
        console.log("WildFlowers.onClick", this.id, e);
        if (e.which != 1)
            return;
        var x = e.clientX;
        var y = e.clientY;
        var pt = this.gtool.getMousePos(e);
        if (!this.plantOnClick)
            return;
        console.log("new flower ", pt);
        var f = new Flower(pt);
        this.gtool.addGraphic(f);
        this.plants.push(f);

    }

    numPlants() { return this.plants.length; }

    startWildFlowers(maxNumWildFlowers) {
        var inst = this;
        inst.maxNumWildFlowers = maxNumWildFlowers;
        this.timer = setInterval(() => inst.addPlant(), 500);
    }

    async addPlant() {
        var inst = this;
        if (this.numPlants() < this.maxNumWildFlowers) {
            var x = uniform(this.xMin, this.xMax);
            var y = uniform(this.yMin, this.yMax);
            var opts = { x, y };
            //console.log("adding flower ", opts);
            var f = await this.gtool.addFlower(opts);
            this.plants.push(f);
        }
        if (this.numPlants() >= this.maxNumWildFlowers) {
            var f = this.plants[0];
            f.die(() => inst.removePlant(f));
            //this.removeFlower(this.flowers[0]);
        }
    }

    removePlant(f) {
        this.gtool.removeFlower(f);
        arrayRemove(this.plants, f);
    }
}

class ProjectGarden extends Garden {
    constructor(opts) {
        super(opts);
        this.x0 = opts.x0 || 0;
        this.y0 = opts.y0 || 0;
        this.spacing = opts.spacing || 100;
        this.ncols = opts.ncols || 5;
        if (opts.dbName) {
            this.loadFromDB(opts.dbName);
        }
    }

    async loadFromDB() {
        var inst = this;
        var gtool = this.gtool;
        gtool.initFirebase();
        var db = gtool.firebaseDB;
        console.log("db:", db);
        var dbRef = db.ref('/topics');
        console.log("Got dbRef", dbRef);
        dbRef.on('value', snap => {
            console.log("Got", snap);
            var obj = snap.val();
            console.log("obj", obj);
            var jstr = JSON.stringify(obj, null, 3);
            inst.load(obj);
        });

    }

    async loadProjectFile(url) {
        if (url == null) {
            var projs = getParameterByName("projects");
            if (projs)
                url = projs + ".json"
        }
        url = url || "projects.json";
        console.log("Reading project file " + url);
        var obj = await loadJSON(url);
        //console.log("got project data: " + JSON.stringify(obj));
        this.load(obj);
    }

    load(obj) {
        this.addProjectFlowers(obj);
        var pic = new FramedPic({
            id: 'PicViewer', x: 0, y: -200,
            width: 160, height: 120, url: "images/logo1.png"
        });
        this.gtool.addGraphic(pic);
        //this.picViewer = pic;
        this.gtool.picViewer = pic;
    }

    addProjectFlowers(obj) {
        console.log("addProjectFlowers", obj);
        var inst = this;
        var i = 0;
        var ncols = this.ncols;
        var spacing = this.spacing;
        var xLeft = this.x0 - (ncols-1)*spacing/2.0;
        var y0 = this.y0;
        var col, row;


        var row, col;
        obj.projects.forEach(proj => {
            col = i % ncols;
            row = Math.floor(i / ncols);
            console.log("project", proj);
            var name = proj.name;
            var desc = proj.description;
            console.log(row, col, "name:", name);
            var opts = { x: xLeft + col * spacing, y: y0 + row * spacing };
            opts.id = proj.id;
            opts.targetURL = proj.infoURL || "https://worldviews.org";
            if (proj.imageURL) {
                opts.imageURL = proj.imageURL;
            }
            opts.project = proj;
            inst.gtool.addFlower(opts);
            i++;
        });
        this.width = spacing * (ncols + 1) - spacing;
        this.height = spacing * (row + 1);
        this.x = this.x0;
        this.y = y0 + this.height / 2.0 - spacing + spacing/4;
    }

}
