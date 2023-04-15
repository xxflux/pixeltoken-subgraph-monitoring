const fs = require('fs');
const { ethers, BigNumber } = require('ethers');
const Utils = require('../includes/utils');
const CONST = require('../includes/constants');
const GRAPH = require('../includes/thegraph');
const termalPoolsDataFile = 'tmp_thegraph_t_pools.json';
const termalTokenDepositTxDataFile = 'tmp_thegraph_t_deposits.json';
const termalTokenWithdrawTxDataFile = 'tmp_thegraph_t_withdrawals.json';
const originationTokenPurchaseTxDataFile = 'tmp_thegraph_o_purchases.json';
const originationTokenVestedTxDataFile = 'tmp_thegraph_o_claimvesteds.json';


class Thegraph {
  constructor(provider, netRPCData){
    this.provider = provider;
    this.netRPCData = netRPCData;

    switch(this.netRPCData.chainId){
      case 1: // Mainnet
        this.netRPCDataNetName = "homestead";
        this.graphEndpoint = CONST.GRAPHQL_ENDPOIN;
        this.etherscanApi = CONST.ETHSCAN_API.MAINNET;
        this.graphEndpointOrigination = CONST.GRAPHQL_ORI_ENDPOIN;
        break;
      case 31337: // local fork
        this.netRPCDataNetName = "homestead";
        this.graphEndpoint = CONST.GRAPHQL_ENDPOIN;
        this.etherscanApi = CONST.ETHSCAN_API.MAINNET;
        this.graphEndpointOrigination = CONST.GRAPHQL_ORI_ENDPOIN;
        break;
      case 42161: // Arbitrum
        this.netRPCDataNetName = "arbitrum";
        this.graphEndpoint = CONST.GRAPHQL_ENDPOIN_ARBI;
        this.etherscanApi = CONST.ETHSCAN_API.ARBI;
        this.graphEndpointOrigination = CONST.GRAPHQL_ORI_ENDPOIN_ARBI;
        break;
      case 10: // Optimistic
        this.netRPCDataNetName = "optimism";
        this.graphEndpoint = CONST.GRAPHQL_ENDPOIN_OPTI;
        this.etherscanApi = CONST.ETHSCAN_API.OPTI;
        this.graphEndpointOrigination = CONST.GRAPHQL_ORI_ENDPOIN_OPTI;
        break;
      case 137: // Polygon
        this.netRPCDataNetName = "matic";
        this.graphEndpoint = CONST.GRAPHQL_ENDPOIN_POLY;
        this.etherscanApi = CONST.ETHSCAN_API.POLY;
        this.graphEndpointOrigination = CONST.GRAPHQL_ORI_ENDPOIN_POLY;
        break;
      case 5: // Mainnet Goerli
        this.netRPCDataNetName = "goerli";
        this.graphEndpoint = CONST.GRAPHQL_ENDPOIN_GOERLI;
        this.etherscanApi = CONST.ETHSCAN_API.GOERLI;
        this.graphEndpointOrigination = CONST.GRAPHQL_ORI_ENDPOIN_GOERLI;
        break;
      default:
        this.graphEndpoint = null;
        this.etherscanApi = null;
        this.graphEndpointOrigination = null;
    }

    let netData = Utils.getNet(this.netRPCData.chainId);
    this.netName = netData.netName;
    this.assetPlatformId = netData.assetPlatformId;
    this.txExploreUrl = netData.txExploreUrl;
    this.addressExploreUrl = netData.addressExploreUrl;
    this.providerEthScan = new ethers.providers.EtherscanProvider(this.netRPCDataNetName, this.etherscanApi);
    this.graphDataArray = [];
    this.graphPoolTxDataArray = [];
  }


  async getTerminalDeployedPool(){
    let log, previousData, netArrayInTmp = [], discordChennal;
    let currentData = await GRAPH.getTerminalData(this.graphEndpoint, 'terminalPoolCreation');
    let graphObj = {
      networkName: this.netName,
      currentData: currentData
    };
    this.graphDataArray.push(graphObj);

    let previousDataArray = JSON.parse(fs.readFileSync(termalPoolsDataFile));

    for(let ele of previousDataArray){
      console.log(ele.networkName, this.netName);
      netArrayInTmp.push(ele.networkName);
      if(ele.networkName == this.netName){
        previousData = ele.currentData[0];
      }
    }

    if(!previousData){
      if(!netArrayInTmp.includes(this.netName)){
        console.log(`${this.netName} is not in new network, need to store in tmp file`);
        // new pool detected, store thegraph data in file. activate it for prod.
        previousDataArray.push(graphObj);
        await Utils.storeData(previousDataArray, termalPoolsDataFile);
        // reload data from tmp file.
        previousDataArray = JSON.parse(fs.readFileSync(termalPoolsDataFile));
        for(let ele of previousDataArray){
          console.log(ele.networkName, this.netName);
          netArrayInTmp.push(ele.networkName);
          if(ele.networkName == this.netName){
            previousData = ele.currentData[0];
          }
        }
      } else {
        console.log("No previousData in file, exit automation");
        process.exit();
      }
    }

    console.log(`${currentData[0].terminals[0].poolCount}`);
    console.log(`${previousData.terminals[0].poolCount}`);
    // detected new pool on currentData.
    if(currentData[0].terminals[0].poolCount > previousData.terminals[0].poolCount){
      let newPools = await this.compareObjects(currentData[0]['pools'], previousData['pools']);
      for(let ele of currentData[0]['pools']){
        for(let i in newPools){
          if(ele.id == newPools[i]){
            console.log("ele.id>>>", ele.id);
            this.providerEthScan.getHistory(ele.id).then((history) => {
                console.log(history);
                let txHash;
                if(history.length > 0){
                  console.log(history[history.length-1].hash);
                  txHash = history[history.length-1].hash;
                } else if (history.length == 0) {
                  // no history, it is little odd.
                  txHash = ele.id;
                  this.txExploreUrl = this.addressExploreUrl;
                  console.log("this.addressExploreUrl>>>", this.addressExploreUrl);
                }
                if(ele.isReward){
                  log = `${this.netName} | DeployedIncentivizedPool`;
                  discordChennal = "terminal";
                  // DeployedIncentivizedPool, change discord server
                } else {
                  log = `${this.netName} | DeployedNoneIncentivizedPool`;
                  discordChennal = "terminalnoreward";
                  // DeployedNonIncentivizedPool, change discord server
                }
                log += `
  pool:${ele.id}
  token0: ${ele.token0.symbol}-${ele.token0.id}
  token1: ${ele.token1.symbol}-${ele.token1.id}
  fee: ${ele.poolFee}
  lowerTick: ${ele.lowerTick}
  upperTick: ${ele.upperTick}`;
                Utils.notifyOnDiscord(discordChennal, log, (this.txExploreUrl) ? this.txExploreUrl+txHash : '');
            });
          }
        }
      }
      // new pool detected, store thegraph data in file. activate it for prod.
      await Utils.storeData(this.graphDataArray, termalPoolsDataFile);
    }
  }


  async compareObjects(o1, o2){
    let one = [];
    let two = [];

    for(let p in o1){
      one.push(o1[p].id);
    }

    for(let p in o2){
      two.push(o2[p].id);
    }

    let diff = one.filter(x => !two.includes(x));
    return diff;
  };


  async tokensCall(token0, token1){
    let token0Info, token1Info;
    if(this.assetPlatformId){
      token0Info = await Utils.getTokenInfo(this.provider, token0);
      token1Info = await Utils.getTokenInfo(this.provider, token1);
    } else {
      token0Info = {'symbol':'Unknown'};
      token1Info = {'symbol':'Unknown'};
    }
    return {
      token0Info,
      token1Info
    };
  }


  async getTerminalPoolTx(targetTxName){
    let log, timestamp, targetArrayInTmp = [], discordChennal, termalTokentxDataFile;

    let targetTxNameArray = ['deposits', 'withdrawals'];
    for(let targetTxName of targetTxNameArray){

      switch(targetTxName){
        case 'deposits':
          termalTokentxDataFile = termalTokenDepositTxDataFile;
        break;
        case 'withdrawals':
          termalTokentxDataFile = termalTokenWithdrawTxDataFile;
        break;
        default:
          termalTokentxDataFile = null;
      }

      let previousDataArray = JSON.parse(fs.readFileSync(termalTokentxDataFile));

      for(let ele of previousDataArray){
        console.log(ele.target, targetTxName);
        targetArrayInTmp.push(ele.target);
        if(ele.target == targetTxName){
          timestamp = ele.timestamp;
        }
      }

      let currentData = await GRAPH.getTerminalDynamicData(this.graphEndpoint, timestamp);
      console.log("currentData>>>");
      console.log(JSON.stringify(currentData, null, 2));

      // send notificaiton
      discordChennal = "terminaldeposit";

      // we got new tx
      if(currentData[0].deposits && targetTxName == 'deposits'){
        for(let eleD of currentData[0].deposits){
          let amount0 = ethers.utils.formatUnits(eleD.amount0, eleD.pool.token0.decimals);
          let amount1 = ethers.utils.formatUnits(eleD.amount1, eleD.pool.token1.decimals);
          let txHash = eleD.id;
          log = `${this.netName} | ${targetTxName}
  Pool: ${eleD.pool.id}
  User: ${eleD.user.id}
  Token0: ${Number(amount0).toFixed(3)} ${eleD.pool.token0.symbol}-${eleD.pool.token0.id}
  Token1: ${Number(amount1).toFixed(3)} ${eleD.pool.token1.symbol}-${eleD.pool.token1.id}`;
          Utils.notifyOnDiscord(discordChennal, log, (this.txExploreUrl) ? this.txExploreUrl+txHash : '');
        }
      }
      if(currentData[0].withdrawals && targetTxName == 'withdrawals'){
        for(let eleW of currentData[0].withdrawals){
          let amount0 = ethers.utils.formatUnits(eleW.amount0, eleW.pool.token0.decimals);
          let amount1 = ethers.utils.formatUnits(eleW.amount1, eleW.pool.token1.decimals);
          let txHash = eleW.id;
          log = `${this.netName} | ${targetTxName}
  Pool: ${eleW.pool.id}
  User: ${eleW.user.id}
  Token0: ${Number(amount0).toFixed(3)} ${eleW.pool.token0.symbol}-${eleW.pool.token0.id}
  Token1: ${Number(amount1).toFixed(3)} ${eleW.pool.token1.symbol}-${eleW.pool.token1.id}`;
          Utils.notifyOnDiscord(discordChennal, log, (this.txExploreUrl) ? this.txExploreUrl+txHash : '');
        }
      }
    }

  }


  async getOriginationPoolTx(){
    let log, timestamp, targetArrayInTmp = [], discordChennal, originationTokentxDataFile;

    let targetTxNameArray = ['purchases', 'claimvesteds'];
    for(let targetTxName of targetTxNameArray){

      switch(targetTxName){
        case 'purchases':
          originationTokentxDataFile = originationTokenPurchaseTxDataFile;
        break;
        case 'claimvesteds':
          originationTokentxDataFile = originationTokenVestedTxDataFile;
        break;
        default:
          originationTokentxDataFile = null;
      }

      let previousDataArray = JSON.parse(fs.readFileSync(originationTokentxDataFile));

      for(let ele of previousDataArray){
        console.log(ele.target, targetTxName);
        targetArrayInTmp.push(ele.target);
        if(ele.target == targetTxName){
          timestamp = ele.timestamp;
        }
      }

      let currentData = await GRAPH.getOriginationDynamicData(this.graphEndpointOrigination, timestamp);
      console.log("currentData>>>");
      console.log(JSON.stringify(currentData, null, 2));

      // send notificaiton
      discordChennal = "originationtx";

      // we got new tx
      try{
        if(currentData[0] && targetTxName == 'purchases'){
          for(let eleD of currentData[0].purchases){
            let amount0 = ethers.utils.formatUnits(eleD.contributionAmount, eleD.pool.offerToken.decimals);
            //let amount1 = ethers.utils.formatUnits(eleD.amount1, eleD.pool.purchaseToken.decimals);
            let txHash = eleD.id;
            log = `${this.netName} | ${targetTxName}
    From: ${eleD.user.id}
    To: ${eleD.pool.id}
    PurchaseToken: ${Number(amount0).toFixed(3)} ${eleD.pool.purchaseToken.symbol}-${eleD.pool.purchaseToken.id}`;
            Utils.notifyOnDiscord(discordChennal, log, (this.txExploreUrl) ? this.txExploreUrl+txHash : '');
          }
        }
      } catch(error){
        console.log("purchases catch error>>>", error);
      }

      try{
        if(currentData[0] && targetTxName == 'claimvesteds'){
          for(let eleW of currentData[0].vesteds){
            let amount0 = ethers.utils.formatUnits(eleW.tokenAmountClaimed, eleW.pool.offerToken.decimals);
            //let amount1 = ethers.utils.formatUnits(eleW.amount1, eleW.pool.purchaseToken.decimals);
            let txHash = eleW.id;
            log = `${this.netName} | ${targetTxName}
    From: ${eleW.pool.id}
    To: ${eleW.user.id}
    OfferToken: ${Number(amount0).toFixed(3)} ${eleW.pool.offerToken.symbol}-${eleW.pool.offerToken.id}`;
            Utils.notifyOnDiscord(discordChennal, log, (this.txExploreUrl) ? this.txExploreUrl+txHash : '');
          }
        }
      } catch(error){
        console.log("claimvesteds catch error>>>", error);
      }

    }

  }



}

module.exports = Thegraph;
