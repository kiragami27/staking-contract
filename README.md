# Staking Contract — Solidity + Hardhat

A production-ready ERC-20 staking contract with time-based reward accrual, deposit/withdraw, and reward claiming.

## Features

- Stake any ERC-20 token, earn any ERC-20 as reward
- Rewards accrue per second proportional to staked amount
- Deposit, withdraw, and claim independently
- Reentrancy-protected with OpenZeppelin ReentrancyGuard
- Owner-configurable reward rate
- Fully tested (6 tests)
- Verified on Etherscan

## Deployed Contract (Sepolia Testnet)

[0x3d9A97b00572f0e48346B4859b508606E53c5961](https://sepolia.etherscan.io/address/0x3d9A97b00572f0e48346B4859b508606E53c5961#code)

## Stack

- Solidity 0.8.24
- Hardhat 2
- OpenZeppelin Contracts v5
- Ethers.js

## Setup

```bash
npm install
cp .env.example .env
# Fill in SEPOLIA_RPC_URL, PRIVATE_KEY, ETHERSCAN_API_KEY, STAKING_TOKEN, REWARD_TOKEN
```

## Test

```bash
npx hardhat test
```

## Deploy

```bash
npx hardhat run scripts/deploy.js --network sepolia
```
