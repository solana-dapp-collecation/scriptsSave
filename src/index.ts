import { getOwnerInfo, getSolBalance, getPrice} from "./tokens";
import {PublicKey, Connection } from "@solana/web3.js";
import moment from "moment";
import {insertDb, updateDb, checkDbForOwner} from "./dbOperations";
import * as wallets from "./testWallets.json";
import * as tokenData from "./tokenInfoBackup.json";

var solAddressArvind= new PublicKey("Gaw5HBXFe2W9uepHQ8ehGpHQ6eqEvAswdt9BHzPnet69");
var connection = new Connection("https://solana-api.projectserum.com");
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const collectAndSaveData = async (solAddress) => {
    var response = await getOwnerInfo(connection, solAddress);
    if (response.length === 0)
    {
      console.log("Only Sol with user. Do more when we figure out to calculate sol balance");
      return;
    }
    let db = await MongoClient.connect(url)
    var dbo = db.db("mydb");
    let ifUserExists = await checkDbForOwner(solAddress.toBase58(), dbo);
    let formattedData;
    if (!ifUserExists){
      formattedData = await formatFirstTimeData(solAddress, response);
      insertDb(dbo, formattedData, "dailyInfo");
    }
    else{
      formattedData =await formatRecurringData(ifUserExists[0], response);
      updateDb(dbo, ifUserExists[0].accountAddress, formattedData, "dailyInfo");
    }
    
};

async function formatFirstTimeData(ownerAddress, response){
  let balances =[];
  for (var i=0; i<response.length; i++){
    let ownerTokenAddress = response[i].ownerTokenAddress, 
        balance = response[i].balance , 
        effectiveMint = response[i].effectiveMint , 
        tokenName = response[i].tokenName , 
        supply = response[i].supply;
  
    let marketAddress = "";
    for (var j=0; j<tokenData.tokens.length; j++){
      if (effectiveMint === tokenData.tokens[j].tokenMint)
      {
        marketAddress = tokenData.tokens[j].marketAddress;
        break;
      }
    }
    let price = await getPrice(new Connection("https://solana-api.projectserum.com"),marketAddress);
    if (effectiveMint === USDC_MINT)
      price =1;
    if (marketAddress !== "")
      balances.push({
          "ownerTokenAddress": ownerTokenAddress,
          "effectiveMint": effectiveMint,
          "amount": parseFloat(balance),
          "tokenName": tokenName,
          "supply": supply,
          "marketAddress": marketAddress,
          "price": price
      })
  };
  let objectToInsert = {
    accountAddress: ownerAddress.toBase58(),
    dailyInfos: [
      {
        __time: moment().format("DD/MM/YYYY HH:mm:ss a"),
        balances: balances
      }
    ]
  }
  return objectToInsert;
}

async function formatRecurringData(dbData, apiResponse){
  let existingDailyInfo = dbData.dailyInfos;
  let balances = [];
  for (var i=0; i<apiResponse.length; i++){
    let ownerTokenAddress = apiResponse[i].ownerTokenAddress, 
        balance = apiResponse[i].balance , 
        effectiveMint = apiResponse[i].effectiveMint , 
        tokenName = apiResponse[i].tokenName , 
        supply = apiResponse[i].supply;

    let marketAddress = "";
    for (var j=0; j<tokenData.tokens.length; j++){
      if (effectiveMint === tokenData.tokens[j].tokenMint)
      {
        marketAddress = tokenData.tokens[j].marketAddress;
        break;
      }
    }
    let price = await getPrice(new Connection("https://solana-api.projectserum.com"),marketAddress);
    if (effectiveMint === USDC_MINT)
      price =1;
    if (marketAddress !== "")
      balances.push({
        "ownerTokenAddress": ownerTokenAddress,
        "effectiveMint": effectiveMint,
        "amount": parseFloat(balance),
        "tokenName": tokenName,
        "supply": supply,
        "marketAddress": marketAddress,
        "price": price
      });
  };
  existingDailyInfo.push({
    __time: moment().format("DD/MM/YYYY HH:mm:ss a"),
    balances: balances
  });

  let objectToInsert = {
    accountAddress: dbData.accountAddress,
    dailyInfos: existingDailyInfo
  }
  return objectToInsert;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
//async function mainF(){
//  for (var i =0; i<124; i++){
//    let address = new PublicKey(wallets.wallets[i]);
//    console.log("Wallet: " +i);
//    await sleep(200);
//    await collectAndSaveData(address);
//}
//}
//mainF();
collectAndSaveData(solAddressArvind);



//Only to save initial Token meta Data
//async function saveMarketAndtokenData(){
//  let objectToWrite = {}
//  let tokenss =[];
//  for (var i =0; i<tokens.tokens.length; i++){
//  let marketAddress = tokens.tokens[i].marketAddress;
//  let returnedData = await fetchTokenDetails(marketAddress);
//  tokenss.push(
//    {
//      "tokenName": tokens.tokens[i].tokenName,
//      "marketAddress": tokens.tokens[i].marketAddress,
//      "decimals": returnedData[1],
//      "tokenMint": returnedData[0]
//    }
//  )
  
//}
//let tokensss = JSON.stringify({"tokens": tokenss});
//var fs = require("fs");
//fs.writeFile("allMarkets.json", tokensss, function (err){
//  console.log(err);
//});
//}

//const fetchTokenDetails = async (newAddress) =>{
//  const requestOptions = {
//    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer 93a9f904-ca91-4561-8908-8b6466585b8c' }
//  };
//  let response = await axios.get("https://api.solanabeach.io/v1/market/"+newAddress, requestOptions);
//  return [response.data.basemint.address, response.data.meta.baseTokenDecimals];
  
//}