// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StakingContract is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    uint256 public rewardRatePerSecond;
    uint256 public totalStaked;

    struct Stake {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lastUpdated;
    }

    mapping(address => Stake) public stakes;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);

    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRatePerSecond,
        address initialOwner
    ) Ownable(initialOwner) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRatePerSecond = _rewardRatePerSecond;
    }

    function pendingReward(address user) public view returns (uint256) {
        Stake memory s = stakes[user];
        if (s.amount == 0) return 0;
        uint256 elapsed = block.timestamp - s.lastUpdated;
        return s.rewardDebt + (elapsed * rewardRatePerSecond * s.amount) / 1e18;
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        Stake storage s = stakes[msg.sender];

        if (s.amount > 0) {
            s.rewardDebt = pendingReward(msg.sender);
        }

        s.amount += amount;
        s.lastUpdated = block.timestamp;
        totalStaked += amount;

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        Stake storage s = stakes[msg.sender];
        require(amount > 0, "Amount must be > 0");
        require(s.amount >= amount, "Insufficient stake");

        s.rewardDebt = pendingReward(msg.sender);
        s.amount -= amount;
        s.lastUpdated = block.timestamp;
        totalStaked -= amount;

        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() external nonReentrant {
        Stake storage s = stakes[msg.sender];
        uint256 reward = pendingReward(msg.sender);
        require(reward > 0, "No reward to claim");

        s.rewardDebt = 0;
        s.lastUpdated = block.timestamp;

        rewardToken.safeTransfer(msg.sender, reward);
        emit RewardClaimed(msg.sender, reward);
    }

    function setRewardRate(uint256 newRate) external onlyOwner {
        rewardRatePerSecond = newRate;
        emit RewardRateUpdated(newRate);
    }

    function fundRewards(uint256 amount) external onlyOwner {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
    }
}
