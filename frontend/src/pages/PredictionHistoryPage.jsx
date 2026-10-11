
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Download,
  Menu,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import DashboardSidebar from "../components/DashboardSidebar";
import "./PredictionHistoryPage.css";

const PERIODS = [
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "All time", value: "all" },
];

function getMarks(record) {
  const value = record.predicted_marks ?? record.result_data?.predicted_grade;
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatMarks(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "—";
  }
  return Number(value).toFixed(2).replace(/\.?0+$/, "");
}

function formatDate(value, includeTime = false) {
  if (!value) return "Unknown date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function getInputSummary(inputData) {
  if (!inputData || typeof inputData !== "object") return [];

  return Object.entries(inputData).map(([key, value]) => ({
    label: key
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^./, (char) => char.toUpperCase()),
    value:
      value === null || value === undefined || value === ""
        ? "Not provided"
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value),
  }));
}

function downloadCsv(records) {
  const columns = [
    "Prediction ID",
    "Date",
    "Predicted Marks",
    "Input Data",
    "Result Data",
  ];

  const rows = records.map((record) => [
    record.id,
    record.created_at ?? "",
    getMarks(record) ?? "",
    JSON.stringify(record.input_data ?? {}),
    JSON.stringify(record.result_data ?? {}),
  ]);

  const escapeCsv = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = [columns, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "edupredict-history.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function MetricCard({ label, value, detail, icon: Icon, trend }) {
  return (
    <article className="history-metric-card">
      <div className="history-metric-top">
        <span>{label}</span>
        <span className="history-metric-icon">
          <Icon size={19} />
        </span>
      </div>

      <div className="history-metric-value">{value}</div>

      <div className="history-metric-bottom">
        {trend === "up" && <ArrowUpRight size={15} />}
        {trend === "down" && <ArrowDownRight size={15} />}
        <span>{detail}</span>
      </div>
    </article>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="history-chart-tooltip">
      <p>{label}</p>
      <strong>{formatMarks(payload[0].value)} / 20</strong>
      <span>Predicted marks</span>
    </div>
  );
}

function HistoryState({ loading, error, onRetry }) {
  return (
    <div className="history-state">
      {loading ? (
        <>
          <span className="history-spinner" />
          <h2>Loading prediction history</h2>
          <p>Retrieving your saved predictions…</p>
        </>
      ) : (
        <>
          <div className="history-state-icon">
            <Activity size={25} />
          </div>
          <h2>Unable to load history</h2>
          <p>{error}</p>
          <button className="history-primary-button" onClick={onRetry}>
            <RefreshCw size={16} />
            Try again
          </button>
        </>
      )}
    </div>
  );
}

export default function PredictionHistoryPage() {
  const { user, loading: authLoading } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("30");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [expandedId, setExpandedId] = useState(null);

  const loadHistory = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      setError("Please sign in to view your prediction history.");
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("student_predictions")
        .select("id, user_id, input_data, result_data, predicted_marks, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setRecords(data ?? []);
    } catch (err) {
      setError(err.message || "Something went wrong while loading history.");
    } finally {
      setPageLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredRecords = useMemo(() => {
    const now = Date.now();
    const days = period === "all" ? null : Number(period);

    return records
      .filter((record) => {
        if (days !== null) {
          const created = new Date(record.created_at).getTime();
          if (!Number.isFinite(created)) return false;
          if (created < now - days * 24 * 60 * 60 * 1000) return false;
        }

        if (!search.trim()) return true;

        const term = search.trim().toLowerCase();
        return [
          record.id,
          record.created_at,
          JSON.stringify(record.input_data ?? {}),
          JSON.stringify(record.result_data ?? {}),
          getMarks(record),
        ].some((value) => String(value ?? "").toLowerCase().includes(term));
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at ?? 0).getTime();
        const dateB = new Date(b.created_at ?? 0).getTime();
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });
  }, [records, period, search, sortOrder]);

  const validRecords = useMemo(
    () =>
      filteredRecords
        .map((record) => ({ ...record, marks: getMarks(record) }))
        .filter(
          (record) =>
            record.marks !== null &&
            record.marks !== undefined &&
            Number.isFinite(Number(record.marks))
        ),
    [filteredRecords]
  );

  const stats = useMemo(() => {
    const marks = validRecords.map((record) => Number(record.marks));
    const average = marks.length
      ? marks.reduce((sum, value) => sum + value, 0) / marks.length
      : null;

    const highest = marks.length ? Math.max(...marks) : null;
    const lowest = marks.length ? Math.min(...marks) : null;

    // Compare the newest two predictions in the selected period.
    const chronological = [...validRecords].sort(
      (a, b) =>
        new Date(a.created_at ?? 0).getTime() -
        new Date(b.created_at ?? 0).getTime()
    );

    const latest = chronological.at(-1)?.marks ?? null;
    const previous = chronological.at(-2)?.marks ?? null;
    const change =
      latest !== null && previous !== null
        ? Number(latest) - Number(previous)
        : null;

    return {
      total: filteredRecords.length,
      average,
      highest,
      lowest,
      latest,
      change,
    };
  }, [filteredRecords, validRecords]);

  const lineData = useMemo(() => {
    return [...validRecords]
      .sort(
        (a, b) =>
          new Date(a.created_at ?? 0).getTime() -
          new Date(b.created_at ?? 0).getTime()
      )
      .map((record, index) => ({
        index: index + 1,
        label: formatDate(record.created_at, true),
        date: formatDate(record.created_at),
        marks: Number(record.marks),
      }));
  }, [validRecords]);

  const distribution = useMemo(() => {
    const ranges = [
      { range: "0–5", min: 0, max: 5 },
      { range: "5–10", min: 5, max: 10 },
      { range: "10–15", min: 10, max: 15 },
      { range: "15–20", min: 15, max: 20.000001 },
    ];

    return ranges.map((range) => ({
      range: range.range,
      count: validRecords.filter(
        (record) =>
          Number(record.marks) >= range.min &&
          Number(record.marks) < range.max
      ).length,
    }));
  }, [validRecords]);

  const handleExport = () => downloadCsv(filteredRecords);

  const renderPage = () => {
    if (authLoading || pageLoading) {
      return <HistoryState loading />;
    }

    if (error) {
      return <HistoryState error={error} onRetry={loadHistory} />;
    }

    if (!user) {
      return (
        <div className="history-state">
          <h2>Sign in required</h2>
          <p>Sign in to view predictions saved to your account.</p>
          <Link to="/login" className="history-primary-button">
            Go to login <ArrowRight size={16} />
          </Link>
        </div>
      );
    }

    return (
      <>
        <header className="history-page-header">
          <div>
            <div className="history-eyebrow">
              <Activity size={15} />
              STUDENT PERFORMANCE
            </div>
            <h1>Prediction History</h1>
            <p>
              Explore your previous predictions, compare marks, and track
              changes in your predicted performance over time.
            </p>
          </div>

          <div className="history-header-actions">
            <button
              className="history-secondary-button"
              onClick={loadHistory}
              disabled={pageLoading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              className="history-primary-button"
              onClick={handleExport}
              disabled={!filteredRecords.length}
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </header>

        <section className="history-metrics-grid">
          <MetricCard
            label="Total predictions"
            value={stats.total}
            detail={`${validRecords.length} with valid marks`}
            icon={BarChart3}
          />
          <MetricCard
            label="Average predicted marks"
            value={stats.average === null ? "—" : `${formatMarks(stats.average)}/20`}
            detail="Across selected period"
            icon={Activity}
          />
          <MetricCard
            label="Highest predicted marks"
            value={stats.highest === null ? "—" : `${formatMarks(stats.highest)}/20`}
            detail={
              stats.lowest === null
                ? "No scored predictions yet"
                : `Lowest: ${formatMarks(stats.lowest)}/20`
            }
            icon={TrendingUp}
          />
          <MetricCard
            label="Latest change"
            value={
              stats.change === null
                ? "—"
                : `${stats.change > 0 ? "+" : ""}${formatMarks(stats.change)}`
            }
            detail={
              stats.change === null
                ? "Need two predictions to compare"
                : "Compared with previous prediction"
            }
            icon={CalendarDays}
            trend={
              stats.change === null
                ? undefined
                : stats.change > 0
                  ? "up"
                  : stats.change < 0
                    ? "down"
                    : undefined
            }
          />
        </section>

        <section className="history-panel history-trend-panel">
          <div className="history-panel-heading">
            <div>
              <h2>Predicted marks trend</h2>
              <p>Track your predicted marks across saved predictions.</p>
            </div>
            <span className="history-chart-badge">
              <Activity size={14} />
              Out of 20
            </span>
          </div>

          {lineData.length > 0 ? (
            <div className="history-line-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={lineData}
                  margin={{ top: 12, right: 12, left: -18, bottom: 4 }}
                >
                  <defs>
                    <linearGradient id="historyMarksFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.015} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#edf0f6" strokeDasharray="4 5" vertical={false} />
                  <XAxis
                    dataKey="index"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#8a94a6", fontSize: 12 }}
                    tickFormatter={(value) => `#${value}`}
                    minTickGap={22}
                  />
                  <YAxis
                    domain={[0, 20]}
                    ticks={[0, 5, 10, 15, 20]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#8a94a6", fontSize: 12 }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={10} stroke="#cbd5e1" strokeDasharray="5 5" />
                  <Area
                    type="monotone"
                    dataKey="marks"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fill="url(#historyMarksFill)"
                    activeDot={{ r: 6, strokeWidth: 2, fill: "#ffffff" }}
                    dot={{ r: 3, fill: "#4f46e5", strokeWidth: 0 }}
                    isAnimationActive
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="history-chart-empty">
              <BarChart3 size={30} />
              <strong>No graph data for this period</strong>
              <span>Save a prediction to begin building your trend graph.</span>
            </div>
          )}

          <div className="history-chart-footnote">
            <span><i className="history-legend-dot" /> Predicted marks</span>
            <span>Each point represents one saved prediction, not an actual exam result.</span>
          </div>
        </section>

        <section className="history-charts-grid">
          <article className="history-panel">
            <div className="history-panel-heading">
              <div>
                <h2>Marks distribution</h2>
                <p>Number of predictions in each score range.</p>
              </div>
              <BarChart3 size={19} className="history-heading-icon" />
            </div>

            {validRecords.length > 0 ? (
              <div className="history-distribution-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution} margin={{ top: 14, right: 6, left: -24, bottom: 0 }}>
                    <CartesianGrid stroke="#edf0f6" strokeDasharray="4 5" vertical={false} />
                    <XAxis
                      dataKey="range"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#8a94a6", fontSize: 12 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#8a94a6", fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => [value, "Predictions"]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e8ebf3",
                        boxShadow: "0 8px 24px rgba(22, 34, 61, 0.08)",
                      }}
                    />
                    <Bar dataKey="count" radius={[7, 7, 0, 0]} maxBarSize={54}>
                      {distribution.map((entry, index) => (
                        <Cell
                          key={entry.range}
                          fill={["#a5b4fc", "#818cf8", "#6366f1", "#4338ca"][index]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="history-chart-empty compact">
                <span>No scored predictions available.</span>
              </div>
            )}

            <div className="history-distribution-legend">
              {distribution.map((item) => (
                <div key={item.range}>
                  <span>{item.range}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="history-panel history-insight-panel">
            <div className="history-panel-heading">
              <div>
                <h2>Performance overview</h2>
                <p>A quick summary of your selected history.</p>
              </div>
              <TrendingUp size={19} className="history-heading-icon" />
            </div>

            <div className="history-overview-list">
              <div>
                <span>Latest prediction</span>
                <strong>
                  {stats.latest === null ? "—" : `${formatMarks(stats.latest)} / 20`}
                </strong>
              </div>
              <div>
                <span>Average predicted marks</span>
                <strong>
                  {stats.average === null ? "—" : `${formatMarks(stats.average)} / 20`}
                </strong>
              </div>
              <div>
                <span>Highest predicted marks</span>
                <strong>
                  {stats.highest === null ? "—" : `${formatMarks(stats.highest)} / 20`}
                </strong>
              </div>
              <div>
                <span>Predictions recorded</span>
                <strong>{stats.total}</strong>
              </div>
            </div>

            <div className="history-insight-note">
              <Activity size={17} />
              <p>
                Use these results to compare predictions over time. They are
                estimates from your model, not verified academic grades.
              </p>
            </div>

            <Link to="/predict" className="history-text-link">
              Make a new prediction <ArrowRight size={16} />
            </Link>
          </article>
        </section>

        <section className="history-panel history-records-panel">
          <div className="history-panel-heading history-records-heading">
            <div>
              <h2>All predictions</h2>
              <p>Search, sort, and expand a record to inspect its details.</p>
            </div>
            <span className="history-record-count">
              {filteredRecords.length} records
            </span>
          </div>

          <div className="history-filters">
            <div className="history-period-tabs" role="group" aria-label="Filter history by period">
              {PERIODS.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  className={period === item.value ? "active" : ""}
                  onClick={() => setPeriod(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="history-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search history..."
                aria-label="Search prediction history"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  <X size={15} />
                </button>
              )}
            </label>

            <select
              className="history-sort-select"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              aria-label="Sort history"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="history-no-records">
              <div className="history-state-icon"><Search size={22} /></div>
              <h3>No matching predictions</h3>
              <p>
                {records.length === 0
                  ? "Your saved predictions will appear here after you run a prediction."
                  : "Try a different search term or time filter."}
              </p>
              {records.length === 0 && (
                <Link to="/predict" className="history-primary-button">
                  Create your first prediction <ArrowRight size={16} />
                </Link>
              )}
            </div>
          ) : (
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Prediction</th>
                    <th>Date and time</th>
                    <th>Predicted marks</th>
                    <th>Model result</th>
                    <th aria-label="Details" />
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => {
                    const marks = getMarks(record);
                    const expanded = expandedId === record.id;
                    const message =
                      record.result_data?.message ??
                      record.result_data?.note ??
                      "Saved prediction";

                    return (
                      <FragmentRow
                        key={record.id}
                        record={record}
                        index={index}
                        marks={marks}
                        message={message}
                        expanded={expanded}
                        onToggle={() =>
                          setExpandedId(expanded ? null : record.id)
                        }
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="history-disclaimer">
          <Activity size={16} />
          <span>
            EduPredict outputs are estimates. They should not be treated as
            guaranteed results or official academic marks.
          </span>
        </footer>
      </>
    );
  };

  return (
    <div className="dashboard-shell">
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <main className="dashboard-main history-main">
        <button
          type="button"
          className="history-mobile-menu"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="history-page-content">{renderPage()}</div>
      </main>
    </div>
  );
}

function FragmentRow({ record, index, marks, message, expanded, onToggle }) {
  const inputs = getInputSummary(record.input_data);

  return (
    <>
      <tr className={expanded ? "history-row-expanded" : ""}>
        <td>
          <div className="history-prediction-id">
            <span className="history-row-icon"><Activity size={16} /></span>
            <div>
              <strong>Prediction #{index + 1}</strong>
              <small>ID: {String(record.id).slice(0, 8)}</small>
            </div>
          </div>
        </td>
        <td>
          <div className="history-date-cell">
            <strong>{formatDate(record.created_at)}</strong>
            <small>{formatDate(record.created_at, true).split(", ").slice(-1)[0]}</small>
          </div>
        </td>
        <td>
          <span className="history-marks-pill">
            {marks === null || marks === undefined ? "—" : `${formatMarks(marks)} / 20`}
          </span>
        </td>
        <td>
          <span className="history-result-message" title={String(message)}>
            {String(message)}
          </span>
        </td>
        <td>
          <button
            type="button"
            className="history-expand-button"
            onClick={onToggle}
            aria-expanded={expanded}
          >
            {expanded ? "Hide" : "Details"}
            <ArrowRight size={15} className={expanded ? "rotated" : ""} />
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="history-detail-row">
          <td colSpan={5}>
            <div className="history-detail-content">
              <div className="history-detail-heading">
                <div>
                  <h3>Prediction details</h3>
                  <p>Created {formatDate(record.created_at, true)}</p>
                </div>
                <span className="history-detail-score">
                  {marks === null || marks === undefined
                    ? "Marks unavailable"
                    : `${formatMarks(marks)} / 20`}
                </span>
              </div>

              <div className="history-detail-grid">
                <section>
                  <h4>Input data</h4>
                  {inputs.length ? (
                    <dl className="history-input-list">
                      {inputs.map((input) => (
                        <div key={input.label}>
                          <dt>{input.label}</dt>
                          <dd>{input.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="history-detail-empty">No input data was saved.</p>
                  )}
                </section>

                <section>
                  <h4>Result data</h4>
                  {record.result_data &&
                  Object.keys(record.result_data).length ? (
                    <pre className="history-result-json">
                      {JSON.stringify(record.result_data, null, 2)}
                    </pre>
                  ) : (
                    <p className="history-detail-empty">No result details were saved.</p>
                  )}
                </section>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}