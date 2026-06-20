// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract CircuitBreakerV2 is Initializable, OwnableUpgradeable {
    using ECDSA for bytes32;

    // --- Threshold multisig state ---
    bool public circuitOpen;
    mapping(bytes32 => bytes32) public latestProof;
    address[] public signerList;
    mapping(address => bool) public isSigner;
    uint256 public threshold;

    // --- EIP-712 single-verifier state ---
    bytes32 public constant ALIGNMENT_ASSERTION_TYPEHASH = keccak256(
        "AlignmentAssertion(uint256 featureId,uint32 criticalScore,uint256 timestamp)"
    );
    bytes32 private _domainSeparator;
    address public authorizedVerifier;
    uint256 public constant MIN_TRIP_INTERVAL = 1 hours;
    uint256 public lastTripTimestamp;
    bool private _paused;

    // --- Threshold multisig events ---
    event CircuitTripped(string reason);
    event CircuitReset();
    event ProofUpdated(bytes32 indexed assetId, bytes32 deedHash);
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event ThresholdUpdated(uint256 newThreshold);

    // --- EIP-712 / single-verifier events ---
    event AlignmentBreachTripped(
        uint256 indexed featureId,
        uint32 criticalScore,
        uint256 indexed timestamp,
        address indexed verifier
    );
    event VerifierRotated(address indexed oldVerifier, address indexed newVerifier);
    event EmergencyResumed(address indexed executor);

    modifier whenOpen() {
        require(circuitOpen, "CircuitBreaker: circuit tripped");
        _;
    }

    modifier whenNotPaused() {
        require(!_paused, "CircuitBreaker: paused");
        _;
    }

    function initialize(
        address[] memory _signers,
        uint256 _threshold,
        address _authorizedVerifier
    ) public initializer {
        __Ownable_init(msg.sender);
        require(_signers.length >= _threshold, "Not enough signers");
        require(_threshold > 0, "Threshold must be > 0");
        for (uint256 i = 0; i < _signers.length; i++) {
            require(_signers[i] != address(0), "Invalid signer");
            require(!isSigner[_signers[i]], "Duplicate signer");
            signerList.push(_signers[i]);
            isSigner[_signers[i]] = true;
            emit SignerAdded(_signers[i]);
        }
        threshold = _threshold;
        circuitOpen = true;
        _domainSeparator = _buildDomainSeparator();
        authorizedVerifier = _authorizedVerifier;
        lastTripTimestamp = block.timestamp - MIN_TRIP_INTERVAL;
        _paused = false;
    }

    function _buildDomainSeparator() private view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("ProofBridgeLiner")),
                keccak256(bytes("1.0.0")),
                block.chainid,
                address(this)
            )
        );
    }

    function hashTypedDataV4(bytes32 structHash) public view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", _domainSeparator, structHash));
    }

    function verifyThresholdSignature(
        bytes32 digest,
        bytes calldata sigs
    ) public view returns (bool) {
        uint256 numSigs = sigs.length / 65;
        require(numSigs >= threshold, "Not enough signatures provided");
        uint256 validCount;
        address lastSigner;

        for (uint256 i = 0; i < numSigs; i++) {
            bytes memory sig = sigs[i * 65:(i + 1) * 65];
            address recovered = digest.recover(sig);
            require(recovered > lastSigner, "Signers must be in ascending order");
            lastSigner = recovered;
            if (isSigner[recovered]) validCount++;
        }
        return validCount >= threshold;
    }

    function actionDigest(bytes32 assetId, bytes32 deedHash) public view returns (bytes32) {
        return keccak256(abi.encodePacked(assetId, deedHash, block.chainid, address(this)));
    }

    function updateProof(bytes32 assetId, bytes32 deedHash, bytes calldata thresholdSigs) external {
        bytes32 digest = actionDigest(assetId, deedHash);
        require(verifyThresholdSignature(digest, thresholdSigs), "Invalid threshold signature");
        latestProof[assetId] = deedHash;
        emit ProofUpdated(assetId, deedHash);
    }

    function tripCircuit(string calldata reason, bytes calldata thresholdSigs) external {
        bytes32 digest = keccak256(abi.encodePacked(reason, block.chainid, address(this)));
        require(verifyThresholdSignature(digest, thresholdSigs), "Invalid threshold signature");
        circuitOpen = false;
        emit CircuitTripped(reason);
    }

    function validate(bytes32 assetId, bytes32 expectedHash) external view whenOpen returns (bool) {
        return latestProof[assetId] == expectedHash;
    }

    function reset() external onlyOwner {
        circuitOpen = true;
        emit CircuitReset();
    }

    function addSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "Invalid signer");
        require(!isSigner[_signer], "Already a signer");
        signerList.push(_signer);
        isSigner[_signer] = true;
        emit SignerAdded(_signer);
    }

    function removeSigner(address _signer) external onlyOwner {
        require(isSigner[_signer], "Not a signer");
        require(signerList.length - 1 >= threshold, "Would fall below threshold");
        isSigner[_signer] = false;
        emit SignerRemoved(_signer);
    }

    function updateThreshold(uint256 _newThreshold) external onlyOwner {
        require(_newThreshold > 0, "Threshold must be > 0");
        require(_newThreshold <= signerList.length, "Threshold too high");
        threshold = _newThreshold;
        emit ThresholdUpdated(_newThreshold);
    }

    function assertAlignmentBreach(
        uint256 featureId,
        uint32 criticalScore,
        uint256 timestamp,
        bytes calldata signature
    ) external whenNotPaused {
        require(block.timestamp - lastTripTimestamp >= MIN_TRIP_INTERVAL, "CircuitBreaker: Cooldown active");
        require(timestamp <= block.timestamp, "Assertion from future");
        require(block.timestamp - timestamp < 15 minutes, "Stale assertion payload");

        bytes32 structHash = keccak256(
            abi.encode(
                ALIGNMENT_ASSERTION_TYPEHASH,
                featureId,
                criticalScore,
                timestamp
            )
        );

        bytes32 digest = hashTypedDataV4(structHash);
        address signer = digest.recover(signature);

        require(signer == authorizedVerifier, "Signature validation failed: Unauthorized source");

        lastTripTimestamp = block.timestamp;
        _paused = true;

        emit AlignmentBreachTripped(featureId, criticalScore, timestamp, signer);
    }

    function rotateVerifier(address _newVerifier) external onlyOwner {
        require(_newVerifier != address(0), "Invalid verifier address");
        emit VerifierRotated(authorizedVerifier, _newVerifier);
        authorizedVerifier = _newVerifier;
    }

    function emergencyResume() external onlyOwner {
        _paused = false;
        emit EmergencyResumed(msg.sender);
    }

    function isPaused() external view returns (bool) {
        return _paused;
    }
}
