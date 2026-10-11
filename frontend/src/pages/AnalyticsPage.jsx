
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  GraduationCap,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
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
import "./AnalyticsPage.css";

const FILTERS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "All time", value: "all" },
];

function getMarks(prediction) {
  const value =
    prediction.predicted_marks ??
    prediction.result_data?.predicted_grade ??
    prediction.result_data?.Predicted_marks;

  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}


function formatMarks(value, marksFormat = "out-of-20") {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(Number(value))
  ) {
    return "—";
  }

  const marks = Number(value);

  if (marksFormat === "percentage") {
    return `${(marks * 5).toFixed(2)}%`;
  }

  return `${marks.toFixed(2)}/20`;
}

function formatDate(value, options = {}) {
  if (!value) return "Unknown date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString("en-IN", options);
}

function MetricCard({ icon: Icon, label, value, helper }) {
  return (
    <article className="analytics-metric-card">
      <div className="analytics-metric-top">
        <span className="analytics-metric-icon">
          <Icon size={19} />
        </span>
      </div>
      <p className="analytics-metric-label">{label}</p>
      <h2 className="analytics-metric-value">{value}</h2>
      <p className="analytics-metric-helper">{helper}</p>
    </article>
  );
}

function EmptyAnalytics() {
  return (
    <section className="analytics-empty">
      <div className="analytics-empty-icon">
        <ChartNoAxesCombined size={30} />
      </div>
      <h2>Your performance story starts here</h2>
      <p>
        Make your first prediction to unlock your personal analytics,
        performance trends, and mark distribution.
      </p>
      <Link to="/predict" className="analytics-primary-button">
        <BrainCircuit size={18} />
        Make your first prediction
        <ArrowRight size={17} />
      </Link>
    </section>
  );
}

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();

  
const marksFormat =
  user?.user_metadata?.edupredict_settings?.preferences?.marksFormat ===
  "percentage"
    ? "percentage"
    : "out-of-20";

  const [mobileOpen, setMobileOpen] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPredictions = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("student_predictions")
      .select(
        "id, input_data, result_data, predicted_marks, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (queryError) {
      setError(queryError.message || "Could not load your analytics.");
      setPredictions([]);
    } else {
      setPredictions(data ?? []);
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      setError("Please sign in to view your analytics.");
      return;
    }

    loadPredictions();
  }, [authLoading, user, loadPredictions]);

  const validPredictions = useMemo(() => {
    return predictions
      .map((prediction) => ({
        ...prediction,
        marks: getMarks(prediction),
      }))
      .filter(
        (prediction) =>
          prediction.marks !== null &&
          prediction.created_at &&
          !Number.isNaN(new Date(prediction.created_at).getTime())
      );
  }, [predictions]);

  const filteredPredictions = useMemo(() => {
    if (dateFilter === "all") return validPredictions;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(dateFilter));

    return validPredictions.filter(
      (prediction) => new Date(prediction.created_at) >= cutoff
    );
  }, [validPredictions, dateFilter]);

  const stats = useMemo(() => {
    const values = filteredPredictions.map((item) => item.marks);

    if (!values.length) {
      return {
        count: 0,
        average: null,
        highest: null,
        latest: null,
        change: null,
      };
    }

    const average =
      values.reduce((total, value) => total + value, 0) / values.length;

    const chronological = [...filteredPredictions].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    const latest = chronological[chronological.length - 1].marks;
    const highest = Math.max(...values);

    let change = null;
    if (chronological.length >= 2) {
      change =
        chronological[chronological.length - 1].marks -
        chronological[chronological.length - 2].marks;
    }

    return {
      count: values.length,
      average,
      highest,
      latest,
      change,
    };
  }, [filteredPredictions]);

  const trendData = useMemo(() => {
    return filteredPredictions.map((item, index) => ({
      name: formatDate(item.created_at, {
        day: "numeric",
        month: "short",
      }),
      marks: Number(item.marks.toFixed(2)),
      prediction: index + 1,
    }));
  }, [filteredPredictions]);

  const distributionData = useMemo(() => {
    const ranges = [
      { range: "0–5", min: 0, max: 5 },
      { range: "5–10", min: 5, max: 10 },
      { range: "10–15", min: 10, max: 15 },
      { range: "15–20", min: 15, max: Infinity },
    ];

    return ranges.map(({ range, min, max }) => ({
      range,
      count: filteredPredictions.filter(
        (item) =>
          item.marks >= min &&
          (max === Infinity
            ? item.marks <= 20
            : item.marks < max)
      ).length,
    }));
  }, [filteredPredictions]);

  const recentPredictions = useMemo(
    () =>
      [...filteredPredictions]
        .sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
        .slice(0, 5),
    [filteredPredictions]
  );

  if (authLoading || loading) {
    return (
      <div className="dashboard-shell">
        <DashboardSidebar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <main className="dashboard-main analytics-main">
          <button
            className="analytics-mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            type="button"
          >
            <span>☰</span>
          </button>
          <div className="analytics-loading">
            <div className="analytics-spinner" />
            <p>Preparing your analytics...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="dashboard-main analytics-main">
        <button
          className="analytics-mobile-menu"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          type="button"
        >
          <span>☰</span>
        </button>

        <div className="analytics-content">
          <header className="analytics-header">
            <div>
              <div className="analytics-eyebrow">
                <Activity size={15} />
                PERSONAL PERFORMANCE
              </div>
              <h1>Performance Analytics</h1>
              <p>
                Explore your saved predictions and track your performance
                estimates over time.
              </p>
            </div>

            <button
              type="button"
              className="analytics-refresh-button"
              onClick={loadPredictions}
              disabled={loading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </header>

          {error && (
            <div className="analytics-error" role="alert">
              <p>{error}</p>
              {user && (
                <button type="button" onClick={loadPredictions}>
                  Try again
                </button>
              )}
              {!user && (
                <Link to="/login">Sign in</Link>
              )}
            </div>
          )}

          {!error && validPredictions.length === 0 ? (
            <EmptyAnalytics />
          ) : (
            <>
              <div className="analytics-toolbar">
                <div className="analytics-toolbar-label">
                  <CalendarDays size={18} />
                  <span>Analysis period</span>
                </div>
                <div className="analytics-filter-group">
                  {FILTERS.map((filter) => (
                    <button
                      key={filter.value}
                      type="button"
                      className={
                        dateFilter === filter.value
                          ? "analytics-filter active"
                          : "analytics-filter"
                      }
                      onClick={() => setDateFilter(filter.value)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredPredictions.length === 0 ? (
                <section className="analytics-no-period-data">
                  <Clock3 size={24} />
                  <h2>No predictions in this period</h2>
                  <p>
                    Try a longer time range or create a new prediction.
                  </p>
                  <button
                    type="button"
                    className="analytics-secondary-button"
                    onClick={() => setDateFilter("all")}
                  >
                    View all history
                  </button>
                </section>
              ) : (
                <>
                  <section className="analytics-metrics-grid">
                    <MetricCard
                      icon={Activity}
                      label="Total predictions"
                      value={stats.count}
                      helper="In selected period"
                    />
                    <MetricCard
                      icon={Target}
                      label="Average prediction"
                      value={formatMarks(stats.average, marksFormat)}
                      helper={marksFormat === "percentage" ? "Percentage" : "Out of 20"}
                      
                    />
                    <MetricCard
                      icon={TrendingUp}
                      label="Highest prediction"
                      value={formatMarks(stats.highest, marksFormat)}
                      helper={marksFormat === "percentage" ? "Percentage" : "Out of 20"}
                    />
                    <MetricCard
                      icon={GraduationCap}
                      label="Latest prediction"
                      value={formatMarks(stats.latest, marksFormat)}
                      helper={marksFormat === "percentage" ? "Percentage" : "Out of 20"}
                    />
                  </section>

                  <section className="analytics-chart-grid">
                    <article className="analytics-panel analytics-trend-panel">
                      <div className="analytics-panel-heading">
                        <div>
                          <h2>Prediction trend</h2>
                          <p>
                            How your predicted marks have changed over time
                          </p>
                        </div>
                        <span className="analytics-panel-icon">
                          <TrendingUp size={19} />
                        </span>
                      </div>

                      <div className="analytics-chart">
                        {trendData.length < 2 ? (
                          <div className="analytics-chart-empty">
                            Make another prediction to see your trend line.
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={trendData}
                              margin={{
                                top: 12,
                                right: 12,
                                left: -18,
                                bottom: 4,
                              }}
                            >
                              <CartesianGrid
                                stroke="#e9eef5"
                                strokeDasharray="4 4"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="name"
                                tick={{ fill: "#64748b", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                domain={[0, 20]}
                                tick={{ fill: "#64748b", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <Tooltip
                                formatter={(value) => [
                                  `${formatMarks(value)} / 20`,
                                  "Predicted marks",
                                ]}
                                contentStyle={{
                                  borderRadius: 12,
                                  border: "1px solid #e2e8f0",
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="marks"
                                name="Predicted marks"
                                stroke="#2563eb"
                                strokeWidth={3}
                                dot={{
                                  r: 4,
                                  fill: "#2563eb",
                                  strokeWidth: 2,
                                  stroke: "#ffffff",
                                }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </article>

                    <article className="analytics-panel">
                      <div className="analytics-panel-heading">
                        <div>
                          <h2>Marks distribution</h2>
                          <p>Predictions grouped by marks out of 20</p>
                        </div>
                        <span className="analytics-panel-icon">
                          <BarChart3 size={19} />
                        </span>
                      </div>

                      <div className="analytics-chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={distributionData}
                            margin={{
                              top: 12,
                              right: 8,
                              left: -22,
                              bottom: 4,
                            }}
                          >
                            <CartesianGrid
                              stroke="#e9eef5"
                              strokeDasharray="4 4"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="range"
                              tick={{ fill: "#64748b", fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fill: "#64748b", fontSize: 12 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              formatter={(value) => [
                                value,
                                "Predictions",
                              ]}
                              contentStyle={{
                                borderRadius: 12,
                                border: "1px solid #e2e8f0",
                              }}
                            />
                            <Bar
                              dataKey="count"
                              name="Predictions"
                              fill="#60a5fa"
                              radius={[6, 6, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </article>
                  </section>

                  <section className="analytics-insight-grid">
                    <article className="analytics-insight-card">
                      <span className="analytics-insight-icon">
                        {stats.change === null ? (
                          <Activity size={20} />
                        ) : stats.change >= 0 ? (
                          <ArrowUpRight size={20} />
                        ) : (
                          <ArrowDownRight size={20} />
                        )}
                      </span>
                      <div>
                        <h3>Latest change</h3>
                        <p>
                          {stats.change === null
                            ? "Make at least two predictions in this period to compare results."
                            : `${stats.change >= 0 ? "+" : ""}${formatMarks(
                                stats.change
                              )} marks compared with your previous prediction.`}
                        </p>
                      </div>
                    </article>

                    <article className="analytics-insight-card">
                      <span className="analytics-insight-icon">
                        <Target size={20} />
                      </span>
                      <div>
                        <h3>Performance snapshot</h3>
                        <p>
                          {stats.average === null
                            ? "No data available."
                            : `Your average predicted score is ${formatMarks(
                                stats.average
                              )} out of 20 across ${stats.count} predictions.`}
                        </p>
                      </div>
                    </article>
                  </section>

                  <section className="analytics-panel analytics-recent-panel">
                    <div className="analytics-panel-heading">
                      <div>
                        <h2>Recent predictions</h2>
                        <p>Your latest saved performance estimates</p>
                      </div>
                      <Link
                        to="/dashboard/history"
                        className="analytics-text-link"
                      >
                        View history <ArrowRight size={15} />
                      </Link>
                    </div>

                    <div className="analytics-table-wrap">
                      <table className="analytics-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Prediction</th>
                            <th>Estimated marks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentPredictions.map((prediction) => (
                            <tr key={prediction.id}>
                              <td>
                                {formatDate(prediction.created_at, {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                              <td>
                                <span className="analytics-prediction-label">
                                  <span className="analytics-status-dot" />
                                  Performance estimate
                                </span>
                              </td>
                              <td>
                                <strong>
                                  {formatMarks(prediction.marks)} / 20
                                </strong>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <p className="analytics-disclaimer">
                    These figures represent model predictions, not actual
                    exam marks or guaranteed academic outcomes. Trends are
                    descriptive and do not establish actual improvement.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}