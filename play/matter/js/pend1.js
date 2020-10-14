// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
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

// add all of the bodies to the world
World.add(world, [boxA, boxB, boxC, ground]);

// run the engine
Engine.run(engine);

// run the renderer
Render.run(render);
