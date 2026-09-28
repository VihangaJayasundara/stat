import json
import pandas as pd
import numpy as np
import streamlit as st
from pathlib import Path

# ----------------------------------------------------------------------
# Helper functions – these replace the original JavaScript utilities
# ----------------------------------------------------------------------
def format_currency(amount: float) -> str:
    """Format a number as GBP currency."""
    return f"£{amount:,.2f}"

def format_percentage(frac: float, decimals: int = 1) -> str:
    """Convert a fraction (0‑1) to a percent string."""
    return f"{frac * 100:.{decimals}f}%"

def load_demo_data() -> list[dict]:
    """Load the demo JSON that originally lived in src/demoCustomers.js."""
    demo_path = Path(__file__).parent / "demo_customers.json"
    if not demo_path.exists():
        st.error("Demo data not found – please add `demo_customers.json`.")
        return []
    with demo_path.open(encoding="utf-8") as f:
        return json.load(f)

# ----------------------------------------------------------------------
# Model – a very small pure‑Python re‑implementation of the logistic regression
# ----------------------------------------------------------------------
# Coefficients & scaling parameters (exact copy of the JS version)
MODEL_METADATA = {
    "coefficients": [
        {"feature": "Log_Frequency", "coefficient": 0.7590},
        {"feature": "Recency", "coefficient": -0.5050},
        {"feature": "Log_AverageOrderValue", "coefficient": 0.1946},
        {"feature": "Log_ProductDiversity", "coefficient": 0.1893},
        {"feature": "CustomerTenure", "coefficient": 0.1073},
        {"feature": "Log_AveragePurchaseInterval", "coefficient": -0.0359},
        {"feature": "HasPurchaseInterval", "coefficient": -0.0072},
    ],
    "intercept": 0.2974,
}

SCALER = {
    "means": {
        "Log_Frequency": 1.352,
        "Recency": 94.65,
        "Log_AverageOrderValue": 5.210,
        "Log_ProductDiversity": 3.645,
        "CustomerTenure": 202.40,
        "Log_AveragePurchaseInterval": 2.820,
        "HasPurchaseInterval": 0.655,
    },
    "scales": {
        "Log_Frequency": 0.765,
        "Recency": 87.12,
        "Log_AverageOrderValue": 0.942,
        "Log_ProductDiversity": 1.148,
        "CustomerTenure": 112.35,
        "Log_AveragePurchaseInterval": 1.415,
        "HasPurchaseInterval": 0.475,
    },
}

def engineer_features(raw: dict) -> dict:
    """Create the 7 engineered features from raw customer data."""
    frequency = max(1, int(raw.get("Frequency", 1)))
    recency = max(0, int(raw.get("Recency", 0)))
    aov = max(0.0, float(raw.get("AverageOrderValue", 0)))
    diversity = max(1, int(raw.get("ProductDiversity", 1)))
    tenure = max(0, int(raw.get("CustomerTenure", 0)))
    avg_interval = raw.get("AveragePurchaseInterval")
    has_interval = raw.get("HasPurchaseInterval")

    # Derive a sane interval if missing
    if avg_interval is None or float(avg_interval) <= 0:
        avg_interval = 0
        has_interval = 0
    else:
        avg_interval = float(avg_interval)
        has_interval = int(has_interval) if has_interval is not None else 1

    return {
        "Log_Frequency": np.log1p(frequency),
        "Recency": recency,
        "Log_AverageOrderValue": np.log1p(aov),
        "Log_ProductDiversity": np.log1p(diversity),
        "CustomerTenure": tenure,
        "Log_AveragePurchaseInterval": np.log1p(avg_interval),
        "HasPurchaseInterval": has_interval,
    }

def standardize(features: dict) -> dict:
    """Z‑score the engineered features using the training‑set parameters."""
    out = {}
    for k, v in features.items():
        mean = SCALER["means"][k]
        scale = SCALER["scales"][k]
        out[k] = (v - mean) / scale
    return out

def sigmoid(z: float) -> float:
    """Logistic sigmoid."""
    return 1 / (1 + np.exp(-z))

def predict(raw: dict) -> dict:
    """Full prediction pipeline – returns probability and contribution details."""
    eng = engineer_features(raw)
    std = standardize(eng)
    logit = MODEL_METADATA["intercept"]
    contributions = {}
    for coeff in MODEL_METADATA["coefficients"]:
        f = coeff["feature"]
        w = coeff["coefficient"]
        val = std[f]
        contrib = w * val
        logit += contrib
        contributions[f] = {"z": val, "weight": w, "contribution": contrib}

    prob = sigmoid(logit)
    return {
        "probability": prob,
        "percentage": f"{prob * 100:.1f}",
        "logit": logit,
        "contributions": contributions,
        "raw_features": eng,
        "standardized": std,
    }

# ----------------------------------------------------------------------
# Business rules – exactly the same logic as the original JS module
# ----------------------------------------------------------------------
RETENTION_CONFIG = {
    "LOW_REPEAT_THRESHOLD": 0.40,
    "HIGH_REPEAT_THRESHOLD": 0.70,
    "SEGMENTS": {
        "HIGH_VALUE_AT_RISK": {
            "id": "HIGH_VALUE_AT_RISK",
            "label": "High‑Value At‑Risk",
            "proposedAction": "Re‑engagement campaign / retention offer",
        },
        "LOYAL_ACTIVE": {
            "id": "LOYAL_ACTIVE",
            "label": "Loyal / Active",
            "proposedAction": "Loyalty recognition / relationship maintenance",
        },
        "CROSS_SELL_OPPORTUNITY": {
            "id": "CROSS_SELL_OPPORTUNITY",
            "label": "Cross‑Sell Opportunity",
            "proposedAction": "Personalized product recommendations",
        },
        "MONITOR_NURTURE": {
            "id": "MONITOR_NURTURE",
            "label": "Monitor / Nurture",
            "proposedAction": "Continue normal engagement and monitoring",
        },
        "LOWER_PRIORITY": {
            "id": "LOWER_PRIORITY",
            "label": "Lower Priority",
            "proposedAction": "Lower‑cost communication",
        },
    },
}

def classify(prob: float, cust: dict, benchmarks: dict) -> dict:
    """Assign a segment based on probability and simple median benchmarks."""
    low = RETENTION_CONFIG["LOW_REPEAT_THRESHOLD"]
    high = RETENTION_CONFIG["HIGH_REPEAT_THRESHOLD"]
    seg = RETENTION_CONFIG["SEGMENTS"]

    aov = float(cust.get("AverageOrderValue", 0))
    diversity = int(cust.get("ProductDiversity", 1))

    median_aov = benchmarks.get("medianAOV", 300)
    median_div = benchmarks.get("medianProductDiversity", 45)

    high_val = aov >= median_aov
    narrow = diversity < median_div

    if prob < low and high_val:
        return seg["HIGH_VALUE_AT_RISK"]
    if prob >= high:
        return seg["LOYAL_ACTIVE"]
    if low <= prob < high and high_val and narrow:
        return seg["CROSS_SELL_OPPORTUNITY"]
    if low <= prob < high:
        return seg["MONITOR_NURTURE"]
    return seg["LOWER_PRIORITY"]

def generate_explanation(cust: dict, prob: float, segment: dict) -> str:
    """Human‑friendly narrative – mirrors the original JS version."""
    prob_pct = f"{prob*100:.1f}%"
    freq = int(cust.get("Frequency", 1))
    rec = int(cust.get("Recency", 0))
    aov = float(cust.get("AverageOrderValue", 0))
    div = int(cust.get("ProductDiversity", 1))

    if segment["id"] == "HIGH_VALUE_AT_RISK":
        return (
            f"This high‑value customer (average order £{aov:,.2f}) last bought {rec} days ago. "
            f"The model predicts a repeat probability of {prob_pct}. Immediate re‑engagement is recommended."
        )
    if segment["id"] == "LOYAL_ACTIVE":
        return (
            f"Strong recent activity (last purchase {rec} days ago, {freq} orders) yields a high repeat "
            f"probability of {prob_pct}. Proposed action: loyalty recognition."
        )
    if segment["id"] == "CROSS_SELL_OPPORTUNITY":
        return (
            f"The customer spends well (£{aov:,.2f}) but only bought {div} unique products. "
            f"With a {prob_pct} repeat probability, cross‑sell recommendations are suggested."
        )
    if segment["id"] == "MONITOR_NURTURE":
        return (
            f"Balanced behaviour (probability {prob_pct}) calls for routine monitoring "
            f"and standard lifecycle communications."
        )
    # LOWER_PRIORITY
    return (
        f"Modest repeat probability ({prob_pct}) and lower spend (£{aov:,.2f}) suggest a low‑cost "
        f"digital communication."
    )

# ----------------------------------------------------------------------
# Streamlit UI
# ----------------------------------------------------------------------
st.set_page_config(page_title="Executive Retention Dashboard", layout="wide")

st.title("🧭 Executive Retention Dashboard")
st.caption(
    "Statistical model (Task 5 Logistic Regression) + prototype business rules (Task 10) – "
    "interactive exploration of customer retention opportunities."
)

# ----------------------------------------------------------------------
# Load data (demo data is bundled as JSON for simplicity)
# ----------------------------------------------------------------------
@st.cache_data
def load_data() -> pd.DataFrame:
    raw = load_demo_data()
    if not raw:
        return pd.DataFrame()
    df = pd.DataFrame(raw)

    probs = []
    seg_labels = []
    explanations = []

    demo_bench = {
        "medianAOV": df["AverageOrderValue"].median(),
        "medianProductDiversity": df["ProductDiversity"].median()
    }

    for _, row in df.iterrows():
        pred = predict(row.to_dict())
        seg = classify(pred["probability"], row.to_dict(), demo_bench)
        probs.append(pred["probability"])
        seg_labels.append(seg["label"])
        explanations.append(generate_explanation(row.to_dict(), pred["probability"], seg))

    df["repeat_probability"] = probs
    df["repeat_pct"] = df["repeat_probability"].apply(lambda x: f"{x*100:.1f}%")
    df["segment"] = seg_labels
    df["explanation"] = explanations
    return df

df = load_data()

if df.empty:
    st.warning("No customer data loaded. Please check demo_customers.json.")
    st.stop()

# ----------------------------------------------------------------------
# Sidebar – filters
# ----------------------------------------------------------------------
with st.sidebar:
    st.header("Filters")
    selected_segment = st.multiselect(
        "Segment(s)",
        options=df["segment"].unique(),
        default=list(df["segment"].unique()),
    )
    prob_min, prob_max = st.slider(
        "Repeat probability range",
        min_value=0.0,
        max_value=1.0,
        value=(0.0, 1.0),
        step=0.01,
    )
    aov_min, aov_max = st.slider(
        "Average Order Value (£)",
        min_value=float(df["AverageOrderValue"].min()),
        max_value=float(df["AverageOrderValue"].max()),
        value=(
            float(df["AverageOrderValue"].min()),
            float(df["AverageOrderValue"].max()),
        ),
        step=5.0,
    )
    st.caption("All filters apply cumulatively.")

# ----------------------------------------------------------------------
# Filtered view
# ----------------------------------------------------------------------
filtered = df[
    (df["segment"].isin(selected_segment))
    & (df["repeat_probability"].between(prob_min, prob_max))
    & (df["AverageOrderValue"].between(aov_min, aov_max))
]

st.subheader(f"📊 {len(filtered)} customers matching filters")
st.dataframe(
    filtered[
        [
            "CustomerID",
            "repeat_pct",
            "segment",
            "Frequency",
            "Recency",
            "AverageOrderValue",
            "ProductDiversity",
        ]
    ],
    use_container_width=True,
    hide_index=True,
)

# ----------------------------------------------------------------------
# KPI cards
# ----------------------------------------------------------------------
col1, col2, col3 = st.columns(3)
with col1:
    avg_prob = filtered["repeat_probability"].mean() if not filtered.empty else 0.0
    st.metric(
        label="Average repeat probability",
        value=format_percentage(avg_prob),
    )
with col2:
    at_risk_count = filtered[filtered["segment"].str.contains("At‑Risk|At-Risk", na=False, regex=True)].shape[0]
    st.metric(
        label="High‑Value At‑Risk",
        value=at_risk_count,
    )
with col3:
    loyal_count = filtered[filtered["segment"].str.contains("Loyal", na=False)].shape[0]
    st.metric(
        label="Loyal / Active",
        value=loyal_count,
    )

# ----------------------------------------------------------------------
# Detail view – modal‑style expanders
# ----------------------------------------------------------------------
st.subheader("🔍 Customer details")
for _, row in filtered.iterrows():
    with st.expander(f"Customer {row['CustomerID']} – {row['segment']}"):
        st.write(row["explanation"])

# ----------------------------------------------------------------------
# Footer
# ----------------------------------------------------------------------
st.caption(
    "⚠️ This prototype uses synthetic demo data. "
    "Replace `demo_customers.json` with a real Task 5 export and re‑run the app "
    "to see production‑grade results."
)
