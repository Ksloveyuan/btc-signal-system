# BTC Signal AI - 4D Analysis System

A Vue 3 application that implements a 4-dimensional Bitcoin signal system with automatic daily refresh.

## 四维度信号系统 (4-Dimensional Signal System)

### 1. 📈 Trend Dimension (趋势维度)
- **Indicators**: MA20 & MA50 Moving Averages
- **Signals**: Golden Cross / Death Cross detection
- **Weight**: 35%

### 2. 💰 Fund Flow Dimension (资金流维度)
- **Indicators**: ETF 3-day Net Inflow
- **Analysis**: Institutional buying/selling behavior
- **Weight**: 30%

### 3. 📊 Derivatives Dimension (衍生品维度)
- **Indicators**: Funding Rate + Open Interest
- **Analysis**: Leverage overheating detection
- **Weight**: 20%

### 4. 🌐 Macro Dimension (宏观维度)
- **Indicators**: NASDAQ correlation
- **Analysis**: Macro environment impact
- **Weight**: 15%

## Features

- ✅ Real-time Bitcoin price tracking
- ✅ 4-dimensional signal analysis
- ✅ Overall signal scoring (0-100)
- ✅ Auto-refresh every 24 hours
- ✅ Manual refresh button
- ✅ Responsive design
- ✅ Visual signal cards with color coding
- ✅ Data from CoinGecko & Binance APIs

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Steps

1. **Install dependencies**:
```bash
npm install
```

2. **Run development server**:
```bash
npm run dev
```

3. **Open browser**:
Navigate to `http://localhost:3000`

4. **Build for production**:
```bash
npm run build
```

5. **Preview production build**:
```bash
npm run preview
```

## Project Structure

```
btc1/
├── src/
│   ├── components/
│   │   └── SignalCard.vue       # Individual signal dimension card
│   ├── services/
│   │   ├── dataService.js       # API data fetching service
│   │   └── signalCalculator.js  # Signal calculation logic
│   ├── App.vue                   # Main application component
│   └── main.js                   # Application entry point
├── index.html
├── vite.config.js
└── package.json
```

## Signal Interpretation

### Signal Types
- **STRONG_BUY**: Strong bullish signals (Score: 75-100)
- **BUY**: Bullish bias (Score: 60-74)
- **NEUTRAL**: Mixed signals (Score: 40-59)
- **SELL**: Bearish bias (Score: 25-39)
- **STRONG_SELL**: Strong bearish signals (Score: 0-24)

### Overall Score Calculation
```
Overall Score =
  Trend × 0.35 +
  Fund Flow × 0.30 +
  Derivatives × 0.20 +
  Macro × 0.15
```

## Data Sources

- **BTC Price & Trend**: CoinGecko API (real-time prices + 60-day history)
- **ETF Flows**: CoinGecko Volume Data (volume changes as flow proxy)
  - Note: Real ETF flow data requires premium APIs (CoinGlass, Bloomberg, etc.)
  - Volume increases indicate positive flow, decreases indicate negative flow
- **Derivatives**: Binance Futures API (real-time funding rate + open interest)
- **NASDAQ**: Yahoo Finance API via CORS proxy (real-time NASDAQ Composite)

## Auto-Refresh

The application automatically refreshes data every 24 hours. You can also manually refresh by clicking the "Manual Refresh" button.

## Customization

### Adjust Signal Weights
Edit `src/services/signalCalculator.js` at line ~172:
```javascript
const weights = {
  trend: 0.35,      // Adjust trend weight
  flow: 0.30,       // Adjust flow weight
  derivatives: 0.20, // Adjust derivatives weight
  macro: 0.15       // Adjust macro weight
};
```

### Change Refresh Interval
Edit `src/App.vue` at line ~108:
```javascript
refreshInterval = setInterval(() => {
  fetchData();
}, 24 * 60 * 60 * 1000); // Change 24 to desired hours
```

## API Rate Limits

- CoinGecko: 10-50 calls/minute (free tier)
- Binance: No authentication required for market data

## License

MIT

## Disclaimer

This tool is for educational and informational purposes only. Not financial advice. Always do your own research before making investment decisions.
