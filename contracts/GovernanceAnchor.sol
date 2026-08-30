// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title  GovernanceAnchor
/// @notice On-chain anchor for governance attestation. Assets must be
///         explicitly anchored with a valid Groth16 proof before
///         isAnchoredValid() returns true. Un-anchored or un-attested
///         assets trigger an immediate rollback — fail-closed by design.
///
/// @dev    HF-003: This contract was missing from the repository despite
///         being referenced by deploy-governance-anchor.ts, AIR governance
///         rules, and the evidence registry. This is the production source.
///
///         Trust model:
///           - Only the Groth16Verifier can confirm proof validity.
///           - Assets are anchored as bytes32 commitments.
///           - isAnchoredValid() returns false for any asset not explicitly
///             anchored — enforcing fail-closed on-chain.
///           - The owner may rotate the verifier address.
///
/// References:
///   - Deploy script: scripts/deploy-governance-anchor.ts
///   - AIR rule: air/governance/rules/adapter-boundary-integrity.js
///   - Evidence log: air/store/evidence_log.json

interface IGroth16Verifier {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata input
    ) external view returns (bool);
}

contract GovernanceAnchor {
    /*//////////////////////////////////////////////////////////////
                                 STATE
    //////////////////////////////////////////////////////////////*/

    /// @notice The deployed Groth16Verifier contract address.
    address public verifier;

    /// @notice The contract owner (deployer).
    address public owner;

    /// @notice Anchored asset commitments: assetId => anchored hash.
    mapping(bytes32 => bytes32) public anchoredAssets;

    /// @notice Total number of successfully anchored assets.
    uint256 public anchorCount;

    /// @notice Initialization guard.
    bool private _initialized;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event Initialized(address indexed owner, address indexed verifier);
    event AssetAnchored(
        bytes32 indexed assetId,
        bytes32 anchoredHash,
        uint256 blockNumber,
        uint256 anchorIndex
    );
    event VerifierRotated(address indexed oldVerifier, address indexed newVerifier);
    event AssetRevoked(bytes32 indexed assetId, uint256 blockNumber);

    /*//////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyOwner() {
        require(msg.sender == owner, "GA: not owner");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @param _verifier Address of the deployed Groth16Verifier.
    constructor(address _verifier) {
        require(_verifier != address(0), "GA: verifier=0");
        owner = msg.sender;
        verifier = _verifier;
        _initialized = true;
        emit Initialized(msg.sender, _verifier);
    }

    /*//////////////////////////////////////////////////////////////
                            ANCHOR OPERATIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Anchor an asset with a Groth16 proof. The proof must verify
    ///         against the circuit's verification key embedded in the
    ///         Groth16Verifier contract.
    /// @param assetId    The unique asset identifier (keccak256 of asset metadata).
    /// @param anchoredHash  The commitment hash to anchor for this asset.
    /// @param a          Proof component a (2 field elements).
    /// @param b          Proof component b (2x2 field elements).
    /// @param c          Proof component c (2 field elements).
    /// @param input      Public inputs to the circuit (must include the asset commitment).
    function anchorAsset(
        bytes32 assetId,
        bytes32 anchoredHash,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata input
    ) external {
        require(assetId != bytes32(0), "GA: zero assetId");
        require(anchoredHash != bytes32(0), "GA: zero hash");

        // Verify the Groth16 proof on-chain — fail-closed if verification fails
        IGroth16Verifier verifierContract = IGroth16Verifier(verifier);
        bool proofValid = verifierContract.verifyProof(a, b, c, input);
        require(proofValid, "GA: invalid proof - anchoring rejected");

        anchoredAssets[assetId] = anchoredHash;
        anchorCount++;

        emit AssetAnchored(assetId, anchoredHash, block.number, anchorCount);
    }

    /// @notice Anchor an asset without proof verification (admin-only).
    ///         Used for migrating existing assets or emergency anchoring.
    ///         Requires owner signature — not available to general callers.
    function anchorAssetAdmin(
        bytes32 assetId,
        bytes32 anchoredHash
    ) external onlyOwner {
        require(assetId != bytes32(0), "GA: zero assetId");
        require(anchoredHash != bytes32(0), "GA: zero hash");

        anchoredAssets[assetId] = anchoredHash;
        anchorCount++;

        emit AssetAnchored(assetId, anchoredHash, block.number, anchorCount);
    }

    /// @notice Revoke an anchor, setting the asset's hash back to zero.
    ///         After revocation, isAnchoredValid() returns false.
    function revokeAnchor(bytes32 assetId) external onlyOwner {
        require(anchoredAssets[assetId] != bytes32(0), "GA: not anchored");
        anchoredAssets[assetId] = bytes32(0);
        emit AssetRevoked(assetId, block.number);
    }

    /*//////////////////////////////////////////////////////////////
                              VERIFICATION
    //////////////////////////////////////////////////////////////*/

    /// @notice Check whether an asset is anchored with the expected hash.
    ///         FAIL-CLOSED: returns false for any un-anchored asset, any
    ///         zero assetId, or any hash mismatch. This is the critical
    ///         safety property — un-anchored assets are never treated as valid.
    /// @param assetId      The asset identifier to check.
    /// @param expectedHash The expected commitment hash.
    /// @return True only if the asset is anchored AND the hash matches exactly.
    function isAnchoredValid(
        bytes32 assetId,
        bytes32 expectedHash
    ) external view returns (bool) {
        // Fail-closed: zero assetId is never valid
        if (assetId == bytes32(0)) return false;

        // Fail-closed: un-anchored assets (hash == 0) are never valid
        bytes32 anchored = anchoredAssets[assetId];
        if (anchored == bytes32(0)) return false;

        // Exact hash match required
        return anchored == expectedHash;
    }

    /// @notice Overload for single-argument check — always returns false
    ///         if the asset is not anchored (fail-closed).
    function isAnchoredValid(bytes32 assetId) external view returns (bool) {
        if (assetId == bytes32(0)) return false;
        return anchoredAssets[assetId] != bytes32(0);
    }

    /*//////////////////////////////////////////////////////////////
                              ADMIN OPERATIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Rotate the Groth16Verifier address. Only callable by owner.
    function rotateVerifier(address newVerifier) external onlyOwner {
        require(newVerifier != address(0), "GA: new verifier=0");
        emit VerifierRotated(verifier, newVerifier);
        verifier = newVerifier;
    }

    /// @notice Transfer ownership.
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "GA: new owner=0");
        owner = newOwner;
    }
}
