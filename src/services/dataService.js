import axios from "axios";

/**
 * Data Service for fetching market data
 * Note: Using public APIs with CORS proxies or mock data for demo
 */

export class DataService {
  constructor() {
    this.btcPrices = [];
    this.lastUpdate = null;
    this.corsProxies = [
      "https://corsproxy.io/?",
    ];
    this.currentProxyIndex = 0;
  }

  getProxyUrl(url) {
    const proxy = this.corsProxies[this.currentProxyIndex];
    return proxy + encodeURIComponent(url);
  }

  rotateProxy() {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.corsProxies.length;
  }

  /**
   * Fetch BTC price history from CoinGecko
   */
  async fetchBTCPrices(days = 60) {
    try {
      const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`;
      const response = await this.fetchWithProxy(url);

      if (!response.data || !response.data.prices) {
        throw new Error("Invalid BTC price data received");
      }

      this.btcPrices = response.data.prices.map((p) => p[1]);
      return this.btcPrices;
    } catch (error) {
      console.error("Error fetching BTC prices:", error);
      throw new Error(
        "Failed to fetch BTC price history. Please try again later."
      );
    }
  }

  /**
   * Fetch current BTC price
   */
  async fetchCurrentBTCPrice() {
    try {
      const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true";
      const response = await this.fetchWithProxy(url);

      if (!response.data || !response.data.bitcoin) {
        throw new Error("Invalid BTC price data received");
      }

      const price = response.data.bitcoin.usd;
      const change24h = response.data.bitcoin.usd_24h_change;

      console.log("BTC Price Data:", { price, change24h });

      // Validate data
      if (!price || price <= 0) {
        throw new Error("Invalid BTC price value");
      }

      if (change24h === null || change24h === undefined || isNaN(change24h)) {
        throw new Error("Invalid BTC 24h change value");
      }

      // Sanity check - BTC shouldn't change more than 30% in a day normally
      if (Math.abs(change24h) > 30) {
        console.warn(
          `BTC change ${change24h.toFixed(2)}% seems unusually high`
        );
      }

      return {
        price: price,
        change24h: change24h,
      };
    } catch (error) {
      console.error("Error fetching current BTC price:", error);
      throw new Error(
        "Failed to fetch current BTC price. Please try again later."
      );
    }
  }

  async fetchWithProxy(url, maxRetries = 2) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const proxyUrl = this.getProxyUrl(url);
        const response = await axios.get(proxyUrl);
        return response;
      } catch (error) {
        console.warn(`Proxy attempt ${attempt + 1} failed, rotating...`, error.message);
        this.rotateProxy();
      }
    }
    throw new Error("All CORS proxies failed");
  }

  /**
   * Fetch ETF flow data from bitcoin-data.com
   * Real Bitcoin ETF flow data in BTC
   */
  async fetchETFFlows() {
    try {
      const url = "https://bitcoin-data.com/api/v1/etf-flow-btc?last=30";
      const response = await this.fetchWithProxy(url);

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid ETF flow data format");
      }

      const flowData = response.data;

      if (flowData.length === 0) {
        throw new Error("No ETF flow data available");
      }

      // Extract flow values (already in BTC)
      const flows = flowData.map((item) => parseFloat(item.etfFlow) || 0);

      console.log("ETF Flow Data (BTC):", flows.slice(-7));

      return flows;
    } catch (error) {
      console.error("Error fetching ETF flows:", error);
      throw new Error("Failed to fetch ETF flow data from bitcoin-data.com.");
    }
  }

  /**
   * Fetch Funding Rate and Open Interest from Binance
   */
  async fetchDerivativesData() {
    try {
      // Fetch funding rate from Binance with CORS proxy
      const fundingUrl = "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT";
      const fundingResponse = await this.fetchWithProxy(fundingUrl);

      if (!fundingResponse.data) {
        throw new Error("Invalid funding rate data received");
      }

      const fundingRate = parseFloat(fundingResponse.data.lastFundingRate);

      // Fetch OI history from bitcoin-data.com with CORS proxy
      let openInterest = 0;
      let oiChange = 0;
      try {
        const oiUrl = "https://bitcoin-data.com/api/v1/open-interest-1h?last=48";
        const oiResponse = await this.fetchWithProxy(oiUrl);

        if (oiResponse.data && Array.isArray(oiResponse.data) && oiResponse.data.length > 1) {
          const currentOI = parseFloat(oiResponse.data[oiResponse.data.length - 1].sumOpenInterest);
          const yesterday24hAgo = oiResponse.data[oiResponse.data.length - 25]; // 24 hours ago (24 * 1h)

          if (yesterday24hAgo) {
            const historicalOI = parseFloat(yesterday24hAgo.sumOpenInterest);
            oiChange = ((currentOI - historicalOI) / historicalOI) * 100;
          }

          openInterest = currentOI;
        }
      } catch (oiError) {
        console.warn("Could not fetch OI history, using 0 values:", oiError);
      }

      return {
        fundingRate,
        openInterest,
        oiChange,
      };
    } catch (error) {
      console.error("Error fetching derivatives data:", error);
      throw new Error(
        "Failed to fetch derivatives data (Funding Rate & Open Interest)."
      );
    }
  }

  /**
   * Fetch NASDAQ index data from Yahoo Finance API with CORS proxy
   */
  async fetchNASDAQData() {
    try {
      const url = "https://query1.finance.yahoo.com/v8/finance/chart/%5EIXIC?interval=1d&range=2d";
      const response = await this.fetchWithProxy(url);

      console.log("NASDAQ API Response:", response.data);

      if (
        !response.data ||
        !response.data.chart ||
        !response.data.chart.result[0]
      ) {
        throw new Error("Invalid NASDAQ data format");
      }

      const result = response.data.chart.result[0];
      const quote = result.indicators.quote[0];

      if (!quote.close || quote.close.length < 2) {
        throw new Error("Insufficient NASDAQ price data");
      }

      // Filter out null values
      const validPrices = quote.close.filter((p) => p !== null && !isNaN(p));

      if (validPrices.length < 2) {
        throw new Error("Insufficient valid NASDAQ price data");
      }

      const currentPrice = validPrices[validPrices.length - 1];
      const previousPrice = validPrices[validPrices.length - 2];

      console.log("NASDAQ prices:", { currentPrice, previousPrice });

      if (
        !currentPrice ||
        !previousPrice ||
        currentPrice <= 0 ||
        previousPrice <= 0
      ) {
        throw new Error("Invalid NASDAQ price values");
      }

      const change = ((currentPrice - previousPrice) / previousPrice) * 100;

      console.log("NASDAQ change calculated:", change);

      // Sanity check - NASDAQ shouldn't change more than 10% in a day
      if (Math.abs(change) > 10) {
        throw new Error(
          `NASDAQ change ${change.toFixed(2)}% seems unrealistic`
        );
      }

      return {
        change: change,
        value: currentPrice,
      };
    } catch (error) {
      console.error("Error fetching NASDAQ data:", error);
      throw new Error(
        "Failed to fetch NASDAQ data. Market data may be unavailable."
      );
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
      this.fetchNASDAQData(),
    ]);

    const [
      pricesResult,
      currentPriceResult,
      etfFlowsResult,
      derivativesResult,
      nasdaqResult,
    ] = results;

    // Build response with available data
    const response = {
      lastUpdate: this.lastUpdate,
      errors: {},
    };

    // BTC Prices (for trend calculation)
    if (pricesResult.status === "fulfilled") {
      response.prices = pricesResult.value;
    } else {
      response.errors.prices = pricesResult.reason.message;
      console.error("BTC Prices error:", pricesResult.reason);
    }

    // Current BTC Price
    if (currentPriceResult.status === "fulfilled") {
      response.currentPrice = currentPriceResult.value.price;
      response.btcChange24h = currentPriceResult.value.change24h;
    } else {
      response.errors.currentPrice = currentPriceResult.reason.message;
      console.error("Current BTC Price error:", currentPriceResult.reason);
    }

    // ETF Flows
    if (etfFlowsResult.status === "fulfilled") {
      response.etfFlows = etfFlowsResult.value;
    } else {
      response.errors.etfFlows = etfFlowsResult.reason.message;
      console.error("ETF Flows error:", etfFlowsResult.reason);
    }

    // Derivatives
    if (derivativesResult.status === "fulfilled") {
      response.derivatives = derivativesResult.value;
    } else {
      response.errors.derivatives = derivativesResult.reason.message;
      console.error("Derivatives error:", derivativesResult.reason);
    }

    // NASDAQ
    if (nasdaqResult.status === "fulfilled") {
      response.nasdaq = nasdaqResult.value;
    } else {
      response.errors.nasdaq = nasdaqResult.reason.message;
      console.error("NASDAQ error:", nasdaqResult.reason);
    }

    return response;
  }
}
