import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Login({ setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/login", { email, password });

      if (res.data.message === "Login successful") {
        // ✅ SINGLE SOURCE OF TRUTH
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userId", res.data.user_id); // 🔥 FIX
        localStorage.setItem("role", res.data.role);

        setIsLoggedIn(true);
        navigate("/feed");
      } else {
        setMsg(res.data.message || "Login failed");
      }
    } catch (err) {
      setMsg("Server error");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container glass">
        <h2>Login</h2>

        <form onSubmit={handleLogin} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>

        {msg && <p className="auth-message">{msg}</p>}
      </div>
    </div>
  );
}

export default Login;
