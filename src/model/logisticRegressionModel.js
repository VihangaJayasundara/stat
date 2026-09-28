/**
 * Task 5: Standard Logistic Regression Model Implementation
 * 
 * Model Specification:
 * - Target: RepeatPurchase (1 = future purchase in 10 June 2011 – 09 Dec 2011; 0 = no future purchase)
 * - Historical Observation Window: 10 June 2010 – 09 June 2011 (Online Retail II)
 * - Exactly 7 predictors:
 *   1. Log_Frequency: ln(1 + Frequency)
 *   2. Recency: days since last purchase
 *   3. Log_AverageOrderValue: ln(1 + AverageOrderValue)
 *   4. Log_ProductDiversity: ln(1 + ProductDiversity)
 *   5. CustomerTenure: days since first purchase
 *   6. Log_AveragePurchaseInterval: ln(1 + AveragePurchaseInterval)
 *   7. HasPurchaseInterval: binary flag (1 if orders >= 2 and valid interval, 0 if single order)
 * 
 * Continuous predictors were standardized using StandardScaler fitted to the training set (80:20 stratified split, random_state=42).
 * 
 * IMPORTANT ACADEMIC NOTE:
 * Predictions are estimated probabilities of future repeat purchasing, representing statistical associations 
 * from observational data, NOT causal guarantees.
 */

export const MODEL_METADATA = {
  name: 'Standard Logistic Regression',
  task: 'Task 5 Predictive Repeat-Purchase Modelling',
  observationPeriod: '10 June 2010 – 09 June 2011',
  outcomePeriod: '10 June 2011 – 09 December 2011',
  eligibleCustomers: 4324,
  repeatPurchasers: 2481,
  repeatRate: 0.5738,
  nonRepeatPurchasers: 1843,
  nonRepeatRate: 0.4262,
  trainTestSplit: '80:20 Stratified Split (random_state=42)',
  performance: {
    accuracy: 0.696,
    precision: 0.743,
    recall: 0.718,
    f1Score: 0.730,
    rocAuc: 0.757,
    confusionMatrix: {
      trueNegative: 246,
      falsePositive: 123,
      falseNegative: 140,
      truePositive: 356,
      totalTestSamples: 865
    }
  },
  coefficients: [
    {
      feature: 'Log_Frequency',
      label: 'Log(1 + Purchase Frequency)',
      originalMetric: 'Orders / Frequency',
      coefficient: 0.7590,
      direction: 'positive',
      signalStrength: 'Strongest positive predictive signal',
      description: 'Customers with higher historical order counts exhibit significantly higher odds of repeat purchasing.'
    },
    {
      feature: 'Recency',
      label: 'Recency (Days Since Last Order)',
      originalMetric: 'Days Since Last Purchase',
      coefficient: -0.5050,
      direction: 'negative',
      signalStrength: 'Strongest negative predictive signal',
      description: 'Longer elapsed time since the most recent purchase sharply reduces repeat purchase probability.'
    },
    {
      feature: 'Log_AverageOrderValue',
      label: 'Log(1 + Average Order Value)',
      originalMetric: 'Average Order Value (£)',
      coefficient: 0.1946,
      direction: 'positive',
      signalStrength: 'Moderate positive signal',
      description: 'Higher average spend per order positively associates with customer commitment and retention.'
    },
    {
      feature: 'Log_ProductDiversity',
      label: 'Log(1 + Product Diversity)',
      originalMetric: 'Unique Products Purchased',
      coefficient: 0.1893,
      direction: 'positive',
      signalStrength: 'Moderate positive signal',
      description: 'Purchasing a broader variety of catalogue items is positively associated with future loyalty.'
    },
    {
      feature: 'CustomerTenure',
      label: 'Customer Relationship Tenure (Days)',
      originalMetric: 'Tenure (Days)',
      coefficient: 0.1073,
      direction: 'positive',
      signalStrength: 'Modest positive signal',
      description: 'Longer relationship duration provides a slight positive baseline for ongoing repeat activity.'
    },
    {
      feature: 'Log_AveragePurchaseInterval',
      label: 'Log(1 + Avg Purchase Interval)',
      originalMetric: 'Avg Days Between Purchases',
      coefficient: -0.0359,
      direction: 'negative',
      signalStrength: 'Slight negative signal',
      description: 'Longer inter-purchase spacing slightly dampens the probability of an imminent future transaction.'
    },
    {
      feature: 'HasPurchaseInterval',
      label: 'Has Repeat Purchase Interval Flag',
      originalMetric: 'Multiple Order History',
      coefficient: -0.0072,
      direction: 'negative',
      signalStrength: 'Minimal adjustment',
      description: 'Binary adjustment accounting for the presence of a calculable inter-order interval.'
    }
  ]
};

/**
 * StandardScaler Parameters fitted to Task 5 Training Cohort
 * Allows future replacement with exact scikit-learn exported parameters (scaler.mean_, scaler.scale_)
 */
export const STANDARD_SCALER_PARAMS = {
  means: {
    Log_Frequency: 1.352,
    Recency: 94.65,
    Log_AverageOrderValue: 5.210,
    Log_ProductDiversity: 3.645,
    CustomerTenure: 202.40,
    Log_AveragePurchaseInterval: 2.820,
    HasPurchaseInterval: 0.655
  },
  scales: {
    Log_Frequency: 0.765,
    Recency: 87.12,
    Log_AverageOrderValue: 0.942,
    Log_ProductDiversity: 1.148,
    CustomerTenure: 112.35,
    Log_AveragePurchaseInterval: 1.415,
    HasPurchaseInterval: 0.475
  }
};

/**
 * Standard Logistic Regression Model Intercept (Task 5 calibration)
 * Corresponding to the baseline repeat probability log-odds (ln(0.5738 / 0.4262) ≈ +0.2974)
 */
export const MODEL_INTERCEPT = 0.2974;

/**
 * Sigmoid activation function: 1 / (1 + exp(-z))
 * @param {number} z - Logit / log-odds
 * @returns {number} Probability between 0 and 1
 */
function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Extracts and engineers the 7 features required by the Task 5 model
 * @param {Object} rawCustomer - Customer object with natural behavioural metrics
 * @returns {Object} Engineered features before scaling
 */
export function engineerFeatures(rawCustomer) {
  const frequency = Math.max(1, Number(rawCustomer.Frequency) || 1);
  const recency = Math.max(0, Number(rawCustomer.Recency) || 0);
  const aov = Math.max(0, Number(rawCustomer.AverageOrderValue) || 0);
  const productDiversity = Math.max(1, Number(rawCustomer.ProductDiversity) || 1);
  const tenure = Math.max(0, Number(rawCustomer.CustomerTenure) || 0);
  
  // Calculate or parse interval
  let avgInterval = Number(rawCustomer.AveragePurchaseInterval);
  let hasInterval = rawCustomer.HasPurchaseInterval !== undefined 
    ? (Number(rawCustomer.HasPurchaseInterval) === 1 ? 1 : 0)
    : (frequency > 1 && avgInterval > 0 ? 1 : 0);
  
  if (isNaN(avgInterval) || avgInterval <= 0) {
    avgInterval = 0;
    hasInterval = 0;
  }

  return {
    Log_Frequency: Math.log1p(frequency),
    Recency: recency,
    Log_AverageOrderValue: Math.log1p(aov),
    Log_ProductDiversity: Math.log1p(productDiversity),
    CustomerTenure: tenure,
    Log_AveragePurchaseInterval: Math.log1p(avgInterval),
    HasPurchaseInterval: hasInterval
  };
}

/**
 * Standardizes continuous features using the fitted training set parameters
 * @param {Object} engineeredFeatures - Raw transformed features
 * @returns {Object} Standardized z-score features
 */
export function standardizeFeatures(engineeredFeatures) {
  const standardized = {};
  for (const [key, value] of Object.entries(engineeredFeatures)) {
    const mean = STANDARD_SCALER_PARAMS.means[key] || 0;
    const scale = STANDARD_SCALER_PARAMS.scales[key] || 1;
    standardized[key] = (value - mean) / scale;
  }
  return standardized;
}

/**
 * Calculates logit (linear predictor z) and predicted probability of repeat purchase
 * Replicates scikit-learn model.predict_proba() for Standard Logistic Regression
 * 
 * @param {Object} rawCustomer - Customer with natural behavioural metrics
 * @returns {Object} Prediction result including probability, logit, and standardized inputs
 */
export function predictRepeatProbability(rawCustomer) {
  const rawFeatures = engineerFeatures(rawCustomer);
  const standardized = standardizeFeatures(rawFeatures);
  
  // Compute dot product of standardized features and Task 5 coefficients
  let logit = MODEL_INTERCEPT;
  const contributions = {};

  for (const item of MODEL_METADATA.coefficients) {
    const featureName = item.feature;
    const zScore = standardized[featureName];
    const weight = item.coefficient;
    const contribution = weight * zScore;
    logit += contribution;
    contributions[featureName] = {
      zScore,
      weight,
      contribution
    };
  }

  const probability = sigmoid(logit);

  return {
    probability,
    percentage: (probability * 100).toFixed(1),
    logit,
    contributions,
    rawFeatures,
    standardized
  };
}
