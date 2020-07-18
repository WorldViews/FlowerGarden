
// SOme of this code is based on flower samples from
// https://www.html5canvastutorials.com/advanced/html5-canvas-blooming-flowers-effect/

"use strict"

class Bee extends Pic {
    constructor(opts) {
        opts.width = opts.width || 40;
        opts.height = opts.height || 30;
        opts.url = "images/bee1.png";
        super(opts);
        this.targetURL = opts.targetURL;
    }
}
