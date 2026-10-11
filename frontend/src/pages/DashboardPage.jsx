
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  ChartNoAxesCombined,
  Clock3,
  Menu,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import DashboardSidebar from "../components/DashboardSidebar";
import "./DashboardPage.css";

function formatDate(value) {
  if (!value) return "Date unavailable";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPredictedMarks(prediction) {
  const value =
    prediction.predicted_marks ??
    prediction.result_data?.predicted_grade ??
    prediction.result_data?.predicted_marks;

  const number = Number(value);
  return value !== null && value !== undefined && value !== "" &&
    Number.isFinite(number)
    ? number
    : null;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user) {
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setError("");

    try {
      const [profileResult, predictionResult] = await Promise.all([
        supabase
          .from("student_profiles")
          .select(
            "full_name, age, education_level, study_hours_per_week"
          )
          .eq("user_id", user.id)
          .maybeSingle(),

        supabase
          .from("student_predictions")
          .select(
            "id, input_data, result_data, predicted_marks, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (predictionResult.error) throw predictionResult.error;

      setProfile(profileResult.data ?? null);
      setPredictions(predictionResult.data ?? []);
    } catch (loadError) {
      console.error("Dashboard load failed:", loadError.message);
      setError(
        "We couldn't load your dashboard. Please try again."
      );
    } finally {
      setPageLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const metadata = user?.user_metadata ?? {};
  const fallbackName =
    metadata.full_name ||
    metadata.name ||
    user?.email?.split("@")[0] ||
    "Student";

  const displayName = profile?.full_name?.trim() || fallbackName;
  const firstName = displayName.split(/\s+/)[0];

  const profileFields = [
    profile?.full_name?.trim(),
    profile?.age !== null && profile?.age !== undefined &&
      profile?.age !== "",
    profile?.education_level?.trim(),
    profile?.study_hours_per_week !== null &&
      profile?.study_hours_per_week !== undefined &&
      profile?.study_hours_per_week !== "",
  ];

  const completedFields = profileFields.filter(Boolean).length;
  const profileCompletion = Math.round(
    (completedFields / profileFields.length) * 100
  );
  const profileComplete = profileCompletion === 100;

  const validPredictions = useMemo(
    () =>
      predictions
        .map((prediction) => ({
          ...prediction,
          marks: getPredictedMarks(prediction),
        }))
        .filter((prediction) => prediction.marks !== null),
    [predictions]
  );

  const averageMarks = validPredictions.length
    ? validPredictions.reduce((total, item) => total + item.marks, 0) /
      validPredictions.length
    : null;

  const latestPrediction = validPredictions[0] ?? null;

  return (
    <div className="dashboard-shell">
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-menu-button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="dashboard-breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <strong>Dashboard</strong>
          </div>

          <button
            type="button"
            className="dashboard-refresh-button"
            onClick={loadDashboard}
            disabled={pageLoading}
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
          >
            <RefreshCw
              size={17}
              className={pageLoading ? "dashboard-spinning" : ""}
            />
          </button>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div>
              <span className="dashboard-eyebrow">
                <Sparkles size={15} />
                YOUR LEARNING WORKSPACE
              </span>
              <h1>
                Welcome back, {firstName}<span>.</span>
              </h1>
              <p>
                Here's your personal student performance overview.
              </p>
            </div>

            <Link to="/predict" className="dashboard-primary-button">
              <BrainCircuit size={18} />
              New prediction
              <ArrowRight size={17} />
            </Link>
          </section>

          {error && (
            <div className="dashboard-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={loadDashboard}>
                Try again
              </button>
            </div>
          )}

          {pageLoading ? (
            <section className="dashboard-loading">
              <span className="dashboard-loader" />
              <p>Loading your dashboard...</p>
            </section>
          ) : (
            <>
              <section className="dashboard-stat-grid">
                <article className="dashboard-stat-card">
                  <div className="dashboard-stat-top">
                    <span className="dashboard-stat-icon blue">
                      <Activity size={20} />
                    </span>
                    <span className="dashboard-stat-label">
                      Total predictions
                    </span>
                  </div>
                  <strong className="dashboard-stat-value">
                    {predictions.length}
                  </strong>
                  <span className="dashboard-stat-caption">
                    Saved to your account
                  </span>
                </article>

                <article className="dashboard-stat-card">
                  <div className="dashboard-stat-top">
                    <span className="dashboard-stat-icon purple">
                      <Target size={20} />
                    </span>
                    <span className="dashboard-stat-label">
                      Latest predicted marks
                    </span>
                  </div>
                  <strong className="dashboard-stat-value">
                    {latestPrediction
                      ? latestPrediction.marks.toFixed(2)
                      : "—"}
                  </strong>
                  <span className="dashboard-stat-caption">
                    {latestPrediction
                      ? formatDate(latestPrediction.created_at)
                      : "Make your first prediction"}
                  </span>
                </article>

                <article className="dashboard-stat-card">
                  <div className="dashboard-stat-top">
                    <span className="dashboard-stat-icon green">
                      <ChartNoAxesCombined size={20} />
                    </span>
                    <span className="dashboard-stat-label">
                      Average predicted marks
                    </span>
                  </div>
                  <strong className="dashboard-stat-value">
                    {averageMarks !== null
                      ? averageMarks.toFixed(2)
                      : "—"}
                  </strong>
                  <span className="dashboard-stat-caption">
                    {validPredictions.length
                      ? `Across ${validPredictions.length} valid predictions`
                      : "Available after your first prediction"}
                  </span>
                </article>
              </section>

              {!profileComplete && (
                <section className="dashboard-profile-banner">
                  <div className="dashboard-profile-banner-icon">
                    <UserRound size={23} />
                  </div>

                  <div className="dashboard-profile-banner-copy">
                    <span>COMPLETE YOUR PROFILE</span>
                    <h2>Help us personalize your experience</h2>
                    <p>
                      Add your student details to complete your profile
                      and get your workspace ready.
                    </p>
                    <div
                      className="dashboard-profile-progress"
                      role="progressbar"
                      aria-label="Profile completion"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={profileCompletion}
                    >
                      <span style={{ width: `${profileCompletion}%` }} />
                    </div>
                    <small>{profileCompletion}% complete</small>
                  </div>

                  <Link
                    to="/profile"
                    className="dashboard-secondary-button"
                  >
                    Complete profile <ArrowRight size={16} />
                  </Link>
                </section>
              )}

              {profileComplete && predictions.length === 0 && (
                <section className="dashboard-first-prediction">
                  <div className="dashboard-first-prediction-icon">
                    <BrainCircuit size={27} />
                  </div>
                  <span className="dashboard-eyebrow">
                    YOUR NEXT STEP
                  </span>
                  <h2>Ready to explore your performance?</h2>
                  <p>
                    Your profile is complete. Generate your first
                    prediction to start building your personal
                    performance history and insights.
                  </p>
                  <Link
                    to="/predict"
                    className="dashboard-primary-button"
                  >
                    Make your first prediction
                    <ArrowRight size={17} />
                  </Link>
                </section>
              )}

              <section className="dashboard-lower-grid">
                <article className="dashboard-panel dashboard-profile-panel">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>Student profile</h2>
                      <p>Your learning details</p>
                    </div>
                    <Link to="/profile" aria-label="Edit student profile">
                      <ArrowRight size={19} />
                    </Link>
                  </div>

                  {profile ? (
                    <div className="dashboard-profile-details">
                      <div>
                        <span>Full name</span>
                        <strong>{profile.full_name || "Not added"}</strong>
                      </div>
                      <div>
                        <span>Age</span>
                        <strong>{profile.age ?? "Not added"}</strong>
                      </div>
                      <div>
                        <span>Education level</span>
                        <strong>
                          {profile.education_level || "Not added"}
                        </strong>
                      </div>
                      <div>
                        <span>Study hours per week</span>
                        <strong>
                          {profile.study_hours_per_week !== null &&
                          profile.study_hours_per_week !== undefined
                            ? `${profile.study_hours_per_week} hours`
                            : "Not added"}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="dashboard-empty-state">
                      <UserRound size={25} />
                      <p>Your student profile hasn't been saved yet.</p>
                      <Link to="/profile">Set up your profile</Link>
                    </div>
                  )}
                </article>

                <article className="dashboard-panel dashboard-activity-panel">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>Recent predictions</h2>
                      <p>Your latest saved results</p>
                    </div>
                    <Link
                      to="/dashboard/history"
                      aria-label="View prediction history"
                    >
                      <ArrowRight size={19} />
                    </Link>
                  </div>

                  {validPredictions.length > 0 ? (
                    <div className="dashboard-recent-list">
                      {validPredictions.slice(0, 4).map((prediction) => (
                        <div
                          className="dashboard-recent-item"
                          key={prediction.id}
                        >
                          <span className="dashboard-recent-icon">
                            <Activity size={18} />
                          </span>
                          <div className="dashboard-recent-copy">
                            <strong>Performance prediction</strong>
                            <span>
                              <Clock3 size={13} />
                              {formatDate(prediction.created_at)}
                            </span>
                          </div>
                          <strong className="dashboard-recent-marks">
                            {prediction.marks.toFixed(2)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="dashboard-empty-state">
                      <ChartNoAxesCombined size={26} />
                      <p>
                        Your saved prediction results will appear here.
                      </p>
                      <Link to="/predict">Create a prediction</Link>
                    </div>
                  )}
                </article>
              </section>

              <p className="dashboard-disclaimer">
                Predictions are estimates generated by your model, not
                guaranteed academic results.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}