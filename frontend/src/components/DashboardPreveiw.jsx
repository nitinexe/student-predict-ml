
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  ChartColumnIncreasing,
  CircleAlert,
  Users,
} from "lucide-react";

const bars = [34, 48, 41, 65, 52, 78, 59, 88, 68, 96, 73, 84];

export default function DashboardPreview() {
  return (
    <div className="preview-shell">
      <div className="preview-window">
        <aside className="preview-sidebar">
          <div className="preview-logo">
            <Activity size={21} />
          </div>

          <div className="preview-side-item active">
            <ChartColumnIncreasing size={18} />
          </div>
          <div className="preview-side-item">
            <Users size={18} />
          </div>
          <div className="preview-side-item">
            <BookOpen size={18} />
          </div>
        </aside>

        <div className="preview-content">
          <div className="preview-topbar">
            <div>
              <span className="preview-eyebrow">OVERVIEW</span>
              <h3>Student insights</h3>
            </div>
            <span className="preview-avatar">AI</span>
          </div>

          <div className="preview-welcome">
            <div>
              <span>YOUR STUDENT OVERVIEW</span>
              <h4>Understand performance.</h4>
              <p>Explore predictions and student trends.</p>
            </div>
            <Activity size={30} />
          </div>

          <div className="preview-stats">
            <div className="preview-stat">
              <span><Users size={15} /> Students</span>
              <strong>—</strong>
              <small>Awaiting data</small>
            </div>
            <div className="preview-stat">
              <span><Activity size={15} /> Predictions</span>
              <strong>—</strong>
              <small>Awaiting data</small>
            </div>
          </div>

          <div className="preview-chart-card">
            <div className="preview-chart-heading">
              <div>
                <strong>Performance overview</strong>
                <p>Example chart layout</p>
              </div>
              <ArrowUpRight size={18} />
            </div>

            <div className="preview-chart">
              {bars.map((height, index) => (
                <div
                  className={`preview-bar ${index === 9 ? "highlight" : ""}`}
                  style={{ height: `${height}%` }}
                  key={index}
                />
              ))}
            </div>
            <div className="preview-chart-labels">
              <span>Week 1</span>
              <span>Week 2</span>
              <span>Week 3</span>
              <span>Week 4</span>
            </div>
          </div>

          <div className="preview-insight">
            <span className="insight-icon">
              <CircleAlert size={17} />
            </span>
            <div>
              <strong>Early-warning insights</strong>
              <p>Insights will appear after data is available.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="preview-floating-card">
        <span className="floating-icon"><Activity size={18} /></span>
        <div>
          <strong>AI-powered insights</strong>
          <p>Designed for smarter decisions</p>
        </div>
      </div>
    </div>
  );
}