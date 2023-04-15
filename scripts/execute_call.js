require('dotenv').config();
const { ethers } = require('ethers');
const Utils = require('../scripts/includes/utils');
const { PROD } = require("../scripts/includes/config");
const Thegraph = require('../scripts/classes/Thegraph');

let provider, providerMainnet, providerArbinet, providerOptinet, providerPolynet, providerGoerli;
if(!PROD){
  provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
  providerGoerli = new ethers.providers.JsonRpcProvider(process.env.ALCHEMYENDPOINT_MAINNET_GOERLI);
  providers = [provider, providerGoerli];
} else {
  provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMYENDPOINT);
  providerMainnet = new ethers.providers.JsonRpcProvider(process.env.ALCHEMYENDPOINT_MAINNET);
  providerArbinet = new ethers.providers.JsonRpcProvider(process.env.ALCHEMYENDPOINT_ARBINET);
  providerOptinet = new ethers.providers.JsonRpcProvider(process.env.ALCHEMYENDPOINT_OPTINET);
  providerPolynet = new ethers.providers.JsonRpcProvider(process.env.ALCHEMYENDPOINT_POLYNET);
  providerGoerli = new ethers.providers.JsonRpcProvider(process.env.ALCHEMYENDPOINT_MAINNET_GOERLI);
  providers = [providerMainnet, providerArbinet, providerOptinet, providerGoerli, providerPolynet];
}


////////////////////////////////////////////////////////
// Main
////////////////////////////////////////////////////////
executionManager();
async function executionManager(){
  if(!PROD){
    console.log(`Run on development mode.`);
  }

  let start_date_r = new Date().toLocaleString('en-US', {timezone:'America/Log_Angeles'});
  console.log(">> start at:", start_date_r);

  let action = process.argv[2];

  if(!action){
    process.exit('Please make sure action flag is defined');
  } else {
    switch (action) {
      case 'listenFromGraph':
        for(let idx in providers){
          let netRPCData = await providers[idx]._networkPromise;
          const TheGraphInst = new Thegraph(providers[idx], netRPCData);
          await TheGraphInst.getTerminalDeployedPool();
          await new Promise(r => setTimeout(r, 1000)); // 1000 = 1 sec
        }
        break;
      case 'getTerminalPoolTx':
        for(let idx in providers){
          let netRPCData = await providers[idx]._networkPromise;
          const TheGraphInst = new Thegraph(providers[idx], netRPCData);
          await TheGraphInst.getTerminalPoolTx();
          await new Promise(r => setTimeout(r, 1000)); // 1000 = 1 sec
        }
        await Utils.storeTimestamp('deposits');
        await Utils.storeTimestamp('withdrawals');
        break;
      case 'getOriginationPoolTx':
        for(let idx in providers){
          let netRPCData = await providers[idx]._networkPromise;
          const TheGraphInst = new Thegraph(providers[idx], netRPCData);
          await TheGraphInst.getOriginationPoolTx();
          await new Promise(r => setTimeout(r, 1500)); // 1000 = 1 sec
        }
        await Utils.storeTimestamp('purchases');
        await Utils.storeTimestamp('claimvesteds');
        break;
      default:
    }
  }
  let end_date = new Date().toLocaleString('en-US', {timezone:'America/Log_Angeles'});
  console.log(">> end at:", end_date);
}
