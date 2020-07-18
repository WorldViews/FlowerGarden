
// SOme of this code is based on flower samples from
// https://www.html5canvastutorials.com/advanced/html5-canvas-blooming-flowers-effect/

"use strict"

class Penguin extends Pic {
    constructor(opts) {
        opts.width = opts.width || 70;
        opts.height = opts.height || 100;
        opts.url = "images/penguin.svg";
        super(opts);
        this.targetURL = opts.targetURL;
    }
}
