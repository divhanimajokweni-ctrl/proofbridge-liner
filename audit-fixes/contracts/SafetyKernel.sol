// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BayesianScorer.sol";
import "./TEEVerifier.sol";

/// @title  SafetyKernel
/// @notice The sole enforcement point for the constitutional invariant:
///         (vote=PASS, proof=FAIL, authorization=EXECUTE) is unreachable.
/// @dev    PATCHED (audit 2026-09-01): previously `check()` accepted a
///         caller-supplied `posteriorScaled` and never called the bound
///         `scorer` — anyone could call `check(MAX_UINT, 0)` and keep
///         the kernel OPEN regardless of actual risk. The kernel now
///         computes the posterior internally from raw evidence
///         (successes/failures) via `scorer.computePosterior()`, and
///         `check()` is restricted to calls originating from the bound
///         `TEEVerifier` (enclave-signed evidence only).
contract SafetyKernel {
    enum State { OPEN, HALTED }
    enum Actor { UNAUTHORIZED, AUTHORIZED }

    State public state = State.OPEN;
    address public authorizedActor;

    /// @notice Constitutional floor: 80% posterior (8000 basis points).
    /// @dev    BayesianScorer.computePosterior() returns basis points
    ///         (0–10000), so 80% = 8000. The previous constant `FLOOR_80 = 80`
    ///         was ambiguous (author left an unresolved "80% in basis points?
    ///         Wait, 0.80 as 80/100" comment). Deleted in favour of this
    ///         clearly-named, clearly-unit'd constant.
    uint256 public constant FLOOR_80_BP = 8000; // 80.00% in basis points (0–10000 scale)

    BayesianScorer public immutable scorer;
    TEEVerifier public immutable teeVerifier;

    event StateChanged(State newState);
    event ResetInitiated(address actor);
    event PosteriorComputed(uint256 successes, uint256 failures, uint256 posterior, uint256 threshold);

    /// @param _authorizedActor Address allowed to reset a HALTED kernel.
    /// @param _scorer          The BayesianScorer that computes posteriors.
    /// @param _teeVerifier     The TEEVerifier that must be the caller of check().
    constructor(address _authorizedActor, address _scorer, address _teeVerifier) {
        require(_authorizedActor != address(0), "SK: actor=0");
        require(_scorer != address(0), "SK: scorer=0");
        require(_teeVerifier != address(0), "SK: tee=0");
        authorizedActor = _authorizedActor;
        scorer = BayesianScorer(_scorer);
        teeVerifier = TEEVerifier(_teeVerifier);
    }

    modifier onlyAuthorized() {
        require(msg.sender == authorizedActor, "Unauthorized");
        _;
    }

    /// @notice Enforce the constitutional invariant: if the Bayesian posterior
    ///         of evidence validity falls below `threshold`, HALT the kernel.
    /// @dev    PATCHED: previously accepted `posteriorScaled` as a caller-
    ///         supplied argument (anyone could lie). Now computes the
    ///         posterior internally via `scorer.computePosterior(successes,
    ///         failures)` from raw evidence, and is restricted to calls from
    ///         the bound `TEEVerifier` so only enclave-attested evidence
    ///         can influence kernel state.
    /// @param successes  Count of passing observations (enclave-attested).
    /// @param failures   Count of failing observations (enclave-attested).
    /// @param threshold  Trip threshold in basis points (e.g. 8000 for 80%).
    function check(uint256 successes, uint256 failures, uint256 threshold)
        external
    {
        require(msg.sender == address(teeVerifier), "SafetyKernel: unverified input");
        uint256 posterior = scorer.computePosterior(successes, failures);
        emit PosteriorComputed(successes, failures, posterior, threshold);
        if (posterior < threshold) {
            state = State.HALTED;
            emit StateChanged(State.HALTED);
        }
        // else remains OPEN
    }

    function reset() external onlyAuthorized {
        require(state == State.HALTED, "Not halted");
        state = State.OPEN;
        emit StateChanged(State.OPEN);
        emit ResetInitiated(msg.sender);
    }

    function assertOpen() external view {
        require(state == State.OPEN, "Kernel is halted");
    }
}
