# AGENTS.md - Developer Guidelines for BTC Signal AI

This file provides guidelines for agentic coding agents working in this repository.

## Project Overview

Bitcoin 4-Dimensional Signal System - A Vue 3 application that analyzes BTC using four signal dimensions:
1. **Trend** - MA20/MA50 Golden Cross
2. **Fund Flow** - ETF 3-day Net Inflow
3. **Derivatives** - Funding Rate & Open Interest
4. **Macro** - NASDAQ Correlation

## Tech Stack

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Styling**: Plain CSS (scoped in components)

---

## Build & Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

### Running Tests

This project has no test framework configured. If tests are added:
- **Single test**: `npm test -- --testNamePattern="test name"`
- **All tests**: `npm test`
- **Watch mode**: `npm test -- --watch`

---

## Code Style Guidelines

### General Principles

- Write clean, readable code with meaningful variable/function names
- Prefer Vue 3 Composition API (`<script setup>`) for new components
- Use ES modules (`import`/`export`)
- Keep functions focused and small (single responsibility)

### Imports

```javascript
// Vue imports
import { ref, computed, onMounted } from 'vue';

// Component imports (relative paths)
import SignalCard from './components/SignalCard.vue';
import { DataService } from './services/dataService.js';
import { SignalCalculator } from './services/signalCalculator.js';

// External libraries
import axios from 'axios';
```

### Component Structure

```vue
<template>
  <!-- Template code -->
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'ComponentName',
  props: {
    title: String,
    signal: String,
    score: Number
  },
  emits: ['update'],
  setup(props, { emit }) {
    // Composition API logic
    return { /* exposed refs */ };
  }
};
</script>

<style scoped>
/* Scoped CSS */
</style>
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `SignalCard.vue`, `App.vue` |
| Services | PascalCase | `DataService.js`, `SignalCalculator.js` |
| Methods/Variables | camelCase | `fetchData`, `currentPrice` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| CSS Classes | kebab-case | `.signal-card`, `.price-value` |

### Vue Composition API Best Practices

```javascript
// Use ref for primitives, reactive for objects
const count = ref(0);
const user = reactive({ name: 'John', age: 30 });

// Use computed for derived state
const isValid = computed(() => count.value > 0);

// Use onMounted for initialization
onMounted(() => {
  fetchData();
});

// Use onUnmounted for cleanup
onUnmounted(() => {
  if (interval) clearInterval(interval);
});
```

### Error Handling

- Use try/catch for async operations
- Provide meaningful error messages
- Always throw descriptive errors, never silent failures
- Log errors to console with context

```javascript
async fetchData() {
  try {
    const response = await axios.get(url);
    if (!response.data) {
      throw new Error('Invalid response data');
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Error('Failed to fetch data. Please try again later.');
  }
}
```

### Data Validation

- Validate all API responses before processing
- Check for null/undefined values
- Sanity check data ranges (e.g., price changes > 30% are suspicious)

```javascript
if (!price || price <= 0) {
  throw new Error('Invalid price value');
}

if (Math.abs(change24h) > 30) {
  console.warn(`Unusually high change: ${change24h}%`);
}
```

### CSS Guidelines

- Use scoped styles (`<style scoped>`) to avoid conflicts
- Prefer flexbox and grid for layout
- Use CSS custom properties for colors if needed
- Keep responsive design in mind (mobile-first approach)

```css
.container {
  display: flex;
  gap: 20px;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
}
```

### Async Data Handling

- Use `Promise.allSettled()` for parallel independent requests
- Handle partial failures gracefully (show available data)
- Provide loading and error states in UI

```javascript
const results = await Promise.allSettled([
  this.fetchPrices(),
  this.fetchETFFlows()
]);

// Handle each result independently
if (results[0].status === 'fulfilled') {
  this.prices = results[0].value;
} else {
  console.error('Prices error:', results[0].reason);
}
```

---

## File Organization

```
src/
├── services/          # Business logic & API calls
│   ├── dataService.js
│   └── signalCalculator.js
├── components/        # Vue components
│   └── SignalCard.vue
├── App.vue            # Root component
└── main.js            # Entry point
```

---

## Common Patterns

### Signal Objects

Each signal dimension returns this structure:
```javascript
{
  signal: 'BUY' | 'SELL' | 'NEUTRAL' | 'STRONG_BUY' | 'STRONG_SELL' | 'ERROR',
  score: 0-100,
  description: 'Human readable description',
  data: { /* raw data values */ }
}
```

### Component Props

- Always define prop types
- Use required props appropriately
- Provide default values for optional props

---

## API Endpoints Used

- CoinGecko: BTC prices & current price
- bitcoin-data.com: ETF flows, Open Interest
- Binance: Funding Rate
- Yahoo Finance: NASDAQ data
- corsproxy.io: CORS proxy for browser requests

---

## Notes for Agents

1. **No TypeScript** - This is a plain JavaScript Vue project
2. **No linting** - No ESLint or Prettier configured
3. **No tests** - Consider adding Vitest for future test coverage
4. **CORS handling** - Uses `https://corsproxy.io/?` for cross-origin API calls
5. **Auto-refresh** - Data refreshes every 24 hours; can trigger manual refresh