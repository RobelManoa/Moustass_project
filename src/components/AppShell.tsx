import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth";

export function AppShell() {
  const { clientInfo, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-badge">MS</span>
          <div>
            <p className="sidebar-kicker">Messagerie video securisee</p>
            <h1>{clientInfo?.client ?? "Moustass"}</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/messages">Messagerie</NavLink>
          <NavLink to="/compose">Composer</NavLink>
        </nav>

        <div className="sidebar-user">
          <p className="sidebar-user-name">{user?.name || user?.email}</p>
          <p className="sidebar-user-meta">
            {user?.role} · v{clientInfo?.version ?? "1.0.0"}
          </p>
          <button
            className="ghost-button"
            onClick={() => {
              logout();
              navigate("/login", { replace: true, state: { from: location.pathname } });
            }}
            type="button"
          >
            Se deconnecter
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
