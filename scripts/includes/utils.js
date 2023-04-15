#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const rq = require('request-promise');
const { ethers, BigNumber } = require('ethers');
const axios = require('axios');
const CONST = require('../includes/constants');
const { PROD } = require("./config");

let webhooks;
if(!PROD){
  webhooks = require('../includes/webhooks_dev.json');
} else {
  webhooks = require('../includes/webhooks.json');
}

const termalTokenDepositTxDataFile = 'tmp_thegraph_t_deposits.json';
const termalTokenWithdrawTxDataFile = 'tmp_thegraph_t_withdrawals.json';
const originationTokenPurchaseTxDataFile = 'tmp_thegraph_o_purchases.json';
const originationTokenVestedTxDataFile = 'tmp_thegraph_o_claimvesteds.json';

exports.getNet = function (chainId){
  switch(chainId){
    case 1: // Mainnet
      LMTERMINAL = CONST.LMTERMINAL;
      ORIGINATION = CONST.ORIGINATION;
      ERC20 = CONST.ERC20;
      netName = 'Mainnet';
      assetPlatformId = 'ethereum';
      txExploreUrl = 'https://etherscan.io/tx/';
      addressExploreUrl = 'https://etherscan.io/address/';
      break;
    case 31337: // local fork
      LMTERMINAL = CONST.LMTERMINAL;
      ORIGINATION = CONST.ORIGINATION;
      ERC20 = CONST.ERC20;
      netName = 'Mainnet';
      assetPlatformId = 'ethereum';
      txExploreUrl = 'https://etherscan.io/tx/';
      addressExploreUrl = 'https://etherscan.io/address/';
      break;
    case 42161: // Arbitrum
      LMTERMINAL = CONST.LMTERMINALARBI;
      ORIGINATION = CONST.ORIGINATIONARBI;
      ERC20 = CONST.ERC20ARBI;
      netName = 'Arbitrum';
      assetPlatformId = 'arbitrum-one';
      txExploreUrl = 'https://arbiscan.io/tx/';
      addressExploreUrl = 'https://arbiscan.io/address/';
      break;
    case 10: // Optimistic
      LMTERMINAL = CONST.LMTERMINALOPTI;
      ORIGINATION = CONST.ORIGINATIONOPTI;
      ERC20 = CONST.ERC20OPTI;
      netName = 'Optimistic';
      assetPlatformId = 'optimistic-ethereum';
      txExploreUrl = 'https://optimistic.etherscan.io/tx/';
      addressExploreUrl = 'https://optimistic.etherscan.io/address/';
      break;
    case 137: // Polygon
      LMTERMINAL = CONST.LMTERMINALPOLY;
      ORIGINATION = CONST.ORIGINATIONPOLY;
      ERC20 = CONST.ERC20POLY;
      netName = 'Polygon';
      assetPlatformId = 'polygon-ethereum';
      txExploreUrl = 'https://polygonscan.com/tx/';
      addressExploreUrl = 'https://polygonscan.com/address/';
      break;
    case 5: // Mainnet Goerli
      LMTERMINAL = CONST.LMTERMINALGOERLI;
      ORIGINATION = CONST.ORIGINATIONGOERLI;
      ERC20 = CONST.ERC20GOERLI;
      netName = 'Mainnet Goerli';
      assetPlatformId = 'ethereum-goerli';
      txExploreUrl = 'https://goerli.etherscan.io/tx/';
      addressExploreUrl = 'https://goerli.etherscan.io/address/';
      break;
    case 4: // Mainnet Rinkeby
      LMTERMINAL = CONST.LMTERMINALRINKE;
      ORIGINATION = CONST.ORIGINATIONGOERLI;
      ERC20 = CONST.ERC20RINKE;
      netName = 'Mainnet Rinkeby';
      assetPlatformId = 'ethereum-rinkeby';
      txExploreUrl = 'https://rinkeby.etherscan.io/tx/';
      addressExploreUrl = 'https://rinkeby.etherscan.io/address/';
      break;
    default:
      LMTERMINAL = null;
      ORIGINATION = null;
      ERC20 = null;
      netName = 'Unknown';
      assetPlatformId = null;
      txExploreUrl = null;
      addressExploreUrl = null;
  }

  return {
    'ERC20': ERC20,
    'LMTERMINAL': LMTERMINAL,
    'ORIGINATION': ORIGINATION,
    'netName': netName,
    'assetPlatformId': assetPlatformId,
    'txExploreUrl': txExploreUrl,
    'addressExploreUrl': addressExploreUrl,
  }
}


exports.initializeInst = async function (provider){
  let wallet = await ethers.Wallet.fromEncryptedJson(
    fs.readFileSync(process.env.AUTOMANAGERWALLET).toString(),
    process.env.AUTOMANAGERPASSWORD
  );
  wallet = await wallet.connect(provider);

  let chainId = wallet.provider._network.chainId;
  let { LMTERMINAL, ORIGINATION } = await this.getNet(chainId);

  LMTerminal = new ethers.Contract(LMTERMINAL.ADDRESS, LMTERMINAL.ABI, wallet);

  if(ORIGINATION.ADDRESS){
    LMOrigination = new ethers.Contract(ORIGINATION.ADDRESS, ORIGINATION.ABI, wallet);
  } else {
    LMOrigination = null;
  }

  return {
    wallet,
    LMTerminal,
    LMOrigination,
  }
}


exports.getTokenInfo = async function (provider, tokenAddress){
  let wallet = await ethers.Wallet.fromEncryptedJson(
    fs.readFileSync(process.env.AUTOMANAGERWALLET).toString(),
    process.env.AUTOMANAGERPASSWORD
  );
  wallet = await wallet.connect(provider);

  let chainId = wallet.provider._network.chainId;
  let { ERC20 } = await this.getNet(chainId);

  tokenInst = new ethers.Contract(tokenAddress, ERC20.ABI, wallet);

  return {
    'symbol': await tokenInst.symbol(),
    'decimal': await tokenInst.decimals(),
  }
}


exports.usdcUnit = async function (amount){
  let weiStr = await BigNumber.from("1000000").mul(amount);
  return await BigNumber.from(weiStr);
}


exports.usdcToUnit = async function (amount){
  let weiStr = await BigNumber.from("1000000").div(amount);
  return await BigNumber.from(weiStr);
}


exports.notifyOnDiscord = async function(to, title, txLink){
  let utc_date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
  utc_date = utc_date+' +UTC'
  let local_date = new Date().toLocaleString('en-US',{timezone:'America/Los_Angeles'});

  let uri;
  switch(to){
    case 'prod':
      uri = process.env.DISCORDWEBHOOK;
      break;
    case 'terminal':
      uri = webhooks.terminal;
      break;
    case 'terminalnoreward':
      uri = webhooks.terminalnoreward;
      break;
    case 'terminaldeposit':
      uri = webhooks.terminaldeposit;
      break;
    case 'originationtx':
      uri = webhooks.originationtx;
      break;
    default:
      uri = process.env.DISCORDWEBHOOKPRIVATE;
  }

  let content =
`\`\`\`css
[${utc_date}]
${title.substring(0,500)}
\`\`\``;
  if(txLink){
    content = content + " [Check tx >]("+txLink+")"
  }
  var options = {
    method: 'POST',
    uri: uri,
    body: {
        content: content
    },
    json: true // Automatically stringifies the body to JSON
  };

  await rq(options).then((r) => {
    console.log(`[${local_date}] Discord notify sent - ${title}`)
  }).catch((e) => {
    console.error(e);
  });
}


exports.notifyOnDiscordWithTag = async function(log) {
    let membertag = "";
    let privateTags = [
      "_DISCORD_ACCOUNT_ID_012_",
      "_DISCORD_ACCOUNT_ID_022_"
    ];
    for(let i=0; i < privateTags.length; i++){
      membertag += "<@"+privateTags[i]+">";
    }
    await axios.post(process.env.DISCORDWEBHOOKPRIVATE, {
        content: membertag + log
    });
    console.log(membertag + log);
}


exports.getDateFromJSON = async function(url) {
  let jsonData = JSON.parse(fs.readFileSync(url));
  return jsonData;
}


exports.storeData = async function (data, path){
  try {
    fs.writeFileSync(path, JSON.stringify(data))
  } catch (err) {
    console.error(err)
  }
}


exports.storeAppendData = async function(data, path){
  let preData = await fs.readFileSync(path)
  let objData = JSON.parse(preData)
  console.log(typeof data === 'object')
  if(typeof data === 'object'){
    objData.push(data)
  } else {
    objData.push(data[0])
  }

  try {
    fs.writeFileSync(path, JSON.stringify(objData))
  } catch (err) {
    console.error(err)
  }
}

exports.getDateFromJSON = async function(url) {
  let jsonData = JSON.parse(fs.readFileSync(url));
  return jsonData;
}

exports.hoursAgo = async function(hours){
  var d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
}

exports.bnDecimals = async function (amount, _decimals) {
   let decimal = Math.pow(10, _decimals);
   let decimals = new BigNumber.from(decimal.toString());
   return new BigNumber.from(amount).mul(decimals);
}

exports.getNumberDivDecimals = async function (amount, _decimals) {
    let decimal = Math.pow(10, _decimals);
    let decimals = new BigNumber.from(decimal.toString());
    return amount.div(decimals).toNumber();
}


exports.getTimeDurationStr = async function (secs) {
  if (secs < 60) {
    return `${secs} secs`;
  }

  const mins = Math.floor(secs / 60);
  if (mins < 60) {
    return `${mins} mins`;
  }

  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours} hours`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return `${days} day`;
  } else if (days < 7) {
    return `${days} days`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks === 1) {
    return `${weeks} week`;
  }

  return `${weeks} weeks`;
}



exports.storeTimestamp = async function (targetTxName) {
  let termalTokentxDataFile, graphPoolTxDataArray = [];
  let now = Math.floor(Date.now() / 1000);

  let graphObj = {
    target: targetTxName,
    timestamp: now.toString()
  };
  graphPoolTxDataArray.push(graphObj);

  switch(targetTxName){
    case 'deposits':
      termalTokentxDataFile = termalTokenDepositTxDataFile;
    break;
    case 'withdrawals':
      termalTokentxDataFile = termalTokenWithdrawTxDataFile;
    break;
    case 'purchases':
      termalTokentxDataFile = originationTokenPurchaseTxDataFile;
    break;
    case 'claimvesteds':
      termalTokentxDataFile = originationTokenVestedTxDataFile;
    break;
    default:
      termalTokentxDataFile = null;
  }

  // store the current timestamp to file for later use
  await this.storeData(graphPoolTxDataArray, termalTokentxDataFile);
}
