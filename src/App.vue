<template>
  <div class="app">
    <header class="header">
      <h1>🤖 BTC Signal AI</h1>
      <h2>Bitcoin 4-Dimensional Signal System</h2>
      <p class="subtitle">四维度信号系统</p>
    </header>

    <div class="container">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading market data...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="fetchData" class="retry-btn">Retry</button>
      </div>

      <div v-else class="content">
        <!-- Overall Signal -->
        <div class="overall-signal" :class="overallSignalClass">
          <div class="overall-header">
            <h2>Overall Signal</h2>
            <span class="overall-badge">{{ overallSignal.signal }}</span>
          </div>
          <div class="overall-score">
            <div class="score-circle">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" class="score-bg"></circle>
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  class="score-progress"
                  :style="{ strokeDashoffset: scoreOffset }"
                ></circle>
              </svg>
              <div class="score-number">{{ overallSignal.score }}</div>
            </div>
            <p class="recommendation">{{ overallSignal.recommendation }}</p>
          </div>
        </div>

        <!-- BTC Price Info -->
        <div class="price-info">
          <div class="price-item">
            <span class="price-label">Current Price</span>
            <span class="price-value">${{ currentPrice.toLocaleString() }}</span>
          </div>
          <div class="price-item">
            <span class="price-label">24h Change</span>
            <span class="price-change" :class="btcChange24h >= 0 ? 'positive' : 'negative'">
              {{ btcChange24h >= 0 ? '+' : '' }}{{ btcChange24h.toFixed(2) }}%
            </span>
          </div>
          <div class="price-item">
            <span class="price-label">Last Update</span>
            <span class="price-value">{{ formatTime(lastUpdate) }}</span>
          </div>
        </div>

        <!-- Signal Cards Grid -->
        <div class="signals-grid">
          <SignalCard
            title="📈 Trend (趋势)"
            :signal="trendSignal.signal"
            :score="trendSignal.score"
            :description="trendSignal.description"
            :data="trendSignal.data"
          />
          <SignalCard
            title="💰 Fund Flow (资金流)"
            :signal="flowSignal.signal"
            :score="flowSignal.score"
            :description="flowSignal.description"
            :data="flowSignal.data"
          />
          <SignalCard
            title="📊 Derivatives (衍生品)"
            :signal="derivativesSignal.signal"
            :score="derivativesSignal.score"
            :description="derivativesSignal.description"
            :data="derivativesSignal.data"
          />
          <SignalCard
            title="🌐 Macro (宏观)"
            :signal="macroSignal.signal"
            :score="macroSignal.score"
            :description="macroSignal.description"
            :data="macroSignal.data"
          />
        </div>

        <!-- Refresh Info -->
        <div class="refresh-info">
          <p>Auto-refresh: Every 24 hours at midnight</p>
          <button @click="fetchData" class="manual-refresh">🔄 Manual Refresh</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import SignalCard from './components/SignalCard.vue';
import { DataService } from './services/dataService.js';
import { SignalCalculator } from './services/signalCalculator.js';

export default {
  name: 'App',
  components: {
    SignalCard
  },
  setup() {
    const loading = ref(true);
    const error = ref(null);
    const currentPrice = ref(0);
    const btcChange24h = ref(0);
    const lastUpdate = ref(null);

    const trendSignal = ref({});
    const flowSignal = ref({});
    const derivativesSignal = ref({});
    const macroSignal = ref({});
    const overallSignal = ref({});

    const dataService = new DataService();
    const calculator = new SignalCalculator();

    let refreshInterval = null;

    const fetchData = async () => {
      loading.value = true;
      error.value = null;

      const data = await dataService.fetchAllData();

      // Update BTC price info if available
      if (data.currentPrice !== undefined) {
        currentPrice.value = data.currentPrice;
        btcChange24h.value = data.btcChange24h;
      } else {
        currentPrice.value = 0;
        btcChange24h.value = 0;
      }
      lastUpdate.value = data.lastUpdate;

      // Calculate signals for each dimension independently
      // Trend Signal (MA20/MA50)
      if (data.prices) {
        try {
          trendSignal.value = calculator.calculateTrendSignal(data.prices);
        } catch (err) {
          trendSignal.value = {
            signal: 'ERROR',
            score: 0,
            description: 'Unable to calculate trend signal',
            data: {}
          };
        }
      } else {
        trendSignal.value = {
          signal: 'ERROR',
          score: 0,
          description: data.errors.prices || 'Price data unavailable',
          data: {}
        };
      }

      // Fund Flow Signal (ETF)
      if (data.etfFlows) {
        try {
          flowSignal.value = calculator.calculateFlowSignal(data.etfFlows);
        } catch (err) {
          flowSignal.value = {
            signal: 'ERROR',
            score: 0,
            description: 'Unable to calculate flow signal',
            data: {}
          };
        }
      } else {
        flowSignal.value = {
          signal: 'ERROR',
          score: 0,
          description: data.errors.etfFlows || 'ETF flow data unavailable',
          data: {}
        };
      }

      // Derivatives Signal (Funding Rate + OI)
      if (data.derivatives) {
        try {
          derivativesSignal.value = calculator.calculateDerivativesSignal(
            data.derivatives.fundingRate,
            data.derivatives.openInterest,
            data.derivatives.oiChange
          );
        } catch (err) {
          derivativesSignal.value = {
            signal: 'ERROR',
            score: 0,
            description: 'Unable to calculate derivatives signal',
            data: {}
          };
        }
      } else {
        derivativesSignal.value = {
          signal: 'ERROR',
          score: 0,
          description: data.errors.derivatives || 'Derivatives data unavailable',
          data: {}
        };
      }

      // Macro Signal (NASDAQ)
      if (data.nasdaq && data.btcChange24h !== undefined) {
        try {
          macroSignal.value = calculator.calculateMacroSignal(
            data.btcChange24h,
            data.nasdaq.change
          );
        } catch (err) {
          macroSignal.value = {
            signal: 'ERROR',
            score: 0,
            description: 'Unable to calculate macro signal',
            data: {}
          };
        }
      } else {
        macroSignal.value = {
          signal: 'ERROR',
          score: 0,
          description: data.errors.nasdaq || 'NASDAQ data unavailable',
          data: {}
        };
      }

      // Calculate overall signal from available signals (excluding errors)
      const validSignals = [
        trendSignal.value,
        flowSignal.value,
        derivativesSignal.value,
        macroSignal.value
      ].filter(s => s.signal !== 'ERROR');

      if (validSignals.length > 0) {
        try {
          overallSignal.value = calculator.calculateOverallSignal(
            trendSignal.value.signal !== 'ERROR' ? trendSignal.value : { signal: 'NEUTRAL', score: 50 },
            flowSignal.value.signal !== 'ERROR' ? flowSignal.value : { signal: 'NEUTRAL', score: 50 },
            derivativesSignal.value.signal !== 'ERROR' ? derivativesSignal.value : { signal: 'NEUTRAL', score: 50 },
            macroSignal.value.signal !== 'ERROR' ? macroSignal.value : { signal: 'NEUTRAL', score: 50 }
          );
        } catch (err) {
          overallSignal.value = {
            signal: 'NEUTRAL',
            score: 50,
            recommendation: 'Insufficient data for overall signal'
          };
        }
      } else {
        overallSignal.value = {
          signal: 'ERROR',
          score: 0,
          recommendation: 'No data available. All API sources failed.'
        };
      }

      loading.value = false;
    };

    const setupAutoRefresh = () => {
      // Refresh every 24 hours
      refreshInterval = setInterval(() => {
        fetchData();
      }, 24 * 60 * 60 * 1000); // 24 hours
    };

    const formatTime = (date) => {
      if (!date) return '';
      return date.toLocaleString();
    };

    const overallSignalClass = computed(() => {
      const signal = overallSignal.value.signal?.toLowerCase() || '';
      if (signal.includes('strong_buy')) return 'strong-buy';
      if (signal.includes('buy')) return 'buy';
      if (signal.includes('strong_sell')) return 'strong-sell';
      if (signal.includes('sell')) return 'sell';
      return 'neutral';
    });

    const scoreOffset = computed(() => {
      const score = overallSignal.value.score || 0;
      const circumference = 2 * Math.PI * 45;
      return circumference - (score / 100) * circumference;
    });

    onMounted(() => {
      fetchData();
      setupAutoRefresh();
    });

    onUnmounted(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    });

    return {
      loading,
      error,
      currentPrice,
      btcChange24h,
      lastUpdate,
      trendSignal,
      flowSignal,
      derivativesSignal,
      macroSignal,
      overallSignal,
      fetchData,
      formatTime,
      overallSignalClass,
      scoreOffset
    };
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 36px;
  margin-bottom: 10px;
}

.header h2 {
  font-size: 20px;
  font-weight: 400;
  margin-bottom: 5px;
}

.subtitle {
  font-size: 16px;
  opacity: 0.9;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.loading, .error {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 20px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn, .manual-refresh {
  margin-top: 20px;
  padding: 10px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
}

.retry-btn:hover, .manual-refresh:hover {
  background: #5568d3;
}

.overall-signal {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.overall-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.overall-header h2 {
  font-size: 24px;
  color: #1f2937;
}

.overall-badge {
  padding: 8px 20px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
}

.overall-signal.strong-buy .overall-badge {
  background: #d1fae5;
  color: #065f46;
}

.overall-signal.buy .overall-badge {
  background: #d1fae5;
  color: #047857;
}

.overall-signal.neutral .overall-badge {
  background: #fef3c7;
  color: #92400e;
}

.overall-signal.sell .overall-badge {
  background: #fee2e2;
  color: #991b1b;
}

.overall-signal.strong-sell .overall-badge {
  background: #fee2e2;
  color: #7f1d1d;
}

.overall-score {
  display: flex;
  align-items: center;
  gap: 30px;
}

.score-circle {
  position: relative;
  width: 120px;
  height: 120px;
}

.score-circle svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.score-bg {
  fill: none;
  stroke: #f3f4f6;
  stroke-width: 8;
}

.score-progress {
  fill: none;
  stroke: #667eea;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 283;
  transition: stroke-dashoffset 1s ease;
}

.score-number {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
}

.recommendation {
  flex: 1;
  font-size: 18px;
  color: #4b5563;
  line-height: 1.6;
}

.price-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.price-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.price-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.price-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.price-change {
  font-size: 24px;
  font-weight: 700;
}

.price-change.positive {
  color: #10b981;
}

.price-change.negative {
  color: #ef4444;
}

.signals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.refresh-info {
  background: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.refresh-info p {
  color: #6b7280;
  margin-bottom: 15px;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 28px;
  }

  .overall-score {
    flex-direction: column;
    text-align: center;
  }

  .signals-grid {
    grid-template-columns: 1fr;
  }
}
</style>
