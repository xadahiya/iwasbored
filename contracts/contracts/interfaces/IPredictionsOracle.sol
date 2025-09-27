// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IPredictionsOracle {
  function sellEnabled (  ) external view returns ( bool );
  function stopTradingBeforeMarketEnd (  ) external view returns ( uint256 );
}
