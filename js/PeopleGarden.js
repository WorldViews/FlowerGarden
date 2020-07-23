"use strict"

console.log("in PeopleGarden.js");

class PeopleGarden extends Garden {
    constructor(opts) {
        super(opts);
        this.numAdded = 0;
        if (opts.dbName) {
            this.loadFromDB(opts.dbName);
        }

        var pic = new FramedPic({
            id: 'PicViewer', x: 0, y: -200,
            width: 160, height: 120, url: "images/logo1.png"
        });
        this.gtool.addGraphic(pic);
        this.gtool.picViewer = pic;
    }

    async loadFromDB() {
        var inst = this;
        var gtool = this.gtool;
        gtool.initFirebase();
        var db = gtool.firebaseDB;
        console.log("db:", db);
        var dbRef = db.ref('/userState');
        console.log("Got dbRef", dbRef);
        dbRef.on('value', snap => {
            console.log("Got", snap);
            var obj = snap.val();
            console.log("obj", obj);
            var jstr = JSON.stringify(obj, null, 3);
            inst.load(obj);
        });

    }

    load(obj) {
        this.updatePeopleFlowers(obj);
        //this.picViewer = pic;
    }

    updatePeopleFlowers(obj) {
        console.log("updatePeopleFlowers", obj);
        var people = obj;
        var inst = this;
        var ncols = 5;
        var spacing = 100;
        var x0 = -200;
        var y0 = 0;
        for (var uid in people) {
            var person = people[uid];
            var row = this.numAdded % ncols;
            var col = Math.floor(this.numAdded / ncols);
            var name = person.email;
            var id = "person_" + person.uid;
            console.log(row, col, "name:", name, "idL", id);
            var f = inst.gtool.getFlower(id);
            if (f) {
                console.log("******* update flower f", f);
            }
            else {
                var opts = { x: x0 + row * spacing, y: y0 + col * spacing };
                opts.id = id;
                opts.targetURL = "https://worldviews.org";
                //if (proj.imageURL) {
                //    opts.imageURL = proj.imageURL;
               // }
                opts.project = person;
                inst.gtool.addFlower(opts);
                this.numAdded++;
            }
        }
    }
}

//# sourceURL=js/PeopleGarden.js
