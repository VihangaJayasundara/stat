# Customer Priorities & Revenue Opportunities
### Executive Decision Support Dashboard &bull; Task 10 Statistical Modelling Consultancy Proof-of-Concept

**Dataset**: Online Retail II E-Commerce Transaction Cohort  
**Model**: Task 5 Standard Logistic Regression (7 Predictors, Stratified Holdout ROC-AUC: 75.7%)  
**Theme**: Professional Executive Corporate (Deep Slate &amp; Sapphire Palette)  
**Status**: Proof-of-Concept Decision Support Tool (Non-Causal Academic Prototype)

---

## 1. Executive Summary &amp; Overview

This application delivers a unified, single-dashboard interface designed for executive decision-makers to transform past customer transaction behavior into actionable retention strategies and prioritized revenue opportunities.

Built for **Task 10** of the Statistical Modelling consultancy project, it operationalizes the **Task 5 Standard Logistic Regression model** into a streamlined, high-performance web dashboard.

### Core Value Proposition:
1. **Unified Management View**: A cohesive, single-dashboard architecture eliminating disjointed screens.
2. **Dynamic Business Filters**: Instant cohort slicing across customer value segments, proposed retention actions, geographic regions, return likelihood percentages, and expected lifetime values (£).
3. **Interactive Customer Dossier**: Drill-down inspection modal showing individual customer transaction history, behavioral metrics, and individual Task 5 model feature contributions.
4. **Actionable Strategy Playbook**: Heuristic business rules categorizing customers into tailored operational responses (Protect Loyalty, Win Back Now, Grow Customer Value, Low-Cost Nurture, Monitor).
5. **Academic Governance &amp; Non-Causal Boundary**: Transparent labeling of predictions as observational associations requiring Task 6 randomized experimental validation (CRD/RCBD) before commercial investment.

---

## 2. Dashboard Interface &amp; Navigation

The interface utilizes a modern enterprise layout featuring a fixed **Dark Slate Filter Sidebar** and a **High-Performance Executive Canvas** organized into four strategic tabs:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  CUSTOMER PRIORITIES & REVENUE OPPORTUNITIES                                                            │
├─────────────────────┬───────────────────────────────────────────────────────────────────────────────────┤
│  BUSINESS FILTERS   │  [What is happening?]  [Who needs attention?]  [What should we do?]  [Numbers?]   │
│                     ├───────────────────────────────────────────────────────────────────────────────────┤
│  • Value Segment    │  EXECUTIVE MANAGEMENT OVERVIEW                                                    │
│    [Very High][High]│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│    [Medium][Low]    │  │ Customers    │ │ Likely Rev   │ │ Avg Return   │ │ At-Risk      │             │
│                     │  │    50        │ │  £119,549    │ │     53%      │ │     5        │             │
│  • Action           │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘             │
│    [Win back][Loyal]│                                                                                   │
│    [Grow][Nurture]  │  EXECUTIVE BRIEFING & KEY STRATEGIC INSIGHTS                                      │
│                     │  ▸ 5 valuable customers represent urgent retention risk...                        │
│  • Likelihood %     │                                                                                   │
│    [0% ────── 100%] │  CHARTS & BREAKDOWNS                                                              │
│                     │  ┌──────────────────────────────┐  ┌──────────────────────────────┐               │
│  • Expected CLV (£) │  │ Customer Value Segments      │  │ Recommended Actions          │               │
│    [£0 ─── £15,400] │  │ Very High: ■■■■■■ 5 (10%)    │  │ Protect loyalty: ■■■■ 12     │               │
│                     │  └──────────────────────────────┘  └──────────────────────────────┘               │
│  [↺ Reset Filters]  │  ┌────────────────────────────────────────────────────────────────┐               │
│                     │  │ Distribution of Return Likelihood Scores (Histogram)           │               │
│  Active Dataset:    │  └────────────────────────────────────────────────────────────────┘               │
│  Online Retail II   │                                                                                   │
└─────────────────────┴───────────────────────────────────────────────────────────────────────────────────┘
```

### The 4 Strategic Tabs:
- **Tab 1: What is happening?**
  - **KPI Metrics**: Cohort customer volume, estimated cumulative future revenue (AOV &times; Frequency), average predicted return probability, and high-value customers at immediate churn risk.
  - **Executive Briefing Callout**: Plain-language takeaway points summarizing the current filtered cohort's commercial impact.
  - **Segment &amp; Action Visualizations**: Color-coded distribution bars for value tiers and recommended operational actions.
  - **Likelihood Distribution Histogram**: SVG visualizer displaying predicted repeat-purchase rates across 10-percentage-point bins.

- **Tab 2: Who needs attention?**
  - **Urgency-Ranked Queue**: Customers sorted by risk urgency (high past spending paired with lower predicted repeat probability).
  - **Quick Search**: Filter instantly by Customer ID with live search.
  - **Enterprise Data Table**: Value segment badges, action badges, visual likelihood progress bars, AOV, days since purchase, and order frequency.
  - **Customer Inspection**: Click any row or the *"Inspect &rarr;"* button to launch the **Customer Profile Modal**.

- **Tab 3: What should we do?**
  - **Strategic Action Playbook**: Dedicated strategy cards for each of the 5 operational categories (*Win Back Now, Protect Loyalty, Grow Customer Value, Low-Cost Nurture, Monitor*).
  - **Channel Recommendations**: Specific engagement channels (VIP concierge, early preview access, cross-sell bundles, automated nurture sequences).
  - **Direct Customer Chips**: Interactive chips to directly inspect customers in each category.

- **Tab 4: What do the numbers mean?**
  - **Executive Methodology Documentation**: Transparent explainers defining Return Likelihood, Customer Value Segments, Likely Future Revenue, Model Predictors, and Responsible AI governance.

---

## 3. Clean File Structure

The project has a clean, decoupled architecture:

```
c:/Users/User/Desktop/Chanu/
├── index.html                   # Primary entry point: semantic HTML shell & modern metadata
├── streamlit.html               # Backward-compatible secondary entry point
├── package.json                 # Project dependencies & Vite scripts (dev, build, preview)
├── vite.config.js               # Multi-page build configuration
├── public/
│   └── favicon.svg              # Dashboard SVG brand icon
├── src/
│   ├── main.js                  # Primary application coordinator, filter engine & UI renderer
│   ├── streamlit-app.js         # Forwarder script for backward compatibility
│   ├── styles/
│   │   ├── app.css              # Canonical design tokens & professional executive stylesheet
│   │   └── streamlit-style.css  # Forwarding stylesheet for legacy references
│   ├── data/
│   │   ├── customerDataService.js # Data service layer, empirical medians & subscriber pattern
│   │   └── demoCustomers.js     # Curated transaction cohort based on Online Retail II
│   ├── model/
│   │   └── logisticRegressionModel.js # Task 5 Logistic Regression formula & StandardScaler
│   ├── rules/
│   │   └── retentionRules.js    # Business segmentation rules & proposed action heuristics
│   └── utils/
│       └── formatters.js        # Formatting helpers (Currency £, Days, Orders)
└── README.md                    # Project documentation & consultancy manual
```

---

## 4. Professional Color Theme System

The design avoids harsh, unrefined colors in favor of an **Executive Corporate Analytics Palette**:

| Element | Hex Code | Visual Role |
| :--- | :--- | :--- |
| **Sidebar Background** | `#0f172a` (Slate 900) | Deep midnight slate providing high contrast |
| **Sidebar Card / Inputs** | `#1e293b` (Slate 800) | Sleek container background for filter controls |
| **Main Canvas** | `#f8fafc` (Slate 50) | Crisp, glare-free off-white background |
| **Card Surfaces** | `#ffffff` (Pure White) | Clean elevated surfaces with subtle slate borders (`#e2e8f0`) |
| **Primary Brand Accent** | `#2563eb` (Sapphire Blue) | Title accents, primary badges, and key metrics |
| **Loyalty &amp; Success** | `#10b981` (Emerald) | Loyal customer badges, positive predictive drivers |
| **At-Risk &amp; Urgency** | `#b91c1c` / `#ef4444` (Rose / Crimson) | High-value at-risk customers, win-back action |
| **Cross-Sell / Value** | `#6366f1` / `#8b5cf6` (Indigo / Violet) | Value tiers and basket expansion opportunities |
| **Neutral / Muted** | `#64748b` (Slate 500) | Secondary labels, captions, and benchmark indicators |

---

## 5. Statistical Model Specification (Task 5)

The dashboard operationalizes the Standard Logistic Regression model developed in **Task 5**:

- **Target Variable ($Y$)**: `RepeatPurchase` ($1 =$ purchased at least once in future 6 months, $0 =$ did not repeat)
- **Observation Window**: 10 June 2010 – 09 June 2011 (12 months)
- **Outcome Period**: 10 June 2011 – 09 December 2011 (6 months)
- **Eligible Population**: 4,324 customers
- **Model Evaluation** (80:20 stratified holdout test set, $n = 865$):
  - **ROC-AUC**: **75.7%**
  - **Accuracy**: **69.6%**
  - **Precision**: **74.3%**
  - **Recall**: **71.8%**
  - **F1-Score**: **73.0%**

### Model Predictors &amp; Coefficients:
The model computes the linear predictor (logit $z$) and probability $P(Y=1)$:

$$z = \beta_0 + \sum_{j=1}^7 \beta_j \left(\frac{X_j - \mu_j}{\sigma_j}\right), \quad P(\text{RepeatPurchase} = 1) = \frac{1}{1 + e^{-z}}$$

| Feature ($X_j$) | Transformation | Standardized Coeff ($\beta_j$) | Business Interpretation |
| :--- | :--- | :--- | :--- |
| `Log_Frequency` | $\ln(1 + \text{Frequency})$ | **+0.7590** | **Strongest positive driver** of retention |
| `Recency` | Days since last purchase | **-0.5050** | **Strongest negative driver** (inactivity decay) |
| `Log_AverageOrderValue`| $\ln(1 + \text{AOV})$ | **+0.1946** | Higher basket spend correlates with repeat intent |
| `Log_ProductDiversity`| $\ln(1 + \text{Diversity})$ | **+0.1893** | Broader catalog engagement increases retention |
| `CustomerTenure` | Days from 1st order | **+0.1073** | Account age provides slight positive retention baseline |
| `Log_AvgInterval` | $\ln(1 + \text{AvgInterval})$ | **-0.0359** | Longer gaps between orders slightly reduce return rate |
| `HasPurchaseInterval` | Binary flag ($\ge 2$ orders) | **-0.0072** | Baseline correction parameter |

---

## 6. Academic Integrity &amp; Non-Causal Boundaries

> [!IMPORTANT]
> **Academic Note on Causation vs. Correlation**:  
> The logistic regression model captures observational associations from historical data. It does **not** prove that marketing actions *cause* customers to return.  
> 
> In accordance with **Task 6**, all proposed interventions are classified as **"Proposed Actions"** and must be experimentally validated via:
> - **Completely Randomized Design (CRD)**: For initial intervention screening against an uncontacted holdout control group.
> - **Randomized Complete Block Design (RCBD)**: Blocking on baseline purchase frequency to control for customer variance before measuring true incremental promotional lift.

---

## 7. Getting Started &amp; Local Execution

### Prerequisites
- Node.js (v18.0.0 or later recommended)
- npm (v9.0.0 or later)

### Installation
Clone or navigate to the project directory and install dependencies:
```bash
npm install
```

### Running Locally (Development Mode)
Start the local Vite development server:
```bash
npm run dev
```
Open your browser to:
- **Primary Dashboard**: `http://localhost:3000/`
- **Streamlit View**: `http://localhost:3000/streamlit.html`

### Building for Production
Create the optimized production bundle in `/dist`:
```bash
npm run build
```

### Previewing the Production Build
```bash
npm run preview
```

---

## 8. Summary of Completed Improvements

1. **One Unified Dashboard**: Converted `index.html` and `streamlit.html` into a single, cohesive dashboard experience.
2. **Professional Executive Theme**: Replaced prototype red colors with a corporate Deep Slate, Sapphire, Emerald, and Violet palette.
3. **Interactive Customer Dossier**: Added an inspection modal showing full customer RFM statistics and Task 5 logistic regression driver breakdowns.
4. **Clean File Structure**: Eliminated dead prototype files (`dashboard-app.js`, `dashboard.css`, unused component folders) and consolidated styles into `src/styles/app.css` and logic into `src/main.js`.
5. **Comprehensive Documentation**: Updated `README.md` to reflect the clean structure, model specifications, interface guide, and governance boundaries.
