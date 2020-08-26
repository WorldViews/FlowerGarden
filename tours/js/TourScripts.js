
var SITE_NAME = "";
var HOST = null; // "localhost:8000";
var METADATA_HOST = null; // "localhost:8001";

var TOUR_URL_BASE = null;
var BOOKMARKS_URL = null;
var UPDATE_BOOKMARKS_URL = null;
var SERVER = null;

//var sock = null;
var SIO_URL = "http://platonia:4000";
var PC = null;


function setupURLs() {
    console.log("setupURLs");
    if (document.URL.startsWith("file:")) {
        alert("Virtual Tours are not fully functional with file URLs");
    }
    if (!HOST) {
        console.log("Using document server for host");
        HOST = window.location.host;
    }
    if (!HOST) {
        //console.log("no server detected - assuming localhost:8000");
        //HOST = "localhost:8000";
        HOST = "dvr4.paldeploy.com";
        console.log("no server detected - assuming " + HOST);
    }
    if (!METADATA_HOST) {
        //METADATA_HOST = HOST.replace(":8000", "");
        //METADATA_HOST = METADATA_HOST+":8001";
        METADATA_HOST = HOST;
    }
    SERVER = "http://" + HOST;
    URL_ROOT = "/";
    if (HOST == "dvr4.paldeploy.com") {
        URL_ROOT = "/PanoJS/";
    }
    console.log("HOST: " + HOST);
    console.log("SERVER: " + SERVER);
    console.log("URL_ROOT: " + URL_ROOT);

    if (!TOUR_URL_BASE) {
        console.log("Setting TOUR_URL_BASE");
        //TOUR_URL_BASE = "http://%HOST%/".replace("%HOST%", METADATA_HOST);
        //TOUR_URL_BASE = "http://dvr4.paldeploy.com/PanoJS/tours/data/";
        //TOUR_URL_BASE = "http://platonia:8000/tours/data/";
        TOUR_URL_BASE = URL_ROOT + "tours/data/";
    }
    if (!BOOKMARKS_URL) {
        BOOKMARKS_URL = URL_ROOT + "tours/data/" + SITE_NAME + "bookmarks.json".replace("%HOST%", METADATA_HOST);
    }
    if (!UPDATE_BOOKMARKS_URL) {
        //UPDATE_BOOKMARKS_URL = "http://%HOST%/update/bookmarks.json".replace("%HOST%", METADATA_HOST);
        UPDATE_BOOKMARKS_URL = BOOKMARKS_URL;
    }
    console.log("TOUR_URL_BASE: " + TOUR_URL_BASE);
    console.log("BOOKMARKS_URL: " + BOOKMARKS_URL);
    console.log("UPDATE_BOOKMARKS_URL: " + UPDATE_BOOKMARKS_URL);
}

/*
Note on firefox bug.  In firefox, e.which for many mouse
down or move events is giving 1, which it should be 2 (for
middle mouse) or 0 for no button.  It works fine in firefox.
But to get it working in both, we are instead using a variable
mouseIsDown to determine if a mousedown even has happened and
a mouseup event didn't.  This works pretty well, but introduces
anothor minor bug, that if you click down over the image, then
move the mouse off the image and release the button, it will
act like a sticky up.  To recover just click again in the image.
 */
var BOOKMARKS = {};
var downX = 0;
var downY = 0;
var mouseIsDown = false;
var playSpeed = 0;
var curPose = { yaw: null, phi: null, roll: null, t: null };
var tourCanvas = null;
var currentTourName = null;

function pano_yaw_to_tour_yaw(pyaw) { return 90 - pyaw; }
function tour_yaw_to_pano_yaw(tyaw) { return 90 - tyaw; }


function join(a, b) {
    if (a.slice(-1) != "/" && b[0] != "/")
        return a + "/" + b;
    if (a.slice(-1) == "/" && b[0] == "/")
        return a + b.slice(1);
    return a + b;
}


function checkReply(obj) {
    //console.log("reply: "+JSON.stringify(obj));
    if (obj.error) {
        alert("Error reported by server: " + obj.error);
    }
}

function move(dyaw, dphi, droll) {
    console.log("moveView " + dyaw + " " + dphi + " " + droll);
}

/*
  this sets the camera (view) yaw, but does not register it in the GUI
  immediately.  Instead it requests the new view from the server, and
  when a status message later comes back from the server indicating that
  view, the GUI is updated then.
 */
//function setYaw(yaw)
function setVirtualCamYaw(yaw) {
    var y0 = curPose.yaw;
    //console.log("TS.setVirtualCamYaw "+yaw+"  y0: "+y0);
    if (yaw > 0 && y0 < 0) {
        while (yaw > 0) {
            yaw -= 360;
        }
        console.log("corrected yaw: " + yaw);
    }
    else if (yaw < 0 && y0 > 0) {
        while (yaw < 0) {
            yaw += 360;
        }
        console.log("corrected yaw: " + yaw);
    }
    var phi = curPose.phi;
    var roll = curPose.roll;
    pano.setViewYawPhi(tour_yaw_to_pano_yaw(yaw), phi);
    /*
    if (PC) {
	var vYaw = pano.getViewYaw();
	var vPitch = pano.getViewPitch();
	var msg = {type: 'pano.control', panoView: [vYaw,vPitch], userId: 'master'};
	PC.sendMessage(msg);
    }
    */
}

function setCamView(yaw, phi, roll) {
    curPose.yaw = yaw;
    curPose.phi = phi;
    curPose.roll = roll;
}

function zoom(zf) {
    console.log("zoom " + zf);
}

function startDrag() {
    console.log("startDrag");
}

var lastDragTime = 0;

function drag(dx, dy) {
    console.log("drag " + dx + " " + dy);
    var t = Date.now() / 1000.0;
    var dt = t - lastDragTime;
    if (dt < 0.2) {
        console.log("skipping drag event  dt: " + dt);
        return;
    }
    lastDragTime = t;
}

function setMode(mode) {
    console.log("mode: " + mode);
}

function goToHome() {
    console.log("goToHome: " + mode);
}

function goToHomeView() {
    console.log("goToHomeView");
}

function setHomeView() {
    console.log("setHomeView");
}

function goToPos(x, y) {
    console.log("goToPos " + x + " " + y);
}

function handleRecording() {
    var amRecording = ($("#recordingButton").val() != "Record");
    if (amRecording) {
        $("#recordingButton").val("Record");
    }
    else {
        $("#recordingButton").val("Stop Recording");
    }
}

function handleDecorations() {
    console.log("decorationsCheckbox");
    var showDecs = $("#decorationsCheckbox").is(':checked');
    console.log("decorationsCheckbox " + showDecs);
}

function handlePlay() {
    console.log("handlePlay");
    setPlaySpeed(1);
    pano.play();
    if (PC)
        PC.sendMessage({ type: 'pano.control', playSpeed: 1 });
}

function handlePause() {
    console.log("handlePause");
    setPlaySpeed(0);
    pano.pause();
    if (PC)
        PC.sendMessage({ type: 'pano.control', playSpeed: 0 });
}

function setPlaySpeed(speed) {
    playSpeed = speed;
    console.log("setPlaySpeed " + speed);
    pano.setPlaySpeed(speed);
    if (PC)
        PC.sendMessage({ type: 'pano.control', playSpeed: speed });
}

function handleSpeedUp() {
    console.log("speedUp");
    if (playSpeed == 0)
        pano.play();
    if (playSpeed > .3 || playSpeed < -.3) {
        setPlaySpeed(1.2 * playSpeed);
    }
    else {
        if (playSpeed >= 0)
            setPlaySpeed(playSpeed + 0.1);
        else
            setPlaySpeed(playSpeed - 0.1);
    }
}

function handleSlowDown() {
    console.log("slowDown");
    if (playSpeed > .3) {
        setPlaySpeed(playSpeed / 1.2);
    }
    else {
        playSpeed -= 0.1;
        if (playSpeed < 0)
            playSpeed = 0;
        setPlaySpeed(playSpeed);
    }
}

function handleReverse() {
    console.log("reverse");
    playSpeed = -playSpeed;
    if (playSpeed == 0)
        playSpeed = -1;
    setPlaySpeed(playSpeed);
}

function getPlayTime() {
    return curPose.t;
}

// This requests the server to set a given play time.
// The server will send images, and a future status message
// will indiate the time.
function setPlayTime(t) {
    console.log("setPlayTime " + t);
    pano.setPlayTime(t);
    if (PC)
        PC.sendMessage({ 'type': 'pano.control', time: t });
}

var prevRequestedPlayTime = 0;
var requestedPlayTime = 0;

function noticeRequestedPlayTime(t) {
    requestedPlayTime = t;
}

function sendRequestedPlayTime() {
    if (requestedPlayTime != prevRequestedPlayTime) {
        setPlayTime(requestedPlayTime);
        prevRequestedPlayTime = requestedPlayTime;
    }
}

function fmt1(f) {
    return "" + Math.floor(f * 10) / 10;
}

function fmt3(f) {
    return "" + Math.floor(f * 1000) / 1000;
}

function getStatus() {
    //console.log("getStatus ");
    if (!pano) {
        console.log("no pano");
        return
    }
    var t = pano.getPlayTime();
    curPose.t = t;
    //curPose.yaw = toDegrees(data.c_yaw);
    //curPose.phi = toDegrees(data.c_phi);
    var vYaw = pano.getViewYaw();
    var vPitch = pano.getViewPitch();
    if (PC) {
        var msg = { type: 'pano.control', panoView: [vYaw, vPitch], userId: 'master' };
        if (MOUSE_DOWN) {
            PC.sendMessage(msg);
        }
    }
    c_yaw = pano_yaw_to_tour_yaw(vYaw);
    c_phi = vPitch;
    curPose.yaw = c_yaw;
    curPose.phi = c_phi;
    curPose.roll = 0;
    //var yaw = Math.round(curPose.yaw);
    //var phi = Math.round(curPose.phi);
    var yaw = fmt1(curPose.yaw);
    var phi = fmt1(curPose.phi);
    var str = "vcYaw: " + yaw + " phi: " + phi + " t: " + fmt3(t);
    if (tourCanvas && !tourCanvas.editMode) {
        tourCanvas.setVirtualCamYaw(yaw, true);
        if (tourCanvas.currentRobotYaw != null) {
            str += " rYaw: " + fmt1(tourCanvas.currentRobotYaw);
        }
        var geoYaw = tourCanvas.getViewYaw();
        str += " geoYaw: " + fmt1(geoYaw)
    }
    if (tourCanvas) {
        //str += "&nbsp;&nbsp;&nbsp;&nbsp "+tourCanvas.status;
        if (!tourCanvas.editMode)
            tourCanvas.setTime(t);
        tourCanvas.hfov = pano.getViewFOV();
        tourCanvas.showTourStatus();
    }
    $("#statusDiv").html(str);
    if (tourCanvas.currentTour) {
        var f = t / tourCanvas.currentTour.duration;
        $("#tourTimeLine").slider('value', f);
    }
}


var T = 0;
function updatePos() {
    T += 1;
    var dx = 3 * Math.sin(.1 * T);
    var dy = 1 * Math.sin(.1 * T);
    var pos = tourCanvas.getPosition();
    tourCanvas.setPosition(pos[0] + dx, pos[1] + dy);
}

function getBookmarks() {
    console.log("getBookmarks");
    var url = BOOKMARKS_URL;
    console.log("getJSON url: " + url);
    $.getJSON(url, function (data) {
        showBookmarks(data);
    });
}


function setBookmark() {
    var name = $("#bookmarkName").val();
    console.log("name: " + name);
    var bm = {
        t: curPose.t, phi: curPose.phi, yaw: curPose.yaw, roll: curPose.roll,
        name: name
    };
    if (tourCanvas && tourCanvas.currentTour) {
        var tourName = tourCanvas.currentTour.name;
        console.log("tourName: " + name);
        bm.tour = tourName;
    }
    else {
        error("Cannot set bookmark without tour");
        return;
    }
    BOOKMARKS[name] = bm;
    updateBookmarks();
    $("#bookmarkName").val("");
    showBookmarks(BOOKMARKS);
    $("#bookmarkSelection").val(name);
}


function showBookmarks(data) {
    BOOKMARKS = data;
    console.log("BOOKMARKS: " + JSON.stringify(data));

    var bookmarkNames = Object.keys(BOOKMARKS);
    bookmarkNames.sort();
    $("#bookmarkSelection").html("");
    //for (var name in ANIM.views) {
    $("#bookmarkSelection").append($('<option>', { value: "", text: "" }));
    for (var i = 0; i < bookmarkNames.length; i++) {
        var name = bookmarkNames[i];
        console.log("name: " + name + " view: " + JSON.stringify(BOOKMARKS[name]));
        //ANIM.viewNames.push(name);
        $("#bookmarkSelection").append($('<option>', { value: name, text: name }));
    }
    /*
    if (ANIM.views["Home"]) {
	console.log("Going to Home after loading bookmarks");
	ANIM.gotoView("Home", 1);
    }
    */
}


function updateBookmarks() {
    jstr = JSON.stringify(BOOKMARKS);
    console.log("uploading BOOKMARKS: " + jstr);
    var url = UPDATE_BOOKMARKS_URL;
    console.log("uploadBookmarks to " + url);
    jQuery.post(url, jstr, function () {
        console.log("Succeeded at upload bookmarks")
    }, "json");
}

function handleBookmarkSelection() {
    var name = $("#bookmarkSelection").val();
    console.log("selection made name: " + name);
    var view = BOOKMARKS[name];
    console.log("view tour: " + view.tour);
    if (view.tour) {
        currentTourName = view.tour;
        if (tourCanvas) {
            var tour = tourCanvas.findTourByName(currentTourName);
            tourCanvas.setCurrentTour(tour);
        }
    }
    setPlayTime(view.t);
    setCamView(view.yaw, view.phi, view.roll);
}



function tourSliderChanged(e, ui) {
    var tour = tourCanvas.currentTour;
    if (!tour) {
        console.log("*** no tour selected ***");
        return;
    }
    var t = ui.value * tour.duration;
    console.log("slider val: " + ui.value + " " + t);
    setPlayTime(t);
}

/*
More info on sliders at: https://jqueryui.com/slider/
 */
function setupTourInfo() {
    //$("#setTourPoint").click(setTourPoint);
    $("#saveTour").click(function (e) {
        tourCanvas.saveTour(e);
    });
    $("#restoreTour").click(function (e) {
        tourCanvas.restoreTour();
    });
    $("#addTourPoint").click(function (e) {
        tourCanvas.addTourPoint(e);
    });
    $("#toggleEditTour").click(function (e) {
        tourCanvas.toggleEditMode();
    });
    $("#removeTourPoints").click(function (e) {
        tourCanvas.removeTourPoints();
    });
    $("#prevTourPoint").click(function (e) {
        tourCanvas.gotoPrevTourPoint();
    });
    $("#nextTourPoint").click(function (e) {
        tourCanvas.gotoNextTourPoint();
    });
    //$("#tourInfo").append("<br>Dur: "+TOUR.duration);
    $("#tourInfo").append('<div id="tourStatus"></div>');
    $("#tourTimeLine").slider({
        slide: tourSliderChanged,
        min: 0, max: 1, step: 0.001
    });
}

var MOUSE_DOWN = false;
$(document).ready(function () {

    $(document).mousedown(e => { MOUSE_DOWN = true; });
    $(document).mouseup(e => { MOUSE_DOWN = false; });

    setupURLs();
    imagePushUrl = join(SERVER, "pushImages?camId=viewImage");
    console.log("imagePushUrl: " + imagePushUrl);
    $("#viewImg").attr('src', imagePushUrl);

    console.log("ready");
    $("#playButton").click(handlePlay);
    $("#pauseButton").click(handlePause);

    $("#speedUp").click(function () { handleSpeedUp(); });
    $("#slowDown").click(function () { handleSlowDown(); });
    $("#reverse").click(function () { handleReverse(); });

    $("#setPerspective").click(function () { setMode("mode_perspective.fcp") });
    $("#setFocusContext").click(function () { setMode("mode_fc.fcp") });

    $("#pauseButton").click(handlePause);

    $("#recordingButton").click(handleRecording);

    $("#left").click(function () {
        move(2, 0, 0);
    });
    $("#right").click(function () {
        move(-2, 0, 0);
    });
    $("#UP").click(function () {
        move(0, -2, 0);
    });
    $("#DOWN").click(function () {
        move(0, 2, 0);
    });
    $("#in").click(function () {
        zoom(1.2);
    });
    $("#out").click(function () {
        zoom(1 / 1.2);
    });
    $("#perspective").click(function () {
        setMode("mode_perspective.fcp");
    });
    $("#cyl").click(function () {
        setMode("mode_cyl.fcp");
    });
    $("#fc").click(function () {
        setMode("mode_fc.fcp");
    });
    $("#home").click(function () {
        goToHomeView();
    });
    $("#setHome").click(function () {
        setHomeView();
    });
    $("#viewImg").dblclick(function (e) {
        console.log("dbl click on img");
        mouseIsDown = false;
        downX = e.clientX;
        downY = e.clientY;
        goToPos(downX, downY);
    });
    $("#viewImg").mousedown(function (e) {
        console.log("down on img");
        e.preventDefault();
        mouseIsDown = true;
        downX = e.clientX;
        downY = e.clientY;
        //if (e.which == 2) {
        //if (e.which == 1) {
        //    startDrag();
        //}
        startDrag();
    });

    $("#viewImg").mouseup(function (e) {
        console.log("up on img");
        mouseIsDown = false;
    });
    $("#viewImg").mousemove(function (e) {
        //console.log("mouse move on img e.which "+e.which);
        //if (e.which == 2) {
        if (mouseIsDown) {
            var dx = e.clientX - downX;
            var dy = e.clientY - downY;
            console.log("mouse drag " + " " + dx + " " + dy);
            drag(dx, dy);
        }
    });
    $("#decorationsCheckbox").click(handleDecorations);

    $("#bookmarkName").keyup(function (e) {
        console.log('enterBookmark');
        if (e.keyCode == 13) {
            setBookmark();
        }
    });

    $("#bookmarkSelection").change(handleBookmarkSelection);

    $("#editTourInfo").click(function (e) {
        console.log("editTourInfo click");
        if ($("#editTourInfo").val() == "Edit") {
            $("#editTourInfo").val("Hide");
            $("#tourInfo").show(200);
            tourCanvas.locked = false;
        }
        else {
            $("#editTourInfo").val("Edit");
            $("#tourInfo").hide(200);
            tourCanvas.locked = true;
        }
    });

    //setInterval(getStatus, 200);
    setInterval(getStatus, 50);
    getBookmarks();

    console.log("-------------------");
    PROPS.x = "25";
    setupTourInfo();
    tourCanvas = new TourCanvas("canvas1", PROPS);
    tourCanvas.setTime(0);
    var SEND_IMMEDIATELY = false;
    if (SEND_IMMEDIATELY) {
        tourCanvas.playTimeHandler = setPlayTime;
    }
    else {
        //tourCanvas.playTimeHandler = noticeRequestedPlayTime;
        tourCanvas.playTimeHandler = setPlayTime;
        //tourCanvas.playTimeHandler = function(t) { pano.setPlayTime(t); }
        setInterval(sendRequestedPlayTime, 100);
    }
});

