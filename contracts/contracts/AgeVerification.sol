// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import { SelfVerificationRoot } from "@selfxyz/contracts/contracts/abstract/SelfVerificationRoot.sol";
import { ISelfVerificationRoot } from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";
import { SelfStructs } from "@selfxyz/contracts/contracts/libraries/SelfStructs.sol";
import { SelfUtils } from "@selfxyz/contracts/contracts/libraries/SelfUtils.sol";
import { IIdentityVerificationHubV2 } from "@selfxyz/contracts/contracts/interfaces/IIdentityVerificationHubV2.sol";

/**
 * @title AgeVerification
 * @notice Smart contract for verifying users are 18 years or older using Self Protocol
 * @dev This contract extends SelfVerificationRoot to implement age verification for the betting app
 */
contract AgeVerification is SelfVerificationRoot {
    // Storage for verified users
    mapping(address => bool) public verifiedUsers;
    mapping(address => uint256) public verificationTimestamp;
    
    // Contract configuration
    bytes32 public verificationConfigId;
    SelfStructs.VerificationConfigV2 public verificationConfig;
    
    // Access control
    address private immutable owner;
    
    // Events
    event UserVerified(address indexed user, uint256 timestamp);
    event VerificationCompleted(ISelfVerificationRoot.GenericDiscloseOutputV2 output, bytes userData);
    event ScopeCalculated(bytes32 scopeHash);
    
    // Errors
    error UserNotVerified();
    error InsufficientAge();

    /**
     * @notice Constructor for the age verification contract
     * @param identityVerificationHubV2Address The address of the Identity Verification Hub V2
     * @param scopeSeed The verification scope seed for this contract
     * @param _verificationConfig The verification configuration (minimum age, excluded countries, etc.)
     */
    constructor(
        address identityVerificationHubV2Address,
        string memory scopeSeed,
        SelfUtils.UnformattedVerificationConfigV2 memory _verificationConfig
    ) SelfVerificationRoot(identityVerificationHubV2Address, scopeSeed) {
        // Set the contract deployer as the owner
        owner = msg.sender;
        
        // Emit the calculated scope for transparency
        emit ScopeCalculated(bytes32(_scope));

        // Format and set the verification config
        verificationConfig = SelfUtils.formatVerificationConfigV2(_verificationConfig);
        
        // Register the verification config with the hub
        verificationConfigId = IIdentityVerificationHubV2(identityVerificationHubV2Address)
            .setVerificationConfigV2(verificationConfig);
    }

    /**
     * @notice Implementation of customVerificationHook for age verification
     * @dev This function is called by onVerificationSuccess after hub address validation
     * @param output The verification output from the hub containing user data
     * @param userData Additional user data passed through verification
     */
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory userData
    ) internal override {
        // Use msg.sender as the user address (the actual caller of verification)
        address userAddress = msg.sender;
        
        // Validate that the user meets the minimum age requirement
        // The olderThan field contains the minimum age that was verified
        if (output.olderThan < 18) {
            revert InsufficientAge();
        }
        
        // Allow re-verification but update the timestamp
        verifiedUsers[userAddress] = true;
        verificationTimestamp[userAddress] = block.timestamp;
        
        // Emit events
        emit UserVerified(userAddress, block.timestamp);
        emit VerificationCompleted(output, userData);
    }

    /**
     * @notice Get the verification config ID for a given user and destination
     * @param destinationChainId The destination chain ID (unused in this implementation)
     * @param userIdentifier The user identifier (unused in this implementation)
     * @param userDefinedData User-defined data (unused in this implementation)
     * @return The verification config ID
     */
    function getConfigId(
        bytes32 destinationChainId,
        bytes32 userIdentifier,
        bytes memory userDefinedData
    ) public view override returns (bytes32) {
        // Suppress unused parameter warnings
        destinationChainId;
        userIdentifier;
        userDefinedData;
        
        return verificationConfigId;
    }

    /**
     * @notice Check if a user is verified (18+ years old)
     * @param user The address to check
     * @return True if user is verified, false otherwise
     */
    function isVerified(address user) public view returns (bool) {
        return verifiedUsers[user];
    }

    /**
     * @notice Get the verification timestamp for a user
     * @param user The address to check
     * @return The timestamp when the user was verified (0 if not verified)
     */
    function getVerificationTimestamp(address user) public view returns (uint256) {
        return verificationTimestamp[user];
    }

    /**
     * @notice Modifier to restrict access to verified users only
     */
    modifier onlyVerified() {
        if (!verifiedUsers[msg.sender]) {
            revert UserNotVerified();
        }
        _;
    }

    /**
     * @notice Function that can be called only by verified users (example usage)
     * @dev This demonstrates how other contracts can use the verification
     */
    function verifiedUserAction() external onlyVerified {
        // This function can only be called by users who have completed age verification
        // In the betting app, this would be used to place bets
    }

    /**
     * @notice Admin function to update verification config (if needed)
     * @param newConfigId The new verification config ID
     * @dev Restricted to contract owner for security
     */
    function updateConfigId(bytes32 newConfigId) external {
        // Add basic access control - only allow the owner to update
        // In production, consider using OpenZeppelin's Ownable for better access control
        require(msg.sender == owner, "Only owner can update config");
        verificationConfigId = newConfigId;
    }
}
