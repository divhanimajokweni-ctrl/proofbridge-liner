#!/usr/bin/env python3
"""
Monte Carlo Dual-Mode Bayesian Localization Simulation
Generates posterior probability matrix for sensor network localisation.

Usage:
    python3 monte_carlo_simulation.py --nodes 5 --sensors 2 --iterations 1000 --output artifacts/simulation_results.csv
"""

import argparse
import numpy as np
import pandas as pd
import sys
from pathlib import Path


def run_monte_carlo(
    nodes: int,
    sensors: int,
    iterations: int = 1000,
) -> pd.DataFrame:
    """Run dual-mode Bayesian localization simulation."""
    if nodes < 3:
        raise ValueError("nodes must be >= 3")
    if sensors < 1 or sensors >= nodes:
        raise ValueError("sensors must satisfy 1 <= sensors < nodes")

    node_names = [f"Node_{chr(65 + i)}" for i in range(nodes)]  # A, B, C...
    prior = np.full(nodes, 1.0 / nodes)

    # Simplified signature matrix for demonstration
    # For a real deployment, load from a configuration file or sensor calibration data.
    rng = np.random.default_rng(seed=42)
    signature_matrix = rng.uniform(0.1, 0.9, size=(nodes, sensors))
    signature_matrix = signature_matrix / signature_matrix.sum(axis=1, keepdims=True)

    post_accumulator = np.zeros((nodes, nodes))

    for true_idx in range(nodes):
        posterior_tracker = np.zeros((iterations, nodes))

        for i in range(iterations):
            bg_noise = rng.normal(0, 0.1, sensors)
            impulse_noise = rng.poisson(0.05, sensors) * 1.5

            true_signal = signature_matrix[true_idx]
            measurement = true_signal + bg_noise + impulse_noise

            # Gaussian component likelihood (closed-form comparison)
            likelihoods = []
            for node_idx in range(nodes):
                expected = signature_matrix[node_idx]
                diff = measurement - expected
                g_like = float(np.exp(-0.5 * np.dot(diff, diff) / 0.1))
                likelihoods.append(g_like)

            likelihoods = np.array(likelihoods)
            if likelihoods.sum() == 0:
                likelihoods = np.ones(nodes)

            posterior = prior * likelihoods
            posterior /= posterior.sum()
            posterior_tracker[i] = posterior

        post_accumulator[true_idx] = posterior_tracker.mean(axis=0)

    df = pd.DataFrame(
        post_accumulator,
        index=[f"Post_{n}" for n in node_names],
        columns=node_names,
    )
    return df


def main() -> int:
    parser = argparse.ArgumentParser(description="Dual-mode Bayesian localisation Monte Carlo")
    parser.add_argument("--nodes", type=int, default=5)
    parser.add_argument("--sensors", type=int, default=2)
    parser.add_argument("--iterations", type=int, default=1000)
    parser.add_argument(
        "--output",
        type=str,
        default="artifacts/simulation_results.csv",
        help="Output CSV path relative to workspace root",
    )
    args = parser.parse_args()

    try:
        df = run_monte_carlo(args.nodes, args.sensors, args.iterations)
        print("\nMonte Carlo Posterior Matrix")
        print(f"(True state rows vs estimated node columns | {args.iterations} iterations)\n")
        print(df.to_string())

        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(out_path)
        print(f"\n✅ Saved: {out_path.resolve()}")
        return 0
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
