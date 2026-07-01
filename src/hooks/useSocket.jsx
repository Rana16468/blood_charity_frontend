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

      // transports থেকে শুধু ["websocket"] বাদ দেওয়া হয়েছে অথবা নিচের মতো polling যুক্ত করা হয়েছে
      socketInstance = io(SOCKET_URL, {
        transports: ["polling", "websocket"], 
        query: {
          token: token || "",
        },
        reconnectionAttempts: 5, // কানেকশন ড্রপ করলে ৫ বার চেষ্টা করবে
        timeout: 10000,          // ১০ সেকেন্ড পর টাইমআউট হবে
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);

      socketInstance.on("connect", () => {
        console.log("⚡ Socket Connected successfully!");
        setConnected(true);
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("🔌 Socket Disconnected. Reason:", reason);
        setConnected(false);
      });

     
      socketInstance.on("connect_error", (err) => {
        console.error("❌ Socket Connection Error:", err.message);
      
        if (err.data) {
          console.error("❌ Error Data:", err.data);
        }
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
        console.log("❌ General Socket error:", err?.message);
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