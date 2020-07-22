
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
        var obj = await getProjects();
        console.log("org repos", obj);
        //this.addRepoFlowers(obj);
    }

    addRepoFlowers(dataObj) {
        console.log("addRepoFlowers", dataObj);
        var repos = dataObj;
        var inst = this;
        var nrepos = repos.length;
        var i = 0;
        var ncols = 5;
        var spacing = 100;
        var x0 = this.x0 - ncols*spacing/2.0;
        var y0 = this.y0;
        repos.forEach(repo => {
            var row = i % ncols;
            var col = Math.floor(i / ncols);
            console.log("repo", repo);
            var name = repo.name;
            var desc = repo.description || "";
            if (1) {
                var url = sprintf("https://github.com/%s/%s", inst.org, name);
                console.log("repo url", url);
                desc += sprintf("<p>size %s<br>", repo.size);
                desc += sprintf("created %s<br>", repo.created_at);
                desc += sprintf("updated %s<br>", repo.updated_at);
                var link = sprintf('<p><a href="%s" target="other">view on git</a>', url);
                desc += link;
                repo.description = desc;
            }
            console.log(row, col, "name:", name);
            var opts = { x: x0 + row * spacing, y: y0 + col * spacing };
            opts.id = sprintf("gitrepo%s", repo.id);
            opts.targetURL = repo.url || "https://worldviews.org";
            opts.project = repo;
            inst.gtool.addFlower(opts);
            i++;
        })
    }
}

//# sourceURL=js/QuireGarden.js
