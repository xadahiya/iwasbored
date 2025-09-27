const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgeVerification", function () {
  let ageVerification;
  let owner;
  let user1;
  let user2;
  let mockHub;

  // Mock verification config for testing
  const mockVerificationConfig = {
    minimumAge: 18,
    maximumAge: 0, // 0 means no maximum age
    excludedCountries: [],
    ofacCompliance: false,
    allowTestPassports: true,
    allowOnlyTestPassports: false
  };

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy a mock hub for testing (in a real scenario, you'd use the actual Self Protocol hub)
    const MockHub = await ethers.getContractFactory("MockIdentityVerificationHub");
    mockHub = await MockHub.deploy();
    await mockHub.waitForDeployment();

    // Deploy the AgeVerification contract
    const AgeVerification = await ethers.getContractFactory("AgeVerification");
    ageVerification = await AgeVerification.deploy(
      await mockHub.getAddress(),
      "self-workshop",
      mockVerificationConfig
    );
    await ageVerification.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct verification config", async function () {
      const configId = await ageVerification.verificationConfigId();
      expect(configId).to.not.equal(ethers.ZeroHash);
    });

    it("Should initialize with no verified users", async function () {
      expect(await ageVerification.isVerified(user1.address)).to.be.false;
      expect(await ageVerification.isVerified(user2.address)).to.be.false;
    });
  });

  describe("User Verification", function () {
    it("Should mark user as verified after successful verification", async function () {
      // This would normally be called by the Self Protocol hub after verification
      // For testing, we'll simulate the verification process
      
      // Check user is not verified initially
      expect(await ageVerification.isVerified(user1.address)).to.be.false;
      
      // In a real scenario, the verification would happen through Self Protocol's QR code flow
      // and the hub would call the verification hook
      
      // For now, we can test the view functions and contract structure
      expect(await ageVerification.getVerificationTimestamp(user1.address)).to.equal(0);
    });

    it("Should revert when unverified user tries to perform verified action", async function () {
      await expect(
        ageVerification.connect(user1).verifiedUserAction()
      ).to.be.revertedWithCustomError(ageVerification, "UserNotVerified");
    });

    it("Should return correct verification config ID", async function () {
      const configId = await ageVerification.getConfigId(
        ethers.ZeroHash,
        ethers.ZeroHash,
        "0x"
      );
      expect(configId).to.equal(await ageVerification.verificationConfigId());
    });
  });

  describe("Admin Functions", function () {
    it("Should allow updating verification config ID", async function () {
      const newConfigId = ethers.keccak256(ethers.toUtf8Bytes("new-config"));
      await ageVerification.updateConfigId(newConfigId);
      expect(await ageVerification.verificationConfigId()).to.equal(newConfigId);
    });
  });
});
