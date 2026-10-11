import { useState } from "react";
import { Menu } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";

export default function StudyWorkspaceLayout({ children, pageClass = "" }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <main className={`dashboard-main study-main ${pageClass}`}>
        <button
          type="button"
          className="study-mobile-menu"
          aria-label="Open navigation menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={21} />
        </button>
        <div className="study-content">{children}</div>
      </main>
    </div>
  );
}
