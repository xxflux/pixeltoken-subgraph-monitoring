const { ethers } = require("hardhat");
const { BigNumber } = require('ethers');

exports.etherUnit = async function (amount) {
  const weiString = await ethers.utils.parseEther(amount.toString());
  return BigNumber.from(weiString);
};

exports.usdcUnit = async function (amount) {
  const weiString = BigNumber.from("1000000").mul(amount);
  return BigNumber.from(weiString);
};
