import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("ams_token");
    const storedUser = localStorage.getItem("ams_user");

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
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
  };

  const logout = () => {
    localStorage.removeItem("ams_token");
    localStorage.removeItem("ams_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
