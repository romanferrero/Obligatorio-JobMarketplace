// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockERC20 - Token ERC-20 de prueba con faucet abierto
/// @notice Token usado para pagar los trabajos del JobMarketplace en testnet y en
///         los tests. `mint` es público a propósito (faucet) para poder fondear
///         cualquier cuenta sin fricción. NO usar en producción.
contract MockERC20 is ERC20 {
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    /// @notice Acuña `amount` tokens para `to`. Faucet abierto (solo testnet).
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
