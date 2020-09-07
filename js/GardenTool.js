
// Some of this code is based on flower samples from
// https://www.html5canvastutorials.com/advanced/html5-canvas-blooming-flowers-effect/

"use strict";


class Pic extends CanvasTool.ImageGraphic {
  constructor(opts) {
    super(opts);
    this.targetURL = opts.targetURL;
  }

  onClick(e) {
    if (!this.targetURL)
      return true;
    this.tool.showPage(this.targetURL);
    //$("#webView").src = this.targetURL;
    //window.open(this.targetURL, "webView");
    return true;
  }
}

//TODO: modify draw method of this to produce nice frame.
class FramedPic extends Pic {
  constructor(opts) {
    super(opts);
    this.fillStyle = "brown";
  }
  draw(canvas, ctx) {
    var bd = 4;
    this.drawRect(canvas, ctx,
      this.x, this.y,
      this.width + 2 * bd, this.height + 2 * bd);
    if (!this.image)
      return;
    ctx.drawImage(
      this.image,
      this.x - this.width / 2.0, this.y - this.height / 2.0,
      this.width, this.height);
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
  },
  {
    id: 'candle', url: 'images/transFlower.png', x: -50, y: 150, width: 60, height: 60,
    targetURL: 'http://taiko.org'
  }
];


class GardenTool extends CanvasTool {
  constructor(name, opts) {
    super(name, opts);
    opts = opts || {};
    this.numStartupFlowers = getVal(opts.numStartupFlowers, 10);
    this.maxNumWildFlowers = getVal(opts.maxNumWildFlowers, 10);
    var ctx = this.ctx;
    ctx.strokeStyle = "white";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowColor = "#333";
    ctx.globalAlpha = .85;
    this.flowers = [];
    this.user = null;
    this.plantOnClick = false;
    this.initGUI();
    if (getBooleanParameterByName("muse"))
      this.setupMUSE();
    if (getBooleanParameterByName("hud"))
      this.addHUD();
    if (getBooleanParameterByName("jitsi"))
      this.addJitsi();
  }

  addJitsi(parentId) {
    if (this.jitsi) {
      console.log("Already have jitsi");
      return;
    }
    this.jitsi = new GardenJitsi(this, {parentId});;
  }

  addHUD(parentName) {
    if (this.hudDisplay)
      return;
     this.hudDisplay = new Display(this, parentName);
  }

  xresize() {
    //console.log("resizing the canvas...");
    var view = this.getView();
    console.log("view:", view);
    /*
    let canvasWidth = this.canvas.clientWidth;
    let canvasHeight = this.canvas.clientHeight;
    let maxCanvasSize = 800;
    if (canvasWidth > maxCanvasSize) {
        canvasWidth = maxCanvasSize;
    }
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasWidth;
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    */
    this.setView(view);
    this.draw();
  }


  clear() {
    super.clear();
    this.flowers = [];
  }

  initGUI() {
    var inst = this;
    $("#jitsi").click(e => inst.addJitsi());
    $("#save").click(e => inst.downloadGardenObj());
    var dropzone = "#" + this.canvasName;
    $(dropzone).on('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    $(dropzone).on('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    $(dropzone).on('drop', (e) => inst.handleDrop(e));
    $("#login").click(e => inst.handleLogin());
  }

  handleLogin() {
    // window.open('./PlayAuth/auth.html');
    if (this.user) {
      firebase.auth().signOut().then(function () {
        // Sign-out successful.
      }).catch(function (error) {
        // An error happened.
      });
    }
    else {
      window.location = './PlayAuth/authGarden.html';
    }
  }

  start() {
    var inst = this;
    this.flowers = [];
    super.start();
  }

  setupMUSE() {
    if (this.muse)
      return;
    this.muse = new MUSEControl();
    var inst = this;
    this.muse.setMessageHandler(msg => inst.handleMUSEMessage(msg));
  }

  handleMUSEMessage(msg) {
    console.log("msg", msg);
  }

  mouseMove(e) {
    if (this.muse) {
      var cpt = this.getMousePosCanv(e);
      this.muse.sendMessage({type: 'mousePosition', cpt});
    }
    super.mouseMove(e);
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

  async addFlower(opts) {
    opts = opts || {};
    if (opts.x == null)
      opts.x = uniform(-100, 100);
    if (opts.y == null)
      opts.y = uniform(-100, 100);
    var f;
    if (opts.type) {
      f = await createObject(opts);
      if (f) {
        console.log("Created object", f, opts);
      }
      else {
        alert("Couldn't create flower");
        console.log("couldn't create flower for", opts);
      }
    }
    else {
      f = new Flower(opts);
    }
    this.addGraphic(f);
    this.flowers.push(f);
    return f;
  }

  getFlower(id) {
    return this.getGraphic(id);
  }

  removeFlower(f) {
    this.removeGraphic(f);
    arrayRemove(this.flowers, f);
  }

  getNumFlowers() {
    return this.flowers.length;
  }

  addPic(opts) {
    var imgGraphic = new Pic(opts);
    this.addGraphic(imgGraphic);
  }

  async addItem(item) {
    console.log("addItem", item);
    item.gtool = this;
    var otype = item.type;
    var obj = await createObject(item);
    console.log("addItem got", obj);
    if (obj == null) {
      console.log("Couldn't create", item);
      return;
    }
    if (obj instanceof CanvasTool.Graphic) {
      console.log("obj is graphic");
      this.addGraphic(obj);
    }
  }

  handleMouseDown(e) {
    if (e.which != 1)
      return;
    var x = e.clientX;
    var y = e.clientY;
    var pt = this.getMousePos(e);
    if (!this.plantOnClick)
      return;
    console.log("new flower ", pt);
    var f = new Flower(pt);
    this.addGraphic(f);
    this.flowers.push(f);
  }

  clearCanvas() {
    //var ctx = this.canvas.getContext('2d');
    var ctx = this.ctx;
    var canvas = this.canvas;
    //ctx.resetTransform(); // stupid -- internet explorer doesn't have this
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var drawBorder = false;
    if (drawBorder) {
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#999';
      ctx.fillStyle = this.background;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      //ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  async loadGardenFile(url) {
    var gardenName = "garden0";
    if (url == null) {
      gardenName = getParameterByName("garden");
      if (gardenName)
        url = gardenName + ".json"
    }
    url = url || "garden.json";
    console.log("Reading garden file " + url);
    try {
      var obj = await loadJSON(url);
    }
    catch (e) {
      var errStr = "Failed to load garden "+url;
      console.log(errStr);
      alert(errStr);
    }
    console.log("got garden data: " + JSON.stringify(obj));
    return await this.loadGarden(obj);
    return garden;
  }

  // load flowers from a JSON object
  async loadGarden(obj) {
    console.log("loadGarden");
    var garden = new Garden({ name: "garden0", gtool: this });
    garden.load(obj);
    return garden;
  }

  async initFirebase() {
    var inst = this;
    if (inst.firebase)
      return;
      var firebaseConfig = {
        apiKey: "AIzaSyABtA6MxppX03tvzqsyO7Mddc606DsHLT4",
        authDomain: "gardendatabase-1c073.firebaseapp.com",
        databaseURL: "https://gardendatabase-1c073.firebaseio.com",
        projectId: "gardendatabase-1c073",
        storageBucket: "gardendatabase-1c073.appspot.com",
        messagingSenderId: "601117522914",
        appId: "1:601117522914:web:90b28c88b798e45f5fd7bb"
      };

    // Initialize Firebase
    //TODO: move firebase initialization to early place before we
    // go to fetch data.
    firebase.initializeApp(firebaseConfig);
    inst.firebase = firebase;
    var db = firebase.database();
    inst.firebaseDB = db;
    var dbRef = db.ref('/userState');
    //console.log("Got dbRef", dbRef);
    dbRef.on('value', snap => {
      inst.noticeUserStates(snap);
    });

    firebase.auth().onAuthStateChanged(user => {
      console.log("authStateChange", user);
      inst.user = user;
      if (user) {
        // User is signed in.
        var displayName = user.displayName;
        var email = user.email;
        var emailVerified = user.emailVerified;
        var photoURL = user.photoURL;
        var isAnonymous = user.isAnonymous;
        var uid = user.uid;
        var providerData = user.providerData;
        $("#userInfo").html(user.displayName + " " + user.email);
        $("#login").html("signout");
        inst.heartBeater = setInterval(() => inst.produceHeartBeat(), 15000);
        // ...
      } else {
        // User is signed out.
        // ...
        $("#userInfo").html("guest");
        $("#login").html("login");
        if (inst.heartBeater) {
          clearInterval(inst.heartBeater);
          inst.heartBeater = null;
        }
      }
    });
  }

  noticeUserStates(snap) {
    //console.log("noticeUserStates Got", snap);
    var obj = snap.val();
    //console.log("obj", obj);
    var jstr = JSON.stringify(obj, null, 3);
    //console.log("userState", jstr);
  }


  async produceHeartBeat() {
    var uid = this.user.uid;
    var email = this.user.email;
    var t = getClockTime();
    console.log("heartbeat tick...", uid, email, t);
    var userState = {
      email, uid, lastUpdate: t
    }
    //console.log("userState", userState);
    var dbRef = this.firebaseDB.ref();
    //await dbRef.child("/userState/" + uid).set(userState);
    await dbRef.child("/user/state/" + uid + "/login").set(userState);
    //console.log("Successfully updated");
  }

  async getObjFromDB(path, db) {
    console.log("getObjFromDB", path);
    var inst = this;
    await this.initFirebase();
    db = db || this.firebaseDB;
    console.log("db:", db);
    var dbRef = db.ref(path);
    console.log("Got dbRef", dbRef);
    return new Promise((res, rej) => {
      try {
        dbRef.once('value').then(snap => {
          console.log("Got", snap);
          var obj = snap.val();
          console.log("obj", obj);
          var jstr = JSON.stringify(obj, null, 3);
          res(obj);
        });
      }
      catch (e) {
        console.log("Error tring to get path", path);
        rej(e);
      }
    });
  }


  async addURL(url) {
    var obj = { 'type': 'URL', url };
    return await this.addTopic(obj);
  }

  async addTopic(obj) {
    console.log("addTopic", obj);
    if (!obj.id) {
      obj.id = genUniqueId();
    }
    var dbRef = this.firebaseDB.ref();
    var ret = await dbRef.child("/topics/urls/" + obj.id).set(obj);
    console.log("topic added");
    return ret;
  }

  async loadFromFirebase() {
    var garden = new ProjectGarden({ name: "projects", gtool, dbName: "foo" });
  }

  getGardenStateObj() {
    var obj = { flowers: [] };
    this.flowers.forEach(f => obj.flowers.push(f.getState()));
    return obj;
  }

  downloadGardenObj() {
    var obj = this.getGardenStateObj();
    var jstr = JSON.stringify(obj, null, 3);
    downloadFromBrowser("gardenState.json", jstr);
  }

  handleDrop(e) {
    var inst = this;
    console.log("handleDrop", e);
    window.Exxx = e;
    e.preventDefault();
    e.stopPropagation();
    if (e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files.length) {
      console.log("handle fild data");
      e.preventDefault();
      e.stopPropagation();
      var files = e.originalEvent.dataTransfer.files;
      if (files.length > 1) {
        alert("Cannot handle multiple dropped files");
        return;
      }
      var file = files[0];
      console.log("file", file);
      console.log("files", e.originalEvent.dataTransfer.files)
      var reader = new FileReader();
      reader.onload = (e) => {
        var jstr = reader.result;
        console.log("got jstr", jstr);
        var data = JSON.parse(jstr);
        console.log("data", data);
        inst.clear();
        inst.loadGarden(data);
      };
      var txt = reader.readAsText(file);
    }
    else {
      //alert("other drop event");
      const lines = e.originalEvent.dataTransfer.getData("text/uri-list").split("\n");
      lines.forEach(async line => {
        console.log("*** line", line);
        var url = line;
        await inst.addURL(url);
      });
    }
  }

  showProject(project) {
    console.log("showProject");
    var hstr = sprintf("<h3 align='center'>%s</h3><p>\n%s", project.name, project.description)
    $("#projectView").html(hstr);
    $("#instagramView").html("");
    if (project.instagramUsername || project.instagramTag)
      this.showInstagram(project);
  }

  showInstagram(project) {
    console.log("showInstagram");
    var opts = {
      //      'username': 'taikoin',
      'username': project.instagramUsername,
      //      'container': "#instagram-feed1",
      'container': "#instagramView",
      'display_profile': true,
      'display_biography': true,
      'display_gallery': true,
      'callback': null,
      'styling': true,
      'items': 8,
      'items_per_row': 4,
      'margin': 1
    }
    if (project.instagramUsername)
      opts.username = project.instagramUsername;
    else if (project.instagramTag)
      opts.tag = project.instagramTag;
    $.instagramFeed(opts);
  }

  showPage(url) {
    console.log("showPage ", url);
    $("#webView").attr('src', url);
  }

  showImage(url) {
    console.log("showImage ", url);
    if (this.hudDisplay)
      this.hudDisplay.showImage(url);
   if (this.picViewer) {
      this.picViewer.setImageURL(url);
    }
  }

  showVideo(idOrURL) {
    console.log("GardenTool.showVideo ", idOrURL);
    this.addHUD();
    if (this.hudDisplay)
      this.hudDisplay.playVideo(idOrURL);
  }

}

