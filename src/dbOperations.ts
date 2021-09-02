export function createDb() {
  var MongoClient = require("mongodb").MongoClient;
  var url = "mongodb://localhost:27017/";
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("mydb");
    dbo.createCollection("dailyInfo", function (err, result) {
      if (err) throw err;
      console.log("Created");
      db.close();
    });
  });
}

export function insertDb(mydb, objectToInsert, dataSource) {
  mydb.collection(dataSource).insertOne(objectToInsert);
}

export function updateDb(mydb, ownerAddress, newObject, dataSource) {
  var query = { accountAddress: ownerAddress };
  mydb.collection(dataSource).replaceOne(query, newObject);
}

export async function checkDbForOwner(ownerAddress, mydb) {
  let queryResult = null;
  var query = { accountAddress: ownerAddress };
  queryResult = await mydb.collection("dailyInfo").find(query).toArray();
  if (queryResult.length === 0) return false;

  return queryResult;
}

//api db functions

export async function checkDbForWallet(ownerAddress, mydb) {
  let queryResult = null;
  var query = { accountAddress: ownerAddress };
  queryResult = await mydb.collection("dailyInfo").find(query).toArray();
  if (queryResult.length === 0) return false;
  return queryResult;
}

