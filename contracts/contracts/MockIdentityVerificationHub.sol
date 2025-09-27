// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { SelfStructs } from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";

/**
 * @title MockIdentityVerificationHub
 * @notice Mock contract for testing AgeVerification without the actual Self Protocol hub
 * @dev This is only for testing purposes - in production, use the real Self Protocol hub
 */
contract MockIdentityVerificationHub {
    mapping(bytes32 => SelfStructs.VerificationConfigV2) public verificationConfigs;
    uint256 private configCounter;

    event VerificationConfigSet(bytes32 indexed configId, SelfStructs.VerificationConfigV2 config);

    /**
     * @notice Mock implementation of setVerificationConfigV2
     * @param config The verification configuration to set
     * @return The generated config ID
     */
    function setVerificationConfigV2(
        SelfStructs.VerificationConfigV2 memory config
    ) external returns (bytes32) {
        configCounter++;
        bytes32 configId = keccak256(abi.encodePacked(block.timestamp, configCounter, msg.sender));
        
        verificationConfigs[configId] = config;
        emit VerificationConfigSet(configId, config);
        
        return configId;
    }

    /**
     * @notice Get a verification config by ID
     * @param configId The config ID to retrieve
     * @return The verification configuration
     */
    function getVerificationConfig(bytes32 configId) 
        external 
        view 
        returns (SelfStructs.VerificationConfigV2 memory) 
    {
        return verificationConfigs[configId];
    }

    /**
     * @notice Mock function to simulate successful verification
     * @dev In real implementation, this would be called by Self Protocol's verification system
     */
    function mockVerifyUser(
        address verificationContract,
        address userAddress,
        bytes memory userData
    ) external {
        // This would normally be implemented by the Self Protocol hub
        // For testing, we can manually trigger verification success
        
        // In the real system, the hub would call onVerificationSuccess on the verification contract
        // after validating the user's identity documents through the Self Protocol
        
        // For now, this is just a placeholder for testing contract deployment and structure
    }
}
