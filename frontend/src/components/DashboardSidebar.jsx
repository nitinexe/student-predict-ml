
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ChartNoAxesCombined,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
  X,
  BrainCircuit,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./DashboardSidebar.css";

const navigation = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Predict Performance", to: "/predict", icon: BrainCircuit },
  { label: "Analytics", to: "/dashboard/analytics", icon: ChartNoAxesCombined },
  { label: "Prediction History", to: "/dashboard/history", icon: History },
  { label: "My Student Profile", to: "/profile", icon: GraduationCap },
  { label: "Settings", to: "/dashboard/settings", icon: Settings },
];

export default function DashboardSidebar({
  mobileOpen = false,
  onClose = () => {},
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const metadata = user?.user_metadata ?? {};
  const displayName =
    metadata.full_name ||
    metadata.name ||
    user?.email?.split("@")[0] ||
    "Student";

  const avatarUrl = metadata.avatar_url || metadata.picture;

  async function handleSignOut() {
    try {
      await signOut();
      onClose();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Sign out failed:", error.message);
    }
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="dashboard-sidebar-overlay"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}

      <aside
        className={`dashboard-sidebar ${
          mobileOpen ? "dashboard-sidebar-open" : ""
        }`}
      >
        <div className="dashboard-sidebar-header">
          <Link
            to="/dashboard"
            className="dashboard-sidebar-brand"
            onClick={onClose}
          >
            <span className="dashboard-brand-icon">
              <GraduationCap size={23} />
            </span>

            <span className="dashboard-brand-copy">
              Edu<span>Predict</span>
              <small>STUDENT INTELLIGENCE</small>
            </span>
          </Link>

          <button
            type="button"
            className="dashboard-sidebar-close"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>

        <div className="dashboard-sidebar-section-label">
          WORKSPACE
        </div>

        <nav className="dashboard-sidebar-nav" aria-label="Dashboard navigation">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              className={({ isActive }) =>
                `dashboard-nav-link ${isActive ? "active" : ""}`
              }
              onClick={onClose}
            >
              <Icon size={19} strokeWidth={1.9} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-sidebar-user">
            <div className="dashboard-user-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" />
              ) : (
                <UserRound size={20} />
              )}
            </div>

            <div className="dashboard-user-info">
              <strong title={displayName}>{displayName}</strong>
              <span title={user?.email}>{user?.email || "Student account"}</span>
            </div>
          </div>

          <button
            type="button"
            className="dashboard-signout-button"
            onClick={handleSignOut}
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
