pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";

template ThresholdCheck() {
    signal input alpha;
    signal input beta;
    signal input tau_num;
    signal input tau_den;

    signal output valid;

    // constraint:
    // alpha > tau * (alpha + beta)
    // => alpha * tau_den > (alpha + beta) * tau_num

    signal left;
    signal right;

    left <== alpha * tau_den;
    right <== (alpha + beta) * tau_num;

    // Use GreaterThan from circomlib
    component isPositive = GreaterThan(32);
    isPositive.in[0] <== left;
    isPositive.in[1] <== right;

    valid <== isPositive.out;
}

component main = ThresholdCheck();
