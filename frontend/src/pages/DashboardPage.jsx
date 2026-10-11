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
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
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


function formatMarks(value, marksFormat = "out-of-20") {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "—";
  }

  if (marksFormat === "percentage") {
    return `${(Number(value) * 5).toFixed(2)}%`;
  }

  return `${Number(value).toFixed(2)}/20`;
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

  
const marksFormat =
  user?.user_metadata?.edupredict_settings?.preferences?.marksFormat ===
  "percentage"
    ? "percentage"
    : "out-of-20";

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
  const highestMarks = validPredictions.length
    ? Math.max(...validPredictions.map((item) => item.marks))
    : null;

  // Charts use the saved 0–20 marks. Formatting is applied only to labels.
  const trendData = useMemo(() => {
    const chronological = [...validPredictions]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(-10);

    return chronological.map((item, index) => {
      const valuesSoFar = chronological
        .slice(0, index + 1)
        .map((prediction) => prediction.marks);
      const runningAverage =
        valuesSoFar.reduce((total, value) => total + value, 0) /
        valuesSoFar.length;

      return {
        date: new Date(item.created_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        marks: Number(item.marks.toFixed(2)),
        runningAverage: Number(runningAverage.toFixed(2)),
      };
    });
  }, [validPredictions]);

  const distributionData = useMemo(() => {
    const ranges = [
      { name: marksFormat === "percentage" ? "0–25%" : "0–5", min: 0, max: 5 },
      { name: marksFormat === "percentage" ? "25–50%" : "5–10", min: 5, max: 10 },
      { name: marksFormat === "percentage" ? "50–75%" : "10–15", min: 10, max: 15 },
      { name: marksFormat === "percentage" ? "75–100%" : "15–20", min: 15, max: 20 },
    ];

    return ranges.map((range) => ({
      name: range.name,
      value: validPredictions.filter((item) =>
        range.max === 20
          ? item.marks >= range.min && item.marks <= range.max
          : item.marks >= range.min && item.marks < range.max
      ).length,
    }));
  }, [validPredictions, marksFormat]);

  const activityData = useMemo(() => {
    const dayMap = new Map();
    const now = new Date();

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(now);
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - offset);
      const key = day.toLocaleDateString("en-CA");
      dayMap.set(key, {
        day: day.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        predictions: 0,
      });
    }

    validPredictions.forEach((item) => {
      const date = new Date(item.created_at);
      date.setHours(0, 0, 0, 0);
      const key = date.toLocaleDateString("en-CA");
      if (dayMap.has(key)) {
        dayMap.get(key).predictions += 1;
      }
    });

    return [...dayMap.values()];
  }, [validPredictions]);

  const scoreColors = ["#cbd5e1", "#93c5fd", "#60a5fa", "#2563eb"];
  const scoreChangeLabel =
    validPredictions.length >= 2
      ? validPredictions[0].marks - validPredictions[1].marks
      : null;

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
                         ? formatMarks(latestPrediction.marks, marksFormat)
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
                        ? formatMarks(averageMarks, marksFormat)
                        : "—"}
                  </strong>
                  <span className="dashboard-stat-caption">
                    {validPredictions.length
                      ? `Across ${validPredictions.length} valid predictions`
                      : "Available after your first prediction"}
                  </span>
                </article>

                <article className="dashboard-stat-card">
                  <div className="dashboard-stat-top">
                    <span className="dashboard-stat-icon orange">
                      <TrendingUp size={20} />
                    </span>
                    <span className="dashboard-stat-label">
                      Highest predicted marks
                    </span>
                  </div>
                  <strong className="dashboard-stat-value">
                    {highestMarks !== null
                      ? formatMarks(highestMarks, marksFormat)
                      : "—"}
                  </strong>
                  <span className="dashboard-stat-caption">
                    Best result in saved predictions
                  </span>
                </article>
              </section>

              <section className="dashboard-visual-grid">
                <article className="dashboard-panel dashboard-chart-panel dashboard-trend-panel">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>Performance trend</h2>
                      <p>Recent predictions compared with your running average</p>
                    </div>
                    <span className="dashboard-chart-heading-icon">
                      <TrendingUp size={19} />
                    </span>
                  </div>
                  {trendData.length < 2 ? (
                    <div className="dashboard-chart-empty">
                      <ChartNoAxesCombined size={26} />
                      <p>Make at least two predictions to see your trend.</p>
                    </div>
                  ) : (
                    <div className="dashboard-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData} margin={{ top: 12, right: 14, left: -16, bottom: 4 }}>
                          <CartesianGrid stroke="#e9eef5" strokeDasharray="4 4" vertical={false} />
                          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 20]} tickFormatter={(value) => marksFormat === "percentage" ? `${value * 5}%` : value} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(value, name) => [
                              formatMarks(value, marksFormat),
                              name === "marks" ? "Predicted marks" : "Running average",
                            ]}
                            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="marks" name="Predicted marks" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          <Line type="monotone" dataKey="runningAverage" name="Running average" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </article>

                <article className="dashboard-panel dashboard-chart-panel">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>Score distribution</h2>
                      <p>How your saved predictions are distributed</p>
                    </div>
                    <span className="dashboard-chart-heading-icon">
                      <PieChartIcon size={19} />
                    </span>
                  </div>
                  {validPredictions.length === 0 ? (
                    <div className="dashboard-chart-empty">
                      <PieChartIcon size={26} />
                      <p>Your score distribution will appear after your first prediction.</p>
                    </div>
                  ) : (
                    <div className="dashboard-chart dashboard-donut-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="46%" innerRadius={55} outerRadius={86} paddingAngle={3}>
                            {distributionData.map((entry, index) => (
                              <Cell key={entry.name} fill={scoreColors[index % scoreColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value} prediction${value === 1 ? "" : "s"}`, name]} />
                          <Legend verticalAlign="bottom" height={38} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </article>

                <article className="dashboard-panel dashboard-chart-panel">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>Prediction activity</h2>
                      <p>Predictions created over the last 7 days</p>
                    </div>
                    <span className="dashboard-chart-heading-icon">
                      <BarChart3 size={19} />
                    </span>
                  </div>
                  <div className="dashboard-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityData} margin={{ top: 12, right: 8, left: -22, bottom: 4 }}>
                        <CartesianGrid stroke="#e9eef5" strokeDasharray="4 4" vertical={false} />
                        <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => [value, "Predictions"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                        <Bar dataKey="predictions" name="Predictions" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="dashboard-panel dashboard-insight-panel">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>Quick insights</h2>
                      <p>A snapshot of your saved prediction history</p>
                    </div>
                    <span className="dashboard-chart-heading-icon">
                      <Sparkles size={19} />
                    </span>
                  </div>
                  <div className="dashboard-quick-insights">
                    <div className="dashboard-quick-insight">
                      <span className="dashboard-quick-insight-icon">
                        {scoreChangeLabel === null ? <Activity size={18} /> : scoreChangeLabel >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                      </span>
                      <div>
                        <strong>Latest change</strong>
                        <p>
                          {scoreChangeLabel === null
                            ? "Create another prediction to compare scores."
                            : `${scoreChangeLabel >= 0 ? "+" : ""}${formatMarks(Math.abs(scoreChangeLabel), marksFormat)} compared with the previous prediction.`}
                        </p>
                      </div>
                    </div>
                    <div className="dashboard-quick-insight">
                      <span className="dashboard-quick-insight-icon"><Target size={18} /></span>
                      <div>
                        <strong>Profile completion</strong>
                        <p>{profileCompletion}% of your student profile is complete.</p>
                      </div>
                    </div>
                    <div className="dashboard-quick-insight">
                      <span className="dashboard-quick-insight-icon"><Activity size={18} /></span>
                      <div>
                        <strong>Predictions this week</strong>
                        <p>{activityData.reduce((total, day) => total + day.predictions, 0)} saved prediction(s) in the last 7 days.</p>
                      </div>
                    </div>
                  </div>
                  <Link to="/dashboard/analytics" className="dashboard-chart-link">
                    View detailed analytics <ArrowRight size={16} />
                  </Link>
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
                            {formatMarks(prediction.marks, marksFormat)}
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