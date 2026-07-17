// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("ams_token");
    const storedUser = localStorage.getItem("ams_user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch {
        localStorage.removeItem("ams_token");
        localStorage.removeItem("ams_user");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("ams_token", token);
    localStorage.setItem("ams_user", JSON.stringify(userData));
    setUser(userData);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem("ams_token");
    localStorage.removeItem("ams_user");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);