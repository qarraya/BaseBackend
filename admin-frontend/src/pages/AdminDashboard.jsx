import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/api/admin");
        if (!cancelled) {
          setAdmins(data.admins ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err.response?.data?.message ||
            err.message ||
            "Could not load admins.";
          setError(msg);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1 className="title title--sm">Admin dashboard</h1>
          <p className="muted">All registered administrators</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <div className="card card--flush">
        {loading ? (
          <p className="muted pad">Loading admins…</p>
        ) : error ? (
          <div className="banner banner--error pad">{error}</div>
        ) : admins.length === 0 ? (
          <p className="muted pad">No admins found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Last login</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.email}</td>
                    <td>
                      {a.lastLogin
                        ? new Date(a.lastLogin).toLocaleString()
                        : "—"}
                    </td>
                    <td>{new Date(a.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
