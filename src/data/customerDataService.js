/**
 * CUSTOMER DATA & MODEL INTEGRATION SERVICE
 * 
 * Architectural separation:
 * Acts as the single source of truth for customer records, model execution,
 * dynamic benchmark derivation (medians), and dataset state.
 * 
 * Provides clean hooks for replacing demo data with real exported Task 5 data.
 */

import { RAW_DEMO_CUSTOMERS, IS_DEMO_DATA, DEMO_DATA_SOURCE_NAME } from './demoCustomers.js';
import { predictRepeatProbability } from '../model/logisticRegressionModel.js';
import { classifyCustomerRetention, generateCustomerExplanation } from '../rules/retentionRules.js';

class CustomerDataService {
  constructor() {
    this.isDemoMode = IS_DEMO_DATA;
    this.dataSourceName = DEMO_DATA_SOURCE_NAME;
    this.rawCustomers = [...RAW_DEMO_CUSTOMERS];
    this.processedCustomers = [];
    this.benchmarks = {};
    this.kpis = {};
    this.listeners = [];

    // Initialize with demo cohort
    this.recalculatePortfolio();
  }

  /**
   * Calculates numerical median of an array
   * @param {Array<number>} values 
   * @returns {number}
   */
  calculateMedian(values) {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
  }

  /**
   * Derives portfolio-level benchmarks (medians) directly from the active dataset
   */
  derivePortfolioBenchmarks() {
    const aovs = this.rawCustomers.map(c => Number(c.AverageOrderValue) || 0);
    const diversities = this.rawCustomers.map(c => Number(c.ProductDiversity) || 1);
    const recencies = this.rawCustomers.map(c => Number(c.Recency) || 0);
    const frequencies = this.rawCustomers.map(c => Number(c.Frequency) || 1);
    const tenures = this.rawCustomers.map(c => Number(c.CustomerTenure) || 0);

    this.benchmarks = {
      medianAOV: this.calculateMedian(aovs),
      medianProductDiversity: this.calculateMedian(diversities),
      medianRecency: this.calculateMedian(recencies),
      medianFrequency: this.calculateMedian(frequencies),
      medianTenure: this.calculateMedian(tenures)
    };
  }

  /**
   * Runs the statistical model and business rules across all customers in portfolio
   */
  recalculatePortfolio() {
    this.derivePortfolioBenchmarks();

    this.processedCustomers = this.rawCustomers.map(customer => {
      // 1. Model Prediction via Task 5 Standard Logistic Regression
      const prediction = predictRepeatProbability(customer);

      // 2. Business Rules Prioritisation & Proposed Action
      const segment = classifyCustomerRetention(prediction.probability, customer, this.benchmarks);

      // 3. Human-friendly non-technical explanation
      const explanation = generateCustomerExplanation(customer, prediction.probability, segment, this.benchmarks);

      return {
        ...customer,
        prediction,
        repeatProbability: prediction.probability,
        probabilityFormatted: prediction.percentage + '%',
        segment,
        proposedAction: segment.proposedAction,
        explanation
      };
    });

    this.computeKPIs();
    this.notifyListeners();
  }

  /**
   * Computes Executive KPI summaries across the active customer cohort
   */
  computeKPIs() {
    const total = this.processedCustomers.length;
    if (total === 0) {
      this.kpis = {
        totalCustomers: 0,
        highValueAtRiskCount: 0,
        highValueAtRiskPct: '0.0%',
        loyalActiveCount: 0,
        loyalActivePct: '0.0%',
        crossSellCount: 0,
        monitorNurtureCount: 0,
        lowerPriorityCount: 0,
        averageRepeatProbability: 0,
        averageRepeatProbabilityFormatted: '0.0%',
        segmentCounts: {}
      };
      return;
    }

    let atRiskCount = 0;
    let loyalCount = 0;
    let crossSellCount = 0;
    let monitorCount = 0;
    let lowerPriorityCount = 0;
    let totalProb = 0;

    for (const c of this.processedCustomers) {
      totalProb += c.repeatProbability;
      switch (c.segment.id) {
        case 'HIGH_VALUE_AT_RISK':
          atRiskCount++;
          break;
        case 'LOYAL_ACTIVE':
          loyalCount++;
          break;
        case 'CROSS_SELL_OPPORTUNITY':
          crossSellCount++;
          break;
        case 'MONITOR_NURTURE':
          monitorCount++;
          break;
        case 'LOWER_PRIORITY':
        default:
          lowerPriorityCount++;
          break;
      }
    }

    const avgProb = totalProb / total;

    this.kpis = {
      totalCustomers: total,
      highValueAtRiskCount: atRiskCount,
      highValueAtRiskPct: ((atRiskCount / total) * 100).toFixed(1) + '%',
      loyalActiveCount: loyalCount,
      loyalActivePct: ((loyalCount / total) * 100).toFixed(1) + '%',
      crossSellCount: crossSellCount,
      monitorNurtureCount: monitorCount,
      lowerPriorityCount: lowerPriorityCount,
      averageRepeatProbability: avgProb,
      averageRepeatProbabilityFormatted: (avgProb * 100).toFixed(1) + '%',
      segmentCounts: {
        HIGH_VALUE_AT_RISK: atRiskCount,
        LOYAL_ACTIVE: loyalCount,
        CROSS_SELL_OPPORTUNITY: crossSellCount,
        MONITOR_NURTURE: monitorCount,
        LOWER_PRIORITY: lowerPriorityCount
      }
    };
  }

  /**
   * API to replace demo dataset with real customer data (e.g. from Task 5 export)
   * @param {Array<Object>} newCustomers - Array of raw customer records
   * @param {string} sourceName - Identifier for the data source
   */
  loadCustomData(newCustomers, sourceName = 'Uploaded Customer Dataset') {
    if (!Array.isArray(newCustomers) || newCustomers.length === 0) {
      throw new Error('Invalid dataset: Expected a non-empty array of customer records.');
    }

    this.rawCustomers = newCustomers;
    this.isDemoMode = false;
    this.dataSourceName = sourceName;
    this.recalculatePortfolio();
  }

  /**
   * Restores the default synthetic demo cohort
   */
  restoreDemoData() {
    this.rawCustomers = [...RAW_DEMO_CUSTOMERS];
    this.isDemoMode = true;
    this.dataSourceName = DEMO_DATA_SOURCE_NAME;
    this.recalculatePortfolio();
  }

  /**
   * Retrieves all processed customers
   * @returns {Array<Object>}
   */
  getAllCustomers() {
    return this.processedCustomers;
  }

  /**
   * Finds a customer by ID
   * @param {string|number} customerId 
   * @returns {Object|null}
   */
  getCustomerById(customerId) {
    const id = String(customerId).trim();
    return this.processedCustomers.find(c => String(c.CustomerID) === id) || null;
  }

  /**
   * Gets portfolio benchmarks (medians)
   */
  getBenchmarks() {
    return this.benchmarks;
  }

  /**
   * Gets Executive KPIs
   */
  getKPIs() {
    return this.kpis;
  }

  /**
   * Event listener subscription for reactive updates
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (err) {
        console.error('Error in CustomerDataService listener:', err);
      }
    }
  }
}

export const customerDataService = new CustomerDataService();
