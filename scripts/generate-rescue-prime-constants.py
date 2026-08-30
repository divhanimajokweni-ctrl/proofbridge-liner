#!/usr/bin/env python3
"""
Rescue-Prime Round Constant Generator
Algorithm 5 from "Rescue-Prime: a Standard Specification (SoK)"
by Szepieniec, Ashur, Dhooghe.

Parameters: BN254 scalar field, rate=2, capacity=1, state=3, 10 rounds
Output: 30 round constants (2 * state * rounds = 2 * 3 * 5 full rounds = 30)

The seed string format follows the specification exactly:
  "Rescue-XLIX(<p>,<m>,<capacity>,<security_level>)"
"""

import hashlib
import math

# BN254 scalar field modulus
P = 21888242871839275222246405745257275088548364400416034343698204186575808495617

# Rescue-Prime parameters
M = 3          # state width
CAPACITY = 1   # capacity elements
RATE = M - CAPACITY  # = 2
SECURITY_LEVEL = 128
ROUNDS = 10    # 5 full + 5 partial = 10 total
ALPHA = 7      # S-box exponent
ALPHA_INV = pow(ALPHA, -1, P - 1)  # 12507567355336728698426517568718442907741922514523448196398973820900461997495


def get_round_constants(p, m, capacity, security_level, num_rounds):
    """
    Algorithm 5: Generate round constants using SHAKE256.
    """
    bytes_per_int = math.ceil(len(bin(p)[2:]) / 8) + 1
    # num_rounds is the number of full rounds (R_F). Each full round has
    # a forward phase and an inverse phase, each with m constants.
    # Total constants = 2 * m * R_F.
    total_constants = 2 * m * num_rounds
    
    num_bytes = bytes_per_int * total_constants
    seed_string = f"Rescue-XLIX({p},{m},{capacity},{security_level})"
    
    # SHAKE256 (XOF)
    shake = hashlib.shake_256()
    shake.update(seed_string.encode('ascii'))
    byte_string = shake.digest(num_bytes)
    
    # Process byte string in chunks
    round_constants = []
    for i in range(total_constants):
        chunk = byte_string[bytes_per_int * i : bytes_per_int * (i + 1)]
        integer = sum(256 ** j * chunk[j] for j in range(len(chunk)))
        round_constants.append(integer % p)
    
    return round_constants


def main():
    print(f"Rescue-Prime Round Constant Generation")
    print(f"=======================================")
    print(f"Field: BN254 scalar (p = {P})")
    print(f"State width: {M} (rate={RATE}, capacity={CAPACITY})")
    print(f"Security level: {SECURITY_LEVEL} bits")
    print(f"Full rounds: {ROUNDS // 2}")
    print(f"Alpha: {ALPHA}")
    print(f"Alpha inverse: {ALPHA_INV}")
    print(f"")
    
    R_F = ROUNDS // 2  # 5 full rounds
    constants = get_round_constants(P, M, CAPACITY, SECURITY_LEVEL, R_F)
    
    print(f"Generated {len(constants)} round constants:")
    print(f"")
    
    # Format for Solidity
    print("// Solidity (contracts/RescuePrimeHash.sol)")
    print("// uint256[30] memory ROUND_CONSTANTS = [")
    for i, c in enumerate(constants):
        comma = "," if i < len(constants) - 1 else ""
        print(f"    {c}{comma}")
    print("];")
    
    print(f"")
    
    # Format for Circom (all30 constants)
    print("// Circom (circuits/threshold_rescue.circom)")
    for i, c in enumerate(constants):
        print(f"var RC{i} = {c};")
    
    print(f"")
    print(f"var RC[{len(constants)}] = [{','.join(f'RC{i}' for i in range(len(constants)))}];")
    
    # Verify: hash known test vector
    # The constants should be deterministic given the seed
    print(f"")
    print(f"Verification:")
    print(f"  Seed: Rescue-XLIX({P},{M},{CAPACITY},{SECURITY_LEVEL})")
    print(f"  First constant: {constants[0]}")
    print(f"  Last constant:  {constants[-1]}")
    
    # Also verify alpha inverse
    assert (ALPHA * ALPHA_INV) % (P - 1) == 1, "Alpha inverse verification failed!"
    print(f"  Alpha * Alpha_inv mod (p-1) = {(ALPHA * ALPHA_INV) % (P - 1)} (expected 1)")
    
    # Output JSON for machine consumption
    import json
    output = {
        "p": str(P),
        "m": M,
        "capacity": CAPACITY,
        "rate": RATE,
        "security_level": SECURITY_LEVEL,
        "alpha": ALPHA,
        "alpha_inv": str(ALPHA_INV),
        "full_rounds": ROUNDS // 2,
        "total_constants": len(constants),
        "seed": f"Rescue-XLIX({P},{M},{CAPACITY},{SECURITY_LEVEL})",
        "constants": [str(c) for c in constants],
    }
    
    with open("rescue-prime-constants.json", "w") as f:
        json.dump(output, f, indent=2)
    print(f"  Saved to rescue-prime-constants.json")


if __name__ == "__main__":
    main()
