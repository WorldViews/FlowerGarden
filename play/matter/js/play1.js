// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Constraint = Matter.Constraint,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    Bodies = Matter.Bodies;

// create an engine
var engine = Engine.create();
var world = engine.world;

// create a renderer
var render = Render.create({
    element: document.body,
    engine: engine
});

// create two boxes and a ground
var boxA = Bodies.rectangle(400, 200, 80, 80);
var boxB = Bodies.rectangle(480, 50, 80, 80);
var boxC = Bodies.rectangle(350, 120, 260, 20);
var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
var cAB = Constraint.create({ bodyA: boxA, pointA: {x: 20, y:0}, bodyB: boxB });
var cAC = Constraint.create({ bodyA: boxA, bodyB: boxC });
//var cA = Constraint.create({bodyB: boxC, pointB: {x: 0, y:0}});
var cA = Constraint.create({
    bodyB: boxC,
    pointA: {x: 200, y:200},
    pointB: {x: 100, y: 0},
    stiffness: 0.05
 });
// add all of the bodies to the world
World.add(world, [boxA, boxB, boxC, ground]);
World.add(world, cAB);
World.add(world, cAC);
World.add(world, cA);

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


// run the engine
Engine.run(engine);

// run the renderer
Render.run(render);
