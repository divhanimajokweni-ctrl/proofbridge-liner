use dep::std;

// Recursive Aggregator Circuit
// This circuit takes two proofs and aggregates them.
// By marking this as recursive too, we can build a binary tree of proofs.
#[recursive]
fn main(
    // Common public context (e.g. they should both belong to the same audit root)
    expected_root: pub Field,
    
    // Recursion Data for Proof 1
    verification_key_1: [Field; 56], 
    proof_1: [Field; 67],             
    public_inputs_1: [Field; 1],
    key_hash_1: Field,
    
    // Recursion Data for Proof 2
    verification_key_2: [Field; 56], 
    proof_2: [Field; 67],             
    public_inputs_2: [Field; 1],
    key_hash_2: Field
) {
    // Verify Proof 1
    std::verify_proof(
        verification_key_1,
        proof_1,
        public_inputs_1,
        key_hash_1
    );
    assert(public_inputs_1[0] == expected_root);
    
    // Verify Proof 2
    std::verify_proof(
        verification_key_2,
        proof_2,
        public_inputs_2,
        key_hash_2
    );
    assert(public_inputs_2[0] == expected_root);
}
