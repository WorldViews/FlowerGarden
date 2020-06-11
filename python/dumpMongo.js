
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
console.log("url: "+url);
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("db1");
  console.log("dbo: "+dbo);
  //var query = { address: "Park Lane 38" };
  //dbo.collection("customers").find(query).toArray(function(err, result) {
  dbo.collection("flowers").find().toArray(function(err, result) {
        if (err) throw err;
    console.log(result);
    db.close();
  });
});
