import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error


# ==========================================
# 1. LOAD DATASET
# ==========================================

data = pd.read_csv("blood_demand.csv")

print("Dataset loaded successfully!")
print(data.head())


# ==========================================
# 2. CONVERT DATE
# ==========================================

data["date"] = pd.to_datetime(data["date"])

data["day"] = data["date"].dt.day
data["month"] = data["date"].dt.month
data["day_of_week"] = data["date"].dt.dayofweek


# ==========================================
# 3. FEATURES AND TARGET
# ==========================================

X = data[
    [
        "blood_group",
        "day",
        "month",
        "day_of_week"
    ]
]

y = data["quantity_required"]


# ==========================================
# 4. PREPROCESSING
# ==========================================

categorical_features = ["blood_group"]

numeric_features = [
    "day",
    "month",
    "day_of_week"
]

preprocessor = ColumnTransformer(
    transformers=[
        (
            "blood_group",
            OneHotEncoder(handle_unknown="ignore"),
            categorical_features
        )
    ],
    remainder="passthrough"
)


# ==========================================
# 5. MACHINE LEARNING MODEL
# ==========================================

model = RandomForestRegressor(
    n_estimators=100,
    random_state=42
)


# ==========================================
# 6. COMPLETE PIPELINE
# ==========================================

pipeline = Pipeline(
    steps=[
        ("preprocessor", preprocessor),
        ("model", model)
    ]
)


# ==========================================
# 7. TRAIN / TEST SPLIT
# ==========================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


# ==========================================
# 8. TRAIN MODEL
# ==========================================

pipeline.fit(X_train, y_train)

print("Model training completed!")


# ==========================================
# 9. EVALUATE MODEL
# ==========================================

predictions = pipeline.predict(X_test)

mae = mean_absolute_error(
    y_test,
    predictions
)

print("Mean Absolute Error:", round(mae, 2))


# ==========================================
# 10. SAVE MODEL
# ==========================================

joblib.dump(
    pipeline,
    "blood_demand_model.pkl"
)

print("Model saved as blood_demand_model.pkl")