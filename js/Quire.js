
// Module to add to node server to handle Quire API
// Usage:
// Quire = require("./js/Quire").Quire;
// Quire(app);

function getClockTime() { return new Date() / 1000.0; }

var verbosity = 1;

var sprintf = require("./libs/sprintf").sprintf;

//Beginning of quire stuff
var clientId = ":vHCsZnwSWPG-arDM79AqLtvC5HD";
var clientSecret = "cr7a64fs6amxpjtjfghfzqw6rw91akp6gik5bdje";
//const redirectURI = 'http://quire/callback';
//const redirectURI = 'http://localhost/api/quire/callback';
const redirectURI = 'http://worldviews.org/FlowerGarden/api/quire/callback';

const authorizationUrl = 'https://quire.io/oauth';
const tokenUrl = 'https://quire.io/oauth/token';
const apiUrlBase = 'https://quire.io/api';
var quireCode = null;
var quireTokenData = null;
var quireToken = null;
var quireTokenTime = 0;
var request = require('request');

async function exchangeAccessToken(code) {
    return new Promise(function (resolve, reject) {
        request.post({
            url: tokenUrl,
            form: {
                grant_type: 'authorization_code',
                code: code,
                client_id: clientId,
                client_secret: clientSecret
            }
        },
            function (error, httpResponse, body) {
                if (error) {
                    return reject(error);
                }
                console.log("body: " + body);
                resolve(JSON.parse(body))
            });
    });
}

function getAPIData(apiPath, token) {
    return new Promise(function (resolve, reject) {
        var url = apiUrlBase + apiPath;
        //var url = 'http://quire.io/api/organization/list';
        console.log("getAPIData ", token, url);
        request.get({
            url: url,
            headers: {
                //"Authorization": "Bearer " + quireToken
                "Authorization": "Bearer " + token
            }
        },
            function (error, httpResponse, body) {
                if (error) {
                    return reject(error);
                }
                console.log("got response....", body);
                var obj;
                try {
                    obj = JSON.parse(body);
                    console.log("obj", obj, JSON.stringify(obj, null, 3));
                }
                catch (e) {
                    obj = {
                        'error': 'JSON parse error',
                        'url': url,
                        'string': body
                    }
                }
                resolve(obj);
            });
    });
}

function setupRoutes(app) {

    app.get('/api/quireStart', function (req, res) {
        console.log("/quire " + req.path);
        var query = req.query;
        console.log("query: " + JSON.stringify(query));
        var authUrl = authorizationUrl
            + '?client_id=' + clientId
            //+ '&redirect_uri=' + encodeURIComponent(redirectURI);
            + '&redirect_uri=' + redirectURI;
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(
            '<html><body>'
            + '<a href="' + authUrl + '">Connect Quire</a>'
            + '</body></html>');
        res.end();
    });

    app.get('/api/quire/getState', function (req, res) {
        var obj = {
            'type': 'quireState',
            'token': quireToken,
            'tokenTime': quireTokenTime,
            'tokenData': quireTokenData, 'code': quireCode
        };
        res.json(obj);
    });

    app.get('/api/quire/callback', async function (req, resp) {
        console.log("/quire " + req.path);
        var query = req.query;
        console.log("query: " + JSON.stringify(query));
        quireCode = query['code'];
        quireTokenData = await exchangeAccessToken(quireCode);
        quireToken = quireTokenData['access_token'];
        quireTokenTime = getClockTime();
        var request = require('request');
        resp.end("callback ok code " + quireCode + " token " + quireToken);
    });

    app.get('/api/quire/getUser', async function (req, res) {
        var obj = await getAPIData('/user/id/me', quireToken);
        var jstr = JSON.stringify(obj, null, 3);
        console.log("jstr", jstr);
        //res.end(jstr);
        res.json(obj);
    });

    app.get('/api/quire/getOrganizations', async function (req, res) {
        var obj = await getAPIData('/organization/list', quireToken);
        var jstr = JSON.stringify(obj, null, 3);
        console.log("jstr", jstr);
        //res.end(jstr);
        res.json(obj);
    });

    app.get('/api/quire/api*', async function (req, res) {
        var path = req.path;
        console.log("path", path);
        var apiPath = path.slice("/api/quire/api".length);
        console.log("apiPath", apiPath);
        var obj = await getAPIData(apiPath, quireToken);
        var jstr = JSON.stringify(obj, null, 3);
        console.log("jstr", jstr);
        //res.end(jstr);
        res.json(obj);
    });
}

function Quire(app) {
    console.log("******* Setting up Quire ******");
    setupRoutes(app);
}

exports.Quire = Quire;
 // End of quire stuff..

