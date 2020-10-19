// module aliases
var Engine = Matter.Engine,
    Events = Matter.Events,
    Render = Matter.Render,
    World = Matter.World,
    Constraint = Matter.Constraint,
    Mouse = Matter.Mouse,
    MouseConstraint = Matter.MouseConstraint,
    Vector = Matter.Vector;
    Body = Matter.Body;
    Bodies = Matter.Bodies;

// create an engine
var engine = Engine.create();
var world = engine.world;

// create a renderer
var render = Render.create({
    element: document.body,
    engine: engine
});

var wd = 80;
var ht = 80;
var ncols = 10;
var nrows = 4;
var x0 = 50;
var y0 = 100;

var bodies = [];
var constraints = [];
var bodiesByRowCol = {};
var stiffness = 0.1;

params = {
    A: .01,
    W: 20
};

function addMesh() {
    for (var i = 0; i < ncols; i++) {
        for (var j = 0; j < nrows; j++) {
            var x = x0 + wd * i;
            var y = y0 + ht * j;
            var box = Bodies.rectangle(x, y, 40, 40);
            bodies.push(box);
            bodiesByRowCol[i + "_" + j] = box;
        }
    }

    for (var i = 0; i < ncols; i++) {
        for (var j = 0; j < nrows; j++) {
            var bodyA = bodiesByRowCol[i + "_" + j];
            if (j < nrows - 1) {
                var bodyB = bodiesByRowCol[i + "_" + (j + 1)];
                var c = Constraint.create({ bodyA, bodyB, stiffness });
                constraints.push(c);
            }
            if (i < ncols - 1) {
                var bodyB = bodiesByRowCol[(i + 1) + "_" + j];
                var c = Constraint.create({ bodyA, bodyB, stiffness });
                constraints.push(c);
            }
            if (i < ncols - 1 && j > 0) {
                var bodyB = bodiesByRowCol[(i + 1) + "_" + (j - 1)];
                var c = Constraint.create({ bodyA, bodyB, stiffness });
                constraints.push(c);
            }
            if (i < ncols - 1 && j < nrows - 1) {
                var bodyB = bodiesByRowCol[(i + 1) + "_" + (j + 1)];
                var c = Constraint.create({ bodyA, bodyB, stiffness });
                constraints.push(c);
            }
        }
    }
    var v = {x: 0, y: 0};
    var bodyB = bodiesByRowCol["0_0"];
    var pos = bodyB.position;
    pos = {x: pos.x, y: pos.y};
    var c = Constraint.create({bodyB, pointA: pos, pointB: v});
    constraints.push(c);

    var v = {x: 0, y: 0};
    var bodyB = bodiesByRowCol[(ncols-1)+"_0"];
    var pos = bodyB.position;
    pos = {x: pos.x, y: pos.y};
    var c = Constraint.create({bodyB, pointA: pos, pointB: v});
    constraints.push(c);

  // var bodyB = bodiesByRowCol["0_"+(ncols-1)];
   // var c = Constraint.create({bodyB, pointA: bodyB.position});
    //constraints.push(c);
}

addMesh();

// create two boxes and a ground
//var boxA = Bodies.rectangle(400, 200, 80, 80);
//var boxB = Bodies.rectangle(480, 50, 80, 80);
//var boxC = Bodies.rectangle(350, 120, 260, 20);
var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
bodies.push(ground);
// add all of the bodies to the world
World.add(world, bodies);
World.add(world, constraints);
//World.add(world, [boxA, boxB, boxC, ground]);

// add mouse control
var mouse = Mouse.create(render.canvas),
    mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });

World.add(world, mouseConstraint);

// keep the mouse in sync with rendering
render.mouse = mouse;

var tickNum = 0;
function showStats(t) {
    tickNum++;
    $("#stats").html(sprintf("%5d %5.1f", tickNum, t));
}

var gui = null;
function setupGUI() {
    gui = new dat.GUI();
    gui.add(params, "W", 0, 50);
    gui.add(params, "A", 0.0, 0.02);
}

setupGUI();

var b0 = bodies[6];
var E = null;
Events.on(engine, "beforeUpdate", (e) => {
    //console.log("beforeUpdate");
    E = e;
    var t = e.timestamp / 1000;
    showStats(t);
    //console.log("t", t);
    var A = params.A;
    var W = params.W;
    var vx = A*Math.sin(W*t);
    var vy = A*Math.cos(W*t);
    var v = Vector.create(vx, vy);
    Body.applyForce(b0, b0.position, v);
})
// run the engine
Engine.run(engine);

// run the renderer
Render.run(render);
