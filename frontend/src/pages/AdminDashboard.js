import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* ================= FETCH USERS ================= */
  useEffect(() => {
    api
      .get("/admin/users")
      .then((res) => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Admin fetch error:", err);
        setLoading(false);
      });
  }, []);

  /* ================= TOGGLE USER STATUS ================= */
  const toggleUserStatus = (userId, currentStatus) => {
    api
      .patch(`/admin/users/${userId}/status`, {
        is_active: !currentStatus,
      })
      .then(() => {
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === userId
              ? { ...u, is_active: !currentStatus }
              : u
          )
        );
      })
      .catch(console.error);
  };

  if (loading) {
    return <p style={{ padding: 20 }}>Loading admin dashboard...</p>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Admin Dashboard</h2>

      {/* ================= QUICK ACTIONS ================= */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 20,
          marginBottom: 40,
        }}
      >
        <button
          onClick={() => navigate("/admin/posts")}
          style={actionBtn}
        >
          Manage Posts
        </button>

        <button
          onClick={() => navigate("/admin/events")}
          style={actionBtn}
        >
          Manage Events
        </button>
      </div>

      {/* ================= USERS TABLE ================= */}
      <h3>User Management</h3>

      <table
        width="100%"
        cellPadding="10"
        style={{ marginTop: 20, borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>User ID</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.user_id}>
              <td>{u.user_id}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.is_active ? "Active" : "Inactive"}</td>
              <td>
                <button
                  onClick={() =>
                    toggleUserStatus(u.user_id, u.is_active)
                  }
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    background: u.is_active
                      ? "#ff4d4f"
                      : "#4caf50",
                    color: "#fff",
                  }}
                >
                  {u.is_active ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================= STYLES ================= */
const actionBtn = {
  padding: "10px 18px",
  borderRadius: 8,
  border: "none",
  background: "#6c63ff",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 500,
};

export default AdminDashboard;
