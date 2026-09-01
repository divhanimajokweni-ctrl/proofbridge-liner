// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title  AssetRegistry
/// @notice Multi-asset registry — each asset owns an isolated safety kernel.
/// @dev    Compositional scaling layer of the proofBRIDGE-liner:
///           • A halt in Asset A does NOT halt Asset B.
///           • The `assertOpen(assetId)` hook is called by token contracts
///             during every `transfer()`.
///           • Posterior values are scaled ×1e18 (uint256 representation of
///             the rational probability produced by scorer.js).
///
///         AUDIT PATCH (2026-09-01): `check()` previously accepted a
///         caller-supplied `posterior` with no caller restriction — any
///         address could trip (DoS) any registered asset by passing a
///         high posterior. Fixed by adding the `onlyVerifier` modifier:
///         only the bound `verifier` (TEEVerifier or oracle) may call
///         `check()`. The verifier is set at construction and is
///         rotatable by owner via `rotateVerifier()`.
contract AssetRegistry {
    /*//////////////////////////////////////////////////////////////
                                 TYPES
    //////////////////////////////////////////////////////////////*/

    struct KernelState {
        bool     open;               // true = OPEN, false = HALTED
        uint256  posterior;          // last posterior that tripped (or 0)
        uint256  threshold;          // trip threshold (×1e18)
        address  authorizedResetter; // address allowed to reset alongside owner
        bool     registered;         // existence guard
    }

    /*//////////////////////////////////////////////////////////////
                                 STATE
    //////////////////////////////////////////////////////////////*/

    address public owner;

    /// @notice The verifier (TEEVerifier or oracle) permitted to call check().
    /// @dev    PATCHED: previously `check()` was external with no caller
    ///         restriction — any address could trip any asset by passing
    ///         a high posterior. Now restricted to `verifier`.
    address public verifier;

    /// @notice Per-asset safety kernel.
    mapping(bytes32 => KernelState) public kernels;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event OwnershipTransferred(address indexed previous, address indexed next);
    event AssetRegistered(bytes32 indexed assetId, uint256 threshold, address resetter);
    event KernelTripped(bytes32 indexed assetId, uint256 posterior, uint256 threshold);
    event KernelReset(bytes32 indexed assetId, address indexed by);
    event ThresholdUpdated(bytes32 indexed assetId, uint256 newThreshold);
    event VerifierRotated(address indexed previous, address indexed next);

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyOwner() {
        require(msg.sender == owner, "AR: not owner");
        _;
    }

    /// @dev PATCHED: `check()` is now restricted to the bound verifier.
    modifier onlyVerifier() {
        require(msg.sender == verifier, "AR: not verifier");
        _;
    }

    modifier assetExists(bytes32 assetId) {
        require(kernels[assetId].registered, "AR: unknown asset");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @param _verifier The TEEVerifier (or oracle) permitted to call check().
    constructor(address _verifier) {
        require(_verifier != address(0), "AR: verifier=0");
        owner = msg.sender;
        verifier = _verifier;
        emit OwnershipTransferred(address(0), msg.sender);
        emit VerifierRotated(address(0), _verifier);
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN: ASSETS
    //////////////////////////////////////////////////////////////*/

    /// @notice Register a new asset with its own isolated safety kernel.
    /// @param assetId   Arbitrary identifier (e.g. keccak256("RealT-Detroit-1")).
    /// @param threshold Trip posterior in ×1e18 units (e.g. 0.75e18 = 75%).
    /// @param resetter  Secondary address authorised to reset this asset's kernel.
    function registerAsset(bytes32 assetId, uint256 threshold, address resetter)
        external
        onlyOwner
    {
        require(!kernels[assetId].registered, "AR: already registered");
        require(threshold > 0 && threshold <= 1e18, "AR: bad threshold");
        kernels[assetId] = KernelState({
            open:               true,
            posterior:          0,
            threshold:          threshold,
            authorizedResetter: resetter,
            registered:         true
        });
        emit AssetRegistered(assetId, threshold, resetter);
    }

    /// @notice Update the trip threshold for an existing asset.
    function setThreshold(bytes32 assetId, uint256 newThreshold)
        external
        onlyOwner
        assetExists(assetId)
    {
        require(newThreshold > 0 && newThreshold <= 1e18, "AR: bad threshold");
        kernels[assetId].threshold = newThreshold;
        emit ThresholdUpdated(assetId, newThreshold);
    }

    /*//////////////////////////////////////////////////////////////
                           KERNEL: WRITE PATH
    //////////////////////////////////////////////////////////////*/

    /// @notice Called by the bound verifier (TEEVerifier or oracle) to advance
    ///         the kernel state.
    /// @dev    PATCHED: now gated by `onlyVerifier`. If the asset is OPEN and
    ///         posterior >= threshold, it trips to HALTED. If already HALTED,
    ///         the call is a no-op (absorbing state for UNAUTH).
    function check(bytes32 assetId, uint256 posterior)
        external
        onlyVerifier
        assetExists(assetId)
    {
        KernelState storage k = kernels[assetId];
        if (k.open && posterior >= k.threshold) {
            k.open      = false;
            k.posterior = posterior;
            emit KernelTripped(assetId, posterior, k.threshold);
        }
    }

    /// @notice Reset a tripped kernel.  Owner or the asset-level resetter only.
    function reset(bytes32 assetId)
        external
        assetExists(assetId)
    {
        KernelState storage k = kernels[assetId];
        require(
            msg.sender == owner || msg.sender == k.authorizedResetter,
            "AR: not authorized"
        );
        k.open      = true;
        k.posterior = 0;
        emit KernelReset(assetId, msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                           KERNEL: READ PATH
    //////////////////////////////////////////////////////////////*/

    /// @notice Hook called in every token transfer.  Reverts if HALTED.
    /// @dev    Example usage:
    ///           function transfer(address to, uint256 amount) external {
    ///               registry.assertOpen(keccak256("MyAsset"));
    ///               _performTransfer(msg.sender, to, amount);
    ///           }
    function assertOpen(bytes32 assetId)
        external
        view
        assetExists(assetId)
    {
        require(kernels[assetId].open, "AR: circuit tripped");
    }

    /// @notice Returns true iff the asset kernel is in the OPEN state.
    function isOpen(bytes32 assetId) external view returns (bool) {
        return kernels[assetId].open;
    }

    /*//////////////////////////////////////////////////////////////
                              OWNERSHIP
    //////////////////////////////////////////////////////////////*/

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "AR: owner=0");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Rotate the verifier address (e.g. on TEE key compromise).
    function rotateVerifier(address newVerifier) external onlyOwner {
        require(newVerifier != address(0), "AR: verifier=0");
        emit VerifierRotated(verifier, newVerifier);
        verifier = newVerifier;
    }
}
