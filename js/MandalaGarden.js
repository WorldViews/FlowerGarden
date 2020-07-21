"use strict"


class MandalaGarden extends ProjectGarden {
    load(obj) {
        this.addProjectFlowers(obj);
        var pic = new FramedPic({
            id: 'PicViewer', x: 0, y: -350,
            width: 240, height: 160, url: "images/logo1.png"
        });
        this.gtool.addGraphic(pic);
        //this.picViewer = pic;
        this.gtool.picViewer = pic;
    }

    addProjectFlowers(obj) {
        console.log("addProjectFlowers", obj);
        var inst = this;
        var nprojects = obj.projects.length;
        this.dr = 10;
        this.w = 0.5;
        this.x0 = 0;
        this.y0 = 200;
        this.addSpiral(nprojects, 80);
        var i = 0;
        obj.projects.forEach(proj => {
            console.log("project", proj);
            var name = proj.name;
            var desc = proj.descriptiong;
            var pt = this.pts[i];
            console.log(i, "name:", name, pt);
            var opts = { x: pt[0], y: pt[1] };
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

    addSpiral0(n, r0) {
        this.pts = [];
        var r = r0;
        for (var i = 0; i < n; i++) {
            var t = this.w * i;
            var x = this.x0 + r * Math.cos(t);
            var y = this.y0 + r * Math.sin(t);
            this.pts.push([x, y]);
            r += this.dr;
        }
    }

    addSpiral(n, r0) {
        this.pts = [];
        var r = r0;
        var theta = 0;
        var ds = 80;
        for (var i = 0; i < n; i++) {
            // ds = r dtheta
            // dtheta = ds / r;
            var x = this.x0 + r * Math.cos(theta);
            var y = this.y0 + r * Math.sin(theta);
            this.pts.push([x, y]);
            var dtheta = ds / r;
            theta += dtheta;
            r += this.dr;
        }
    }

}
