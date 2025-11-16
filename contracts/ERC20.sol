// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title SimpleERC20
 * @dev A standard ERC20 token with a fixed supply minted to the deployer.
 * This contract is designed to be deployed via the FlowForge UI.
 * The constructor takes a name, symbol, and an initial supply, which
 * are provided by the user in the deployment wizard.
 */
contract SimpleERC20 is ERC20 {
    /**
     * @dev Constructor that sets the token name, symbol, and initial supply.
     * The entire initial supply is minted to the address that deploys the contract.
     * @param name_ The name of the token (e.g., "My Awesome Token").
     * @param symbol_ The symbol of the token (e.g., "MAT").
     * @param initialSupply_ The total amount of tokens to mint, including decimals.
     * The frontend should convert the user's input to the correct unit (e.g., 1,000,000 * 10**18).
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_
    ) ERC20(name_, symbol_) {
        _mint(msg.sender, initialSupply_);
    }
}
