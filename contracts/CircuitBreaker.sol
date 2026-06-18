// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CircuitBreaker {
    address public oracle;
    bool public paused;
    mapping(bytes32 => bool) private usedProofs;
    mapping(bytes32 => uint256) private proofTimestamps;

    event ProofUpdated(bytes32 indexed proofHash, string poolId, uint256 amount, uint256 timestamp);
    event OracleUpdated(address indexed oracle);
    event PauseUpdated(bool paused);

    modifier onlyOracle() {
        require(msg.sender == oracle, "only oracle");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "submissions paused");
        _;
    }

    constructor(address initialOracle) {
        require(initialOracle != address(0), "oracle required");
        oracle = initialOracle;
    }

    function updateProof(bytes32 proofHash, string memory poolId, uint256 amount) external onlyOracle whenNotPaused {
        require(!usedProofs[proofHash], "Proof already exists");
        usedProofs[proofHash] = true;
        proofTimestamps[proofHash] = block.timestamp;
        emit ProofUpdated(proofHash, poolId, amount, block.timestamp);
    }

    function isProofUsed(bytes32 proofHash) external view returns (bool) {
        return usedProofs[proofHash];
    }

    function proofTimestamp(bytes32 proofHash) external view returns (uint256) {
        return proofTimestamps[proofHash];
    }

    function pauseSubmissions() external onlyOracle {
        paused = true;
        emit PauseUpdated(true);
    }

    function unpauseSubmissions() external onlyOracle {
        paused = false;
        emit PauseUpdated(false);
    }

    function setOracle(address nextOracle) external onlyOracle {
        require(nextOracle != address(0), "oracle required");
        oracle = nextOracle;
        emit OracleUpdated(nextOracle);
    }
}
