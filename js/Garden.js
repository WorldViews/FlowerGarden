"use strict"

console.log("in PeaceTree.js");

class Garden {
    constructor(opts) {
        //super(opts);
        this.name = opts.name;
        this.gtool = gtool;
    }

    // load flowers from a JSON object
    async load(obj) {
        console.log("loadGardenJSON");
        var gtool = this.gtool;
        var inst = this;
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

    async loadGardenerSpec(spec) {
        console.log("loadGardnerSpec", spec);
        var otype = spec.type;
        spec.gtool = this.gtool;
        var obj = await createObject(spec);
        console.log("addItem got", obj);
        // this.gtool.addGraphic(obj);
    }
}

class WildFlowers {
    constructor(opts) {
        console.log("******* Bingo bingo .... WildFlowers...", opts);
        this.gtool = opts.gtool;
        var num = opts.maxNumWildFlowers || 10;
        this.xMin = opts.xMin || -100;
        this.xMax = opts.xMax || 100;
        this.yMin = opts.yMin || -100,
            this.yMax = opts.yMax || 100;
        this.timer = null;
        this.flowers = [];
        this.startWildFlowers(num);
        window.WF = this;
        console.log("xLow xHigh", this.xLow, this.xHigh);
    }

    numFlowers() { return this.flowers.length; }

    startWildFlowers(maxNumWildFlowers) {
        var inst = this;
        inst.maxNumWildFlowers = maxNumWildFlowers;
        this.timer = setInterval(() => inst.addFlower(), 500);
    }

    addFlower() {
        if (this.numFlowers() < this.maxNumWildFlowers) {
            var x = uniform(this.xMin, this.xMax);
            var y = uniform(this.yMin, this.yMax);
            var opts = { x, y };
            console.log("adding flower ", opts);
            var f = this.gtool.addFlower(opts);
            this.flowers.push(f);
        }
        if (this.numFlowers() == this.maxNumWildFlowers) {
            this.removeFlower(this.flowers[0]);
        }
    }

    removeFlower(f) {
        this.gtool.removeFlower(f);
        arrayRemove(this.flowers, f);
    }
}

class ProjectGarden extends Garden {
    constructor(opts) {
        super(opts);
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
        var ncols = 5;
        var spacing = 100;
        var x0 = -200;
        var y0 = 0;
        obj.projects.forEach(proj => {
            var row = i % ncols;
            var col = Math.floor(i / ncols);
            console.log("project", proj);
            var name = proj.name;
            var desc = proj.descriptiong;
            console.log(row, col, "name:", name);
            var opts = { x: x0 + row * spacing, y: y0 + col * spacing };
            opts.id = proj.id;
            opts.targetURL = proj.infoURL || "https://worldviews.org";
            if (proj.imageURL) {
                opts.imageURL = proj.imageURL;
            }
            opts.project = proj;
            inst.gtool.addFlower(opts);
            i++;
        })
    }

}
