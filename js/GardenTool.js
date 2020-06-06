
// SOme of this code is based on flower samples from
// https://www.html5canvastutorials.com/advanced/html5-canvas-blooming-flowers-effect/

"use strict";

function getVal(val, def) {
  if (val == null)
    return def;
  return val;
}

class Pic extends CanvasTool.ImageGraphic {
  constructor(opts) {
    super(opts);
    this.targetURL = opts.targetURL;
  }

  onClick(e) {
    if (!this.targetURL)
      return true;
    window.open(this.targetURL, "gardenInfo");
    return true;
  }
}

class Circle extends CanvasTool.Graphic {
  constructor(opts) {
    super(opts);
    console.log("Circle ", opts);
  }
}

var PICS = [
  {
    id: 'don', url: 'images/penguin.svg', x: 50, y: 0, width: 20, height: 30,
    targetURL: 'http://worldviews.club/don'
  },
  {
    id: 'shawna', url: 'images/penguin2.svg', x: 100, y: 50, width: 20, height: 30,
    targetURL: 'http://worldviews.club/shawna'
  },
  {
    id: 'manami', url: 'images/mamaP.jpg', x: 200, y: -50, width: 40, height: 50,
    targetURL: 'http://www.dancevita.com/'
  },
  {
    id: 'taiko', url: 'images/taiko.svg', x: 150, y: -100, width: 50, height: 50,
    targetURL: 'http://taiko.org'
  },
  {
    id: 'candle', url: 'images/animated-candle-image-0022.gif', x: 250, y: -200, width: 30, height: 60,
    targetURL: 'http://taiko.org'
  }
];


class GardenTool extends CanvasTool {
  constructor(name, opts) {
    super(name, opts);
    opts = opts || {};
    this.numStartupFlowers = getVal(opts.numStartupFlowers, 10);
    this.maxNumWildFlowers = getVal(opts.maxNumWildFlowers, 10);
  }

  start() {
    var inst = this;
    this.numFlowers = 0;
    this.addFlowers(this.numStartupFlowers);
    setInterval(() => {
      if (inst.numFlowers < inst.maxNumWildFlowers)
        inst.addFlowers(1);
    }, 500);
    super.start();
  }

  loadPics(pics) {
    var inst = this;
    pics.forEach(pic => inst.addPic(pic));
  }

  addFlowers(numFlowers) {
    console.log("addFlowers " + numFlowers);
    for (var i = 0; i < numFlowers; i++)
      this.addFlower();
  }

  addFlower() {
    var f = new Flower({ x: uniform(-100, 100), y: uniform(-100, 100) });
    this.addGraphic(f);
    this.numFlowers++;
    return f;
  }

  addPic(opts) {
    var imgGraphic = new Pic(opts);
    this.addGraphic(imgGraphic);
  }

  handleMouseDown(e) {
    if (e.which != 1)
      return;
    var x = e.clientX;
    var y = e.clientY;
    var pt = this.getMousePos(e);
    console.log("new flower ", pt);
    var f = new Flower(pt);
    this.addGraphic(f);
    this.numFlowers++;
  }
}

