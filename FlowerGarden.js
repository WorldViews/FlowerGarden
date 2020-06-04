
// This code was taken from
// https://www.html5canvastutorials.com/advanced/html5-canvas-blooming-flowers-effect/

"use strict";

var RAD = Math.PI / 180;

function uniform(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

function randomIntFromInterval(mn, mx) {
  return ~~(Math.random() * (mx - mn + 1) + mn);
}

class Animal {
  constructor(garden, url, pos, size) {
    var inst = this;
    this.garden = garden;
    var ctx = garden.ctx;
    pos = pos || {x: 100, y: 80};
    size = size || {width: 60, height: 80};
    this.x = pos.x;
    this.y = pos.y;
    this.width = size.width;
    this.height = size.height;
    url = url || "penguin.svg";
    console.log("*** drawSVG " + url);
    this.svgImg = new Image;
    this.svgImg.onload = function(){
        console.log("*** image loaded ***");
        ctx.drawImage(inst.svgImg, inst.x, inst.y, inst.width, inst.height);
      };
    this.svgImg.src = url;
  }

  draw(ctx) {
    var inst = this;
    if (!this.svgImg)
      return;
    this.garden.ctx.drawImage(inst.svgImg, inst.x, inst.y, inst.width, inst.height);
  }
}

class Penguin extends Animal {
  constructor(garden, pos, size) {
    super(garden, "penguin.svg", pos, size);
  }
}

class Flower {
  constructor(garden, opts) {
    this.garden = garden;
    this.ctx = garden.ctx;
    opts = opts || {};
    var f = this;
    f.cx = opts.x || uniform(0, garden.canvWidth);
    f.cy = opts.y || uniform(0, garden.canvHeight);
    f.centerRadMax = opts.centerRadMax || uniform(0.7,1.5);
    f.centerGrowthInc = uniform(.01, 0.04);
    f.flowerRad = opts.flowerRad || uniform(10, 15);
    f.centerRad = uniform(0.1, 0.4);
    f.growthRate = opts.growthRate || uniform(.1,.2);
    f.fillStyle = opts.fillStyle ||
            garden.colors[~~(Math.random() * garden.colors.length) + 1];
    f.centerStyle = opts.centerStyle ||
          garden.colors[~~(Math.random() * garden.colors.length) + 1];
    f.numPetals = opts.numPetals || randomIntFromInterval(4, 10);
    f.spacing = randomIntFromInterval(4, 10);
  }

  update() {
    var f = this;
    if (f.centerRad < f.centerRadMax) {
      f.flowerRad += f.growthRate;
      f.centerRad += f.centerGrowthInc;
    }
    this.draw();
  }

  draw() {
    var f = this;
    var ctx = f.ctx;
    ctx.fillStyle  = f.fillStyle;
    var petals = this.buildPetals(f.flowerRad, f.centerRad, f.cx, f.cy, f.numPetals, f.spacing);
    for (var petal = 0; petal < petals.length; petal++) {
      this.drawCurve(petals[petal]);
    }
    ctx.beginPath();
    ctx.fillStyle = f.centerStyle;
    ctx.arc(f.cx, f.cy, f.centerRad * 10, 0, 2 * Math.PI)
    ctx.fill();
  }


  drawCurve(p) {
    var ctx = this.ctx;
    var pc = this.controlPoints(p); // the control points array
    ctx.beginPath();
    ctx.moveTo(p[0].x, p[0].y);
    // the first & the last curve are quadratic Bezier
    // because I'm using push(), pc[i][1] comes before pc[i][0]
    ctx.quadraticCurveTo(pc[1][1].x, pc[1][1].y, p[1].x, p[1].y);

    if (p.length > 2) {
      // central curves are cubic Bezier
      for (var i = 1; i < p.length - 2; i++) {
        ctx.bezierCurveTo(pc[i][0].x, pc[i][0].y, pc[i + 1][1].x, pc[i + 1][1].y, p[i + 1].x, p[i + 1].y);
      }
      // the first & the last curve are quadratic Bezier
      var n = p.length - 1;
      ctx.quadraticCurveTo(pc[n - 1][0].x, pc[n - 1][0].y, p[n].x, p[n].y);
    }
    ctx.fill();
  }

  buildPetals(R, k, cx, cy, numPetals, spacing) {
    var r = R * k;
    var A = 360 / numPetals;
    var petals = [];
    for (var i = 0; i < numPetals; i++) {
      var ry = [];
  
      ry[ry.length] = {
        x: cx,
        y: cy
      }
  
      var a1 = i * A + spacing;
      var x1 = ~~(cx + R * Math.cos(a1 * RAD));
      var y1 = ~~(cy + R * Math.sin(a1 * RAD));
  
      ry[ry.length] = {
        x: x1,
        y: y1,
        a: a1
      }
  
      var a2 = i * A + A / 2;
      var x2 = ~~(cx + r * Math.cos(a2 * RAD));
      var y2 = ~~(cy + r * Math.sin(a2 * RAD));
  
      ry[ry.length] = {
        x: x2,
        y: y2,
        a: a2
      }
  
      var a3 = i * A + A - spacing
      var x3 = ~~(cx + R * Math.cos(a3 * RAD));
      var y3 = ~~(cy + R * Math.sin(a3 * RAD));
  
      ry[ry.length] = {
        x: x3,
        y: y3,
        a: a3
      }
  
      ry[ry.length] = {
        x: cx,
        y: cy
      }
  
      petals[i] = ry;
  
    }
    return petals
  }

  controlPoints(p) {
    // given the points array p calculate the control points
    var t = 1 / 5;
    var pc = [];
    for (var i = 1; i < p.length - 1; i++) {
      var dx = p[i - 1].x - p[i + 1].x; // difference x
      var dy = p[i - 1].y - p[i + 1].y; // difference y
      // the first control point
      var x1 = p[i].x - dx * t;
      var y1 = p[i].y - dy * t;
      var o1 = {
        x: x1,
        y: y1
      };
  
      // the second control point
      var x2 = p[i].x + dx * t;
      var y2 = p[i].y + dy * t;
      var o2 = {
        x: x2,
        y: y2
      };
  
      // building the control points array
      pc[i] = [];
      pc[i].push(o1);
      pc[i].push(o2);
    }
    return pc;
  }
  
}


/*
window.setTimeout(function() {
  if (requestId) {
    window.cancelAnimationFrame(requestId)
  };
  console.log("cancelAnimationFrame")
}, 6000)

*/

class FlowerGarden {
  constructor(canvasName) {
    this.canvasName = canvasName || "flowerCanvas";
    this.svgImages = {};
    this.flowers = [];
    this.colors = [
      "#930c37", "#ea767a", "#ee6133", "#ecac43", "#fb9983",
      "#f9bc9f", "#f8ed38", "#a8e3f9", "#d1f2fd", "#ecd5f5",
      "#fee4fd", "#8520b4", "#FA2E59", "#FF703F", "#FF703F",
      "#F7BC05", "#ECF6BB", "#76BCAD"];
    this.init();
  }

  async loadGarden() {
    var obj = await loadJSON("garden.json");
    console.log("got garden data: " + JSON.stringify(obj));
    obj.flowers.forEach(flower => {
      this.addFlower(flower);
    })
  }

  async init() {
    var opts = {};
    try {
      opts = await loadJSON("garden.json");
      console.log("got garden data: "+JSON.stringify(opts))
    }
    catch (e) {
      console.log("Failed to get garden init", e);
    }
    this.init_(opts);
    this.animals = [
      new Penguin(this),
      new Animal( this, "penguin2.svg", {x: 500, y: 150}),
      new Penguin(this, {url: "penguin2.svg", x: 300, y:200})
    ];
  }

  init_(opts) {
    var inst = this;
    this.numInitialFlowers = opts.numInitialFlowers || 8;
    this.maxNumFlowers = opts.maxNumFlowers || 20;
    this.requestId = window.requestAnimationFrame(e => inst.update(e));
    window.setInterval(e => {
      if (inst.flowers.length < inst.maxNumFlowers)
        inst.addFlower();
    }, 300);
    //$("#"+this.canvasName).click(e => inst.handleClick(e));
    $("#" + this.canvasName).mousedown(e => inst.handleClick(e));
    var c = document.getElementById(this.canvasName);
    this.canvas = c;
    this.ctx = c.getContext("2d");
    this.canvWidth = c.width = window.innerWidth;
    this.canvHeight = c.height = window.innerHeight;
    this.cX = this.canvWidth / 2,
    this.cY = this.canvHeight / 2;
    var ctx = this.canvas.getContext("2d");
    this.ctx = ctx;
    ctx.strokeStyle = "white";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowColor = "#333";
    ctx.globalAlpha = .85;
    this.initFlowers();
    if (opts.flowers) {
      opts.flowers.forEach(flower => {
        this.addFlower(flower);
      })  
    }
  }

  initFlowers() {
    var flowers = this.flowers;
    for (var hm = 0; hm < this.numInitialFlowers; hm++) {
      this.addFlower().update();
    }
  }


  addFlower(opts) {
    console.log("Adding flower");
    var f = new Flower(this, opts);
    this.flowers.push(f);
    return f;
  }

  handleClick(e) {
    var pt = { x: e.clientX, y: e.clientY };
    console.log("click ", pt);
    this.addFlower(pt);
  }

  drawSVG(url, pos, size) {
    var inst = this;
    var ctx = this.ctx;
    pos = pos || {x: 100, y: 80};
    size = size || {width: 60, height: 80};
    url = url || "penguin.svg";
    console.log("*** drawSVG " + url);
    if (this.svgImages[url]) {
      ctx.drawImage(this.svgImages[url], pos.x, pos.y, size.width, size.height);
    }
    else {
      var img = new Image;
      this.svgImages[url] = img;
      img.onload = function(){
        console.log("*** image loaded ***");
        ctx.drawImage(img, pos.x, pos.y, size.width, size.height);
      };
      img.src = url;
    }
  }

  update() {
    var inst = this;
    this.ctx.clearRect(0, 0, this.canvWidth, this.canvHeight);
    this.flowers.forEach(flower => flower.update());
    this.animals.forEach(animal => animal.draw());
    this.requestId = window.requestAnimationFrame(e => inst.update());
  }

}
