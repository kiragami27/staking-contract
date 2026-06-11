const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const stakingToken = process.env.STAKING_TOKEN;
  const rewardToken = process.env.REWARD_TOKEN;
  const rewardRate = process.env.REWARD_RATE || "1000000000000";

  if (!stakingToken || !rewardToken) {
    throw new Error("Set STAKING_TOKEN and REWARD_TOKEN in .env");
  }

  const Staking = await hre.ethers.getContractFactory("StakingContract");
  const staking = await Staking.deploy(stakingToken, rewardToken, rewardRate, deployer.address);
  await staking.waitForDeployment();

  const address = await staking.getAddress();
  console.log(`StakingContract deployed to: ${address}`);
  console.log(`Staking token: ${stakingToken}`);
  console.log(`Reward token: ${rewardToken}`);
  console.log(`Reward rate: ${rewardRate} per second per staked token (scaled 1e18)`);
  console.log(`\nVerify with:\nnpx hardhat verify --network sepolia ${address} "${stakingToken}" "${rewardToken}" "${rewardRate}" "${deployer.address}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
