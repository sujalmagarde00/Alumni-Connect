import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000",
});

// 🔥 always attach latest login data
api.interceptors.request.use((config) => {

  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");

  if (userId) {
    config.headers["x-user-id"] = userId;
  }

  if (role) {
    config.headers["x-user-role"] = role.toLowerCase();
  }

  return config;
});

export default api;