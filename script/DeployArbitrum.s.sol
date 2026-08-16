// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/arbitrum/VendingMachine.sol";
import "../contracts/arbitrum/ProofAnchor.sol";
import "../contracts/arbitrum/EpistemicLedger.sol";

contract DeployArbitrum is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy VendingMachine (Quickstart contract)
        VendingMachine vm_contract = new VendingMachine();
        console.log("VendingMachine deployed at:", address(vm_contract));

        // Deploy ProofAnchor (VVU Proof Settlement)
        ProofAnchor proofAnchor = new ProofAnchor();
        console.log("ProofAnchor deployed at:", address(proofAnchor));

        // Deploy EpistemicLedger (VVU Structural Evidence Accounting)
        EpistemicLedger ledger = new EpistemicLedger();
        console.log("EpistemicLedger deployed at:", address(ledger));

        vm.stopBroadcast();
    }
}
