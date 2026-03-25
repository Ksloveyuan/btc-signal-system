import axios from 'axios';

/**
 * Data Service for fetching market data
 * Note: Using public APIs with CORS proxies or mock data for demo
 */

export class DataService {
  constructor() {
    this.btcPrices = [];
    this.lastUpdate = null;
    // CORS proxy for APIs that don't allow direct browser access
    this.corsProxy = 'https://corsproxy.io/?';
  }

  /**
   * Fetch BTC price history from CoinGecko
   */
  async fetchBTCPrices(days = 60) {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart`,
        {
          params: {
            vs_currency: 'usd',
            days: days,
            interval: 'daily'
          }
        }
      );

      if (!response.data || !response.data.prices) {
        throw new Error('Invalid BTC price data received');
      }

      this.btcPrices = response.data.prices.map(p => p[1]);
      return this.btcPrices;
    } catch (error) {
      console.error('Error fetching BTC prices:', error);
      throw new Error('Failed to fetch BTC price history. Please try again later.');
    }
  }

  /**
   * Fetch current BTC price
   */
  async fetchCurrentBTCPrice() {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price',
        {
          params: {
            ids: 'bitcoin',
            vs_currencies: 'usd',
            include_24hr_change: 'true'
          }
        }
      );

      if (!response.data || !response.data.bitcoin) {
        throw new Error('Invalid BTC price data received');
      }

      const price = response.data.bitcoin.usd;
      const change24h = response.data.bitcoin.usd_24h_change;

      console.log('BTC Price Data:', { price, change24h });

      // Validate data
      if (!price || price <= 0) {
        throw new Error('Invalid BTC price value');
      }

      if (change24h === null || change24h === undefined || isNaN(change24h)) {
        throw new Error('Invalid BTC 24h change value');
      }

      // Sanity check - BTC shouldn't change more than 30% in a day normally
      if (Math.abs(change24h) > 30) {
        console.warn(`BTC change ${change24h.toFixed(2)}% seems unusually high`);
      }

      return {
        price: price,
        change24h: change24h
      };
    } catch (error) {
      console.error('Error fetching current BTC price:', error);
      throw new Error('Failed to fetch current BTC price. Please try again later.');
    }
  }

  /**
   * Fetch ETF flow data using CoinGecko volume as proxy
   * Bitcoin trading volume changes indicate institutional flow direction
   */
  async fetchETFFlows() {
    try {
      // Use CoinGecko volume data as a proxy for ETF flows
      // Volume increases = positive flow, decreases = negative flow
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart',
        {
          params: {
            vs_currency: 'usd',
            days: 30,
            interval: 'daily'
          }
        }
      );

      if (!response.data || !response.data.total_volumes) {
        throw new Error('Invalid volume data format');
      }

      const volumes = response.data.total_volumes.map(v => v[1]);

      if (volumes.length === 0) {
        throw new Error('No volume data available');
      }

      // Calculate flow as volume change percentage
      // Normalize to millions of dollars equivalent
      const flows = [];
      for (let i = 1; i < volumes.length; i++) {
        const prevVolume = volumes[i - 1];
        const currentVolume = volumes[i];
        const volumeChange = ((currentVolume - prevVolume) / prevVolume) * 100;

        // Convert percentage change to estimated flow in millions
        // Assuming avg volume of 30B, 1% change = 300M flow
        const estimatedFlow = (volumeChange * 300);
        flows.push(estimatedFlow);
      }

      console.log('ETF Flow Data (estimated from volume):', flows.slice(-7));

      return flows.slice(-30);
    } catch (error) {
      console.error('Error fetching ETF flows:', error);
      throw new Error('Failed to fetch ETF flow data. Volume data unavailable.');
    }
  }

  /**
   * Fetch Funding Rate and Open Interest from Binance
   */
  async fetchDerivativesData() {
    try {
      // Fetch current data from Binance (no CORS issues)
      const [fundingResponse, oiResponse] = await Promise.all([
        axios.get('https://fapi.binance.com/fapi/v1/premiumIndex', {
          params: { symbol: 'BTCUSDT' }
        }),
        axios.get('https://fapi.binance.com/fapi/v1/openInterest', {
          params: { symbol: 'BTCUSDT' }
        })
      ]);

      if (!fundingResponse.data || !oiResponse.data) {
        throw new Error('Invalid derivatives data received');
      }

      const currentOI = parseFloat(oiResponse.data.openInterest);
      const fundingRate = parseFloat(fundingResponse.data.lastFundingRate);

      // Fetch OI history from CoinGlass with CORS proxy
      let oiChange = 0;
      try {
        const histUrl = `${this.corsProxy}https://open-api.coinglass.com/public/v2/indicator/open_interest_history?symbol=BTC&interval=24h`;
        const histResponse = await axios.get(histUrl);

        if (histResponse.data && histResponse.data.data && histResponse.data.data.length > 1) {
          const historicalOI = histResponse.data.data[histResponse.data.data.length - 2].openInterest;
          oiChange = ((currentOI - historicalOI) / historicalOI) * 100;
        }
      } catch (histError) {
        console.warn('Could not fetch OI history, using 0% change:', histError);
      }

      return {
        fundingRate,
        openInterest: currentOI,
        oiChange
      };
    } catch (error) {
      console.error('Error fetching derivatives data:', error);
      throw new Error('Failed to fetch derivatives data (Funding Rate & Open Interest).');
    }
  }

  /**
   * Fetch NASDAQ index data from Yahoo Finance API with CORS proxy
   */
  async fetchNASDAQData() {
    try {
      const url = `${this.corsProxy}https://query1.finance.yahoo.com/v8/finance/chart/%5EIXIC?interval=1d&range=2d`;
      const response = await axios.get(url);

      console.log('NASDAQ API Response:', response.data);

      if (!response.data || !response.data.chart || !response.data.chart.result[0]) {
        throw new Error('Invalid NASDAQ data format');
      }

      const result = response.data.chart.result[0];
      const quote = result.indicators.quote[0];

      if (!quote.close || quote.close.length < 2) {
        throw new Error('Insufficient NASDAQ price data');
      }

      // Filter out null values
      const validPrices = quote.close.filter(p => p !== null && !isNaN(p));

      if (validPrices.length < 2) {
        throw new Error('Insufficient valid NASDAQ price data');
      }

      const currentPrice = validPrices[validPrices.length - 1];
      const previousPrice = validPrices[validPrices.length - 2];

      console.log('NASDAQ prices:', { currentPrice, previousPrice });

      if (!currentPrice || !previousPrice || currentPrice <= 0 || previousPrice <= 0) {
        throw new Error('Invalid NASDAQ price values');
      }

      const change = ((currentPrice - previousPrice) / previousPrice) * 100;

      console.log('NASDAQ change calculated:', change);

      // Sanity check - NASDAQ shouldn't change more than 10% in a day
      if (Math.abs(change) > 10) {
        throw new Error(`NASDAQ change ${change.toFixed(2)}% seems unrealistic`);
      }

      return {
        change: change,
        value: currentPrice
      };
    } catch (error) {
      console.error('Error fetching NASDAQ data:', error);
      throw new Error('Failed to fetch NASDAQ data. Market data may be unavailable.');
    }
  }

  /**
   * Fetch all data needed for signals - NON-BLOCKING
   * Each data source is independent and won't block others
   */
  async fetchAllData() {
    this.lastUpdate = new Date();

    // Fetch all data in parallel, catch individual errors
    const results = await Promise.allSettled([
      this.fetchBTCPrices(60),
      this.fetchCurrentBTCPrice(),
      this.fetchETFFlows(),
      this.fetchDerivativesData(),
      this.fetchNASDAQData()
    ]);

    const [pricesResult, currentPriceResult, etfFlowsResult, derivativesResult, nasdaqResult] = results;

    // Build response with available data
    const response = {
      lastUpdate: this.lastUpdate,
      errors: {}
    };

    // BTC Prices (for trend calculation)
    if (pricesResult.status === 'fulfilled') {
      response.prices = pricesResult.value;
    } else {
      response.errors.prices = pricesResult.reason.message;
      console.error('BTC Prices error:', pricesResult.reason);
    }

    // Current BTC Price
    if (currentPriceResult.status === 'fulfilled') {
      response.currentPrice = currentPriceResult.value.price;
      response.btcChange24h = currentPriceResult.value.change24h;
    } else {
      response.errors.currentPrice = currentPriceResult.reason.message;
      console.error('Current BTC Price error:', currentPriceResult.reason);
    }

    // ETF Flows
    if (etfFlowsResult.status === 'fulfilled') {
      response.etfFlows = etfFlowsResult.value;
    } else {
      response.errors.etfFlows = etfFlowsResult.reason.message;
      console.error('ETF Flows error:', etfFlowsResult.reason);
    }

    // Derivatives
    if (derivativesResult.status === 'fulfilled') {
      response.derivatives = derivativesResult.value;
    } else {
      response.errors.derivatives = derivativesResult.reason.message;
      console.error('Derivatives error:', derivativesResult.reason);
    }

    // NASDAQ
    if (nasdaqResult.status === 'fulfilled') {
      response.nasdaq = nasdaqResult.value;
    } else {
      response.errors.nasdaq = nasdaqResult.reason.message;
      console.error('NASDAQ error:', nasdaqResult.reason);
    }

    return response;
  }
}
