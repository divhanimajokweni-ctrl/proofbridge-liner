// SPDX-License-Identifier: MIT
// ============================================================================
// VVUSovereignRegistry — Sovereign-grade clearance registry (fail-closed)
// ============================================================================
// Roles:
//   - federalAuditor       — automated Watchdog node that anchors telemetry
//   - sovereignAuthority   — federal multi-sig that issues clearance SBTs
//
// Fail-closed guarantees (Theorem 5 — contract layer):
//   1. issueSovereignSBT refuses to mint if no telemetry has been anchored
//      for the operative (executionTraceHash must be non-zero).
//   2. issueSovereignSBT refuses to mint if the operative already has an
//      active clearance (prevents double-minting).
//   3. anchorSovereignTelemetry with passed=false on an operative that
//      currently holds an active clearance immediately revokes it
//      (active=false) and emits ClearanceRevoked — the sovereign track
//      can never lie about an operative's status.
//   4. Dormant-deploy pattern: contract ships in `paused = true` state.
//      No state-changing function (anchor / issue) accepts writes until
//      the sovereign authority calls activate(gitCommitHash). This lets
//      the contract be deployed to multiple testnets in advance (dormant)
//      and only "go live" once the AMD MI300x GPU pipeline has verified
//      the latest git sync and posted the activation transaction.
//
// The constructor sets msg.sender as federalAuditor so the deployer (the
// automated Watchdog node) is the only address that can anchor telemetry.
// The sovereignAuthority is set at construction time and is the only
// address that can mint clearances and activate the contract.
// ============================================================================
pragma solidity 0.8.20;

contract VVUSovereignRegistry {
    // ── Roles ──────────────────────────────────────────────────────────────
    address public federalAuditor;
    address public sovereignAuthority;

    // ── Types ─────────────────────────────────────────────────────────────
    struct NationalSecurityClearance {
        bytes32 clearanceLevel;
        bytes32 executionTraceHash;
        uint256 authorizationTime;
        bool active;
    }

    // ── State ─────────────────────────────────────────────────────────────
    mapping(address => NationalSecurityClearance) public clearanceRegistry;

    // Dormant-deploy pattern: contract ships paused. The AMD MI300x GPU
    // pipeline calls activate(gitCommitHash) after a verified git sync,
    // at which point anchor + issue become callable. Paused state does
    // NOT block reads — observers can still query clearanceRegistry.
    bool public paused = true;
    bytes32 public activationCommitHash;

    // ── Events ────────────────────────────────────────────────────────────
    event TelemetryAudited(address indexed operative, bytes32 indexed traceHash, bool passed);
    event ClearanceMinted(address indexed operative, bytes32 indexed clearanceLevel);
    event ClearanceRevoked(address indexed operative);
    event ContractActivated(bytes32 indexed gitCommitHash, uint256 timestamp);
    event ContractDeactivated(uint256 timestamp);

    // ── Modifiers ─────────────────────────────────────────────────────────
    modifier onlyAuditor() {
        require(
            msg.sender == federalAuditor,
            "Auth: Caller is not the automated monitoring node"
        );
        _;
    }

    modifier onlySovereign() {
        require(
            msg.sender == sovereignAuthority,
            "Auth: Caller is not the Executive Sovereign authority"
        );
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Grid: Contract is dormant -- awaiting AMD pipeline activation");
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────
    /// @param _sovereignAuthority The federal multi-sig that mints clearances.
    /// msg.sender becomes the federalAuditor (the automated Watchdog node).
    /// Contract ships PAUSED — the sovereign authority must call
    /// activate(gitCommitHash) once the AMD GPU pipeline has verified
    /// the latest git sync.
    constructor(address _sovereignAuthority) {
        require(_sovereignAuthority != address(0), "Grid: Sovereign authority cannot be zero-address");
        federalAuditor = msg.sender;
        sovereignAuthority = _sovereignAuthority;
        paused = true;
    }

    // ── Anchor telemetry (auditor only) ───────────────────────────────────
    /// @param _operative   The operative whose telemetry is being audited.
    /// @param _traceHash   Hash of the execution trace being anchored.
    /// @param _passed      Whether the telemetry audit passed.
    /// If _passed is false and the operative currently holds an active
    /// clearance, the clearance is revoked (active=false) and a
    /// ClearanceRevoked event is emitted. Telemetry is always recorded
    /// (the chain remembers; we calibrate).
    function anchorSovereignTelemetry(
        address _operative,
        bytes32 _traceHash,
        bool _passed
    ) external onlyAuditor whenNotPaused {
        require(_operative != address(0), "Grid: Operative cannot be zero-address");
        require(_traceHash != bytes32(0), "Grid: Trace hash cannot be zero");

        NationalSecurityClearance storage c = clearanceRegistry[_operative];
        c.executionTraceHash = _traceHash;

        // Fail-closed: a failed audit immediately revokes any active clearance.
        if (!_passed && c.active) {
            c.active = false;
            emit ClearanceRevoked(_operative);
        }

        emit TelemetryAudited(_operative, _traceHash, _passed);
    }

    // ── Issue clearance SBT (sovereign only) ──────────────────────────────
    /// @param _operative        The operative receiving the clearance.
    /// @param _clearanceLevel  bytes32 encoding of the clearance level
    ///                         (e.g. keccak256("TS/SCI")).
    /// @param _traceHash        Hash of the execution trace that anchored
    ///                         the telemetry audit for this operative.
    /// Fail-closed guarantees:
    ///   - Refuses to mint if no telemetry was anchored for this operative.
    ///   - Refuses to mint if the operative already has an active clearance.
    function issueSovereignSBT(
        address _operative,
        bytes32 _clearanceLevel,
        bytes32 _traceHash
    ) external onlySovereign whenNotPaused {
        require(_operative != address(0), "Grid: Operative cannot be zero-address");
        require(_clearanceLevel != bytes32(0), "Grid: Clearance level cannot be zero");
        require(_traceHash != bytes32(0), "Grid: Trace hash cannot be zero");

        // Fail-closed: must have anchored telemetry before minting.
        require(
            clearanceRegistry[_operative].executionTraceHash != bytes32(0),
            "Grid: No telemetry anchored for this operative"
        );
        // Fail-closed: no double-minting.
        require(
            clearanceRegistry[_operative].active == false,
            "Grid: Operative clearance node already initialized"
        );

        clearanceRegistry[_operative] = NationalSecurityClearance({
            clearanceLevel: _clearanceLevel,
            executionTraceHash: _traceHash,
            authorizationTime: block.timestamp,
            active: true
        });

        emit ClearanceMinted(_operative, _clearanceLevel);
    }

    // ── Dormant-deploy activation (sovereign only) ────────────────────────
    /// @param _gitCommitHash The SHA-256 of the git commit that the AMD
    ///                       MI300x pipeline verified before posting this
    ///                       activation transaction. Recorded on-chain so
    ///                       observers can verify which sync went live.
    /// This is the single "go live" button. The contract flips from
    /// dormant (paused=true) to live (paused=false) and emits
    /// ContractActivated. The sovereign authority (federal multi-sig)
    /// is the only caller — the AMD pipeline authenticates as the
    /// sovereign via its key custody arrangement.
    function activate(bytes32 _gitCommitHash) external onlySovereign {
        require(_gitCommitHash != bytes32(0), "Grid: Activation commit hash cannot be zero");
        require(paused, "Grid: Contract is already live");
        paused = false;
        activationCommitHash = _gitCommitHash;
        emit ContractActivated(_gitCommitHash, block.timestamp);
    }

    /// @notice Emergency deactivate — sovereign can re-pause the contract
    ///         if the pipeline regresses or an audit fails. Telemetry
    ///         already on-chain is preserved (the chain remembers).
    function deactivate() external onlySovereign {
        require(!paused, "Grid: Contract is already dormant");
        paused = true;
        emit ContractDeactivated(block.timestamp);
    }
}
