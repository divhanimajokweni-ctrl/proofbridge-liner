// SPDX-License-Identifier: MIT
// VVU MASTER TEXTBOOK – ZERO CAPITAL EDITION
// VVUIVELedger.sol - Design Freeze Level 1 · Release 20260901 · v0.3
// Purpose: On-chain anchoring of physical + marketing claims. Hash is Proof.
// Alignment: WORM, POPIA, Five-Conjunct Theorem

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract VVUIVELedger is Ownable {
    
    struct Evidence {
        string fileHash;
        string source;
        uint256 timestamp;
        address submitter;
        uint256 blockNumber;
    }

    mapping(string => Evidence) public evidenceByHash;
    mapping(address => bool) public authorizedAgents;
    mapping(string => bool) public fiveConjunctPass;
    mapping(string => bool) public exists;

    event EvidenceRegistered(
        string indexed fileHash,
        string source,
        uint256 timestamp,
        address indexed submitter,
        bytes32 evidenceId
    );
    event AgentAuthorized(address indexed agent, address indexed by);
    event AgentRevoked(address indexed agent, address indexed by);
    event VerificationResult(string indexed fileHash, bool passed);

    modifier onlyAuthorized() {
        require(authorizedAgents[msg.sender] || msg.sender == owner(), "Not authorized agent");
        _;
    }

    constructor() Ownable(msg.sender) {
        authorizedAgents[msg.sender] = true;
    }

    function registerEvidence(
        string calldata _fileHash,
        string calldata _source,
        uint256 _timestamp
    ) external onlyAuthorized {
        require(bytes(_fileHash).length == 64, "Invalid SHA-256");
        require(!exists[_fileHash], "WORM violation - exists");

        evidenceByHash[_fileHash] = Evidence({
            fileHash: _fileHash,
            source: _source,
            timestamp: _timestamp,
            submitter: msg.sender,
            blockNumber: block.number
        });
        exists[_fileHash] = true;

        bytes32 evidenceId = keccak256(abi.encodePacked(_fileHash, _source, _timestamp, msg.sender));
        emit EvidenceRegistered(_fileHash, _source, _timestamp, msg.sender, evidenceId);
    }

    function setVerificationResult(string calldata _fileHash, bool _passed) external onlyAuthorized {
        require(exists[_fileHash], "Not found");
        fiveConjunctPass[_fileHash] = _passed;
        emit VerificationResult(_fileHash, _passed);
    }

    function authorizeAgent(address _agent) external onlyOwner {
        authorizedAgents[_agent] = true;
        emit AgentAuthorized(_agent, msg.sender);
    }

    function revokeAgent(address _agent) external onlyOwner {
        authorizedAgents[_agent] = false;
        emit AgentRevoked(_agent, msg.sender);
    }

    function verifyEvidence(string calldata _fileHash) external view returns (Evidence memory, bool, bool) {
        return (evidenceByHash[_fileHash], fiveConjunctPass[_fileHash], exists[_fileHash]);
    }
}
