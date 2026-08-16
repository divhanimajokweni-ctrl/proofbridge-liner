// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/arbitrum/VendingMachine.sol";
import "../contracts/arbitrum/ProofAnchor.sol";
import "../contracts/arbitrum/EpistemicLedger.sol";

contract DeployLocal is Script {
    // Anvil default first account private key
    uint256 constant ANVIL_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function run() external {
        vm.startBroadcast(ANVIL_KEY);

        VendingMachine vm_contract = new VendingMachine();
        console.log("VendingMachine deployed at:", address(vm_contract));

        ProofAnchor proofAnchor = new ProofAnchor();
        console.log("ProofAnchor deployed at:", address(proofAnchor));

        EpistemicLedger ledger = new EpistemicLedger();
        console.log("EpistemicLedger deployed at:", address(ledger));

        vm.stopBroadcast();
    }
}
