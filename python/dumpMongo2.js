
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

async function getFlowers(url) {
    var db = await MongoClient.connect(url);
    var dbo = db.db("db1");
    console.log("dbo: "+dbo);
    var recs = await dbo.collection("flowers").find().toArray();
    console.log("recs", recs);
    return recs;
}

async function dump() {
    var recs = await getFlowers(url);
    console.log("recs", recs);
}


dump()


