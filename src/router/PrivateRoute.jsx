import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getFromLocalStorage } from "../utils/LocalStore/LocalStore";

const PrivateRoute = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = getFromLocalStorage(
        import.meta.env.VITE_TOKEN_NAME
      );

      if (!token) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem(import.meta.env.VITE_TOKEN_NAME);

          setIsAuthorized(false);
        } else {
          setIsAuthorized(true);

          sessionStorage.setItem(
            "userData",
            JSON.stringify(decoded)
          );
        }
      } catch (error) {
        console.error("Invalid token:", error);

        localStorage.removeItem(import.meta.env.VITE_TOKEN_NAME);

        setIsAuthorized(false);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;