
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, Field


# Locate the saved model relative to this file
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "ml" / "artifacts" / "model.joblib"
STATIC_DIR = BASE_DIR / "static"
DATA_PATH = BASE_DIR / "data" / "student-mat.csv"

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model not found at {MODEL_PATH}. Run train.py first."
    )

model = joblib.load(MODEL_PATH)

app = FastAPI(
    title="Student Performance Prediction API",
    description="Predicts a student's final grade using a trained ML model.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


STATIC_DIR = BASE_DIR / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# Validate the input fields and their expected categories
class StudentInput(BaseModel):
    school: Literal["GP", "MS"]
    sex: Literal["F", "M"]
    age: int = Field(ge=15, le=22)
    address: Literal["U", "R"]
    famsize: Literal["LE3", "GT3"]
    Pstatus: Literal["T", "A"]

    Medu: int = Field(ge=0, le=4)
    Fedu: int = Field(ge=0, le=4)

    Mjob: Literal["teacher", "health", "services", "at_home", "other"]
    Fjob: Literal["teacher", "health", "services", "at_home", "other"]

    reason: Literal["home", "reputation", "course", "other"]
    guardian: Literal["mother", "father", "other"]

    traveltime: int = Field(ge=1, le=4)
    studytime: int = Field(ge=1, le=4)
    failures: int = Field(ge=0, le=3)

    schoolsup: Literal["yes", "no"]
    famsup: Literal["yes", "no"]
    paid: Literal["yes", "no"]
    activities: Literal["yes", "no"]
    nursery: Literal["yes", "no"]
    higher: Literal["yes", "no"]
    internet: Literal["yes", "no"]
    romantic: Literal["yes", "no"]

    famrel: int = Field(ge=1, le=5)
    freetime: int = Field(ge=1, le=5)
    goout: int = Field(ge=1, le=5)
    Dalc: int = Field(ge=1, le=5)
    Walc: int = Field(ge=1, le=5)
    health: int = Field(ge=1, le=5)
    absences: int = Field(ge=0, le=100)


@app.get("/")
def home():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/dashboard")
def dashboard():
    return FileResponse(STATIC_DIR / "dashboard.html")

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": True}


@app.post("/predict")
def predict(student: StudentInput):
    # Convert the validated request into a single-row DataFrame
    input_data = pd.DataFrame([student.model_dump()])

    # Match the exact feature order used during model training
    expected_features = list(model.feature_names_in_)
    input_data = input_data[expected_features]

    # Make a prediction using the saved preprocessing pipeline
    prediction = float(model.predict(input_data)[0])

    return {
        "predicted_grade": round(prediction, 2),
        "grade_scale": "0-20",
        "message": "Prediction generated successfully",
        "note": "This is an estimate, not a guaranteed grade.",
    }



@app.get("/api/analytics")
def analytics():
    df = pd.read_csv(DATA_PATH, sep=";")

    total = len(df)
    grades = df["G3"]

    # Overview statistics
    grade_distribution = pd.cut(
        grades,
        bins=[-1, 4, 9, 14, 20],
        labels=["0–4", "5–9", "10–14", "15–20"]
    ).value_counts().reindex(
        ["0–4", "5–9", "10–14", "15–20"],
        fill_value=0
    )

    def counts(column):
        result = df[column].value_counts().sort_index()
        return {str(k): int(v) for k, v in result.items()}

    def averages(column):
        result = df.groupby(column, observed=True)["G3"].mean()
        return {
            str(k): round(float(v), 2)
            for k, v in result.items()
            if pd.notna(v)
        }

    # Study time and absence groups
    absence_bins = pd.cut(
        df["absences"],
        bins=[-1, 2, 5, 10, float("inf")],
        labels=["0–2", "3–5", "6–10", "11+"]
    )
    absence_averages = (
        df.assign(absence_group=absence_bins)
        .groupby("absence_group", observed=True)["G3"]
        .mean()
    )

    # Dataset-level academic support indicators
    below_threshold = int((grades < 10).sum())
    at_or_above_threshold = int((grades >= 10).sum())

    # Scatter plot points: absences and final grade
    scatter = [
        {"x": int(row["absences"]), "y": int(row["G3"])}
        for _, row in df.iterrows()
    ]

    return {
        "total_students": int(total),
        "average_grade": round(float(grades.mean()), 2),
        "median_grade": round(float(grades.median()), 2),
        "highest_grade": int(grades.max()),
        "lowest_grade": int(grades.min()),
        "pass_rate": round(float((grades >= 10).mean() * 100), 2),
        "below_threshold": below_threshold,
        "at_or_above_threshold": at_or_above_threshold,
        "grade_distribution": {
            str(k): int(v) for k, v in grade_distribution.items()
        },
        "gender_distribution": counts("sex"),
        "school_distribution": counts("school"),
        "address_distribution": counts("address"),
        "support_distribution": counts("schoolsup"),
        "family_support_distribution": counts("famsup"),
        "study_time_distribution": counts("studytime"),
        "study_time_average": averages("studytime"),
        "failure_distribution": counts("failures"),
        "failure_average": averages("failures"),
        "mother_education_average": averages("Medu"),
        "father_education_average": averages("Fedu"),
        "absence_average": {
            str(k): round(float(v), 2)
            for k, v in absence_averages.items()
            if pd.notna(v)
        },
        "absence_grade_scatter": scatter
    }