// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/CircuitBreaker.sol";

contract DeployCircuitBreaker is Script {
    function run() external returns (CircuitBreaker) {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address oracle = vm.addr(vm.envUint("ORACLE_PRIVATE_KEY"));

        vm.startBroadcast(deployerPrivateKey);

        CircuitBreaker cb = new CircuitBreaker();
        cb.initialize(oracle);

        vm.stopBroadcast();

        console.log("CircuitBreaker deployed at:", address(cb));
        console.log("Owner:", msg.sender);
        console.log("Oracle:", oracle);

        return cb;
    }
}
