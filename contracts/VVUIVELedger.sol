// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * VVUIVELedger — on-chain anchor for the VVU IVE fail-closed valve.
 *
 * The dashboard's theorem-state store reads from the off-chain
 * Authorization + CircuitBreaker tables. This contract anchors the
 * *current verdict* on-chain so external systems (ProofBridge,
 * accreditation partners, downstream consumers) can verify the
 * valve's state without trusting the operator UI.
 *
 * Storage layout:
 *   studiVerdict:  UNKNOWN=0, INCONCLUSIVE=1, PROVEN=2
 *   iveVerdict:    same encoding
 *   breaker:       NORMAL=0, TRIPPED=1
 *   confidence:    basis-points 0..10000 (e.g. 5000 == 50%)
 *   lastUpdatedAt: unix-seconds
 *
 * Only the OPERATOR role may post a verdict — and the operator may
 * never set iveVerdict=PROVEN while breaker=TRIPPED (the fail-closed
 * bound enforced at the contract layer as well).
 */
interface IAccessControl {
    function hasRole(bytes32 role, address account) external view returns (bool);
    function grantRole(bytes32 role, address account) external;
}

contract VVUIVELedger {
    // ─── Roles ─────────────────────────────────────────────────────
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ─── Verdict encoding ─────────────────────────────────────────
    uint8 public constant UNKNOWN = 0;
    uint8 public constant INCONCLUSIVE = 1;
    uint8 public constant PROVEN = 2;

    uint8 public constant BREAKER_NORMAL = 0;
    uint8 public constant BREAKER_TRIPPED = 1;

    // ─── State ────────────────────────────────────────────────────
    uint8 public studiVerdict;
    uint8 public iveVerdict;
    uint8 public breaker;
    uint16 public confidence;        // basis points 0..10000
    uint256 public lastUpdatedAt;
    address public admin;

    // ─── Events ───────────────────────────────────────────────────
    event VerdictPosted(
        uint8 indexed studiVerdict,
        uint8 indexed iveVerdict,
        uint8 indexed breaker,
        uint16 confidence,
        uint256 timestamp
    );
    event RoleGranted(bytes32 indexed role, address indexed account);

    // ─── Modifiers ────────────────────────────────────────────────
    modifier onlyOperator() {
        require(
            msg.sender == admin || hasRole(OPERATOR_ROLE, msg.sender),
            "VVUIVELedger: not operator"
        );
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "VVUIVELedger: not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
        studiVerdict = UNKNOWN;
        iveVerdict = UNKNOWN;
        breaker = BREAKER_NORMAL;
        confidence = 0;
        lastUpdatedAt = block.timestamp;
    }

    // ─── External ─────────────────────────────────────────────────
    /**
     * Post the current verdict. Called by the watchdog agent after
     * every successful /api/theorem-state poll.
     *
     * Enforces the fail-closed bound: if breaker is TRIPPED, the
     * contract refuses to record iveVerdict=PROVEN — even if the
     * caller tries. This is the contract-level mirror of EIS
     * Theorem 5.
     */
    function postVerdict(
        uint8 _studiVerdict,
        uint8 _iveVerdict,
        uint8 _breaker,
        uint16 _confidence
    ) external onlyOperator {
        require(_studiVerdict <= PROVEN, "studiVerdict out of range");
        require(_iveVerdict <= PROVEN, "iveVerdict out of range");
        require(_breaker <= BREAKER_TRIPPED, "breaker out of range");
        require(_confidence <= 10000, "confidence out of range");

        // ── Fail-closed bound (Theorem 5) ───────────────────────
        // Breaker TRIPPED ⇒ IVE cannot be PROVEN. Force to INCONCLUSIVE.
        uint8 safeIveVerdict = _iveVerdict;
        if (_breaker == BREAKER_TRIPPED && _iveVerdict == PROVEN) {
            safeIveVerdict = INCONCLUSIVE;
        }

        studiVerdict = _studiVerdict;
        iveVerdict = safeIveVerdict;
        breaker = _breaker;
        confidence = _confidence;
        lastUpdatedAt = block.timestamp;

        emit VerdictPosted(
            _studiVerdict,
            safeIveVerdict,
            _breaker,
            _confidence,
            block.timestamp
        );
    }

    /**
     * Convenience accessor — returns the full verdict tuple in one
     * call. Used by external consumers (ProofBridge, accreditation
     * partners) to verify the valve's state without trusting the
     * operator UI.
     */
    function getVerdict()
        external
        view
        returns (
            uint8 _studiVerdict,
            uint8 _iveVerdict,
            uint8 _breaker,
            uint16 _confidence,
            uint256 _lastUpdatedAt
        )
    {
        return (studiVerdict, iveVerdict, breaker, confidence, lastUpdatedAt);
    }

    // ─── Role management ──────────────────────────────────────────
    function grantOperator(address account) external onlyAdmin {
        _grantRole(OPERATOR_ROLE, account);
    }

    function renounceAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "zero admin");
        admin = newAdmin;
    }

    // ─── Internal ─────────────────────────────────────────────────
    mapping(bytes32 => mapping(address => bool)) private _roles;

    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _roles[role][account] || account == admin;
    }

    function _grantRole(bytes32 role, address account) internal {
        _roles[role][account] = true;
        emit RoleGranted(role, account);
    }
}
