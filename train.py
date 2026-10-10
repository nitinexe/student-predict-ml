
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


# 1. Define project paths
BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "student-mat.csv"
MODEL_DIR = BASE_DIR / "ml" / "artifacts"
MODEL_DIR.mkdir(parents=True, exist_ok=True)


# 2. Load the dataset
df = pd.read_csv(DATA_PATH, sep=";")

print("Dataset loaded successfully!")
print("Dataset shape:", df.shape)
print("\nFirst five rows:")
print(df.head())


# 3. Separate features (X) and target (y)
# G3 is the final grade. Exclude G1 and G2 because
# this model is intended to predict before those grades exist.
X = df.drop(columns=["G1", "G2", "G3"])
y = df["G3"]

print("\nNumber of input features:", X.shape[1])
print("Target: G3 (final grade)")


# 4. Split the data BEFORE fitting any preprocessing.
# Keep 20% aside for final evaluation.
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
)


# 5. Identify categorical and numerical columns
categorical_cols = X.select_dtypes(
    include=["object", "category"]
).columns.tolist()

numerical_cols = X.select_dtypes(
    include=["number"]
).columns.tolist()

print("\nCategorical columns:", categorical_cols)
print("Numerical columns:", numerical_cols)


# 6. Build preprocessing steps
numeric_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler()),
])

categorical_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore")),
])

preprocessor = ColumnTransformer([
    ("numeric", numeric_pipeline, numerical_cols),
    ("categorical", categorical_pipeline, categorical_cols),
])


# 7. Define two candidate models
models = {
    "Linear Regression": LinearRegression(),
    "Random Forest": RandomForestRegressor(
        n_estimators=300,
        min_samples_leaf=2,
        random_state=42,
    ),
}

results = []
trained_models = {}


# 8. Train and evaluate each model
for name, estimator in models.items():
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("model", estimator),
    ])

    pipeline.fit(X_train, y_train)

    predictions = pipeline.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    r2 = r2_score(y_test, predictions)

    results.append({
        "Model": name,
        "MAE": mae,
        "RMSE": rmse,
        "R2": r2,
    })

    trained_models[name] = pipeline

    print(f"\n{name}")
    print(f"MAE:  {mae:.3f} grade points")
    print(f"RMSE: {rmse:.3f} grade points")
    print(f"R²:   {r2:.3f}")


# 9. Compare models and select the lowest test RMSE
results_df = pd.DataFrame(results).sort_values("RMSE")

print("\n--- Model comparison ---")
print(results_df.to_string(index=False))

best_name = results_df.iloc[0]["Model"]
best_model = trained_models[best_name]

# 10. Save the complete preprocessing + model pipeline
model_path = MODEL_DIR / "model.joblib"
joblib.dump(best_model, model_path)

print(f"\nSelected model: {best_name}")
print(f"Saved model to: {model_path}")


# 11. Display sample predictions
sample_results = pd.DataFrame({
    "Actual G3": y_test.iloc[:10].to_numpy(),
    "Predicted G3": np.round(
        best_model.predict(X_test.iloc[:10]), 2
    ),
})

print("\n--- Sample predictions ---")
print(sample_results.to_string(index=False))