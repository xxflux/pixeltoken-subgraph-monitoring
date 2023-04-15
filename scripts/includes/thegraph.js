#!/usr/bin/env node
require('dotenv').config();
const axios = require('axios');
const Util = require('../includes/utils');

const terminalPoolGraphQLParams =
`query TerminalData {
  terminals {
    poolCount
  }
  pools(orderBy: createdAt, orderDirection: desc) {
    id
    createdAt
    token0 {
      id
      symbol
    }
    token1 {
      id
      symbol
    }
    poolFee
    lowerTick
    upperTick
    isReward
  }
}`;

const terminalTokenTxGraphQLParams =
`query TerminalTokenTxData {
  deposits(orderBy: timestamp, orderDirection: desc) {
    id
    pool {
      id
      token0 {
        id
        symbol
        decimals
      }
      token1 {
        id
        symbol
        decimals
      }
    }
    user {
      id
    }
    amount0
    amount1
    timestamp
  }
}`;



exports.getTerminalData = async function (graphEndpoint, queryName){
  let pairData=[];

  switch(queryName){
    case 'terminalPoolCreation':
      terminalPoolGraphQLQuery = terminalPoolGraphQLParams;
    break;
    case 'terminalTokenTx':
      terminalPoolGraphQLQuery = terminalTokenTxGraphQLParams;
    break;
    default:
      terminalPoolGraphQLQuery = null;
  }

  await axios({
    url: graphEndpoint,
    method: 'post',
    data: {
      query: terminalPoolGraphQLQuery,
    }
  }).then((result) => {
    if(result.data.data){
      pairData = pairData.concat(result.data.data);
    }
  }).catch((error) => {
    let errorLog = `Getting data from thegraph has error, stoping entire process for now. Wait to next cron.`;
    console.log(errorLog + "|" + error);
    Util.notifyOnDiscord('private', errorLog + "|" + error, '').then(() => {
        process.exit(); // send private tagged notif, then terminate the process.
    });
  });

  console.log("This is total pool numbers in Terminal: ", pairData.length);
  return pairData;
}


const terminalPoolTxGraphQLParams =
`query TerminalPoolTxData($timestamp: String!) {
  deposits(orderBy: timestamp, orderDirection: desc, where:{timestamp_gt:$timestamp}) {
    id
    pool {
      id
      token0 {
        id
        symbol
        decimals
      }
      token1 {
        id
        symbol
        decimals
      }
    }
    user {
      id
    }
    amount0
    amount1
    timestamp
  },
  withdrawals(orderBy: timestamp, orderDirection: desc, where:{timestamp_gt:$timestamp}) {
    id
    pool {
      id
      token0 {
        id
        symbol
        decimals
      }
      token1 {
        id
        symbol
        decimals
      }
    }
    user {
      id
    }
    amount0
    amount1
    timestamp
  }
}`;


exports.getTerminalDynamicData = async function (graphEndpoint, timestamp){
  let pairData=[];
  await axios({
    url: graphEndpoint,
    method: 'post',
    data: {
      query: terminalPoolTxGraphQLParams,
      variables: {
        timestamp:timestamp,
      },
    }
  }).then((result) => {
    if(result.data.data){
      pairData = pairData.concat(result.data.data);
    } else {
      console.log("result.data.data is not defined.", result.data);
      process.exit();
    }
  }).catch((error) => {
    let errorLog = `Getting data from thegraph has error, stoping entire process for now. Wait to next cron.`;
    console.log(errorLog + "|" + error);
    Util.notifyOnDiscordWithTag(errorLog + "|" + error).then(() => {
        process.exit(); // send private tagged notif, then terminate the process.
    });
  });
  console.log("This is total user numbers in query: ", pairData.length);
  return pairData;
}


const originationPoolTxGraphQLParams =
`query OriginationPoolTxData($timestamp: String!) {
  purchases(orderBy: timestamp, orderDirection: desc, where:{timestamp_gt:$timestamp})  {
    timestamp
    contributionAmount
    id
    user {
      id
    }
    pool {
      id
      offerToken {
        id
        symbol
        decimals
      }
      purchaseToken {
        id
        symbol
        decimals
      }
    }
  },
  vesteds(orderBy: timestamp, orderDirection: desc, where:{timestamp_gt:$timestamp})  {
    timestamp
    tokenAmountClaimed
    id
    user {
      id
    }
    pool
    {
      id
      offerToken {
        id
        symbol
        decimals
      }
      purchaseToken {
        id
        symbol
        decimals
      }
    }
  }
}`;


exports.getOriginationDynamicData = async function (graphEndpoint, timestamp){
  let pairData=[];
  await axios({
    url: graphEndpoint,
    method: 'post',
    data: {
      query: originationPoolTxGraphQLParams,
      variables: {
        timestamp:timestamp,
      },
    }
  }).then((result) => {
    console.log(JSON.stringify(result.data.data, null, 2));
    if(result.data.data){
      pairData = pairData.concat(result.data.data);
    } else {
      console.log("result.data.data is not defined.", result.data);
    }
  }).catch((error) => {
    let errorLog = `Getting data from thegraph has error, stoping entire process for now. Wait to next cron.`;
    console.log(errorLog + "|" + error);
    Util.notifyOnDiscordWithTag(errorLog + "|" + error).then(() => {
        process.exit(); // send private tagged notif, then terminate the process.
    });
  });
  console.log("This is total user numbers in query: ", pairData.length);
  return pairData;
}
