
WV = {};

function report(str) {
	console.log(str);
}

WV.errsShown = {};
function error(str) {
	report(str);
	if (!WV.errsShown[str]) {
		WV.errsShown[str] = 1;
		alert(str);
	}
	//alert(str);
}

function fmt0(f) {
	return "" + Math.floor(f + 0.5);
}

function fmt1(f) {
	return "" + Math.floor(f * 10) / 10;
}

function fmt2(f) {
	return "" + Math.floor(f * 100) / 100;
}

function fmt3(f) {
	return "" + Math.floor(f * 1000) / 1000;
}

function toRadians(d) {
	return Math.PI * d / 180;
}

function toDegrees(r) {
	return 180 * r / Math.PI;
}

/*
  Use this instead of $.getJSON() because this will give
  an error message in the console if there is a parse error
  in the JSON.
 */
WV.getJSON = function (url, handler, errFun) {
	console.log(">>>>> getJSON: " + url);
	$.ajax({
		url: url,
		dataType: 'text',
		success: function (str) {
			try {
				data = JSON.parse(str);
				//data = eval(str);
				handler(data);
			}
			catch (e) {
				report("**************************************************");
				report("**************************************************");
				report("*** error: " + e);
				alert("JSON error: " + e);
				//report("str: "+str);
			}
		},
		error: function (e) {
			console.log("WV.getJSON error " + e);
			if (errFun)
				errFun(e);
		}
	});
}
