
// SOme of this code is based on flower samples from
// https://www.html5canvastutorials.com/advanced/html5-canvas-blooming-flowers-effect/

"use strict";

var RAD = Math.PI / 180;

function uniform(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

function randomIntFromInterval(mn, mx) {
  return ~~(Math.random() * (mx - mn + 1) + mn);
}


var GARDEN = {};
GARDEN.colors = [
  "#930c37", "#ea767a", "#ee6133", "#ecac43", "#fb9983",
  "#f9bc9f", "#f8ed38", "#a8e3f9", "#d1f2fd", "#ecd5f5",
  "#fee4fd", "#8520b4", "#FA2E59", "#FF703F", "#FF703F",
  "#F7BC05", "#ECF6BB", "#76BCAD"];

GARDEN.canvWidth = 300;
GARDEN.canvHeight = 300;

class Flower extends CanvasTool.Graphic {
  constructor(opts) {
    opts = opts || {};
    super(opts);
    console.log("Flower ", opts);
    var garden = GARDEN;
    this.ctx = garden.ctx;
    var f = this;
    f.cx = getVal(opts.x, uniform(0, garden.canvWidth));
    f.cy = getVal(opts.y, uniform(0, garden.canvHeight));
    f.centerRadMax = opts.centerRadMax || uniform(0.7, 1.5);
    f.centerGrowthInc = uniform(.01, 0.04);
    f.flowerRad = opts.flowerRad || uniform(10, 15);
    f.centerRad = uniform(0.1, 0.4);
    f.growthRate = opts.growthRate || uniform(.1, .2);
    f.petalStyle = opts.petalStyle ||
      garden.colors[~~(Math.random() * garden.colors.length) + 1];
    f.centerStyle = opts.centerStyle ||
      garden.colors[~~(Math.random() * garden.colors.length) + 1];
    f.numPetals = opts.numPetals || randomIntFromInterval(4, 10);
    f.spacing = randomIntFromInterval(4, 10);
  }

  getState() {
    var f = this;
    var obj = {'type': 'Flower', x: f.cx, y: f.cy,
    'flowerRad': f.flowerRad,
    'centerRad': f.centerRad};
    return obj;
  }

  draw(canvas, ctx) {
    super.draw(canvas, ctx);
    this.ctx = ctx;
    var f = this;
    if (f.centerRad < f.centerRadMax) {
      f.flowerRad += f.growthRate;
      f.centerRad += f.centerGrowthInc;
    }
    this.drawFlower(ctx);
  }

  drawFlower(ctx) {
    var f = this;
    ctx.fillStyle = f.petalStyle;
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
      pc[i] = [o1, o2];
      //pc[i].push(o1);
      //pc[i].push(o2);
    }
    return pc;
  }
}

class GardenEditor {
}

class FlowerEditor extends GardenEditor {
    constructor(garden, flower) {
        super();
        this.gtool = gtool;
        if (flower)
            this.setFlower(flower);
    }

    setFlower(flower) {
        this.selectedFlower = flower;
        if (!this.gui) {
            var gui = new dat.GUI();
            this.gui = gui;
            var f = flower;
            gui.add(f, 'numPetals', 2, 20);
            gui.add(f, 'centerRad', 0, 10);
            gui.add(f, 'flowerRad', 0, 50);
            gui.add(f, 'spacing', 3, 14);
            gui.addColor(f, 'centerStyle');
            gui.addColor(f, 'petalStyle');

        }
    }
}

