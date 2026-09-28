/**
 * =========================================================================
 * RETENTION SEGMENTATION & PROPOSED ACTION BUSINESS RULES (TASK 10)
 * =========================================================================
 * 
 * "These thresholds are illustrative business rules for the Task 10 proof-of-concept. 
 *  They are not statistically estimated causal treatment thresholds and require validation 
 *  before production deployment."
 * 
 * Architectural separation:
 * This module defines the decision-support logic that maps statistical model predictions
 * (predict_proba) and historical customer metrics into actionable retention tiers.
 * 
 * Always called: "Proposed Action" (NEVER "Optimal Action"), as these interventions
 * have not been experimentally validated.
 */

export const RETENTION_CONFIG = {
  // Prototype decision thresholds (configurable)
  LOW_REPEAT_THRESHOLD: 0.40,
  HIGH_REPEAT_THRESHOLD: 0.70,

  // Segment Definitions
  SEGMENTS: {
    HIGH_VALUE_AT_RISK: {
      id: 'HIGH_VALUE_AT_RISK',
      label: 'High-Value At-Risk',
      shortCode: 'AT-RISK',
      badgeClass: 'badge-at-risk',
      color: '#dc2626',
      bgLight: '#fef2f2',
      border: '#fecaca',
      proposedAction: 'Re-engagement campaign / retention offer',
      actionRationale: 'Customer represents substantial historical revenue but shows waning repeat probability. Priority intervention recommended.',
      channel: 'Personalized VIP Outreach / Time-sensitive Incentive'
    },
    LOYAL_ACTIVE: {
      id: 'LOYAL_ACTIVE',
      label: 'Loyal / Active',
      shortCode: 'LOYAL',
      badgeClass: 'badge-loyal',
      color: '#059669',
      bgLight: '#ecfdf5',
      border: '#a7f3d0',
      proposedAction: 'Loyalty recognition / relationship maintenance',
      actionRationale: 'Customer maintains strong recency and high predicted repeat likelihood. Focus on appreciation without margin-eroding discounts.',
      channel: 'Loyalty Rewards / Early Access to New Collections'
    },
    CROSS_SELL_OPPORTUNITY: {
      id: 'CROSS_SELL_OPPORTUNITY',
      label: 'Cross-Sell Opportunity',
      shortCode: 'CROSS-SELL',
      badgeClass: 'badge-cross-sell',
      color: '#4f46e5',
      bgLight: '#eef2ff',
      border: '#c7d2fe',
      proposedAction: 'Personalized product recommendations',
      actionRationale: 'Customer spends substantially above median per order but concentrates purchases in narrow product categories.',
      channel: 'Category Expansion Recommendations / Bundled Offers'
    },
    MONITOR_NURTURE: {
      id: 'MONITOR_NURTURE',
      label: 'Monitor / Nurture',
      shortCode: 'MONITOR',
      badgeClass: 'badge-monitor',
      color: '#0284c7',
      bgLight: '#f0f9ff',
      border: '#bae6fd',
      proposedAction: 'Continue normal engagement and monitoring',
      actionRationale: 'Customer displays moderate repeat likelihood and stable metrics. No urgent intervention required; monitor for behavioural changes.',
      channel: 'Standard Newsletter & Organic Lifecycle Communications'
    },
    LOWER_PRIORITY: {
      id: 'LOWER_PRIORITY',
      label: 'Lower Priority',
      shortCode: 'LOW-PRIORITY',
      badgeClass: 'badge-lower-priority',
      color: '#64748b',
      bgLight: '#f8fafc',
      border: '#e2e8f0',
      proposedAction: 'Lower-cost communication',
      actionRationale: 'Low repeat likelihood combined with below-median historical order value indicates limited commercial return on costly marketing spend.',
      channel: 'Automated Digital Drip / Low-cost Marketing Channels'
    }
  }
};

/**
 * Classifies a customer into a retention segment based on predicted probability
 * and data-derived portfolio benchmarks.
 * 
 * @param {number} probability - Predicted repeat purchase probability from Logistic Regression
 * @param {Object} customer - Customer with raw behavioural metrics
 * @param {Object} benchmarks - Data-derived portfolio benchmarks (medians)
 * @returns {Object} Segment metadata and proposed action
 */
export function classifyCustomerRetention(probability, customer, benchmarks = {}) {
  const { LOW_REPEAT_THRESHOLD, HIGH_REPEAT_THRESHOLD, SEGMENTS } = RETENTION_CONFIG;
  
  const aov = Number(customer.AverageOrderValue) || 0;
  const productDiversity = Number(customer.ProductDiversity) || 1;
  const medianAOV = benchmarks.medianAOV || 300;
  const medianProductDiversity = benchmarks.medianProductDiversity || 45;

  const isHighValue = aov >= medianAOV;
  const isNarrowBasket = productDiversity < medianProductDiversity;

  // 1. High-Value At-Risk: Low predicted repeat probability despite historically above-average order values
  if (probability < LOW_REPEAT_THRESHOLD && isHighValue) {
    return {
      ...SEGMENTS.HIGH_VALUE_AT_RISK,
      priorityRank: 1,
      urgency: 'Immediate'
    };
  }

  // 2. Loyal / Active: High predicted repeat purchase probability
  if (probability >= HIGH_REPEAT_THRESHOLD) {
    return {
      ...SEGMENTS.LOYAL_ACTIVE,
      priorityRank: 2,
      urgency: 'Scheduled'
    };
  }

  // 3. Cross-Sell Opportunity: Moderate probability, high spending, but limited product category diversity
  if (probability >= LOW_REPEAT_THRESHOLD && probability < HIGH_REPEAT_THRESHOLD && isHighValue && isNarrowBasket) {
    return {
      ...SEGMENTS.CROSS_SELL_OPPORTUNITY,
      priorityRank: 3,
      urgency: 'Targeted'
    };
  }

  // 4. Monitor / Nurture: Moderate repeat probability with steady engagement
  if (probability >= LOW_REPEAT_THRESHOLD && probability < HIGH_REPEAT_THRESHOLD) {
    return {
      ...SEGMENTS.MONITOR_NURTURE,
      priorityRank: 4,
      urgency: 'Passive'
    };
  }

  // 5. Lower Priority: Low repeat probability and below-median spend
  return {
    ...SEGMENTS.LOWER_PRIORITY,
    priorityRank: 5,
    urgency: 'Low-cost'
  };
}

/**
 * Generates an interpretable, non-technical explanation for management
 * based strictly on the customer's ORIGINAL behavioural variables and portfolio benchmarks.
 * 
 * No black-box explainers (SHAP) are used.
 * 
 * @param {Object} customer - Customer behavioural data
 * @param {number} probability - Predicted probability
 * @param {Object} segment - Assigned retention segment
 * @param {Object} benchmarks - Data-derived benchmarks (medians)
 * @returns {string} Human-friendly management narrative
 */
export function generateCustomerExplanation(customer, probability, segment, benchmarks = {}) {
  const probPercent = (probability * 100).toFixed(1) + '%';
  const frequency = Number(customer.Frequency) || 1;
  const recency = Number(customer.Recency) || 0;
  const aov = Number(customer.AverageOrderValue) || 0;
  const diversity = Number(customer.ProductDiversity) || 1;
  const tenure = Number(customer.CustomerTenure) || 0;

  const medianAOV = benchmarks.medianAOV || 300;
  const medianRecency = benchmarks.medianRecency || 75;
  const medianFrequency = benchmarks.medianFrequency || 4;
  const medianDiversity = benchmarks.medianProductDiversity || 45;

  const aovComparison = aov >= medianAOV ? 'above the customer median' : 'below the customer median';
  const freqComparison = frequency >= medianFrequency ? 'frequent orders' : 'limited historical order count';
  const recencyComparison = recency > medianRecency ? 'a longer period has passed since the most recent purchase' : 'recent purchasing activity is observed';

  switch (segment.id) {
    case 'HIGH_VALUE_AT_RISK':
      return `This customer has historically generated substantial value, maintaining an Average Order Value of £${aov.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${aovComparison}) with ${frequency} historical orders. However, ${recency} days have elapsed since their last purchase (${recencyComparison}). In line with the negative coefficient for Recency in the Logistic Regression model, this inactivity significantly depresses the future repeat purchase estimate to ${probPercent}. Under our prototype business rules, this customer represents an immediate retention priority for a re-engagement campaign.`;

    case 'LOYAL_ACTIVE':
      return `This customer displays strong, consistent engagement with ${frequency} completed orders and a recent transaction just ${recency} days ago. Given that purchase frequency is the strongest positive predictive signal in the model and recency is favorable, the model projects a high repeat purchase probability of ${probPercent}. The proposed action focuses on loyalty recognition and relationship maintenance rather than margin-sacrificing discounts.`;

    case 'CROSS_SELL_OPPORTUNITY':
      return `This customer exhibits healthy spending with an Average Order Value of £${aov.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${aovComparison}), but has explored only ${diversity} unique product items (below the median of ${medianDiversity}). The estimated repeat probability of ${probPercent} places them in a stable moderate bracket. Personalized cross-sell recommendations could broaden catalogue adoption and strengthen customer lifetime value.`;

    case 'MONITOR_NURTURE':
      return `This customer shows balanced behavioural metrics across ${frequency} orders and an elapsed time of ${recency} days since their last visit. Their predicted repeat purchase probability of ${probPercent} sits safely within the middle tier. Continued monitoring and routine lifecycle communications are recommended to maintain engagement without unnecessary promotional expense.`;

    case 'LOWER_PRIORITY':
    default:
      return `With an Average Order Value of £${aov.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${aovComparison}) and ${recency} days since the last order, this customer is estimated to have a modest repeat probability of ${probPercent}. Because expected return from intensive manual intervention is low, the proposed decision is automated, lower-cost digital communication.`;
  }
}
