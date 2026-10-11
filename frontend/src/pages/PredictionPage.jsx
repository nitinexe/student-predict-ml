import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./PredictionPage.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const sections = [
  {
    title: "Student information",
    description: "Basic details about the student and their home.",
    icon: GraduationCap,
    fields: [
      { name: "school", label: "School", type: "select", options: [["GP", "Gabriel Pereira"], ["MS", "Mousinho da Silveira"]] },
      { name: "sex", label: "Sex", type: "select", options: [["F", "Female"], ["M", "Male"]] },
      { name: "age", label: "Age", type: "number", min: 15, max: 22, step: 1 },
      { name: "address", label: "Home location", type: "select", options: [["U", "Urban"], ["R", "Rural"]] },
      { name: "famsize", label: "Family size", type: "select", options: [["GT3", "More than 3"], ["LE3", "3 or fewer"]] },
      { name: "Pstatus", label: "Parents' status", type: "select", options: [["T", "Living together"], ["A", "Living apart"]] },
    ],
  },
  {
    title: "Family & education",
    description: "Family education, school choices, and support.",
    icon: BookOpen,
    fields: [
      { name: "Medu", label: "Mother's education (0–4)", type: "number", min: 0, max: 4, step: 1 },
      { name: "Fedu", label: "Father's education (0–4)", type: "number", min: 0, max: 4, step: 1 },
      { name: "Mjob", label: "Mother's job", type: "select", options: [["teacher", "Teacher"], ["health", "Healthcare"], ["services", "Services"], ["at_home", "At home"], ["other", "Other"]] },
      { name: "Fjob", label: "Father's job", type: "select", options: [["teacher", "Teacher"], ["health", "Healthcare"], ["services", "Services"], ["at_home", "At home"], ["other", "Other"]] },
      { name: "reason", label: "Reason for choosing school", type: "select", options: [["home", "Close to home"], ["reputation", "Reputation"], ["course", "Course preference"], ["other", "Other"]] },
      { name: "guardian", label: "Guardian", type: "select", options: [["mother", "Mother"], ["father", "Father"], ["other", "Other"]] },
      { name: "schoolsup", label: "Extra school support", type: "select", options: [["no", "No"], ["yes", "Yes"]] },
      { name: "famsup", label: "Family educational support", type: "select", options: [["yes", "Yes"], ["no", "No"]] },
      { name: "paid", label: "Paid extra classes", type: "select", options: [["no", "No"], ["yes", "Yes"]] },
      { name: "nursery", label: "Attended nursery school", type: "select", options: [["yes", "Yes"], ["no", "No"]] },
      { name: "higher", label: "Wants higher education", type: "select", options: [["yes", "Yes"], ["no", "No"]] },
    ],
  },
  {
    title: "Study habits & lifestyle",
    description: "Study time, activities, relationships, and wellbeing.",
    icon: Activity,
    fields: [
      { name: "traveltime", label: "Travel time (1–4)", type: "number", min: 1, max: 4, step: 1 },
      { name: "studytime", label: "Weekly study time (1–4)", type: "number", min: 1, max: 4, step: 1 },
      { name: "failures", label: "Past class failures (0–3)", type: "number", min: 0, max: 3, step: 1 },
      { name: "activities", label: "Extracurricular activities", type: "select", options: [["yes", "Yes"], ["no", "No"]] },
      { name: "internet", label: "Internet access at home", type: "select", options: [["yes", "Yes"], ["no", "No"]] },
      { name: "romantic", label: "In a romantic relationship", type: "select", options: [["no", "No"], ["yes", "Yes"]] },
      { name: "famrel", label: "Family relationship quality (1–5)", type: "number", min: 1, max: 5, step: 1 },
      { name: "freetime", label: "Free time (1–5)", type: "number", min: 1, max: 5, step: 1 },
      { name: "goout", label: "Going out with friends (1–5)", type: "number", min: 1, max: 5, step: 1 },
      { name: "Dalc", label: "Workday alcohol consumption (1–5)", type: "number", min: 1, max: 5, step: 1 },
      { name: "Walc", label: "Weekend alcohol consumption (1–5)", type: "number", min: 1, max: 5, step: 1 },
      { name: "health", label: "Current health (1–5)", type: "number", min: 1, max: 5, step: 1 },
      { name: "absences", label: "School absences", type: "number", min: 0, max: 100, step: 1 },
    ],
  },
];

const initialValues = {
  school: "GP",
  sex: "F",
  age: "17",
  address: "U",
  famsize: "GT3",
  Pstatus: "T",
  Medu: "3",
  Fedu: "2",
  Mjob: "services",
  Fjob: "other",
  reason: "course",
  guardian: "mother",
  traveltime: "1",
  studytime: "3",
  failures: "0",
  schoolsup: "no",
  famsup: "yes",
  paid: "no",
  activities: "yes",
  nursery: "yes",
  higher: "yes",
  internet: "yes",
  romantic: "no",
  famrel: "4",
  freetime: "3",
  goout: "3",
  Dalc: "1",
  Walc: "2",
  health: "4",
  absences: "2",
};

const numericFields = [
  "age", "Medu", "Fedu", "traveltime", "studytime", "failures",
  "famrel", "freetime", "goout", "Dalc", "Walc", "health", "absences",
];

export default function PredictionPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const data = { ...form };
    numericFields.forEach((key) => {
      data[key] = Number(data[key]);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = payload.detail;
        throw new Error(
          typeof detail === "string"
            ? detail
            : detail
              ? JSON.stringify(detail)
              : "The prediction service returned an error."
        );
      }

      if (payload.predicted_grade == null) {
        throw new Error("The API response did not contain predicted_grade.");
      }

      setResult(payload);

if (user?.id) {
  const { error: saveError } = await supabase
    .from("student_predictions")
    .insert({
      user_id: user.id,
      input_data: data,
      result_data: payload,
      predicted_marks: Number(payload.predicted_grade),
    });

  if (saveError) {
    console.error("Could not save prediction:", saveError);
    setError("Prediction generated, but saving failed. Check the browser console.");
  }
} else {
  setError("Prediction generated, but you are not signed in. It was not saved.");
}

window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Couldn't connect to the prediction API. Check that your FastAPI server is running and the API URL is correct."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(initialValues);
    setResult(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="prediction-page">
      <header className="prediction-topbar">
        <Link to="/dashboard" className="prediction-back">
          <ArrowLeft size={17} />
          Dashboard
        </Link>
        <Link to="/" className="prediction-brand">
          <span className="prediction-brand-icon"><GraduationCap size={22} /></span>
          <span>Edu<span className="prediction-brand-accent">Predict</span></span>
        </Link>
        <span className="prediction-topbar-label">PERFORMANCE LAB</span>
      </header>

      <div className="prediction-container">
        <section className="prediction-hero">
          <span className="prediction-eyebrow">
            <Sparkles size={15} /> AI-POWERED ESTIMATION
          </span>
          <h1>Discover your <span>academic potential.</span></h1>
          <p>
            Share a few details about school, study habits, and your learning
            environment to estimate your final mathematics grade.
          </p>
          <div className="prediction-hero-note">
            <CheckCircle2 size={17} />
            <span>Educational estimate only — not a guaranteed result.</span>
          </div>
        </section>

        {result && (
          <section className="prediction-result" aria-live="polite">
            <div className="prediction-result-icon"><Sparkles size={22} /></div>
            <div className="prediction-result-content">
              <span className="prediction-result-label">YOUR ESTIMATED GRADE</span>
              <div className="prediction-result-grade">{result.predicted_grade} <span>/ 20</span></div>
              <p>{result.message || "Your prediction is ready."}</p>
              <small>This is a model estimate, not a guaranteed grade.</small>
            </div>
            <button className="prediction-secondary-button" type="button" onClick={resetForm}>
              <RotateCcw size={16} /> New prediction
            </button>
          </section>
        )}

        <form onSubmit={handleSubmit}>
          <div className="prediction-form-heading">
            <div>
              <span className="prediction-step">STUDENT ASSESSMENT</span>
              <h2>Tell us about the student</h2>
              <p>Complete the sections below to generate your estimate.</p>
            </div>
            <span className="prediction-field-count">31 inputs</span>
          </div>

          {sections.map((section, index) => {
            const SectionIcon = section.icon;
            return (
              <section className="prediction-section" key={section.title}>
                <div className="prediction-section-heading">
                  <span className="prediction-section-icon"><SectionIcon size={20} /></span>
                  <div>
                    <h3>{index + 1}. {section.title}</h3>
                    <p>{section.description}</p>
                  </div>
                </div>

                <div className="prediction-fields">
                  {section.fields.map((field) => (
                    <label className="prediction-field" key={field.name}>
                      <span>{field.label}</span>
                      {field.type === "select" ? (
                        <select
                          name={field.name}
                          value={form[field.name]}
                          onChange={handleChange}
                          required
                        >
                          {field.options.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          name={field.name}
                          value={form[field.name]}
                          onChange={handleChange}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          required
                        />
                      )}
                    </label>
                  ))}
                </div>
              </section>
            );
          })}

          {error && <div className="prediction-error" role="alert">{error}</div>}

          <div className="prediction-submit-row">
            <button className="prediction-reset-button" type="button" onClick={resetForm}>
              <RotateCcw size={16} /> Reset fields
            </button>
            <button className="prediction-submit-button" type="submit" disabled={loading}>
              {loading ? (
                <>Generating estimate<span className="prediction-button-spinner" /></>
              ) : (
                <>Predict my performance <ArrowRight size={18} /></>
              )}
            </button>
          </div>
          <p className="prediction-privacy-note">
            Your estimate may vary from actual academic results.
          </p>
        </form>
      </div>
    </main>
  );
}