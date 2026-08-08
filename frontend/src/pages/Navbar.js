import { Link, useNavigate, useLocation } from "react-router-dom";

function Navbar({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();
  const profileImage = null;

  // ✅ ADD THIS
  const role = localStorage.getItem("role")?.toLowerCase();


  const handleProtectedNav = (path) => {
    if (!isLoggedIn) {
      alert("Please login or register to access this feature");
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      setIsLoggedIn(false);
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userId");
      localStorage.removeItem("role");
      navigate("/");
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="glass-navbar">
      {/* LEFT */}
      <div className="nav-left">
        <div className="logo-circle">AC</div>
        <Link to="/" className="logo-text">
          Alumni Connect
        </Link>
      </div>

      {/* CENTER */}
      <div className="nav-center">
        <button
          className={isActive("/") ? "nav-link active" : "nav-link"}
          onClick={() => navigate("/")}
        >
          Home
        </button>

        <button
          className={isActive("/feed") ? "nav-link active" : "nav-link"}
          onClick={() => handleProtectedNav("/feed")}
        >
          Feed
        </button>

        <button
          className={isActive("/events") ? "nav-link active" : "nav-link"}
          onClick={() => handleProtectedNav("/events")}
        >
          Events
        </button>

        <button
          className={isActive("/chat") ? "nav-link active" : "nav-link"}
          onClick={() => handleProtectedNav("/chat")}
        >
          Chat
        </button>

        {/* ✅ ADMIN BUTTON (ONLY FOR ADMIN) */}
        {role === "admin" && (
          <button
            className={isActive("/admin") ? "nav-link active" : "nav-link"}
            onClick={() => navigate("/admin")}
          >
            Admin
          </button>
        )}
      </div>

      {/* RIGHT */}
      <div className="nav-right">
        {!isLoggedIn ? (
          <>
            <button className="nav-link" onClick={() => navigate("/login")}>
              Sign In
            </button>

            <button className="nav-cta" onClick={() => navigate("/register")}>
              Join Network
            </button>
          </>
        ) : (
          <div className="nav-profile-group">
            <div
              className="profile-avatar"
              onClick={() =>
                navigate(`/profile/${localStorage.getItem("userId")}`)
              }
            >
              {profileImage ? (
                <img
                  src={`http://localhost:5000${profileImage}`}
                  alt="profile"
                />
              ) : (
                <svg viewBox="0 0 24 24" className="default-avatar">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              )}
            </div>

            <button className="nav-cta logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
