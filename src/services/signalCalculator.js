/**
 * Bitcoin 4-Dimensional Signal System
 * 四维度信号系统
 */

export class SignalCalculator {
  /**
   * 1. Trend Dimension: MA20 & MA50 Golden Cross
   * 趋势维度：20日均线 + 50日均线金叉判断
   */
  calculateTrendSignal(prices) {
    const ma20 = this.calculateMA(prices, 20);
    const ma50 = this.calculateMA(prices, 50);

    const currentMA20 = ma20[ma20.length - 1];
    const currentMA50 = ma50[ma50.length - 1];
    const prevMA20 = ma20[ma20.length - 2];
    const prevMA50 = ma50[ma50.length - 2];

    let signal = 'NEUTRAL';
    let score = 0;
    let description = '';

    // Golden Cross (金叉)
    if (prevMA20 <= prevMA50 && currentMA20 > currentMA50) {
      signal = 'STRONG_BUY';
      score = 100;
      description = 'MA20 crosses above MA50 (Golden Cross) 金叉形成';
    }
    // Death Cross (死叉)
    else if (prevMA20 >= prevMA50 && currentMA20 < currentMA50) {
      signal = 'STRONG_SELL';
      score = 0;
      description = 'MA20 crosses below MA50 (Death Cross) 死叉形成';
    }
    // Bullish (多头排列)
    else if (currentMA20 > currentMA50) {
      const gap = ((currentMA20 - currentMA50) / currentMA50) * 100;
      score = Math.min(100, 60 + gap * 10);
      signal = score > 75 ? 'BUY' : 'NEUTRAL';
      description = `MA20 above MA50 (+${gap.toFixed(2)}%) 多头排列`;
    }
    // Bearish (空头排列)
    else {
      const gap = ((currentMA50 - currentMA20) / currentMA50) * 100;
      score = Math.max(0, 40 - gap * 10);
      signal = score < 25 ? 'SELL' : 'NEUTRAL';
      description = `MA20 below MA50 (-${gap.toFixed(2)}%) 空头排列`;
    }

    return {
      signal,
      score,
      description,
      data: { ma20: currentMA20, ma50: currentMA50 }
    };
  }

  /**
   * 2. Fund Flow Dimension: ETF 3-day Net Inflow
   * 资金流维度：ETF 3日净流入
   */
  calculateFlowSignal(etfFlows) {
    const last3Days = etfFlows.slice(-3);
    const totalFlow = last3Days.reduce((sum, flow) => sum + flow, 0);
    const avgDailyFlow = totalFlow / 3;

    let signal = 'NEUTRAL';
    let score = 50;
    let description = '';

    // Strong institutional buying
    if (avgDailyFlow > 500) {
      signal = 'STRONG_BUY';
      score = 100;
      description = `Strong institutional inflow: $${avgDailyFlow.toFixed(0)}M/day 机构强力买入`;
    }
    // Moderate buying
    else if (avgDailyFlow > 200) {
      signal = 'BUY';
      score = 75;
      description = `Moderate inflow: $${avgDailyFlow.toFixed(0)}M/day 适度流入`;
    }
    // Weak buying or neutral
    else if (avgDailyFlow > -200) {
      score = 50 + (avgDailyFlow / 10);
      description = `Neutral flow: $${avgDailyFlow.toFixed(0)}M/day 资金平稳`;
    }
    // Moderate selling
    else if (avgDailyFlow > -500) {
      signal = 'SELL';
      score = 25;
      description = `Moderate outflow: $${avgDailyFlow.toFixed(0)}M/day 适度流出`;
    }
    // Strong selling
    else {
      signal = 'STRONG_SELL';
      score = 0;
      description = `Strong institutional outflow: $${avgDailyFlow.toFixed(0)}M/day 机构强力卖出`;
    }

    return {
      signal,
      score,
      description,
      data: { totalFlow, avgDailyFlow }
    };
  }

  /**
   * 3. Derivatives Dimension: Funding Rate & Open Interest
   * 衍生品维度：Funding Rate + OI，杠杆过热了吗？
   */
  calculateDerivativesSignal(fundingRate, openInterest, oiChange) {
    let signal = 'NEUTRAL';
    let score = 50;
    let description = '';
    let warnings = [];

    // Analyze Funding Rate
    if (fundingRate > 0.05) {
      score -= 30;
      warnings.push('Extremely high funding rate 资金费率过高');
    } else if (fundingRate > 0.02) {
      score -= 15;
      warnings.push('High funding rate 资金费率偏高');
    } else if (fundingRate < -0.02) {
      score += 15;
      warnings.push('Negative funding rate (shorts paying) 空头支付费率');
    }

    // Analyze Open Interest Change
    if (oiChange > 20) {
      score -= 20;
      warnings.push('Rapid OI increase (leverage buildup) 持仓量快速上升');
    } else if (oiChange > 10) {
      score -= 10;
      warnings.push('OI increasing (leverage rising) 持仓量上升');
    } else if (oiChange < -10) {
      score += 10;
      warnings.push('OI decreasing (deleverage) 持仓量下降');
    }

    // Determine signal
    if (score > 70) {
      signal = 'BUY';
      description = 'Healthy derivatives market 衍生品市场健康';
    } else if (score > 40) {
      signal = 'NEUTRAL';
      description = 'Moderate derivatives risk 衍生品风险适中';
    } else if (score > 20) {
      signal = 'SELL';
      description = 'High leverage risk 杠杆风险较高';
    } else {
      signal = 'STRONG_SELL';
      description = 'Overleveraged market 市场杠杆过热';
    }

    return {
      signal,
      score,
      description: `${description}. ${warnings.join('. ')}`,
      data: { fundingRate, openInterest, oiChange }
    };
  }

  /**
   * 4. Macro Dimension: NASDAQ Correlation
   * 宏观维度：纳斯达克联动
   */
  calculateMacroSignal(btcChange, nasdaqChange) {
    let signal = 'NEUTRAL';
    let score = 50;
    let description = '';

    // NASDAQ is positive
    if (nasdaqChange > 2) {
      score += 30;
      description = `NASDAQ strong (+${nasdaqChange.toFixed(2)}%) 纳指强劲`;
    } else if (nasdaqChange > 0.5) {
      score += 15;
      description = `NASDAQ positive (+${nasdaqChange.toFixed(2)}%) 纳指上涨`;
    }
    // NASDAQ is negative
    else if (nasdaqChange < -2) {
      score -= 30;
      description = `NASDAQ weak (${nasdaqChange.toFixed(2)}%) 纳指疲软`;
    } else if (nasdaqChange < -0.5) {
      score -= 15;
      description = `NASDAQ negative (${nasdaqChange.toFixed(2)}%) 纳指下跌`;
    } else {
      description = `NASDAQ flat (${nasdaqChange.toFixed(2)}%) 纳指平稳`;
    }

    // Check BTC's relative performance
    if (btcChange > nasdaqChange + 2) {
      score += 10;
      description += ' | BTC outperforming 比特币跑赢大盘';
      signal = score > 60 ? 'BUY' : 'NEUTRAL';
    } else if (btcChange < nasdaqChange - 2) {
      score -= 10;
      description += ' | BTC underperforming 比特币跑输大盘';
      signal = score < 40 ? 'SELL' : 'NEUTRAL';
    } else {
      description += ' | BTC tracking market 比特币跟随大盘';
    }

    score = Math.max(0, Math.min(100, score));

    if (score > 70 && signal === 'NEUTRAL') signal = 'BUY';
    if (score < 30 && signal === 'NEUTRAL') signal = 'SELL';

    return {
      signal,
      score,
      description,
      data: { btcChange, nasdaqChange }
    };
  }

  /**
   * Calculate Overall Signal Score
   * 计算综合信号分数
   */
  calculateOverallSignal(trendSignal, flowSignal, derivativesSignal, macroSignal) {
    const weights = {
      trend: 0.35,      // 35% weight on trend
      flow: 0.30,       // 30% weight on fund flow
      derivatives: 0.20, // 20% weight on derivatives
      macro: 0.15       // 15% weight on macro
    };

    const totalScore =
      trendSignal.score * weights.trend +
      flowSignal.score * weights.flow +
      derivativesSignal.score * weights.derivatives +
      macroSignal.score * weights.macro;

    let signal = 'NEUTRAL';
    let recommendation = '';

    if (totalScore >= 75) {
      signal = 'STRONG_BUY';
      recommendation = 'Strong bullish signals across dimensions 多维度强烈看涨';
    } else if (totalScore >= 60) {
      signal = 'BUY';
      recommendation = 'Bullish bias, favorable entry 偏多，适合入场';
    } else if (totalScore >= 40) {
      signal = 'NEUTRAL';
      recommendation = 'Mixed signals, wait for clarity 信号混合，观望为主';
    } else if (totalScore >= 25) {
      signal = 'SELL';
      recommendation = 'Bearish bias, consider reducing 偏空，考虑减仓';
    } else {
      signal = 'STRONG_SELL';
      recommendation = 'Strong bearish signals, high risk 多维度看空，风险较高';
    }

    return {
      signal,
      score: Math.round(totalScore),
      recommendation
    };
  }

  // Helper: Calculate Moving Average
  calculateMA(prices, period) {
    const ma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      ma.push(sum / period);
    }
    return ma;
  }

  // Helper: Calculate Correlation
  calculateCorrelation(arr1, arr2) {
    // Simplified correlation calculation
    if (arr1.length !== arr2.length) return 0;

    const n = arr1.length;
    const sum1 = arr1.reduce((a, b) => a + b, 0);
    const sum2 = arr2.reduce((a, b) => a + b, 0);
    const sum1Sq = arr1.reduce((a, b) => a + b * b, 0);
    const sum2Sq = arr2.reduce((a, b) => a + b * b, 0);
    const pSum = arr1.reduce((a, b, i) => a + b * arr2[i], 0);

    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

    return den === 0 ? 0 : num / den;
  }
}
