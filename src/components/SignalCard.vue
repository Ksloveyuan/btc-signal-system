<template>
  <div class="signal-card" :class="signalClass">
    <div class="card-header">
      <h3>{{ title }}</h3>
      <span class="signal-badge" :class="signalClass">{{ signal }}</span>
    </div>
    <div class="score-bar">
      <div class="score-fill" :style="{ width: score + '%' }"></div>
      <span class="score-text">{{ score }}/100</span>
    </div>
    <p class="description">{{ description }}</p>
    <div class="data-points" v-if="data">
      <div v-for="(value, key) in data" :key="key" class="data-point">
        <span class="data-label">{{ formatLabel(key) }}:</span>
        <span class="data-value">{{ formatValue(value, key) }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SignalCard',
  props: {
    title: String,
    signal: String,
    score: Number,
    description: String,
    data: Object
  },
  computed: {
    signalClass() {
      const signal = this.signal.toLowerCase();
      if (signal.includes('error')) return 'error';
      if (signal.includes('strong_buy')) return 'strong-buy';
      if (signal.includes('buy')) return 'buy';
      if (signal.includes('strong_sell')) return 'strong-sell';
      if (signal.includes('sell')) return 'sell';
      return 'neutral';
    }
  },
  methods: {
    formatLabel(key) {
      const labels = {
        ma20: 'MA20',
        ma50: 'MA50',
        totalFlow: 'Total 3D Flow',
        avgDailyFlow: 'Avg Daily',
        fundingRate: 'Funding Rate',
        openInterest: 'Open Interest',
        oiChange: 'OI Change',
        btcChange: 'BTC 24h',
        nasdaqChange: 'NASDAQ',
        correlation: 'Correlation'
      };
      return labels[key] || key;
    },
    formatValue(value, key) {
      if (typeof value === 'number') {
        // Large numbers are dollar amounts (MA prices, OI)
        if (Math.abs(value) > 1000) {
          return '$' + value.toFixed(0);
        }

        // Funding rates are very small decimals - need to multiply by 100
        if (key === 'fundingRate') {
          return (value * 100).toFixed(4) + '%';
        }

        // These are already in percentage format from APIs
        if (key === 'btcChange' || key === 'nasdaqChange' || key === 'oiChange') {
          return value.toFixed(2) + '%';
        }

        // Default formatting
        return value.toFixed(2);
      }
      return value;
    }
  }
};
</script>

<style scoped>
.signal-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  border-left: 4px solid #ccc;
}

.signal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.signal-card.strong-buy {
  border-left-color: #10b981;
}

.signal-card.buy {
  border-left-color: #34d399;
}

.signal-card.neutral {
  border-left-color: #fbbf24;
}

.signal-card.sell {
  border-left-color: #f87171;
}

.signal-card.strong-sell {
  border-left-color: #ef4444;
}

.signal-card.error {
  border-left-color: #9ca3af;
  opacity: 0.7;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.signal-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.signal-badge.strong-buy {
  background: #d1fae5;
  color: #065f46;
}

.signal-badge.buy {
  background: #d1fae5;
  color: #047857;
}

.signal-badge.neutral {
  background: #fef3c7;
  color: #92400e;
}

.signal-badge.sell {
  background: #fee2e2;
  color: #991b1b;
}

.signal-badge.strong-sell {
  background: #fee2e2;
  color: #7f1d1d;
}

.signal-badge.error {
  background: #f3f4f6;
  color: #6b7280;
}

.score-bar {
  position: relative;
  height: 24px;
  background: #f3f4f6;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444 0%, #fbbf24 50%, #10b981 100%);
  transition: width 0.6s ease;
}

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
}

.description {
  font-size: 14px;
  color: #6b7280;
  margin: 12px 0;
  line-height: 1.5;
}

.data-points {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.data-point {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.data-label {
  color: #6b7280;
  font-weight: 500;
}

.data-value {
  color: #1f2937;
  font-weight: 600;
}
</style>
