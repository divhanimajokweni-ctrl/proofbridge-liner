// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IProofHook} from "./IProofHook.sol";

/// @title  CircuitBreaker
/// @notice Ghost-Risk Circuit-Breaker for tokenised real-world assets.
/// @dev    MVP trust model:
///           - A single `oracle` address may push deed hashes and trip the circuit.
///           - The contract `owner` may reset the circuit after a trip.
///         Future versions will replace `onlyOracle` with EIP-712 quorum
///         signature verification (3-of-5 ECDSA).
///
///         DEPRECATED (audit 2026-09-01): two coexisting implementations
///         of the same safety primitive (this + CircuitBreakerV2) is a
///         governance-violation surface — if V1 is still callable and
///         V2 is canonical, an attacker or confused integrator can
///         trip/reset through whichever has weaker guards. Self-destruct
///         is deprecated post-Cancun, so V1 is hard-deprecated via the
///         `onlyMigrated` revert-all pattern: once `migrated == true`,
///         every state-changing function reverts. `validate()` (the read
///         path) is intentionally left callable so existing token
///         integrations fail closed instead of failing loud. New
///         deployments MUST use CircuitBreakerV2.
contract CircuitBreaker is IProofHook {
    /*//////////////////////////////////////////////////////////////
                                 STATE
    //////////////////////////////////////////////////////////////*/

    /// @notice The address that may reset the circuit.
    address public owner;

    /// @notice The address that may push proofs and trip the circuit.
    address public oracle;

    /// @notice Global circuit state. `true` = open (transfers allowed).
    bool public circuitOpen;

    /// @notice Latest committed deed-hash per asset id.
    mapping(bytes32 => bytes32) public latestProof;

    /// @notice Initialisation guard.
    bool private _initialized;

    /// @notice DEPRECATED: once flipped to true by owner, all state-changing
    ///         functions revert. Signals that V2 is canonical.
    bool public migrated;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event Initialized(address indexed owner, address indexed oracle);
    event ProofUpdated(bytes32 indexed assetId, bytes32 deedHash, uint256 timestamp);
    event CircuitTripped(address indexed by, string reason, uint256 timestamp);
    event CircuitReset(address indexed by, uint256 timestamp);
    event MigrationLocked(address indexed by, uint256 timestamp);

    /*//////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyOwner() {
        require(msg.sender == owner, "CB: not owner");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "CB: not oracle");
        _;
    }

    /// @dev DEPRECATED: reverts on every state-changing function once the
    ///      owner has flipped `migrated = true`. Read paths (validate,
    ///      latestProof, circuitOpen) remain callable so token integrations
    ///      fail closed instead of reverting on every transfer.
    modifier onlyMigrated() {
        require(!migrated, "CB: deprecated, use CircuitBreakerV2");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              INITIALISATION
    //////////////////////////////////////////////////////////////*/

    /// @notice One-shot initialiser. The deployer becomes `owner`.
    /// @param _oracle The single trusted oracle address for the MVP.
    function initialize(address _oracle) external onlyMigrated {
        require(!_initialized, "CB: already initialized");
        require(_oracle != address(0), "CB: oracle=0");
        _initialized = true;
        owner = msg.sender;
        oracle = _oracle;
        circuitOpen = true;
        emit Initialized(msg.sender, _oracle);
    }

    /*//////////////////////////////////////////////////////////////
                              ORACLE WRITES
    //////////////////////////////////////////////////////////////*/

    /// @notice Commit a fresh deed-hash for `assetId`.
    /// @dev    The MVP does not verify a quorum signature; this is the
    ///         documented trust assumption.
    function updateProof(bytes32 assetId, bytes32 deedHash) external onlyOracle onlyMigrated {
        latestProof[assetId] = deedHash;
        emit ProofUpdated(assetId, deedHash, block.timestamp);
    }

    /// @notice Trip the global circuit, halting all gated transfers.
    function tripCircuit(string calldata reason) external onlyOracle onlyMigrated {
        circuitOpen = false;
        emit CircuitTripped(msg.sender, reason, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                                OWNER WRITES
    //////////////////////////////////////////////////////////////*/

    /// @notice Re-open the circuit after a trip. Owner-gated.
    function reset() external onlyOwner onlyMigrated {
        circuitOpen = true;
        emit CircuitReset(msg.sender, block.timestamp);
    }

    /// @notice DEPRECATED: lock this V1 so all state-changing functions revert.
    ///         Intended to be called once CircuitBreakerV2 is deployed and
    ///         token integrations have been migrated. Read paths remain
    ///         callable so existing integrations fail closed.
    function migrateToV2() external onlyOwner {
        require(!migrated, "CB: already migrated");
        migrated = true;
        circuitOpen = false; // fail closed for any straggler integrations
        emit MigrationLocked(msg.sender, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                                  READS
    //////////////////////////////////////////////////////////////*/

    /// @inheritdoc IProofHook
    function validate(bytes32 assetId, bytes32 expectedHash) external view returns (bool) {
        require(circuitOpen, "CB: circuit tripped");
        return latestProof[assetId] == expectedHash;
    }
}
