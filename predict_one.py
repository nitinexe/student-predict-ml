
from pathlib import Path

import joblib
import pandas as pd


# 1. Locate and load the trained model
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "ml" / "artifacts" / "model.joblib"

model = joblib.load(MODEL_PATH)


# 2. Enter one student's information
student = {
    "school": "GP",
    "sex": "F",
    "age": 17,
    "address": "U",
    "famsize": "GT3",
    "Pstatus": "T",
    "Medu": 3,
    "Fedu": 2,
    "Mjob": "services",
    "Fjob": "other",
    "reason": "course",
    "guardian": "mother",
    "traveltime": 1,
    "studytime": 1,
    "failures": 10,
    "schoolsup": "no",
    "famsup": "yes",
    "paid": "no",
    "activities": "yes",
    "nursery": "yes",
    "higher": "yes",
    "internet": "yes",
    "romantic": "no",
    "famrel": 4,
    "freetime": 3,
    "goout": 3,
    "Dalc": 1,
    "Walc": 2,
    "health": 4,
    "absences": 10,
}


# 3. Convert the dictionary into a one-row DataFrame
input_df = pd.DataFrame([student])

# Ensure feature order matches the training data
expected_features = list(model.feature_names_in_)
input_df = input_df[expected_features]


# 4. Predict the final grade
prediction = model.predict(input_df)[0]


# 5. Display the result
print("\n--- Student Performance Prediction ---")
print(f"Predicted final grade: {prediction:.2f} / 20")

print("\nThis is a model estimate, not a guaranteed grade.")