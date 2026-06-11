const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("StakingContract", function () {
  let staking, stakingToken, rewardToken, owner, user1, user2;
  const RATE = ethers.parseUnits("1", 12); // 0.000001 token/sec per staked token
  const STAKE_AMOUNT = ethers.parseUnits("1000", 18);
  const FUND_AMOUNT = ethers.parseUnits("1000000", 18);

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MockERC20");
    stakingToken = await Token.deploy("StakeToken", "STK", owner.address);
    rewardToken = await Token.deploy("RewardToken", "RWD", owner.address);

    const Staking = await ethers.getContractFactory("StakingContract");
    staking = await Staking.deploy(
      await stakingToken.getAddress(),
      await rewardToken.getAddress(),
      RATE,
      owner.address
    );

    await stakingToken.mint(user1.address, STAKE_AMOUNT);
    await stakingToken.mint(user2.address, STAKE_AMOUNT);
    await rewardToken.mint(owner.address, FUND_AMOUNT);
    await rewardToken.approve(await staking.getAddress(), FUND_AMOUNT);
    await staking.fundRewards(FUND_AMOUNT);
  });

  it("accepts deposits and tracks totalStaked", async function () {
    await stakingToken.connect(user1).approve(await staking.getAddress(), STAKE_AMOUNT);
    await staking.connect(user1).deposit(STAKE_AMOUNT);
    expect(await staking.totalStaked()).to.equal(STAKE_AMOUNT);
    const s = await staking.stakes(user1.address);
    expect(s.amount).to.equal(STAKE_AMOUNT);
  });

  it("accrues rewards over time", async function () {
    await stakingToken.connect(user1).approve(await staking.getAddress(), STAKE_AMOUNT);
    await staking.connect(user1).deposit(STAKE_AMOUNT);
    await time.increase(3600);
    const pending = await staking.pendingReward(user1.address);
    expect(pending).to.be.gt(0);
  });

  it("allows withdrawal of staked tokens", async function () {
    await stakingToken.connect(user1).approve(await staking.getAddress(), STAKE_AMOUNT);
    await staking.connect(user1).deposit(STAKE_AMOUNT);
    await staking.connect(user1).withdraw(STAKE_AMOUNT);
    expect(await stakingToken.balanceOf(user1.address)).to.equal(STAKE_AMOUNT);
    expect(await staking.totalStaked()).to.equal(0);
  });

  it("allows claiming rewards", async function () {
    await stakingToken.connect(user1).approve(await staking.getAddress(), STAKE_AMOUNT);
    await staking.connect(user1).deposit(STAKE_AMOUNT);
    await time.increase(3600);
    await staking.connect(user1).claimReward();
    expect(await rewardToken.balanceOf(user1.address)).to.be.gt(0);
  });

  it("rejects zero deposit", async function () {
    await expect(staking.connect(user1).deposit(0)).to.be.revertedWith("Amount must be > 0");
  });

  it("rejects withdraw exceeding stake", async function () {
    await stakingToken.connect(user1).approve(await staking.getAddress(), STAKE_AMOUNT);
    await staking.connect(user1).deposit(STAKE_AMOUNT);
    await expect(
      staking.connect(user1).withdraw(STAKE_AMOUNT + 1n)
    ).to.be.revertedWith("Insufficient stake");
  });
});
