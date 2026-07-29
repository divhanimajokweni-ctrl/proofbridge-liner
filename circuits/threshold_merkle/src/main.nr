use dep::poseidon;

#[recursive]
fn main(
    // Public Inputs (What the inspector/regulator cross-references)
    expected_root: pub Field,
    
    // Private Inputs (The hidden execution specifics)
    alpha: u64,
    beta: u64,
    tau_num: u64,
    tau_den: u64,
    salt: Field,
    
    // Merkle Proof Context (Reduced Depth for Debugging)
    path_elements: [Field; 4],
    path_indices: [bool; 4]
) {
    // 1. HARDENED BOUNDARY TESTING
    let sum: u64 = alpha + beta;
    assert(sum != 0);
    
    let left: Field = (alpha as Field) * (tau_den as Field);
    let right: Field = (sum as Field) * (tau_num as Field);
    
    let diff = left - right - 1;
    let _bits: [u1; 128] = diff.to_le_bits();
    
    // 2. GENERATE LEAF COMMITMENT
    let leaf: Field = poseidon::poseidon::bn254::hash_5([
        alpha as Field,
        beta as Field,
        tau_num as Field,
        tau_den as Field,
        salt
    ]);
    
    // 3. MERKLE ACCOUNTING MEMBERSHIP CHECK
    let mut current_hash = leaf;
    for i in 0..4 {
        let (left_node, right_node) = if path_indices[i] {
            (path_elements[i], current_hash)
        } else {
            (current_hash, path_elements[i])
        };
        current_hash = poseidon::poseidon::bn254::hash_2([left_node, right_node]);
    }
    
    // Lock calculations into the historical snapshot root
    assert(current_hash == expected_root);
}
