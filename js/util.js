
getParameterByName = function (name, defaultVal) {
    //console.log("getParameterByName", name, defaultVal);
    if (typeof window === 'undefined') {
        console.log("***** getParameterByName called outside of browser...");
        return defaultVal;
    }
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    val = match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    //console.log("val:", val);
    if (!val)
        return defaultVal;
    return val;
}

getFloatParameterByName = function (name, defaultVal) {
    var val = getParameterByName(name, defaultVal);
    if (val != null)
        return parseFloat(val);
    return val;
}

getBooleanParameterByName = function (name, defaultVal) {
    var val = getParameterByName(name, defaultVal);
    if (typeof val == "string") {
        console.log("getBool", val);
        sval = val.toLowerCase()
        if (sval == "0" || sval == "false" || sval == "null")
            return false;
        return true;
    }
    return val;
}

function arrayRemove(v, val)
{
    var i = v.indexOf(val);
    if (i > -1)
        v.splice(i, 1);
}

function getVal(val, def) {
    if (val == null)
        return def;
    return val;
}

// return last part of path - the name
function getNameFromPath(path) {
    var parts = path.split("/");
    return parts[parts.length - 1];
}

function cloneObject(obj) { return Object.assign({}, obj); }

function getClockTime() {
    return new Date().getTime() / 1000.0;
}


// This is a promise based version of code for getting
// JSON.  New code should use this instead of getJSON
// and older code should migrate to this.
async function loadJSON(url) {
    console.log("loadJSON: " + url);
    return new Promise((res, rej) => {
        $.ajax({
            url: url,
            dataType: 'text',
            success: function (str) {
                var data;
                try {
                    data = JSON.parse(str);
                }
                catch (err) {
                    console.log("err: " + err);
                    alert("Error in json for: " + url + "\n" + err);
                    rej(err);
                }
                res(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("Failed to get JSON for " + url);
                rej(errorThrown);
            }
        });
    })
}



// This is a version for uploading to a specified path that may
// not be a session.  (i.e. global configs, etc.)
function uploadToFile(dpath, obj, fileName) {
    return uploadDataToFile(dpath, JSON.stringify(obj, null, 3), fileName);
}

function uploadDataToFile(dpath, data, fileName) {
    console.log("uploadDataToFile path " + dpath + "  fileName " + fileName);
    var formData = new FormData();
    formData.append('dir', dpath);
    let blob = new Blob([data], { type: 'application/json' });
    //  formData.append('data', blob, 'data.json');
    formData.append(fileName, blob, fileName);
    var request = new XMLHttpRequest();
    request.onload = function () {
        if (this.status == 200) {
            var r = JSON.parse(this.response);
            console.log(r);
            if (r.error) {
                alert('Error uploading: ' + r.error);
            }
        }
    };
    request.onerror = function (err) { alert('error uploading' + err) };
    request.upload.addEventListener("progress", function (evt) {
        if (evt.lengthComputable) {
            var pc = Math.floor((evt.loaded / evt.total) * 100);
            console.log(pc, '% uploaded');
        }
    }, false);
    request.open("POST", "/uploadfile");
    request.send(formData);
}

function downloadFromBrowser(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

async function createObject(spec) {
    console.log("createObject", spec);
    //alert("createObject");
    var className = spec.type;
    var cls;
    try {
        cls = eval(className);
    }
    catch (e) {
        console.log("no class "+ className);
    };
    if (!cls) {
        try {
            cls = await loadPackage(className);
        }
        catch (e) {
            alert("Can't load class "+className);
            return null;
        }
    }
    console.log("cls", cls);
    if (cls == null)
        return null;
    var inst = new cls(spec);
    console.log("inst", inst);
    //window.INST = inst;
    return inst;
}

async function loadPackage(packageName) {
    console.log("Load class ", packageName);
    url = sprintf("js/%s.js", packageName);
    try {
        await $.getScript(url);
        console.log("Successfully loaded", packageName);
    }
    catch (e) {
        console.log("Unable to load url", url);
        alert("Unable to load "+packageName);
        return null;
    }
    //var cls = window[packageName];
    var cls = eval(packageName);
    console.log("cls", cls);
    // var inst = eval(`new ${packageName}()`);
    return cls;
}

//TODO: combine and share this with CanvasTool getUniqueId
function genUniqueId(idtype) {
    idtype = idtype || "obj";
    var id = idtype + '_' + getClockTime();
    id = id.replace(/\./g, "_");
    return id;
}

async function requirePackage(className) {
    var cls;
    try {
        cls = eval(className);
    }
    catch (e) {
        console.log("no class "+ className);
    };
    if (!cls) {
        try {
            cls = await loadPackage(className);
        }
        catch (e) {
            alert("Can't load class "+className);
            return null;
        }
    }
}
