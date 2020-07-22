"use strict"

// TestApp1
// TestApp2
var clientId = ":_s5xE_UZTl3YSBqsW65cjY2w3kW";
var clientSecret = "shl2pflakkl9vc1ge5m9zkbm68xeoodfu4s7kzqq";
//const redirectURI = 'http://localhost:3000/callback';

const authorizationUrl = 'https://quire.io/oauth';
const tokenUrl = 'https://quire.io/oauth/token';
const apiUrl = 'https://quire.io/api';

function getCurrentUser(token) {
    return new Promise(function (resolve, reject) {
        request.get({
            url: apiUrl + '/user/id/me',
            headers: {
                "Authorization": "Bearer " + token
            }
        },
            function (error, httpResponse, body) {
                if (error) {
                    return reject(error);
                }
                console.log("Got " + body);
                resolve(JSON.parse(body))
            });
    });
}

async function dump() {
    console.log("dump...");
    var code = getParameterByName("code");
    console.log("code:", code);
    //var url = "https://quire.io/api/user/id/me";
    var url = "https://quire.io/oauth/token";
    var dataToBeSent = {
        code: code,
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret
    };
    console.log("dataToBeSent", dataToBeSent);
    console.log("url", url);
    $.post(url, dataToBeSent, function (data, textStatus) {
        //data contains the JSON object
        //textStatus contains the status: success, error, etc
        console.log("Got data", data);
        console.log("textStatus", textStatus);
    }, "json");
    /*
var res = await loadJSON(url);
console.log("url:", url);
var jstr = JSON.stringify(res, null, 3);
$("#jsonArea").html(jstr);
*/
}

async function testAPI() {
    console.log("testAPI");
    var str = "";
    var user = await loadJSON("../api/quire/getUser");
    str += JSON.stringify(user, null, 3) + "<br>";
    $("#jsonArea").html(str);
    var orgs = await loadJSON("../api/quire/getOrganizations");
    str += JSON.stringify(orgs, null, 3);
    $("#jsonArea").html(str);
}

async function getProjects(getTasks) {
    console.log("getProjects");
    var str = "";
    //var url = "../api/quire/api/project/list/id/Garden_Team"'
    var url = "https://worldviews.org/FlowerGarden/api/quire/api/project/list/id/Garden_Team"
    var projects = await loadJSON(url);
    if (getTasks) {
        for (var i = 0; i < projects.length; i++) {
            var project = projects[i];
            var url = "../api/quire/api/task/list/" + project.oid;
            var tasks = await loadJSON(url);
            console.log("got tasks", tasks);
            project.tasks = tasks;
        }
    }
    str += JSON.stringify(projects, null, 3);
    $("#jsonArea").html(str);
    //uploadToFile("/quireData", projects, "quireProjects.json");
}

function requestQuirePermission() {
    var url = "../api/quireStart";
    popupWindow = window.open(url,
        'popUpWindow',
        'height=500,width=500,left=100,top=100,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no, status=yes');
}

