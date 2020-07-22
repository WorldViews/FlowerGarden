
// A garden with flowers representing Git repos for an organization
//
"use strict"

class QuireGarden extends Garden {
    constructor(opts) {
        opts.width = opts.width || 70;
        opts.height = opts.height || 100;
        super(opts);
        this.org = opts.organization || "WorldViews";
        this.targetURL = opts.targetURL;
        this.x0 = opts.x0 || 0;
        this.y0 = opts.y0 || 0;
        this.getData();
    }

    async getData() {
        //var url = sprintf("https://api.github.com/orgs/%s/repos", this.org);
        //console.log("GitGarden.getData", url);
        var projects = await getProjects(true);
        console.log("projects", projects);
        this.addProjectFlowers(projects);
        var tasks = [];
        projects.forEach(proj => {
            console.log("proj", proj);
            console.log("proj.tasks", proj.tasks);
            proj.tasks.forEach(task => {
                tasks.push(task);
            });
        });
        console.log("tasks",tasks);
        this.addProjectFlowers(tasks);
    }

    addProjectFlowers(projects) {
        console.log("addProjectFlowers", projects);
        var inst = this;
        var nprojects = projects.length;
        var i = 0;
        var ncols = 5;
        var spacing = 100;
        var x0 = this.x0 - ncols*spacing/2.0;
        var y0 = this.y0;
        projects.forEach(proj => {
            var row = i % ncols;
            var col = Math.floor(i / ncols);
            console.log("proj", proj);
            var name = proj.nameText;
            var desc = proj.descriptionText || "";
            if (1) {
                var url = "foo";
                console.log("proj url", url);
                //desc += sprintf("<p>size %s<br>", 1);
                desc += sprintf("created %s<br>", proj.createdAt);
                desc += sprintf("due %s<br>", proj.due);
               proj.description = desc;
            }
            console.log(row, col, "name:", name);
            var opts = { x: x0 + row * spacing, y: y0 + col * spacing };
            opts.id = sprintf("quire%s", proj.id);
            opts.targetURL = "https://worldviews.org";
            opts.project = proj;
            inst.gtool.addFlower(opts);
            i++;
        })
    }
}

//# sourceURL=js/QuireGarden.js
