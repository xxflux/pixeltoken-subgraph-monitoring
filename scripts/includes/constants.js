const { ethers } = require('ethers');
const DEC_18 = ethers.utils.parseEther('1');
const ETHSCAN_API = {
  MAINNET: 'QCKWJVPJZV2K1Y6W4XN2TT7F4UYYGB4A69',
  ARBI: 'PUNJ4YWZCEEPG6UEEUFSGJXM1FKIZEBNHR',
  POLY: '9N3TU1TTYNA2Y72SAPNJ1K6PH3QAGF1TZ4',
  OPTI: 'KHGTKJY1X27FR68IW2UCR41YTTKMAGFX39',
  GOERLI: 'QCKWJVPJZV2K1Y6W4XN2TT7F4UYYGB4A69'
}
const GRAPHQL_ENDPOIN = "https://api.thegraph.com/subgraphs/name/pixeltoken/t-mainnet"; // main net
const GRAPHQL_ENDPOIN_ARBI = "https://api.thegraph.com/subgraphs/name/pixeltoken/t-arbitrum";
const GRAPHQL_ENDPOIN_POLY = "https://api.thegraph.com/subgraphs/name/pixeltoken/t-polygon";
const GRAPHQL_ENDPOIN_OPTI = "https://api.thegraph.com/subgraphs/name/pixeltoken/t-optimism";
const GRAPHQL_ENDPOIN_GOERLI = "https://api.thegraph.com/subgraphs/name/pixeltoken/t-goerli";
const GRAPHQL_ORI_ENDPOIN = "https://api.thegraph.com/subgraphs/name/pixeltoken/o-mainnet"; // main net
const GRAPHQL_ORI_ENDPOIN_ARBI = "https://api.thegraph.com/subgraphs/name/pixeltoken/o-arbitrum";
const GRAPHQL_ORI_ENDPOIN_POLY = "https://api.thegraph.com/subgraphs/name/pixeltoken/o-polygon";
const GRAPHQL_ORI_ENDPOIN_OPTI = "https://api.thegraph.com/subgraphs/name/pixeltoken/o-optimism";
const GRAPHQL_ORI_ENDPOIN_GOERLI = "https://api.thegraph.com/subgraphs/name/pixeltoken/o-goerli";

module.exports = {
  DEC_18,
  GRAPHQL_ENDPOIN,
  GRAPHQL_ENDPOIN_ARBI,
  GRAPHQL_ENDPOIN_POLY,
  GRAPHQL_ENDPOIN_OPTI,
  GRAPHQL_ENDPOIN_GOERLI,
  ETHSCAN_API,
  GRAPHQL_ORI_ENDPOIN,
  GRAPHQL_ORI_ENDPOIN_ARBI,
  GRAPHQL_ORI_ENDPOIN_POLY,
  GRAPHQL_ORI_ENDPOIN_OPTI,
  GRAPHQL_ORI_ENDPOIN_GOERLI
}
