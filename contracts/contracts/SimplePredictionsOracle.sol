// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import "./ConditionalTokens.sol";
import "./interfaces/IFactory.sol";
import "./FixedProductMarketMaker.sol";
import "./ERC20.sol";

/**
 * @title SimplePredictionsOracle
 * @dev A simplified contract for managing PYTH-powered prediction markets
 * Focus on automated random market creation and resolution only
 */
contract SimplePredictionsOracle is Ownable, ERC1155Holder, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;


    // External contract interfaces
    ConditionalTokens public conditionalTokens;
    IFactory public FPMMFactory;
    Token public collateralToken;
    IPyth public pythOracle;

    // Structs for PYTH-powered markets only
    struct QuestionData {
        uint256 beginTimestamp;
        uint256 endTimestamp;
        address fpmm;
        bytes32 priceFeedId;
        bytes32 conditionId;
        int64 initialPrice; // Price at market creation
        int64 finalPrice; // Price at market resolution
        uint256 finalPriceTimestamp; // When final price was recorded
    }

    struct AnswerData {
        uint256[] payouts;
        uint256 answerTimestamp;
        string answerCid;
    }

    struct MarketData {
        QuestionData questionData;
        AnswerData answerData;
        uint256 uniqueBuys;
        uint256[] probabilities;
        uint256[] buyAmounts;
    }

    struct MarketConfig {
        bytes32[] priceIds; // Available PYTH price feed IDs
        uint256 initialFunding; // Initial funding for random markets
    }

    // Events
    event MarketCreated(
        bytes32 indexed questionId,
        bytes32 indexed priceId,
        int64 initialPrice,
        uint256 endTimestamp,
        address fpmmAddress
    );
    event MarketResolved(
        bytes32 indexed questionId,
        int64 finalPrice,
        uint256[] payouts
    );
    event BuyPosition(
        address indexed wallet,
        address indexed fpmmAddress,
        bytes32 indexed questionId,
        uint256 investmentAmount,
        uint256 feeAmount,
        uint256 outcomeIndex,
        uint256 outcomeTokensBought
    );
    event RedeemPosition(
        address indexed wallet,
        address indexed fpmmAddress,
        bytes32 indexed questionId,
        uint256[] indexSets,
        uint256 totalPayout
    );

    // Constants and configuration variables
    uint constant ONE = 10**18;
    uint256 public minBuyAmount = 1e18; // 1 token minimum
    uint256 public maxBuyAmountPerQuestion = 1000e18; // 1000 tokens max
    uint256 public stopTradingBeforeMarketEnd = 300; // 5 minutes default
    bool public sellEnabled = false; // Selling disabled for simplified version
    bytes32 parentCollectionId;

    // PYTH Oracle specific variables
    MarketConfig public marketConfig;
    uint256 public lastMarketTime;
    bytes32[] public activeMarketIds;

    // Mappings to store market and user data
    mapping(bytes32 => QuestionData) public questions;
    mapping(address => uint256) public userSpendings;
    mapping(address => uint256) public userRedeemed;
    mapping(address => EnumerableSet.Bytes32Set) private userOpenPositions;
    mapping(address => EnumerableSet.Bytes32Set) private userClosedPositions;
    mapping(bytes32 => AnswerData) public answers;
    mapping(bytes32 => mapping(address => uint256)) public userBuyAmounts;

    constructor(
        address _conditionalTokens,
        address _FPMMFactory,
        address _collateralToken,
        address _pythOracle
    ) Ownable(msg.sender) {
        conditionalTokens = ConditionalTokens(_conditionalTokens);
        FPMMFactory = IFactory(_FPMMFactory);
        collateralToken = Token(_collateralToken);
        pythOracle = IPyth(_pythOracle);
        parentCollectionId = bytes32(0);
    }

    /**
     * @dev Updates contract addresses
     */
    function updateContracts(
        address _conditionalTokens,
        address _FPMMFactory,
        address _collateralToken,
        address _pythOracle
    ) external onlyOwner {
        conditionalTokens = ConditionalTokens(_conditionalTokens);
        FPMMFactory = IFactory(_FPMMFactory);
        collateralToken = Token(_collateralToken);
        pythOracle = IPyth(_pythOracle);
    }

    function getActiveMarketIds() external view returns (bytes32[] memory) {
        bytes32[] memory activeMarketIdsArray = new bytes32[](activeMarketIds.length);
        for (uint256 i = 0; i < activeMarketIds.length; i++) {
            activeMarketIdsArray[i] = activeMarketIds[i];
        }
        return activeMarketIdsArray;
    }

    /**
     * @dev Updates the minimum buy amount
     */
    function updateMinBuyAmount(uint256 _minBuyAmount) external onlyOwner {
        minBuyAmount = _minBuyAmount;
    }

    /**
     * @dev Updates the maximum buy amount per question
     */
    function updateMaxBuyAmountPerQuestion(uint256 _maxBuyAmountPerQuestion) external onlyOwner {
        maxBuyAmountPerQuestion = _maxBuyAmountPerQuestion;
    }

    /**
     * @dev Updates the time before market end when trading should stop
     */
    function updateStopTradingBeforeMarketEnd(uint256 _stopTradingBeforeMarketEnd) external onlyOwner {
        stopTradingBeforeMarketEnd = _stopTradingBeforeMarketEnd;
    }

    /**
     * @dev Gets the remaining buy amount for a user on a specific question
     */
    function getRemainingBuyAmount(bytes32 questionId, address spender) external view returns (uint256) {
        return maxBuyAmountPerQuestion - userBuyAmounts[questionId][spender];
    }

    /**
     * @dev Gets the open positions for a user
     */
    function getUserOpenPositions(address user) public view returns (bytes32[] memory) {
        bytes32[] memory openPositions = new bytes32[](userOpenPositions[user].length());
        for (uint256 i = 0; i < userOpenPositions[user].length(); i++) {
            openPositions[i] = userOpenPositions[user].at(i);
        }
        return openPositions;
    }

    /**
     * @dev Gets the closed positions for a user
     */
    function getUserClosedPositions(address user) public view returns (bytes32[] memory) {
        bytes32[] memory closedPositions = new bytes32[](userClosedPositions[user].length());
        for (uint256 i = 0; i < userClosedPositions[user].length(); i++) {
            closedPositions[i] = userClosedPositions[user].at(i);
        }
        return closedPositions;
    }

    /**
     * @dev Gets the market data for a specific question
     */
    function getMarketData(bytes32 questionId) external view returns (MarketData memory) {
        FixedProductMarketMaker fpmm = FixedProductMarketMaker(questions[questionId].fpmm);
        uint256 uniqueBuys = fpmm.uniqueBuys();
        uint256[] memory probabilities = fpmm.calculateProbabilities();
        uint256[] memory buyAmounts = new uint256[](2); // Always 2 outcomes
        
        buyAmounts[0] = fpmm.calcBuyAmount(ONE, 0);
        buyAmounts[1] = fpmm.calcBuyAmount(ONE, 1);

        return MarketData(questions[questionId], answers[questionId], uniqueBuys, probabilities, buyAmounts);
    }

    /**
     * @dev Buys a position in a market
     */
    function buyPosition(
        bytes32 questionId,
        uint256 outcomeIndex,
        uint256 amount,
        uint256 minOutcomeTokensToBuy,
        address conditionTokensReceiver
    ) external nonReentrant {
        require(amount >= minBuyAmount, "Amount below minimum");
        require(collateralToken.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
        require(collateralToken.balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        uint256 userBuyAmount = userBuyAmounts[questionId][conditionTokensReceiver];
        require(userBuyAmount + amount <= maxBuyAmountPerQuestion, "Amount exceeds maximum buy amount per question");

        collateralToken.transferFrom(msg.sender, address(this), amount);
        userBuyAmounts[questionId][conditionTokensReceiver] = userBuyAmount + amount;

        address fpmmAddress = questions[questionId].fpmm;
        require(fpmmAddress != address(0), "Market not found");

        collateralToken.approve(fpmmAddress, amount);

        FixedProductMarketMaker fpmm = FixedProductMarketMaker(fpmmAddress);
        uint256 outcomeTokensBought = fpmm.buyOnBehalf(amount, outcomeIndex, minOutcomeTokensToBuy, conditionTokensReceiver);

        userSpendings[conditionTokensReceiver] += amount;
        userOpenPositions[conditionTokensReceiver].add(questionId);

        emit BuyPosition(
            conditionTokensReceiver,
            fpmmAddress,
            questionId,
            amount,
            fpmm.fee(),
            outcomeIndex,
            outcomeTokensBought
        );
    }

    /**
     * @dev Gets the position balances for a holder
     */
    function getPositionBalances(bytes32 questionId, uint256[] memory indexSets, address holder) public view returns (uint256[] memory balances) {
        bytes32 conditionId = questions[questionId].conditionId;
        uint256 fullIndexSet = (1 << 2) - 1; // Always 2 outcomes

        balances = new uint256[](indexSets.length);
        for (uint256 i = 0; i < indexSets.length; i++) {
            uint256 indexSet = indexSets[i];
            require(indexSet > 0 && indexSet < fullIndexSet, "Got invalid index set");
            uint256 positionId = conditionalTokens.getPositionId(collateralToken,
                conditionalTokens.getCollectionId(parentCollectionId, conditionId, indexSet));
            balances[i] = conditionalTokens.balanceOf(holder, positionId);
        }
    }

    /**
     * @dev Redeems a position
     */
    function redeemPosition(bytes32 questionId, uint256[] memory indexSets) public {
        QuestionData memory questionData = questions[questionId];
        require(questionData.beginTimestamp > 0, "Market not found");

        uint256[] memory requiredIndexSets = new uint256[](2);
        requiredIndexSets[0] = 1;
        requiredIndexSets[1] = 2;

        require(indexSets.length == 2, "Invalid index sets");
        require(keccak256(abi.encodePacked(indexSets)) == keccak256(abi.encodePacked(requiredIndexSets)), "Invalid index sets");

        uint256[] memory positionBalances = getPositionBalances(questionId, indexSets, msg.sender);

        uint256 positionTotal = 0;
        for (uint256 i = 0; i < positionBalances.length; i++) {
            positionTotal += positionBalances[i];
        }

        require(positionTotal > 0, "No positions to redeem");

        uint256 totalPayout = conditionalTokens.redeemPositionsOnBehalf(
            collateralToken,
            parentCollectionId,
            questions[questionId].conditionId,
            indexSets,
            msg.sender
        );

        collateralToken.transfer(msg.sender, totalPayout);

        userRedeemed[msg.sender] += totalPayout;
        userOpenPositions[msg.sender].remove(questionId);
        userClosedPositions[msg.sender].add(questionId);

        emit RedeemPosition(msg.sender, questions[questionId].fpmm, questionId, indexSets, totalPayout);
    }

    /**
     * @dev Redeems multiple positions
     */
    function redeemPositions(uint256 num) nonReentrant external {
        uint256 nUserPositions = userOpenPositions[msg.sender].length();
        require(nUserPositions > 0, "No open positions to redeem");

        if (num > nUserPositions) {
            num = nUserPositions;
        }

        bytes32[] memory openPositions = getUserOpenPositions(msg.sender);
        bytes32[] memory openPositionsResolved = new bytes32[](num);
        uint256 numPositionsToRedeem = 0;
        
        for (uint256 i = 0; i < num; i++) {
            if(answers[openPositions[i]].answerTimestamp > 0) {
                openPositionsResolved[numPositionsToRedeem] = openPositions[i];
                numPositionsToRedeem++;
            }
        }
        require(numPositionsToRedeem > 0, "Unable to redeem positions, resolution pending. Please try again later.");

        for (uint256 i = 0; i < numPositionsToRedeem; i++) {
            bytes32 questionId = openPositionsResolved[i];
            uint256[] memory indexSets = new uint256[](2);
            indexSets[0] = 1;
            indexSets[1] = 2;
            redeemPosition(questionId, indexSets);
        }
    }

    /**
     * @dev Configures random market parameters
     */
    function configureMarkets(
        bytes32[] calldata _priceIds,
        uint256 _initialFunding
    ) external onlyOwner {
        require(_initialFunding > 0, "Initial funding must be positive");
        
        marketConfig = MarketConfig({
            priceIds: _priceIds,
            initialFunding: _initialFunding
        });
    }

    /**
     * @dev Creates a random market using PYTH price feeds
     */
    function createMarket(bytes32 questionId, uint256 randomIndex, uint256 marketEndTimestamp, bytes[] calldata priceUpdateData) external payable returns (bytes32) {
        require(randomIndex < marketConfig.priceIds.length, "Invalid random index");
        require(marketConfig.priceIds.length > 0, "No price feeds configured");

        // Update PYTH price feeds
        uint updateFee = pythOracle.getUpdateFee(priceUpdateData);
        require(msg.value >= updateFee, "Insufficient fee for price update");
        pythOracle.updatePriceFeeds{value: updateFee}(priceUpdateData);


        // Get current price (fresh after update)
        PythStructs.Price memory currentPrice = pythOracle.getPriceUnsafe(marketConfig.priceIds[randomIndex]);

        int64 initialPrice = currentPrice.price;

        // Create the market with 2 outcomes (price goes up / price goes down)
        conditionalTokens.prepareCondition(address(this), questionId, 2);
        bytes32 conditionId = conditionalTokens.getConditionId(address(this), questionId, 2);

        bytes32[] memory conditionIds = new bytes32[](1);
        conditionIds[0] = conditionId;

        FixedProductMarketMaker fpmm = FPMMFactory.createFixedProductMarketMaker(
            conditionalTokens,
            collateralToken,
            conditionIds,
            25000000000000000, // 2.5% fee
            marketEndTimestamp,
            address(this)
        );

        // Add initial funding with 50/50 distribution
        uint256[] memory distributionHints = new uint256[](2);
        distributionHints[0] = ONE / 2; // 50% for "price goes up"
        distributionHints[1] = ONE / 2; // 50% for "price goes down"

        collateralToken.approve(address(fpmm), marketConfig.initialFunding);
        fpmm.addFunding(marketConfig.initialFunding, distributionHints);

        // Set approval for spending conditional tokens
        conditionalTokens.setApprovalForAll(address(fpmm), true);

        questions[questionId] = QuestionData(
            block.timestamp,
            marketEndTimestamp,
            address(fpmm),
            marketConfig.priceIds[randomIndex],
            conditionId,
            initialPrice,
            0, // finalPrice - set during resolution
            0  // finalPriceTimestamp - set during resolution
        );

        lastMarketTime = block.timestamp;

        activeMarketIds.push(questionId);

        emit MarketCreated(questionId, marketConfig.priceIds[randomIndex], initialPrice, marketEndTimestamp, address(fpmm));

        return questionId;
    }

    /**
     * @dev Automatically resolves markets based on PYTH price data
     */
    function resolveMarket(
        bytes32 questionId,
        bytes[] calldata priceUpdateData,
        string memory answerCid
    ) external onlyOwner payable {
        require(questionId != bytes32(0), "No question to resolve");

        QuestionData memory questionData = questions[questionId];

        require(questionData.beginTimestamp > 0, "Market not initialized");
        require(block.timestamp >= questionData.endTimestamp, "Market still active");
        require(answers[questionId].answerTimestamp == 0, "Market already resolved");

        // Update PYTH price feeds
        uint updateFee = pythOracle.getUpdateFee(priceUpdateData);
        require(msg.value >= updateFee, "Insufficient fee for price update");
        pythOracle.updatePriceFeeds{value: updateFee}(priceUpdateData);

        // Get final price from PYTH (fresh after update)
        PythStructs.Price memory finalPriceData = pythOracle.getPriceUnsafe(questionData.priceFeedId);
        require(finalPriceData.price > 0, "Invalid final price data");
        require(finalPriceData.publishTime > 0, "Invalid final price timestamp");

        int64 finalPrice = finalPriceData.price;
        uint256 finalPriceTimestamp = finalPriceData.publishTime;

        // Update question data with final price
        questionData.finalPrice = finalPrice;
        questionData.finalPriceTimestamp = finalPriceTimestamp;

        // Determine if price went up or down
        bool priceWentUp = finalPrice > questionData.initialPrice;

        // Set payouts: outcome 0 = price went up, outcome 1 = price went down
        uint256[] memory payouts = new uint256[](2);
        if (priceWentUp) {
            payouts[0] = ONE; // Price went up wins
            payouts[1] = 0;
        } else {
            payouts[0] = 0;
            payouts[1] = ONE; // Price went down wins
        }

        // Store answer and resolve
        answers[questionId] = AnswerData(
            payouts,
            block.timestamp,
            answerCid
        );

        conditionalTokens.reportPayouts(questionId, payouts);

        emit MarketResolved(questionId, finalPrice,  payouts);
    }

    /**
     * @dev Gets current price for a given PYTH price feed
     * Note: Use updatePriceFeeds() first to ensure fresh data.
     */
    function getCurrentPrice(bytes32 priceId) external view returns (PythStructs.Price memory) {
        return pythOracle.getPriceUnsafe(priceId);
    }

    /**
     * @dev Gets detailed market information including price history
     */
    function getDetailedMarketData(bytes32 questionId) external view returns (
        QuestionData memory questionData,
        AnswerData memory answerData,
        uint256 uniqueBuys,
        uint256[] memory probabilities,
        uint256[] memory buyAmounts,
        bool isResolved,
        bool hasExpired,
        int64 currentPrice
    ) {
        questionData = questions[questionId];
        answerData = answers[questionId];
        
        require(questionData.beginTimestamp > 0, "Market not found");
        
        FixedProductMarketMaker fpmm = FixedProductMarketMaker(questionData.fpmm);
        uniqueBuys = fpmm.uniqueBuys();
        probabilities = fpmm.calculateProbabilities();
        buyAmounts = new uint256[](2);
        buyAmounts[0] = fpmm.calcBuyAmount(ONE, 0);
        buyAmounts[1] = fpmm.calcBuyAmount(ONE, 1);
        
        isResolved = answerData.answerTimestamp > 0;
        hasExpired = block.timestamp >= questionData.endTimestamp;
        
        // Get current or final price
        if (isResolved && questionData.finalPrice != 0) {
            currentPrice = questionData.finalPrice;
        } else {
            // Get current price (may be stale for informational purposes)
            try pythOracle.getPriceUnsafe(questionData.priceFeedId) returns (PythStructs.Price memory unsafePrice) {
                currentPrice = unsafePrice.price;
            } catch {
                currentPrice = questionData.initialPrice; // Fallback to initial price
            }
        }
        
    }

    /**
     * @dev Converts int64 to string
     */
    function _int64ToString(int64 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        
        bool negative = value < 0;
        uint64 temp = negative ? uint64(-value) : uint64(value);
        
        uint256 digits;
        uint64 temp2 = temp;
        while (temp2 != 0) {
            digits++;
            temp2 /= 10;
        }
        
        bytes memory buffer = new bytes(negative ? digits + 1 : digits);
        
        if (negative) {
            buffer[0] = '-';
        }
        
        while (temp != 0) {
            digits -= 1;
            buffer[negative ? digits + 1 : digits] = bytes1(uint8(48 + temp % 10));
            temp /= 10;
        }
        
        return string(buffer);
    }

    /**
     * @dev Gets random market configuration
     */
    function getMarketConfig() external view returns (MarketConfig memory) {
        return marketConfig;
    }

    /**
     * @dev Emergency withdraw all tokens
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = collateralToken.balanceOf(address(this));
        collateralToken.transfer(msg.sender, balance);
    }

    /**
     * @dev Emergency withdraw all ETH
     */
    function emergencyWithdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    receive() payable external {}
}
