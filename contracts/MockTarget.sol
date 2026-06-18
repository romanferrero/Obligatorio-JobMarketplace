// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Contrato de prueba para verificar que el Multisig puede ejecutar
///         calldata arbitraria sobre otros contratos. Solo se usa en tests.
contract MockTarget {
    uint256 public number;

    function setNumber(uint256 _n) external {
        number = _n;
    }
}
