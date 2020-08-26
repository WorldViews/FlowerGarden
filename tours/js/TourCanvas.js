/*
This is a class using jQuery to support a map view
for Tours.  Tours are paths of panoramic cameras used
capture a space.
*/
//DELTA_T = 15;
AUTO_SAVE = true;
TC = {};

/*
View modes controlling how the view direction is determined
during motion.
 */
TC.ABSOLUTE = "ABSOLUTE";              // Fixed absolute geographic direction
TC.TARGET = "TARGET";                // Keep looking at given target
TC.RELATIVE_CAMERA = "RELATIVE_CAM";   // Fixed direction relative to camera
TC.RELATIVE_MOTION = "RELATIVE_MOTION";// Fiexed direction relative to motion

TC.robotWidth = 9;
TC.robotLength = 6;
TC.tourLineWidth = 0.5;



// convert yaw in degrees to equivalent (i.e. mod 360)
// yaw in range 0 <= yaw < 360;
TC.fixYaw = function (y) {
    //console.log("TC.fixYaw: "+y);
    while (y < 360)
        y += 36000;
    return y % 360;
}

// Interpolate between two yaw values
TC.interpYaw = function (y1, y2, s) {
    // Simple case would be 
    //    return = (1-s)*y1  + s*y2;
    // but if y1 = 1 and y2 = 360
    // this would 'go the long way around'
    // so we must be more careful...
    if (y2 >= y1) {
        if (y2 - y1 < 180)
            return (1 - s) * y1 + s * y2;
        y2 -= 360;
        return TC.fixYaw((1 - s) * y1 + s * y2);
    }
    if (y2 < y1) {
        if (y1 - y2 < 180)
            return (1 - s) * y1 + s * y2;
        y2 += 360;
        return TC.fixYaw((1 - s) * y1 + s * y2);
    }
}

// Interpolate between two vectors
TC.interpVec = function (v1, v2, s) {
    var x = (1 - s) * v1[0] + s * v2[0];
    var y = (1 - s) * v1[1] + s * v2[1];
    var z = (1 - s) * v1[2] + s * v2[2];
    return [x, y, z];
}

// find distance from point(x,y) to line
// segment [(x1,y1), (x2,y2)]
// returns
// d:       distance
// x: y:    point on line segment nearest to x,y
// s:       param along line segment if 0 <= s <= 1
//          the point is on the segment proper, otherwise
//          it is on extended line
//
TC.distToLineSeg = function (x, y, x1, y1, x2, y2) {

    var A = x - x1;
    var B = y - y1;
    var C = x2 - x1;
    var D = y2 - y1;

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0) //in case of 0 length line
        param = dot / len_sq;

    var xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    }
    else if (param > 1) {
        xx = x2;
        yy = y2;
    }
    else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    var dx = x - xx;
    var dy = y - yy;
    var d = Math.sqrt(dx * dx + dy * dy);
    return { d: d, s: param, x: xx, y: yy };
}

TC.transform = function (pos, translate, scale, rotz) {
    var txy = translate || [0, 0]
    var sxy = scale || [1, 1];
    rotz = rotz || 0;
    var a = toRadians(rotz);
    var x = pos[0];
    var y = pos[1];
    /*
        x *= sxy[0];
        y *= sxy[1];
        var xt = Math.cos(a)*x - Math.sin(a)*y + txy[0];
        var yt = Math.sin(a)*x + Math.cos(a)*y + txy[1];
    */
    var xt = Math.cos(a) * x - Math.sin(a) * y;
    var yt = Math.sin(a) * x + Math.cos(a) * y;
    pos[0] = xt * sxy[0] + txy[0];
    pos[1] = yt * sxy[1] + txy[1];
}

TC.numTours = 0;

class Tour {
    constructor(data) {
        console.log("*** TC.Tour ***");
        var h = TC.numTours++;
        console.log("url: " + data.url);
        if (data.name)
            this.name = data.name;
        else {
            var url = data.url;
            var i = url.lastIndexOf("/");
            if (i >= 0) {
                this.name = url.slice(i + 1);
                this.name = this.name.replace(".json", "");
            }
        }
        this.locked = false;
        this.type = "PanoTour";
        this.DELTA_T = 0;
        this.startTime = 0;
        this.duration = 1;
        this.endTime = this.startTime + this.duration;
        this.recs = [{ time: 0, rt: 0, yaw: 0, pos: [0, h, 0] },
        { time: 1, rt: 1, yaw: 0, pos: [10, h, 0] }]
        console.log("*** Created tour " + JSON.stringify(this));
    }
}

class TourCanvas {
    constructor(canvasId, props) {
        console.log("TourCanvas: props: " + JSON.stringify(props));
        this.status = "";
        var tourCanv = this;
        this.targetPos = null;
        this.camMode = TC.RELATIVE_CAM;
        //this.camMode = TC.ABSOLUTE;
        this.showAxes = false;
        this.locked = true;   // If this is true, can not enter edit mode
        this.graphics = [];
        this.labelFont = "10px Arial";
        this.props = props;
        this.hfov = 100;     // Horizontal Field Of View for camera
        //this.yawOffset = 40;  // This is a parameter that should be
        this.yawOffset = 180;  // This is a parameter that should be 
        // provided in the input file.
        if (props.yawOffset != null)
            this.yawOffset = props.yawOffset;
        this.draggingCursor = false;
        this.mouseDownData = null;
        this.editMode = false;
        this.canvasId = canvasId;
        this.jqId = "#" + canvasId;
        var jqId = this.jqId;
        this.tours = [];
        this.bestMatch = null;
        this.selectedRecIndex = null;
        this.currentTour = null;
        this.currentTime = 0;
        this.currentPos = [0, 0];
        this.downYaw = 0;
        this.currentRobotYaw = 0;     // This is the robot direction yaw
        this.currentVirtualCamYaw = 0;// This is the virtual view yaw within
        //  the panoramic image.
        this.canvas = document.getElementById(this.canvasId);
        this.canvWd = $(jqId).width();
        this.canvHt = $(jqId).height();
        console.log("canvas ----- size: " + $(jqId).width() + " " + $(jqId).height());
        this.trans = { sx: 1.0, sy: -1.0, x0: 0, y0: 0 };
        var instance = this;
        this.whichDown = 0;
        if (1) {
            $('#canvasDiv').keypress(function (e) {
                console.log("*** keypress");
            });
            $('document').keydown(function (e) {
                console.log("keydown");
            });
            $(jqId).keyup(function (e) {
                console.log("keyup");
            });
        }
        $(jqId).mousedown(function (e) {
            var x = e.pageX - $(jqId).offset().left;
            var y = e.pageY - $(jqId).offset().top;
            console.log("*** down event v.x,v.y:" + x + " " + y + " which: " + e.which);
            instance.ctrlKey = e.ctrlKey;
            this.whichDown = e.which;
            if (e.which == 1)
                instance.leftDown(e, x, y);
            if (e.which == 2)
                instance.middleDown(e, x, y);
        });
        $(jqId).mouseup(function (e) {
            console.log("*** up event");
            instance.ctrlKey = e.ctrlKey;
            this.whichDown = 0;
            instance.mouseUp(e);
        });
        $(jqId).mousemove(function (e) {
            //console.log("move");
            var x = e.pageX - $(jqId).offset().left;
            var y = e.pageY - $(jqId).offset().top;
            //console.log("move event x,y:" + x+" "+y+"  which: "+e.which);
            var w = this.whichDown;
            instance.ctrlKey = e.ctrlKey;
            //we should be able to use e.which, but there seems
            //to be a bug in firefox about that.
            if (w == 0 && instance.mouseMove) {
                instance.mouseMove(e, x, y);
            }
            if (w == 1 && instance.leftDrag) {
                instance.leftDrag(e, x, y);
            }
            if (w == 2 && instance.middleDrag) {
                instance.middleDrag(e, x, y);
            }
        });

        this.images = props.images;
        this.numImagesLoaded = 0;
        if (this.images) {
            for (var i = 0; i < this.images.length; i++) {
                var img = this.images[i];
                console.log("*** image " + img.x + " " + img.y + " " + img.url);
                var imageObj = new Image();
                img.obj = imageObj;
                imageObj.onload = function () {
                    console.log("onload for " + JSON.stringify(img));
                    instance.numImagesLoaded += 1;
                    if (instance.numImagesLoaded == instance.images.length)
                        instance.redraw();
                }
                imageObj.src = img.url;
            }
            tourCanv.redraw();
        };

        //    if (props.tourURL)
        //	this.getTour(props.tourURL);
        if (props.tours) {
            for (var i = 0; i < props.tours.length; i++) {
                var spec = props.tours[i];
                if ($.type(spec) === "string")
                    spec = { name: spec };
                var url = spec.url;
                if (!url) {
                    url = TOUR_URL_BASE + spec.name + ".json";
                }
                this.getTour(url);
            }
        }
        if (props.tourURLs) {
            for (var i = 0; i < props.tourURLs.length; i++) {
                this.getTour(props.tourURLs[i]);
            }
        }
        if (props.graphics) {
            this.graphics = props.graphics;
        }
        if (props.graphicsURL) {
            this.getGraphics(props.graphicsURL);
        }
        if (props.view)
            this.setView(props.view.x, props.view.y, props.view.width);
        this.redraw();

        $(jqId).bind('DOMMouseScroll', function (e) {
            var zf = 1.1;
            if (e.originalEvent.detail <= 0)
                zf = 1.0 / zf;
            instance.handleZoom(zf);
        });
        $(jqId).bind('mousewheel', function (e) {
            var zf = 1.1;
            if (e.originalEvent.wheelDelta <= 0)
                zf = 1.0 / zf;
            instance.handleZoom(zf);
            e.preventDefault();
        });
    }

    setEditMode(onOrOff) {
        console.log("setEditMode " + onOrOff);
        if (this.locked)
            onOrOff = false;
        this.editMode = onOrOff;
        /*
        if (this.editMode) {
        $("#toggleEditTour").val("View");
        }
        else {
        $("#toggleEditTour").val("Edit");
        }
        */
        this.showTourStatus(this.currentTour);
    }

    handleZoom(zf) {
        console.log("handleZoom " + zf);
        var v = this.getView();
        this.setView(v.x, v.y, v.width * zf);
    }

    // return squared distance between (x1,y1) and (x2,y2)
    dist2(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return dx * dx + dy * dy;
    }

    addTour(tour) {
        var added = false;
        //tour.locked = false;
        for (var i = 0; i < this.tours.length; i++) {
            if (this.tours[i].name == tour.name) {
                this.tours[i] = tour;
                console.log("Replacing " + tour.name);
                added = true;
            }
        }
        if (!added) {
            console.log("added new tour " + tour.name);
            this.tours.push(tour);
        }
        var bbox = this.getBBox(tour);
        this.bbox = bbox;
        console.log("bbox: " + JSON.stringify(bbox));
        var x0 = (bbox.xMin + bbox.xMax) / 2.0;
        var y0 = (bbox.yMin + bbox.yMax) / 2.0;
        console.log("x0 " + x0 + "  y0: " + y0);
        var recs = tour.recs;
        var DELTA_T = 0;
        var maxT = 0;
        if (tour.DELTA_T)
            DELTA_T = tour.DELTA_T;
        for (var i = 0; i < recs.length; i++) {
            //console.log("i: "+i+" "+JSON.stringify(recs[i]));
            var t = recs[i].time;
            var rt = t - tour.startTime - DELTA_T;
            recs[i].rt = rt;
            TC.transform(recs[i].pos, tour.translate, tour.scale, tour.rotz);
            if (rt > tour.duration)
                tour.duration = rt;
        }
        // now process yaw
        for (var i = 0; i < recs.length; i++) {
            if (recs[i].yaw == null) {
                var j = i;
                var k = i;
                if (i > 0)
                    j = i - 1;
                if (i < recs.length - 1)
                    k = i + 1;
                // now j should be an earlier point than k
                // around time i
                var pjx = recs[j].pos[0];
                var pjy = recs[j].pos[1];
                var pkx = recs[k].pos[0];
                var pky = recs[k].pos[1];
                var dx = pkx - pjx;
                var dy = pky - pjy;
                var a = Math.atan2(dy, dx);
                recs[i].yaw = toDegrees(a);
                //console.log("computed yaw "+i+" "+recs[i].yaw);
            }
            recs[i].yaw = TC.fixYaw(recs[i].yaw);
        }
        var smooth = true;
        if (smooth) {
            for (var k = 0; k < 3; k++)
                this.smoothYaws(recs);
        }
        tourCanvas.redraw();
        tourCanvas.showTourStatus(tour);
        tourCanvas.showTourList();
    }

    smoothYaws(recs) {
        console.log("******************* smoothYaws *****************");
        for (var i = 1; i < recs.length - 1; i++) {
            var syaw = (recs[i - 1].yaw + recs[i + 1].yaw) / 2;
            if (Math.abs(syaw - recs[i].yaw) < 10) {
                recs[i].yaw = syaw;
            }
            else {
                //console.log("****** winding transition");
            }
        }
    }

    getHandler(tc, id, tour) {
        return function (e) {
            console.log("----> clicky clack " + id);
            tour.locked = !tour.locked;
            tc.redraw();
        };
    }

    showTourList() {
        var tl = $("#tourList");
        tl.html("");
        var inst = this;
        for (var i = 0; i < this.tours.length; i++) {
            var tour = this.tours[i];
            var name = tour.name;
            var id = "cb_" + name;
            var inst = this;
            console.log("tour: " + name);
            $('<input />',
                {
                    type: 'checkbox',
                    id: id,
                    checked: !tour.locked,
                    click: e => inst.getHandler(this, id, tour),
                    value: name
                }).appendTo(tl);
            //        tl.append(""+tour.name+"<br>\n");
            $('<span />',
                {
                    id: "span_" + name,
                    html: name
                }).appendTo(tl);
            tl.append("<br>\n");
        }
    }

    updateTourList() {
        for (var i = 0; i < this.tours.length; i++) {
            var tour = this.tours[i];
            var jqid = "#span_" + tour.name;
            if (tour == this.currentTour)
                $(jqid).css("color", "red");
            else
                $(jqid).css("color", "black");
        }
    }

    handleCBclick(e, id) {
        console.log("this: " + this.id);
        console.log("**** click: " + id);
    }


    getTour(url) {
        console.log("getJSON tour url: " + url);
        //$.getJSON(url, function(data) {
        WV.getJSON(url, function (data) {
            console.log("*** got tour data for " + url);
            var tour = data;
            tour.duration = tour.endTime - tour.startTime;
            tourCanvas.addTour(data);
        },
            function (e) {
                console.log("*** failed to get tour data for " + url)
                var tour = new Tour({ 'url': url });
                tourCanvas.addTour(tour)
            });
    }

    saveTour() {
        var tour = this.currentTour;
        //http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-an-object
        this.checkPointTour = jQuery.extend(true, {}, tour);
        this.uploadTour(tour);
    }

    restoreTour(tour) {
        if (!this.checkPointTour) {
            console.log("No tour checkpointed");
            return;
        }
        var tour = jQuery.extend(true, {}, this.checkPointTour);
        this.addTour(tour)
    }


    uploadTour(tour) {
        console.log("uploadTour " + tour.name);
        jstr = JSON.stringify(tour);
        console.log("uploading TOUR: " + jstr);
        //var url = TOUR_URL_BASE+"update/"+tour.name+".json";
        var url = TOUR_URL_BASE + tour.name + ".json";
        console.log("uploadTour to " + url);
        jQuery.post(url, jstr, function () {
            console.log("Succeeded at upload tour")
        }, "json");
    }

    // return distance between (x1,y1) and (x2,y2)
    dist(x1, y1, x2, y2) {
        return Math.sqrt(this.dist2(x1, y1, x2, y2));
    }

    getBBox(tour) {
        var xMin = 1.0E10;
        var xMax = -1.0E10;
        var yMin = 1.0E10;
        var yMax = -1.0E10;
        var recs = tour.recs;
        for (var i = 0; i < recs.length; i++) {
            xMin = Math.min(xMin, recs[i].pos[0]);
            xMax = Math.max(xMax, recs[i].pos[0]);
            yMin = Math.min(yMin, recs[i].pos[1]);
            yMax = Math.max(yMax, recs[i].pos[1]);
        }
        return { xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax };
    }

    getGraphics(url) {
        console.log("getJSON graphics url: " + url);
        var inst = this;
        WV.getJSON(url,
            function (data) {
                console.log("********************** got graphics for " + url);
                inst.graphics = data.graphics;
                //inst.points = data.points;
                inst.showPoints = data.showPoints;
                inst.vars = data.vars;
                inst.points = data.points;
                if (data.labelFont)
                    inst.labelFont = data.labelFont;
                console.log("graphics: " + JSON.stringify(inst.graphics));
            },
            function (e) {
                console.log("**************** failed to get graphics data for " + url)
            }
        );
    }

    drawPoints() {
        var ctx = this.canvas.getContext("2d");
        ctx.save();
        var font = this.labelFont;
        ctx.fillStyle = "red";
        ctx.scale(1, -1)
        for (var ptName in this.points) {
            //console.log("ptName: "+ptName);
            var pt = this.getPoint(ptName);
            ctx.fillText(ptName, pt[0], -pt[1]);
        }
        ctx.restore();
    }

    drawGraphics() {
        for (var i = 0; i < this.graphics.length; i++) {
            this.drawGraphic(this.graphics[i]);
        }
    }

    drawGraphic(gr) {
        if (gr.type == 'label') {
            this.drawLabelGraphic(gr);
        }
        if (gr.type == 'polygon') {
            this.drawPolygonGraphic(gr);
        }
    }

    drawLabelGraphic(gr) {
        //console.log("draw text "+gr.text+" "+gr.pos);
        var ctx = this.canvas.getContext("2d");
        ctx.save();
        var x = gr.pos[0];
        var y = gr.pos[1];
        var font = this.labelFont;
        if (gr.font)
            font = gr.font;
        ctx.font = font;
        ctx.fillStyle = "blue";
        if (gr.fillStyle)
            ctx.fillStyle = gr.fillStyle;
        ctx.scale(1, -1)
        //ctx.translate(x,-(y+h));
        ctx.fillText(gr.text, x, -y);
        ctx.restore();
    }

    /*
    This takes an expression which may be a point, or a string that
    is the name of a point, and returns a point given by a pair of
    numbers.   If the elements of a point are strings, they are
    looked up to find their corresponding float values.
    */
    getPoint(pt) {
        if (typeof pt == typeof "str") {
            //console.log("***************** getting point for "+pt);
            pt = this.points[pt];
            //console.log("pt: "+pt);
        }
        var x = pt[0];
        if (typeof x == typeof "str") {
            x = this.vars[x];
            if (x == null)
                error("Undefined var " + pt[0]);
        }
        var y = pt[1];
        if (typeof y == typeof "str") {
            y = this.vars[y];
            if (y == null)
                error("Undefined var " + pt[1]);
        }
        return [x, y];
    }

    drawPolygonGraphic(gr) {
        //console.log("draw polygon "+gr.points);
        var ctx = this.canvas.getContext("2d");
        ctx.save();
        ctx.scale(1, -1)
        if (gr.fillStyle)
            ctx.fillStyle = gr.fillStyle;
        if (gr.strokeStyle)
            ctx.strokeStyle = gr.strokeStyle;
        var pt0 = this.getPoint(gr.points[0]);
        ctx.beginPath()
        ctx.moveTo(pt0[0], -pt0[1]);
        for (var i = 1; i < gr.points.length; i++) {
            var pt = this.getPoint(gr.points[i]);
            ctx.lineTo(pt[0], -pt[1]);
        }
        if (gr.closed != false)
            ctx.lineTo(pt0[0], -pt0[1]);
        if (gr.strokeStyle)
            ctx.stroke();
        ctx.closePath()
        if (gr.fillStyle)
            ctx.fill();
        ctx.restore();
    }

    drawTours() {
        for (var i = 0; i < this.tours.length; i++) {
            this.drawTour(this.tours[i]);
        }
    }

    selectTourPoint(i) {
        console.log("selectTourPoint " + i);
        tour = this.currentTour;
        if (!tour) {
            console.log("no tour");
            return;
        }
        var rec = tour.recs[i];
        this.selectedRecIndex = i;
        this.requestPlayTime(rec.rt);
        this.showTourStatus(tour);
    }


    gotoPrevTourPoint() {
        console.log("gotoPrevTourPoint");
        if (!this.currentTour) {
            console.log("No tour selected");
            return;
        }
        var t = this.getTime();
        var r = this.findRecIndexInTourByTime(this.currentTour, t);
        console.log("prev r: " + JSON.stringify(r));
        if (r.dt > 0)
            i = r.i;
        else
            i = r.i - 1;
        if (i < 0) {
            i = 0;
        }
        this.selectTourPoint(i);
    }

    gotoNextTourPoint() {
        console.log("gotoNextTourPoint");
        var tour = this.currentTour;
        if (!tour) {
            console.log("No tour selected");
            return;
        }
        var t = this.getTime();
        var r = this.findRecIndexInTourByTime(tour, t);
        var n = tour.recs.length;
        i = r.i + 1;
        if (i >= n - 1)
            i = n - 1;
        this.selectTourPoint(i);
    }

    drawTour(tour) {
        var recs = tour.recs;
        var bbox = this.bbox;
        var ctx = this.canvas.getContext("2d");
        var x = recs[0].pos[0];
        var y = recs[0].pos[1];
        //ctx.imageSmoothingEnabled = true;
        //ctx.imageSmoothingQuality = "high";
        //CTX = ctx;
        ctx.beginPath();
        ctx.moveTo(x, y);
        var r = 3.0 / this.trans.sx;
        for (var i = 1; i < recs.length; i++) {
            ctx.lineTo(recs[i].pos[0], recs[i].pos[1]);
        }
        //ctx.lineWidth = 1/this.trans.sx;
        ctx.lineWidth = TC.tourLineWidth / this.trans.sx;
        ctx.strokeStyle = 'black';
        if (tour == this.currentTour)
            ctx.strokeStyle = 'red';
        if (tour.locked)
            ctx.strokeStyle = 'LightGrey';
        ctx.stroke();
        if (tour != this.currentTour)
            return;
        if (this.locked)
            return;

        ctx.beginPath();
        for (var i = 0; i < recs.length; i++) {
            ctx.moveTo(recs[i].pos[0], recs[i].pos[1]);
            ctx.arc(recs[i].pos[0], recs[i].pos[1], r, 0, 2 * Math.PI);
        }
        ctx.stroke();

        var i = this.selectedRecIndex;
        if (i == null)
            return;
        var rec = recs[i];
        ctx.beginPath();
        ctx.arc(rec.pos[0], rec.pos[1], r, 0, 2 * Math.PI);
        ctx.strokeStyle = 'green';
        ctx.stroke();

    }

    clear() {
        var ctx = this.canvas.getContext("2d");
        ctx.save();
        // Use the identity matrix while clearing the canvas
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Restore the transform
        ctx.restore();
    }


    // provied by jim to make fancier graphic for camera.  It didn't work for
    // me and I didn't get track it down.
    drawCursor(x, y, robotYaw, viewYaw, color) {
        //
        //  x,y       Position of robot at given time
        //  robotYaw  Orientation of robot at given time
        //  camYaw    Orientation of virtual camera withint panorama at given time.
        //  viewYaw is the direction of the view in the real world
        //
        //console.log("drawCursor " + x + ", " + y);
        //return this.drawCursor0(x,y,robotYaw,viewYaw);
        color = color || 'blue';
        var canvas = this.canvas;
        var ctx = canvas.getContext("2d");
        var r = 10 / this.trans.sx;
        var cfovRad = toRadians(this.hfov);
        //var vpt = this.canvToView(x, y);
        var r1 = 1.5 * r;  // length of pointer for robot yaw
        var r2 = 4.5 * r;  // length of pointer from cam yaw
        var robotYawRad = toRadians(robotYaw); // Robot Yaw in radians
        var x1 = x + r1 * Math.cos(robotYawRad);
        var y1 = y + r1 * Math.sin(robotYawRad);
        var w = TC.robotWidth;
        var l = TC.robotLength;
        var xw = w / 2.0 * Math.sin(robotYawRad);
        var xl = l * Math.cos(robotYawRad);
        var yw = w / 2.0 * Math.cos(robotYawRad);
        var yl = l * Math.sin(robotYawRad);

        var viewYawRad = toRadians(viewYaw);     // Cam yaw in radians
        var vx1 = x + r2 * Math.cos(viewYawRad - cfovRad / 2);
        var vy1 = y + r2 * Math.sin(viewYawRad - cfovRad / 2);
        var vx2 = x + r2 * Math.cos(viewYawRad + cfovRad / 2);
        var vy2 = y + r2 * Math.sin(viewYawRad + cfovRad / 2);

        // draw the robot orientation
        ctx.beginPath();
        //ctx.arc(x, y, r, 0, 2*Math.PI);
        //ctx.strokeStyle = color;
        ctx.fillStyle = "gray";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(x + xw - xl, y - yw - yl);
        ctx.lineTo(x - xw - xl, y + yw - yl);
        ctx.lineTo(x - xw, y + yw);
        ctx.lineTo(x + xw, y - yw);
        ctx.lineTo(x + xw - xl, y - yw - yl);
        ctx.stroke();
        ctx.fill();

        // draw the view frustrum
        //console.log("vx1: "+vx1+" vy1: "+vy1+" vx2: "+vx2+" vy2: "+vy2);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(vx1, vy1);
        ctx.lineTo(vx2, vy2);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2.0 / this.trans.sx;
        //ctx.stroke();
        //var grd=ctx.createRadialGradient(x,y,.1,x,y,1);
        var grd = ctx.createRadialGradient(x, y, .1, x, y, 20);
        grd.addColorStop(0, color);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.fill();
    }

    drawTarget() {
        if (this.targetPos == null)
            return;
        var ctx = this.canvas.getContext("2d");
        ctx.strokeStyle = 'black';
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(this.targetPos[0], this.targetPos[1], 5, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
    }

    drawAxes() {
        //console.log("drawAxes");
        var ctx = this.canvas.getContext("2d");
        var INF = 5000;
        var N = 10;
        var dx = 100;
        var dy = 100;
        ctx.beginPath();
        ctx.moveTo(-INF, 0);
        ctx.lineTo(INF, 0);
        ctx.moveTo(0, -INF);
        ctx.lineTo(0, INF);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2 / this.trans.sx;
        ctx.stroke();
        ctx.beginPath();
        for (var i = -N; i <= N; i++) {
            ctx.moveTo(dx * i, -INF);
            ctx.lineTo(dx * i, INF);
            ctx.moveTo(-INF, dy * i);
            ctx.lineTo(INF, dy * i);
        }
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 0.25 / this.trans.sx;
        ctx.stroke();
    }

    redraw() {
        //console.log("redraw");
        //console.log(" called by "+arguments.callee.caller.toString());
        var ctx = this.canvas.getContext("2d");
        var T = this.trans;
        ctx.setTransform(T.sx, 0, 0, T.sy, T.x0, T.y0);
        this.clear();
        if (this.images) {
            for (var i = 0; i < this.images.length; i++) {
                var img = this.images[i];
                if (img.obj) {
                    try {
                        TC.drawImage(ctx, img.obj, img.x, img.y, img.width, img.height);
                    }
                    catch (e) {
                        console.log("failed to drawImage " + e);
                    }
                }
                else {
                    console.log("**** image not yet loaded ****");
                }
            }
        }
        else {
            console.log("**** no images ****");
        }
        /*******/
        if (this.bestMatch) {
            var xx = this.bestMatch;
            ctx.beginPath();
            ctx.moveTo(xx.x, xx.y);
            ctx.lineTo(xx.mx, xx.my);
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 2 / T.sx;
            ctx.stroke();
        }
        /*******/
        this.drawGraphics();
        if (this.showPoints)
            this.drawPoints();
        this.drawTours();
        this.drawTarget();
        if (this.showAxes)
            this.drawAxes();
        if (this.currentPos) {
            this.drawCursor(this.currentPos[0], this.currentPos[1],
                this.getRobotYaw(), this.getViewYaw());
        }
    }

    setViewAndScale(x0, y0, scale) {
        this.trans.sx = scale;
        this.trans.sy = -scale;
        this.trans.x0 = x0;
        this.trans.y0 = y0;
        this.redraw();
    }


    getView() {
        var s = this.trans.sx;
        var w = this.canvWd;
        var h = this.canvHt;
        var x = this.trans.x0;
        var y = this.trans.y0;
        var x0 = (w / 2.0 - x) / s;
        var y0 = (- h / 2.0 + y) / s;
        var width = this.canvWd / s;
        return { x: x0, y: y0, width: width };
    }

    /*
    Set transform so that x0,y0 is center of view, and view
    has given width in canvas coordinates.
     */
    setView(x0, y0, width) {
        console.log("setView " + x0 + " " + y0 + " " + width);
        var s = this.canvWd / width;
        var w = this.canvWd;
        var h = this.canvHt;
        var x = w / 2.0 - x0 * s;
        var y = h / 2.0 + y0 * s;
        this.setViewAndScale(x, y, s);
        this.redraw();
        return this.getView();
    }

    findPoseByTime(t) {
        //console.log("findPoseByTime "+t);
        if (this.currentTour) {
            //console.log("findPoseByTime in current tour "+t);
            return this.findPoseInTourByTime(this.currentTour, t);
        }
        for (var i = 0; i < this.tours.length; i++) {
            var tour = this.tours[i];
            return this.findPoseInTourByTime(tour, t);
        }
    }

    /*
       This finds a record by time, but if the time is between records
       it performs a linear interpolation to produce a rec like object
       with linear interpolated values.
     */
    findPoseInTourByTime(tour, t) {
        var recs = tour.recs;
        for (var i = 0; i < recs.length - 1; i++) {
            var rec1 = recs[i];
            var rec2 = recs[i + 1];
            if (t < rec1.rt) {
                return rec1;
                //return {i2: 0, rt: t, dt: t - rec1.rt, interps: null,
                //    x: rec1.x, y: rec1.y, yaw: rec1.yaw}
            }
            if (rec1.rt <= t && t < rec2.rt) {
                var dt12 = rec2.rt - rec1.rt;
                var dt = t - rec1.rt;
                var s = dt / dt12;
                var rt = (1 - s) * rec1.rt + s * rec2.rt;
                //var yaw  = (1-s)*rec1.yaw  + s*rec2.yaw;
                var yaw = TC.interpYaw(rec1.yaw, rec2.yaw, s);
                //console.log("yaw1: "+rec1.yaw+" yaw2: "+rec2.yaw+" s: "+s+" yaw: "+yaw);
                var pos = TC.interpVec(rec1.pos, rec2.pos, s);
                return { i: i, s: s, rt: rt, pos: pos, yaw: yaw };
                return recs[i];
            }
        }
        var rec = recs[recs.length - 1];
        return rec;
    }

    /*
    Find the i that bracket i - that is, rec[i] is before
    or equal to time t, and rec[i+1] is the first record
    after time t.   Returns i, dt where dt t-rec[i].
    If t is before first rec, i=-1.
    */
    findRecIndexInTourByTime(tour, t) {
        var recs = tour.recs;
        if (t < recs[0].rt) {
            return { i: -1, dt: t - recs[0].rt }
        }
        for (var i = 0; i < recs.length - 1; i++) {
            var rec1 = recs[i];
            var rec2 = recs[i + 1];
            if (rec1.rt <= t && t < rec2.rt) {
                var dt = t - rec1.rt;
                return { i: i, dt: dt };
            }
        }
        return { i: recs.length - 1, dt: t - recs[recs.length - 1].rt };
    }

    findRecByPos(x, y) {
        var nearestTour = -1;
        var bestMatch = null;
        var nearestD = 1000000;
        for (var i = 0; i < this.tours.length; i++) {
            var tour = this.tours[i];
            if (!this.ctrlKey && tour.locked) {
                console.log(">>>>>>>>>>> this.ctrlKey " + this.ctrlKey);
                continue;
            }
            var match = this.findRecInTourByPos(tour, x, y);
            if (bestMatch == null || match.d < bestMatch.d) {
                bestMatch = match;
            }
        }
        if (!bestMatch) {
            console.log(">>> findRecByPos couldnt find good rec");
            return null;
        }
        //console.log("bestMatch: "+JSON.stringify(bestMatch));
        //console.log("bestMatch: "+bestMatch);
        bestMatch.mx = x;
        bestMatch.my = y;
        //this.setBestMatch(bestMatch);
        return bestMatch;
    }

    setBestMatch(match) {
        this.bestMatch = match;
        //this.currentTour = match.tour;
        if (match.s < .1)
            this.selectedRecIndex = match.i1;
        else if (match.s > .9)
            this.selectedRecIndex = match.i2;
        else
            this.selectedRecIndex = null;
    }

    /*
    Tries to find nearest rec to x,y on given tour, and returns obj with:
        tour:  tour containing rec (this is the input)
        rec:   nearest rec
        i1:    index of previous rec
        i2:    index of next rec
        x,y:   x,y of nearest point on tour to x0,y0
        s:     fraction of dist from i1 to i2
        d:     dist( (x0,y0), (x,y))
        rt:    interpolated time between i1 and i2
     */
    findRecInTourByPos(tour, x0, y0) {
        var recs = tour.recs;
        var bestResult = null;
        var nearestDist = 1000000;
        for (var i = 0; i < recs.length - 1; i++) {
            var rec1 = recs[i];
            var rec2 = recs[i + 1];
            var ret = TC.distToLineSeg(x0, y0, rec1.pos[0], rec1.pos[1], rec2.pos[0], rec2.pos[1]);
            var s = ret.s;
            var rt = (1 - s) * rec1.rt + s * rec2.rt;
            var d = ret.d;
            if (bestResult == null || d < nearestDist) {
                bestResult = {
                    tour: tour, rec: rec1,
                    i1: i, i2: i + 1,
                    s: ret.s, x: ret.x, y: ret.y, d: d, rt: rt
                }
                nearestDist = d;
                continue;
            }
        }
        return bestResult;
    }


    getTime(t) {
        return this.currentTime;
    }

    setTime(t) {
        this.currentTime = t;
        var rec = this.findPoseByTime(t);
        if (!rec)
            return;
        if (rec.yaw == null) {
            console.log("*** rec with no yaw ***");
            console.log("rec: " + JSON.stringify(rec));
        }
        this.setPosition(rec.pos[0], rec.pos[1], true);
        var mode = $("#movementMode").val();
        this.camMode = mode;
        //console.log("mode: "+mode);
        if (mode == TC.ABSOLUTE) {
            //console.log("camMode ABSOLUTE -- not yet supported");
            var viewYaw = this.getViewYaw()
            this.targetPos = null;
            this.setRobotYaw(rec.yaw, true);
            this.setViewYaw(viewYaw);
        }
        else if (mode == TC.RELATIVE_MOTION) {
            //console.log("camMode RELATIVE_MOTION -- not yet supported");
            this.targetPos = null;
            this.setRobotYaw(rec.yaw, true);
        }
        else if (mode == TC.RELATIVE_CAMERA) {
            //console.log("camMode RELATIVE_CAMERA");
            this.targetPos = null;
            this.setRobotYaw(rec.yaw, true);
        }
        else if (mode == TC.TARGET) {
            this.setRobotYaw(rec.yaw, true);
            var dx = this.targetPos[0] - rec.pos[0];
            var dy = this.targetPos[1] - rec.pos[1];
            var viewYaw = toDegrees(Math.atan2(dy, dx));
            this.setViewYaw(viewYaw);
        }
        else {
            console.log("****** unknown camMode " + mode);
            this.setRobotYaw(rec.yaw, true);
        }
        this.redraw();
    }

    // Note - we don't directly set play time in the server ourselves
    // but call a handler to have it dones from TourScripts.
    requestPlayTime(t) {
        if (this.playTimeHandler) {
            //console.log("calling playTimeHandler");
            this.playTimeHandler(t);
        }
    }


    setRobotYaw(yaw, noRefresh) {
        //console.log("setRobotYaw "+yaw);
        this.currentRobotYaw = yaw;
        if (!noRefresh)
            this.redraw();
    }

    getRobotYaw = function () {
        return this.currentRobotYaw;
    }

    // Note: this keeps track of a virtual view yaw and causes it
    // to be drawn on map, but it does not directly request server
    // to switch to that view.   To do that use global setVirtualCamYaw
    setVirtualCamYaw(yaw, noRefresh) {
        yaw = eval(yaw);
        //console.log("setVirtualCamYaw "+yaw);
        this.currentVirtualCamYaw = yaw;
        if (!noRefresh)
            this.redraw();
    }

    getVirtualCamYaw() {
        return this.currentVirtualCamYaw;
    }

    getViewYaw() {
        var vy = this.currentRobotYaw - this.currentVirtualCamYaw + this.yawOffset;
        return TC.fixYaw(vy);
    }

    setViewYaw(viewYaw) {
        var virtualCamYaw = this.currentRobotYaw - viewYaw + this.yawOffset;
        virtualCamYaw = TC.fixYaw(virtualCamYaw);
        setVirtualCamYaw(virtualCamYaw);
    }


    setPosition(x, y, noRefresh) {
        this.currentPos = [x, y];
        //console.log("setPosition "+this.currentPos);
        if (!noRefresh)
            this.redraw();
    }

    getPosition() {
        return [this.currentPos[0], this.currentPos[1]];
    }

    setSize(w, h) {
        //var ctx = this.canvas.getContext("2d");
        this.canvas.width = w;
        this.canvas.height = h;
    }

    canvToView(x, y) {
        var T = this.trans;
        x = T.x0 + T.sx * x;
        y = T.y0 + T.sy * y;
        //y = this.canvHt - y;
        return { x: x, y: y };
    }

    viewToCanv(x, y) {
        var T = this.trans;
        //y = this.canvHt - y;
        x = (x - T.x0) / T.sx;
        y = (y - T.y0) / T.sy;
        return { x: x, y: y };
    }

    //TourCanvas.prototype.mouseClick = function(e, x, y) {
    leftDown(e, x, y) {
        console.log("mouseClick " + e + " " + x + " " + y);
        var cp = this.viewToCanv(x, y);
        console.log("cx,cy: " + cp.x + " " + cp.y);
        if (e.shiftKey && !this.editMode) {
            console.log("************** set target **********");
            this.targetPos = [cp.x, cp.y];
            this.camMode = TC.TARGET;
            $("#movementMode").val(TC.TARGET);
            //return;
        }
        else {
            /*
            this.targetPos = null;
            if (this.camMode == TC.TARGET)
                this.camMode = TC.RELATIVE_CAM;
                */
        }
        var bestMatch = this.findRecByPos(cp.x, cp.y);
        var bx = bestMatch.x;
        var by = bestMatch.y;
        //console.log("nearestRec: "+JSON.stringify(r));
        var rec = bestMatch.rec;
        //this.setBestMatch(bestMatch);
        if (rec == null) {
            console.log("No rec found");
            this.draggingCursor = false;
            return;
        }
        console.log("nearest rec: " + bx + " " + by);
        var d = this.dist(cp.x, cp.y, bx, by);
        if (e.altKey) {
            console.log("**** ALT Click ****");
            this.currentPos[0] = cp.x;
            this.currentPos[1] = cp.y;
            this.addTourPoint(e);
            return;
        }
        console.log("d: " + d);
        if (d > 2.0) {
            this.draggingCursor = false;
            this.adjustYaw(e, cp);
        }
        else {
            this.setBestMatch(bestMatch);
            this.draggingCursor = true;
            this.downYaw = this.currentRobotYaw;
            this.setCursorPos(e, cp);
        }
    }

    middleDown(e, x, y) {
        console.log("middleDown " + e + " " + x + " " + y);
        var T = this.trans;
        this.mouseDownData = { x: x, y: y, x0: T.x0, y0: T.y0 };
        var cp = this.viewToCanv(x, y);
        console.log("cx,cy: " + cp.x + " " + cp.y);
        e.preventDefault();
    }


    mouseMove(e, x, y) {
        //console.log("mouseMove "+x+" "+y);
        var cp = this.viewToCanv(x, y);
        this.showMouseStatus(x, y, cp.x, cp.y);
    };

    showMouseStatus(vx, vy, cx, cy) {
        //var mousePos = "v: "+fmt1(vx)+", "+fmt1(vy);
        //console.log("showMouseStatus "+vx+" "+vy);
        var mousePos = "v: " + fmt0(vx) + ", " + fmt0(vy);
        mousePos += "&nbsp;&nbsp;   c: " + fmt3(cx) + ", " + fmt3(cy);
        this.status = mousePos;
        $("#mapStatusDiv").html(mousePos);
    }

    mouseUp(e) {
        console.log("mouseUp");
        this.setEditMode(false);
        if (e.ctrlKey) {
            console.log("****** Control UP!!!");
            if (this.currentTour) {
                console.log("**** toggle locked");
                this.currentTour.locked = !this.currentTour.locked;
                tourCanvas.showTourList();
            }
        }
        //    if (!e.shiftKey) {
        //	this.setEditMode(false);
        //    }
    };

    leftDrag(e, x, y) {
        //console.log("leftDrag");
        e.preventDefault();
        var cp = this.viewToCanv(x, y);
        this.showMouseStatus(x, y, cp.x, cp.y);
        if (this.draggingCursor) {
            console.log("Dragging cursor.");
            this.setCursorPos(e, cp);
        }
        else {
            this.adjustYaw(e, cp);
        }
    }

    middleDrag(e, x, y) {
        //console.log("middleDrag");
        e.preventDefault();
        var d = this.mouseDownData;
        var s = 1.0;
        var dx = s * (x - d.x);
        var dy = s * (y - d.y);
        //console.log("dx,dy: "+dx+" "+dy);
        this.trans.x0 = d.x0 + dx;
        this.trans.y0 = d.y0 + dy;
        this.redraw();
        var cp = this.viewToCanv(x, y);
        this.showMouseStatus(x, y, cp.x, cp.y);
    }

    //TourCanvas.prototype.setCursorPos = function(e, cp, rec)
    setCursorPos(e, cp) {
        console.log("setCursorPos shift " + e.shiftKey);
        var rt, x, y;
        if (e.shiftKey && !e.editMode) {
            this.setEditMode(true);
        }
        if (this.editMode) {
            console.log("in edit mode");
            rt = this.currentTime;
            x = cp.x;
            y = cp.y;
            if (this.currentTour) {
                var i = this.selectedRecIndex;
                console.log("i: " + i);
                if (i != null) {
                    console.log("moving selected rec");
                    rec = this.currentTour.recs[i];
                    rec.pos[0] = x;
                    rec.pos[1] = y;
                }
            }
        }
        else {
            var bestMatch = this.findRecByPos(cp.x, cp.y);
            this.setBestMatch(bestMatch);
            var tour = bestMatch.tour;
            if (tour) {
                //TODO: clean this up....
                this.setCurrentTour(tour);
            }
            else {
                console.log("**** No tour found ****");
            }
            x = bestMatch.x;
            y = bestMatch.y;
            rt = bestMatch.rt;
            this.showTourStatus(tour);
            console.log("setCursorPos x: " + x + "  y: " + y + "  rt: " + rt);
        }
        this.setPosition(x, y);
        this.currentTime = rt;
        this.requestPlayTime(rt);
        if (!e.shiftKey) {
            this.setEditMode(false);
        }
    }

    findTourByName(name) {
        var tours = this.tours;
        for (var i = 0; i < tours.length; i++) {
            if (tours[i].name == name)
                return tours[i];
        }
        return null;
    }


    setCurrentTour(tour) {
        this.currentTour = tour;
        this.currentTourName = tour.name;
        currentTourName = tour.name;
        console.log("currentTourName: " + currentTourName);
        if (this.noticeCurrentTour)
            this.noticeCurrentTour(tour);
    }

    adjustYaw(e, cp) {
        if (e.shiftKey && !e.editMode) {
            console.log("*** enter edit mode");
            if (this.selectedRecIndex != null) {
                this.setEditMode(true);
                this.showTourStatus();
            }
            else {
                console.log("*** No rec selected");
            }
        }

        var cursorx = this.currentPos[0];
        var cursory = this.currentPos[1];
        var dx = cp.x - cursorx;
        var dy = cp.y - cursory;
        var thetaRad = Math.atan2(dy, dx);
        var viewYaw = toDegrees(thetaRad);
        //console.log("Dragging view direction dx,dy: "+dx+" "+dy);
        console.log("new viewYaw: " + viewYaw + " degrees");
        var robotYaw = this.currentRobotYaw;
        if (this.editMode) {
            i = this.selectedRecIndex;
            rec = this.currentTour.recs[i];
            var virtualCamYaw = this.currentVirtualCamYaw;
            var offset = this.yawOffset;
            console.log("virtualCamYaw: " + virtualCamYaw);
            console.log("viewYaw: " + viewYaw);
            console.log("offset: " + offset);
            console.log("sum: " + (virtualCamYaw + viewYaw + offset));
            var robotYaw = virtualCamYaw + viewYaw - this.yawOffset;
            console.log("robotYaw: " + robotYaw +
                "  camYaw: " + virtualCamYaw +
                "  offset: " + this.yawOffset);
            rec.yaw = robotYaw;
            this.currentRobotYaw = robotYaw;
            this.redraw();
        }
        else {
            var camYaw = - viewYaw + robotYaw + this.yawOffset;
            //console.log("----- camYaw: "+camYaw);
            setVirtualCamYaw(camYaw);
        }
    }

    addTourPoint(e) {
        console.log("addTourPoint");
        var tour = this.currentTour;
        if (!tour) {
            console.log("addTourPoint - no tour selected");
            return;
        }
        var yaw = this.currentRobotYaw;
        yaw = TC.fixYaw(yaw);
        var t = getPlayTime();
        var x = this.currentPos[0];
        var y = this.currentPos[1];
        console.log("t: " + t + "  x: " + x + "  y: " + y);
        var rec = {
            "yaw": yaw,
            "pos": [x, y, 0],
            "rt": t,
            "time": tour.startTime + t
        }
        var i = this.addTourRec(tour, rec);
        if (t > this.duration)
            this.duration = t;
        this.selectedRecIndex = i;
        this.redraw();
        if (AUTO_SAVE)
            this.uploadTour(tour);
    }

    removeTourPoints() {
        console.log("removeTourPoints");
        var tour = this.currentTour;
        if (!tour)
            return;
        if (this.selectedRecIndex == null) {
            console.log("No points selected");
            return;
        }
        console.log("removeTourPoints " + this.selectedRecIndex);
        tour.recs.splice(this.selectedRecIndex, 1);
        this.selectedRecIndex == null;
        tourCanvas.redraw();
        if (AUTO_SAVE)
            this.uploadTour(tour);
    }

    // This adds a record to a tour, inserting it in the
    // middle of tour if necessary.
    addTourRec(tour, rec) {
        var t = rec.time;
        for (var i = 0; i < tour.recs.length; i++) {
            var tr = tour.recs[i].time;
            console.log("t: " + t + "  tr: " + tr);
            if (t < tour.recs[i].time)
                break;
        }
        console.log("addTourRect addPos: i = " + i);
        tour.recs.splice(i, 0, rec);
        return i;
    }

    showTourStatus(tour) {
        //$("#tourInfo").html("<br>Name: "+tour.name+"\n<br>Dur: "+tour.duration);
        if (!tour)
            tour = this.currentTour;
        var str = "";
        if (this.editMode)
            str = " edit";
        $("#tourStatus").html("");
        if (!tour)
            return;
        this.updateTourList();
        $("#tourStatus").append("Name: " + tour.name + str + " &nbsp;&nbsp" + fmt3(tour.duration) + "\n");
        //$("#tourStatus").append("<br>Dur: "+tour.duration+"\n");
        $("#tourStatus").append("<br>t: " + fmt3(this.currentTime) + "\n");
        if (!this.bestMatch)
            return;
        var bm = this.bestMatch;
        var str = "<br>i1: " + bm.i1 + " s: " + fmt2(bm.s);
        if (this.selectedRecIndex != null)
            str += " sel: " + this.selectedRecIndex;
        $("#tourStatus").append(str);
    }


}

/*
Draw image at right place, but without the vertical flipping
caused by having a -y scale for our canvas.
 */
TC.drawImage = function (ctx, imgObj, x, y, w, h) {
    ctx.save();
    ctx.scale(1, -1)
    ctx.translate(x, -(y + h));
    ctx.drawImage(imgObj, 0, 0, w, h);
    ctx.restore();
}

