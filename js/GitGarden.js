
// A garden with flowers representing Git repos for an organization
//
"use strict"

class GitGarden extends Garden {
    constructor(opts) {
        opts.width = opts.width || 70;
        opts.height = opts.height || 100;
        super(opts);
        this.org = opts.organization || "WorldViews";
        this.user = opts.user;
        this.targetURL = opts.targetURL;
        this.x0 = opts.x0 || 0;
        this.y0 = opts.y0 || 0;
        this.spacing = opts.spacing || 100;
        this.ncols = opts.ncols || 5;
        this.getData();
    }

    async getData() {
        var url;
        if (this.user)
            url = sprintf("https://api.github.com/users/%s/repos", this.user);
        else
            url = sprintf("https://api.github.com/orgs/%s/repos", this.org);
        console.log("GitGarden.getData", url);
        var obj = await loadJSON(url);
        console.log("org repos", obj);
        this.addRepoFlowers(obj);
    }

    addRepoFlowers(dataObj) {
        console.log("addRepoFlowers", dataObj);
        var repos = dataObj;
        var inst = this;
        var nrepos = repos.length;
        var i = 0;
        var ncols = this.ncols;
        var spacing = this.spacing;
        var xLeft = this.x0 - (ncols-1)*spacing/2.0;
        var y0 = this.y0;
        var col, row;
        repos.forEach(repo => {
            col = i % ncols;
            row = Math.floor(i / ncols);
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
            var opts = { x: xLeft + col * spacing, y: y0 + row * spacing };
            opts.id = sprintf("gitrepo%s", repo.id);
            opts.targetURL = repo.url || "https://worldviews.org";
            opts.project = repo;
            inst.gtool.addFlower(opts);
            i++;
        });
        this.width = spacing * (ncols + 1) - spacing;
        this.height = spacing * (row + 1);
        this.x = this.x0;
        this.y = y0 + this.height / 2.0 - spacing + spacing/4;
    }
}

//# sourceURL=js/GitGarden.js
