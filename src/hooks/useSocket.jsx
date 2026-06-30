import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { getFromLocalStorage } from "../utils/LocalStore/LocalStore";
import { decodedToken } from "../utils/jwt";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const useSocket = () => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!SOCKET_URL) return;

    let socketInstance = null;

    const connectSocket = () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }

      const token = getFromLocalStorage(import.meta.env.VITE_TOKEN_NAME);

      socketInstance = io(SOCKET_URL, {
        transports: ["websocket"],
        query: {
          token: token || "",
        },
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);

      socketInstance.on("connect", () => {
        setConnected(true);
      });

      socketInstance.on("disconnect", () => {
        setConnected(false);
      });

      socketInstance.on("connected", (data) => {
        if (data.type === "authenticated") {
          const user = decodedToken(token);
          if (user?.role) {
            socketInstance.emit("join", { role: user.role.toLowerCase() });
            console.log("✅ join emitted:", user.role.toLowerCase());
          }
        } else {
          console.log("👤 Guest mode");
        }
      });

      socketInstance.on("user-online", (data) => {
        console.log("🟢 User online:", data.userId);
      });

      socketInstance.on("user-offline", (data) => {
        console.log("🔴 User offline:", data.userId);
      });

      socketInstance.on("error", (err) => {
        console.log("❌ Socket error:", err?.message);
      });
    };

    connectSocket();

    const handleAuthChange = () => {
      console.log("Auth changed, reconnecting socket...");
      connectSocket();
    };

    window.addEventListener("auth_change", handleAuthChange);

    return () => {
      window.removeEventListener("auth_change", handleAuthChange);
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return {
    socket,
    connected,
  };
};