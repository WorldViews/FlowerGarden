
"use strict";

let path1 = `
M 0.17, 0.23
c 0, 0,
  105.85, 77.7,
  276.46, 73.2
s 243.8, -61.37,
  408.77, -54.05
c 172.09, 7.64,
  213.4, 92.34,
  413.28, 64.19`;

let path2 = `
M 0,0
L 20, 20
L 30, 10
L -30, 30
L 0, 0
L 100, 100
L -200, 50
`;

let path3 = "M 0,0 L 1000, 100"

/*creates formated path string for SVG cubic path element*/
function path(x1,y1,px1,py1,px2,py2,x2,y2)
{
	return "M "+x1+" "+y1+" C "+px1+" "+py1+" "+px2+" "+py2+" "+x2+" "+y2;
}

/*computes control points given knots K, this is the brain of the operation*/
function computeControlPoints(K)
{
    var p1, p2, n, a, b, c, r;
	p1=new Array();
	p2=new Array();
	n = K.length-1;
	
	/*rhs vector*/
	a=new Array();
	b=new Array();
	c=new Array();
	r=new Array();
	
	/*left most segment*/
	a[0]=0;
	b[0]=2;
	c[0]=1;
	r[0] = K[0]+2*K[1];
	
	/*internal segments*/
	for (var i = 1; i < n - 1; i++)
	{
		a[i]=1;
		b[i]=4;
		c[i]=1;
		r[i] = 4 * K[i] + 2 * K[i+1];
	}
			
	/*right segment*/
	a[n-1]=2;
	b[n-1]=7;
	c[n-1]=0;
	r[n-1] = 8*K[n-1]+K[n];
	
	/*solves Ax=b with the Thomas algorithm (from Wikipedia)*/
	for (var i = 1; i < n; i++)
	{
		var m = a[i]/b[i-1];
		b[i] = b[i] - m * c[i - 1];
		r[i] = r[i] - m*r[i-1];
	}
 
	p1[n-1] = r[n-1]/b[n-1];
	for (var i = n - 2; i >= 0; --i)
		p1[i] = (r[i] - c[i] * p1[i+1]) / b[i];
		
	/*we have p1, now compute p2*/
	for (var i=0;i<n-1;i++)
		p2[i]=2*K[i+1]-p1[i+1];
	
	p2[n-1]=0.5*(K[n]+p1[n-1]);
	
	return {p1:p1, p2:p2};
}

/*computes spline control points*/
function computeSplines(pts)
{	
    console.log("-------------------------------------------");
    console.log("computeSpline\n", pts);
	/*grab (x,y) coordinates of the control points*/
	let x=new Array();
	let y=new Array();
    var n = pts.length;
	for (i=0;i<n;i++)
	{
		/*use parseInt to convert string to int*/
		x[i]=pts[i][0];
		y[i]=pts[i][1];
	}
	
	/*computes control points p1 and p2 for x and y direction*/
	let px = computeControlPoints(x);
	let py = computeControlPoints(y);
	
    /*updates path settings, the browser will draw the new spline*/
    var pathStr = "";
	for (var i=0;i<(n-1);i++) {
        pathStr += path(x[i],y[i],px.p1[i],py.p1[i],px.p2[i],py.p2[i],x[i+1],y[i+1]) + "\n";
    }
    console.log("pathStr\n", pathStr);
    return pathStr;
}

class CurvyText {
    constructor(pathId, path2Id) {
        var inst = this;
        pathId = "#text-path";
        path2Id = "#text-path2";
        this.textPath = document.querySelector(pathId);
        this.textPath2 = document.querySelector(path2Id);
        this.inputStr = document.querySelector("#words");
        this.frac = 0;
        this.path = document.querySelector('path');
        //let pathd = "M0.17,0.23c0,0,105.85,77.7,276.46,73.2s243.8-61.37,408.77-54.05c172.09,7.64,213.4,92.34,413.28,64.19";
        this.setPath([[0, 0], [500, 100], [1000, 0]]);
        //this.setPath([[0,0], [ 1000, 50]]);
        //this.setPathCirc(500, 0, 160, 120);
        this.setPathSpiral(500, 0);
        this.setText("Now is the time for all bad men to leave their country.");
        this.wordsInput = document.querySelector("#words");
        this.addButton = document.querySelector("#addButton");
        this.addButton.addEventListener('click', e => inst.updateText());
        this.wordsInput.addEventListener('change', e => inst.handleInput());
    }

    handleInput() {
        console.log("handleInput");
        this.updateText();
    }

    updateText() {
        console.log("updateText");
        var str = this.wordsInput.value;
        this.setText(str);
    }

    setText(str, textName) {
        //textId = textId || "text-path2";
        var reverse = 1;
        if (reverse)
            str = str.split("").reverse().join("");
        this.textPath.innerHTML = str;
        var tp = this.textPath;
        var len = this.textPath.getAttribute("textLength");
        console.log("text length", len);
        len = tp.getComputedTextLength();
        console.log("text computed len", len);
        console.log("text offsetWidth", tp.getAttribute("offsetWidth"))
        console.log("text startOffset", tp.getAttribute("startOffset"))
    }

    setPath(points) {
        console.log("setPath", points);
        var str = "";
        for (var i = 0; i < points.length; i++) {
            var pt = points[i];
            if (i == 0) {
                str += ("M " + pt[0] + "," + pt[1] + "\n");
            }
            else {
                str += ("L " + pt[0] + "," + pt[1] + "\n");
            }
        }
        console.log("str", str);
        str = computeSplines(points);
        this.setPathStr(str);
        //computeSplines(points);
    }

    setPathCirc(cx, cy, r, n) {
        let pts = [];
        for (var i = 0; i < n; i++) {
            let t = 2 * Math.PI * i / n;
            let x = cx + r * Math.sin(t);
            let y = cy + r * Math.cos(t);
            pts.push([x, y]);
        }
        this.setPath(pts);
    }

    setPathSpiral(cx, cy) {
        let pts = [];
        let n = 40;
        let r0 = 20;
        let r1 = 350;
        var thetaMax = 5 * 2 * Math.PI;
        for (var i = 0; i < n; i++) {
            let f = i / n;
            let t = f * thetaMax;
            let r = (1-f)*r0 + f*r1;
            let x = cx + r * Math.sin(t);
            let y = cy + r * Math.cos(t);
            pts.push([x, y]);
        }
        this.setPath(pts);
    }

    setPathStr(pathd) {
        console.log("setPathStr", pathd);
        console.log("path", this.path);
        this.path.setAttribute("d", pathd);
        this.path.setAttribute("stroke", "pink");
        console.log("path", this.path);
        this.textPath.style.fontSize = "50%";
        this.textPath2.style.fontSize = "50%";
    }

    setPathSmooth()
    {
      // NYI - do something based on
      // https://medium.com/@francoisromain/smooth-a-svg-path-with-cubic-bezier-curves-e37b49d46c74  
    }

    setFrac(f) {
        let percent = f * 100;
        //console.log("percent", percent);
        //var soff = (-percent * 40) + 1200;
        var soff = 500 * f;
        //console.log("soff", soff);
        this.textPath.setAttribute("startOffset", soff)
        this.textPath2.setAttribute("startOffset", 2 * soff)
        //textPath.style.fontSize = "50%";
        this.textPath.style.fontSize = 2 * percent + "%";
        //console.log("percent", percent);
    }

    start() {
        var inst = this;
        this.frac = 0;
        setInterval(e => {
            inst.frac += 0.0005;
            if (inst.frac > 2)
                inst.frac = 0;
            inst.setFrac(inst.frac);
        }, 20);
    }
}

