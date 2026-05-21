import { createContext, useContext, useState, useEffect } from "react";
import { saveToken, getToken, removeToken, getMe } from "../utils/auth";
import api from "../service/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // On mount: restore session from secure store
  useEffect(() => {
    const restore = async () => {
      try {
        const stored = await getToken();
        if (stored) {
          const decoded = getMe(stored);
          if (decoded) {
            setToken(stored);
            setUser(decoded);
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoaded(true);
      }
    };
    restore();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    await saveToken(data.token);
    const decoded = getMe(data.token);
    setToken(data.token);
    setUser(decoded);
  };

  const register = async (firstName, lastName, email, password) => {
    await api.register(firstName, lastName, email, password);
    // Returns { message: "Check your email" } — no token yet
  };

  const verifyEmail = async (email, code) => {
    const data = await api.verifyEmail(email, code);
    await saveToken(data.token);
    const decoded = getMe(data.token);
    setToken(data.token);
    setUser(decoded);
  };

  const logout = async () => {
    await removeToken();
    setToken(null);
    setUser(null);
  };

  const updateUser = async (fields) => {
    // Optimistically update local state
    setUser((prev) => ({ ...prev, ...fields }));
    const t = token || (await getToken());
    await api.updateCurrentUserProfile(t, fields);
  };

  const value = {
    user,
    token,
    isLoaded,
    isSignedIn: !!user,
    login,
    register,
    verifyEmail,
    logout,
    updateUser,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside AuthProvider");
  return ctx;
}
